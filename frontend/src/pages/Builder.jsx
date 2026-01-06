import React, { useState, useCallback, useRef } from 'react';
import { useNodesState, useEdgesState, addEdge } from 'reactflow';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { LayerPalette } from '../components/LayerPalette';
import { NetworkCanvas } from '../components/NetworkCanvas';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { CodePreviewModal } from '../components/CodePreviewModal';
import { TrainingPanel } from '../components/TrainingPanel';
import { SavedModelsPanel } from '../components/SavedModelsPanel';
import { generatePyTorchCode, downloadCode } from '../utils/codeGenerator';
import { getLayerConfig } from '../utils/layerConfigs';
import { useAuth } from '../context/AuthContext';

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

export default function Builder() {
  const { isAuthenticated } = useAuth();
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

  // Load model from saved
  const handleLoadModel = useCallback((savedNodes, savedEdges) => {
    setNodes(savedNodes || []);
    setEdges(savedEdges || []);
    setSelectedNode(null);
    // Update nodeId counter
    const maxId = Math.max(0, ...savedNodes.map(n => parseInt(n.id.replace('node_', '')) || 0));
    nodeId = maxId + 1;
  }, [setNodes, setEdges]);

  // Toggle theme
  const handleToggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      document.documentElement.classList.toggle('light', !newMode);
      return newMode;
    });
  }, []);

  // Handle node connection
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: isDarkMode ? '#8b5cf6' : '#3b82f6' }
    }, eds));
    toast.success('Layers connected!');
  }, [setEdges, isDarkMode]);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Handle drag over
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop
  const onDrop = useCallback((event) => {
    event.preventDefault();

    const data = event.dataTransfer.getData('application/reactflow');
    if (!data) return;

    const layer = JSON.parse(data);
    
    // Get the position where the node was dropped
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
  }, [setNodes]);

  // Update node data
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

  // Delete node
  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    toast.success('Layer deleted');
  }, [setNodes, setEdges]);

  // Close properties panel
  const handleCloseProperties = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Clear canvas
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

  // Show code
  const handleShowCode = useCallback(() => {
    const code = generatePyTorchCode(nodes, edges);
    setGeneratedCode(code);
    setIsCodeModalOpen(true);
  }, [nodes, edges]);

  // Download code
  const handleDownloadCode = useCallback(() => {
    downloadCode(generatedCode);
    toast.success('Code downloaded!');
  }, [generatedCode]);

  // Run network (simulation)
  const handleRun = useCallback(() => {
    if (nodes.length === 0) {
      toast.error('Add some layers first!');
      return;
    }

    setIsRunning(true);
    
    // Animate nodes
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, isRunning: true }
      }))
    );

    // Simulate running
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

  // Open training panel
  const handleOpenTraining = useCallback(() => {
    if (nodes.length === 0) {
      toast.error('Add some layers first!');
      return;
    }
    setIsTrainingPanelOpen(true);
  }, [nodes.length]);

  return (
    <div className={`h-screen overflow-hidden ${!isDarkMode ? 'light' : ''}`} data-testid="builder-page">
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onRun={handleRun}
        onShowCode={handleShowCode}
        onClearCanvas={handleClearCanvas}
        onOpenTraining={handleOpenTraining}
        isRunning={isRunning}
        nodeCount={nodes.length}
      />

      <LayerPalette />

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
      />

      <PropertiesPanel
        selectedNode={selectedNode}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onClose={handleCloseProperties}
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
      />
    </div>
  );
}
