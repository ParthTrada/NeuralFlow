import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
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
  isDarkMode
}, ref) => {
  const reactFlowWrapper = useRef(null);

  return (
    <div 
      ref={reactFlowWrapper}
      className="fixed inset-0 top-14 left-64 right-0 bg-background dot-grid"
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
      >
        <Controls 
          className="!bg-card/80 !backdrop-blur-md !border !border-border !rounded-lg"
        />
        <MiniMap 
          nodeColor={(node) => {
            const config = getLayerConfig(node.data?.layerType);
            return config?.color || '#8b5cf6';
          }}
          maskColor={isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
          className="!bg-card/80 !backdrop-blur-md !border !border-border !rounded-lg"
        />
        <Background 
          variant="dots" 
          gap={24} 
          size={1}
          color={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        />
      </ReactFlow>
    </div>
  );
});

NetworkCanvas.displayName = 'NetworkCanvas';
