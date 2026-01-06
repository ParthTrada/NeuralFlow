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
import { generatePyTorchCode, downloadCode } from '../utils/codeGenerator';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

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
  const [trainedWeights, setTrainedWeights] = useState(null);
  
  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [showLayerPalette, setShowLayerPalette] = useState(false);

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
      if (model.trained_weights) {
        setTrainedWeights(model.trained_weights);
      }
      toast.success(`Loaded shared model: ${model.name}`);
      setSearchParams({});
    } catch (error) {
      toast.error('Failed to load shared model');
      setSearchParams({});
    }
  };

  // Load template
  const handleLoadTemplate = useCallback((templateNodes, templateEdges) => {
    setNodes(templateNodes);
    setEdges(templateEdges);
    setSelectedNode(null);
    setTrainedWeights(null);
    // Update nodeId counter
    const maxId = Math.max(0, ...templateNodes.map(n => parseInt(n.id.replace('node_', '')) || 0));
    nodeId = maxId + 1;
    toast.success('Template loaded! You can now customize the layers.');
  }, [setNodes, setEdges]);

  const handleLoadModel = useCallback((savedNodes, savedEdges, weights) => {
    setNodes(savedNodes || []);
    setEdges(savedEdges || []);
    setSelectedNode(null);
    if (weights) {
      setTrainedWeights(weights);
    }
    const maxId = Math.max(0, ...(savedNodes || []).map(n => parseInt(n.id.replace('node_', '')) || 0));
    nodeId = maxId + 1;
  }, [setNodes, setEdges]);

  const handleToggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      document.documentElement.classList.toggle('light', !newMode);
      return newMode;
    });
  }, []);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: isDarkMode ? '#8b5cf6' : '#3b82f6' }
    }, eds));
    toast.success('Layers connected!');
  }, [setEdges, isDarkMode]);

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

    setNodes((nds) => [...nds, newNode]);
    toast.success(`Added ${layer.label} layer`);
    
    if (isMobile) {
      setShowLayerPalette(false);
    }
  }, [setNodes, isMobile]);

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

    setNodes((nds) => [...nds, newNode]);
    toast.success(`Added ${layer.label} layer`);
  }, [setNodes, nodes.length]);

  const handleUpdateNode = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: newData }
          : node
      )
    );
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, data: newData } : prev);
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    toast.success('Layer deleted');
  }, [setNodes, setEdges]);

  const handleCloseProperties = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleClearCanvas = useCallback(() => {
    if (nodes.length === 0) {
      toast.info('Canvas is already empty');
      return;
    }
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    nodeId = 0;
    toast.success('Canvas cleared');
  }, [nodes.length, setNodes, setEdges]);

  const handleShowCode = useCallback(() => {
    const code = generatePyTorchCode(nodes, edges);
    setGeneratedCode(code);
    setIsCodeModalOpen(true);
  }, [nodes, edges]);

  const handleDownloadCode = useCallback(() => {
    downloadCode(generatedCode);
    toast.success('Code downloaded!');
  }, [generatedCode]);

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
        onDownload={handleDownloadCode}
        isDarkMode={isDarkMode}
      />

      <TrainingPanel
        nodes={nodes}
        edges={edges}
        isOpen={isTrainingPanelOpen}
        onClose={() => setIsTrainingPanelOpen(false)}
        onWeightsTrained={setTrainedWeights}
      />

      <SavedModelsPanel
        isOpen={isModelsOpen}
        onClose={() => setIsModelsOpen(false)}
        onLoadModel={handleLoadModel}
        currentNodes={nodes}
        currentEdges={edges}
        trainedWeights={trainedWeights}
      />
    </div>
  );
}
