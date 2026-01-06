import React, { useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { LayerNode } from './nodes/LayerNode';
import { getLayerConfig } from '../utils/layerConfigs';

const nodeTypes = {
  layerNode: LayerNode,
};

const defaultEdgeOptions = {
  animated: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 15,
    height: 15,
  },
  style: {
    strokeWidth: 2,
  },
};

export const NetworkCanvas = React.forwardRef(({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onNodeClick,
  onDrop,
  onDragOver,
  selectedNodeId,
  isDarkMode,
  isMobile,
  showLayerPalette
}, ref) => {
  const reactFlowWrapper = useRef(null);

  // Adjust left position based on device and panel state
  const getLeftPosition = () => {
    if (isMobile) {
      return '0'; // Full width on mobile
    }
    return '256px'; // 16rem = 256px for desktop layer palette
  };

  return (
    <div 
      ref={reactFlowWrapper}
      className="fixed inset-0 top-14 right-0 bg-background dot-grid transition-all duration-300"
      style={{ 
        left: getLeftPosition(),
        touchAction: 'none' // Better touch handling
      }}
      data-testid="network-canvas"
    >
      <ReactFlow
        ref={ref}
        nodes={nodes.map(node => ({
          ...node,
          selected: node.id === selectedNodeId
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={['Backspace', 'Delete']}
        className="transition-colors duration-300"
        panOnScroll={!isMobile}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        preventScrolling={true}
        minZoom={0.2}
        maxZoom={2}
      >
        <Controls 
          className="!bg-card/80 !backdrop-blur-md !border !border-border !rounded-lg"
          position={isMobile ? "bottom-left" : "bottom-left"}
          showZoom={true}
          showFitView={true}
          showInteractive={!isMobile}
        />
        {!isMobile && (
          <MiniMap 
            nodeColor={(node) => {
              const config = getLayerConfig(node.data?.layerType);
              return config?.color || '#8b5cf6';
            }}
            maskColor={isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
            className="!bg-card/80 !backdrop-blur-md !border !border-border !rounded-lg"
          />
        )}
        <Background 
          variant="dots" 
          gap={24} 
          size={1}
          color={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        />
      </ReactFlow>
      
      {/* Mobile empty state hint */}
      {isMobile && nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-6">
            <p className="text-muted-foreground text-sm">
              Tap the <span className="font-semibold text-primary">Layers</span> button to add neural network layers
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

NetworkCanvas.displayName = 'NetworkCanvas';
