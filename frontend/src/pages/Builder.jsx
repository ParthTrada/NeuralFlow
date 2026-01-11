import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNodesState, useEdgesState, addEdge } from 'reactflow';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { LayerPalette } from '../components/LayerPalette';
import { NetworkCanvas } from '../components/NetworkCanvas';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { CodePreviewModal } from '../components/CodePreviewModal';
import { TrainingPanel } from '../components/TrainingPanel';
import { SavedModelsPanel } from '../components/SavedModelsPanel';
import { useHistory } from '../hooks/useHistory';
// import { ProductTour } from '../components/ProductTour'; // Commented out - Product Tour disabled
import { generatePyTorchCode, generateKerasCode, downloadCode } from '../utils/codeGenerator';
import { useAuth } from '../context/AuthContext';

// Smart API URL detection for production/development
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Production domains - use same origin
    if (hostname === 'neuralflows.ai' || hostname === 'www.neuralflows.ai') {
      return window.location.origin + '/api';
    }
  }
  // Development or preview - use env variable
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  if (envUrl) {
    return envUrl + '/api';
  }
  // Fallback to same origin
  return (typeof window !== 'undefined' ? window.location.origin : '') + '/api';
};

const API_URL = getApiUrl();

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

export default function Builder() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const reactFlowRef = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isTrainingPanelOpen, setIsTrainingPanelOpen] = useState(false);
  const [isModelsOpen, setIsModelsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedKerasCode, setGeneratedKerasCode] = useState('');
  const [trainedWeights, setTrainedWeights] = useState(null);
  const [currentModelId, setCurrentModelId] = useState(null); // Track which model is loaded
  const [savedTrainingData, setSavedTrainingData] = useState(null); // Training history for loaded model
  const [currentTemplateId, setCurrentTemplateId] = useState(null); // Track template for dataset recommendations
  
  // History management for undo/redo
  const history = useHistory({ nodes: [], edges: [] }, 50);
  
  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [showLayerPalette, setShowLayerPalette] = useState(false);

  // Record state changes to history
  const recordHistory = useCallback((newNodes, newEdges, immediate = false) => {
    history.record({ nodes: newNodes, edges: newEdges }, immediate);
  }, [history]);

  // Undo handler
  const handleUndo = useCallback(() => {
    const prevState = history.undo();
    if (prevState) {
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      toast.info('Undo');
    }
  }, [history, setNodes, setEdges]);

  // Redo handler
  const handleRedo = useCallback(() => {
    const nextState = history.redo();
    if (nextState) {
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      toast.info('Redo');
    }
  }, [history, setNodes, setEdges]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y = Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowLayerPalette(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for shared model on load
  useEffect(() => {
    const sharedToken = searchParams.get('shared');
    if (sharedToken) {
      loadSharedModel(sharedToken);
    }
  }, [searchParams]);

  const loadSharedModel = async (shareToken) => {
    try {
      const response = await axios.get(`${API_URL}/auth/shared/${shareToken}`);
      const model = response.data;
      setNodes(model.nodes || []);
      setEdges(model.edges || []);
      setTrainedWeights(model.trained_weights || null);
      setSavedTrainingData(model.training_data || null);
      setCurrentModelId(model.model_id || `shared_${shareToken}`);
      toast.success(`Loaded shared model: ${model.name}`);
      setSearchParams({});
    } catch (error) {
      toast.error('Failed to load shared model');
      setSearchParams({});
    }
  };

  // Load template - adds to existing canvas instead of replacing
  const handleLoadTemplate = useCallback((templateNodes, templateEdges, templateName, templateId = null) => {
    // Generate unique IDs for the new nodes
    const timestamp = Date.now();
    const idMap = {};
    
    // Calculate offset based on existing nodes
    let offsetX = 250;
    let offsetY = 50;
    
    if (nodes.length > 0) {
      // Find the rightmost node position
      const maxX = Math.max(...nodes.map(n => n.position.x));
      offsetX = maxX + 300; // Place new template 300px to the right
    }
    
    // Create new nodes with unique IDs and offset positions
    const newNodes = templateNodes.map((node, index) => {
      const newId = `node_${nodeId++}`;
      idMap[node.id] = newId;
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY
        }
      };
    });
    
    // Create new edges with updated source/target IDs
    const newEdges = templateEdges.map((edge, index) => ({
      ...edge,
      id: `e_${timestamp}_${index}`,
      source: idMap[edge.source],
      target: idMap[edge.target],
      targetHandle: edge.targetHandle // Preserve target handle for multi-input nodes
    }));
    
    // Add to existing nodes and edges
    const updatedNodes = [...nodes, ...newNodes];
    const updatedEdges = [...edges, ...newEdges];
    
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    
    // Track template ID for dataset recommendations
    if (templateId) {
      setCurrentTemplateId(templateId);
    }
    
    // Record to history (immediate for discrete action)
    recordHistory(updatedNodes, updatedEdges, true);
    
    toast.success(`Added ${templateName || 'template'} to canvas!`);
  }, [nodes, edges, setNodes, setEdges, recordHistory]);

  const handleLoadModel = useCallback((savedNodes, savedEdges, weights, modelId, trainingData) => {
    setNodes(savedNodes || []);
    setEdges(savedEdges || []);
    setSelectedNode(null);
    setTrainedWeights(weights || null);
    setSavedTrainingData(trainingData || null);
    // Set a unique model ID to trigger TrainingPanel reset/restore
    setCurrentModelId(modelId || `model_${Date.now()}`);
    const maxId = Math.max(0, ...(savedNodes || []).map(n => parseInt(n.id.replace('node_', '')) || 0));
    nodeId = maxId + 1;
  }, [setNodes, setEdges]);

  // Handle saving training data
  const handleSaveTrainingData = useCallback(async (trainingData) => {
    if (!currentModelId || !isAuthenticated) {
      toast.error('Please save your model first');
      return;
    }
    
    try {
      await axios.patch(`${API_URL}/auth/models/${currentModelId}/training`, {
        training_data: trainingData
      }, {
        withCredentials: true
      });
      setSavedTrainingData(trainingData);
      toast.success('Training results saved!');
    } catch (error) {
      console.error('Failed to save training data:', error);
      toast.error('Failed to save training results');
    }
  }, [currentModelId, isAuthenticated]);

  const handleToggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      document.documentElement.classList.toggle('light', !newMode);
      return newMode;
    });
  }, []);

  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      animated: true,
      style: params.targetHandle?.includes('target-1') ? 
        { stroke: '#22c55e', strokeWidth: 2 } : // Green for skip connections
        { stroke: isDarkMode ? '#8b5cf6' : '#3b82f6' }
    };
    
    setEdges((eds) => {
      const updatedEdges = addEdge(newEdge, eds);
      // Record to history
      recordHistory(nodes, updatedEdges, true);
      return updatedEdges;
    });
    toast.success('Layers connected!');
  }, [setEdges, isDarkMode, nodes, recordHistory]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    if (isMobile) {
      setShowLayerPalette(false);
    }
  }, [isMobile]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();

    // Check for template drop
    const templateData = event.dataTransfer.getData('application/template');
    if (templateData) {
      const template = JSON.parse(templateData);
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const dropX = event.clientX - reactFlowBounds.left;
      const dropY = event.clientY - reactFlowBounds.top;
      
      // Generate unique IDs for the new nodes
      const timestamp = Date.now();
      const idMap = {};
      
      // Create new nodes with unique IDs positioned at drop location
      const newNodes = template.nodes.map((node, index) => {
        const newId = `node_${nodeId++}`;
        idMap[node.id] = newId;
        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + dropX,
            y: node.position.y + dropY
          }
        };
      });
      
      // Create new edges with updated source/target IDs
      const newEdges = template.edges.map((edge, index) => ({
        ...edge,
        id: `e_${timestamp}_${index}`,
        source: idMap[edge.source],
        target: idMap[edge.target],
        targetHandle: edge.targetHandle // Preserve target handle for multi-input nodes
      }));
      
      // Add to existing nodes and edges
      const updatedNodes = [...nodes, ...newNodes];
      const updatedEdges = [...edges, ...newEdges];
      
      setNodes(updatedNodes);
      setEdges(updatedEdges);
      
      // Record to history
      recordHistory(updatedNodes, updatedEdges, true);
      
      toast.success(`Added ${template.name} template!`);
      return;
    }

    // Regular layer drop
    const data = event.dataTransfer.getData('application/reactflow');
    if (!data) return;

    const layer = JSON.parse(data);
    
    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left - 90,
      y: event.clientY - reactFlowBounds.top - 30,
    };

    const newNode = {
      id: getId(),
      type: 'layerNode',
      position,
      data: {
        label: layer.label,
        layerType: layer.type,
        config: { ...layer.defaultConfig },
      },
    };

    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    
    // Record to history
    recordHistory(updatedNodes, edges, true);
    
    toast.success(`Added ${layer.label} layer`);
    
    if (isMobile) {
      setShowLayerPalette(false);
    }
  }, [nodes, edges, setNodes, setEdges, isMobile, recordHistory]);

  // Add layer via tap (mobile)
  const handleAddLayer = useCallback((layer) => {
    // Position new node in center of visible area
    const position = {
      x: 150 + (nodes.length * 20) % 100,
      y: 100 + (nodes.length * 50) % 200,
    };

    const newNode = {
      id: getId(),
      type: 'layerNode',
      position,
      data: {
        label: layer.label,
        layerType: layer.type,
        config: { ...layer.defaultConfig },
      },
    };

    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    
    // Record to history
    recordHistory(updatedNodes, edges, true);
    
    toast.success(`Added ${layer.label} layer`);
  }, [setNodes, nodes, edges, recordHistory]);

  const handleUpdateNode = useCallback((nodeId, newData) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: newData }
          : node
      );
      // Record to history (debounced for continuous changes)
      recordHistory(updatedNodes, edges, false);
      return updatedNodes;
    });
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, data: newData } : prev);
  }, [setNodes, edges, recordHistory]);

  const handleDeleteNode = useCallback((nodeId) => {
    const updatedNodes = nodes.filter((node) => node.id !== nodeId);
    const updatedEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
    
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setSelectedNode(null);
    
    // Record to history
    recordHistory(updatedNodes, updatedEdges, true);
    
    toast.success('Layer deleted');
  }, [nodes, edges, setNodes, setEdges, recordHistory]);

  const handleCloseProperties = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleClearCanvas = useCallback(() => {
    if (nodes.length === 0) {
      toast.info('Canvas is already empty');
      return;
    }
    
    // Record current state before clearing
    recordHistory([], [], true);
    
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    nodeId = 0;
    toast.success('Canvas cleared');
  }, [nodes.length, setNodes, setEdges, recordHistory]);

  const handleShowCode = useCallback(() => {
    const pytorchCode = generatePyTorchCode(nodes, edges);
    const kerasCode = generateKerasCode(nodes, edges);
    setGeneratedCode(pytorchCode);
    setGeneratedKerasCode(kerasCode);
    setIsCodeModalOpen(true);
  }, [nodes, edges]);

  const handleDownloadCode = useCallback((framework = 'pytorch') => {
    const code = framework === 'pytorch' ? generatedCode : generatedKerasCode;
    const filename = framework === 'pytorch' ? 'neural_network_pytorch.py' : 'neural_network_keras.py';
    downloadCode(code, filename);
    toast.success(`${framework === 'pytorch' ? 'PyTorch' : 'Keras'} code downloaded!`);
  }, [generatedCode, generatedKerasCode]);

  const handleRun = useCallback(() => {
    if (nodes.length === 0) {
      toast.error('Add some layers first!');
      return;
    }

    setIsRunning(true);
    
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, isRunning: true }
      }))
    );

    setTimeout(() => {
      setIsRunning(false);
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: { ...node.data, isRunning: false }
        }))
      );
      toast.success('Network validated successfully!');
      handleShowCode();
    }, 2000);
  }, [nodes.length, setNodes, handleShowCode]);

  const handleOpenTraining = useCallback(() => {
    if (nodes.length === 0) {
      toast.error('Add some layers first!');
      return;
    }
    setIsTrainingPanelOpen(true);
  }, [nodes.length]);

  const toggleLayerPalette = useCallback(() => {
    setShowLayerPalette(prev => !prev);
    if (selectedNode) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  return (
    <div className={`h-screen overflow-hidden ${!isDarkMode ? 'light' : ''}`} data-testid="builder-page">
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onRun={handleRun}
        onShowCode={handleShowCode}
        onClearCanvas={handleClearCanvas}
        onOpenTraining={handleOpenTraining}
        onOpenModels={() => setIsModelsOpen(true)}
        isRunning={isRunning}
        nodeCount={nodes.length}
        isMobile={isMobile}
        onToggleLayers={toggleLayerPalette}
        showLayerPalette={showLayerPalette}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
      />

      <LayerPalette 
        isMobile={isMobile}
        isOpen={showLayerPalette}
        onClose={() => setShowLayerPalette(false)}
        onAddLayer={handleAddLayer}
        onLoadTemplate={handleLoadTemplate}
      />

      <NetworkCanvas
        ref={reactFlowRef}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        selectedNodeId={selectedNode?.id}
        isDarkMode={isDarkMode}
        isMobile={isMobile}
        showLayerPalette={showLayerPalette}
      />

      <PropertiesPanel
        selectedNode={selectedNode}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onClose={handleCloseProperties}
        isMobile={isMobile}
      />

      <CodePreviewModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        code={generatedCode}
        kerasCode={generatedKerasCode}
        onDownload={handleDownloadCode}
        isDarkMode={isDarkMode}
      />

      <TrainingPanel
        nodes={nodes}
        edges={edges}
        isOpen={isTrainingPanelOpen}
        onClose={() => setIsTrainingPanelOpen(false)}
        onWeightsTrained={setTrainedWeights}
        modelId={currentModelId}
        savedWeights={trainedWeights}
        savedTrainingData={savedTrainingData}
        onSaveTrainingData={handleSaveTrainingData}
      />

      <SavedModelsPanel
        isOpen={isModelsOpen}
        onClose={() => setIsModelsOpen(false)}
        onLoadModel={handleLoadModel}
        currentNodes={nodes}
        currentEdges={edges}
        trainedWeights={trainedWeights}
      />

      {/* Product Tour for first-time users - Disabled due to inconsistencies */}
      {/* <ProductTour isDark={isDarkMode} /> */}
    </div>
  );
}
