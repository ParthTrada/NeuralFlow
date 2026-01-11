import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { getLayerConfig, multiInputLayers } from '../../utils/layerConfigs';
import { cn } from '../../lib/utils';

// Helper to format input shape for display
const formatInputShape = (config) => {
  const inputType = config?.inputType || 'flat';
  if (inputType === 'flat') {
    return `[${config?.inputSize || 784}]`;
  } else if (inputType === 'image') {
    return `[${config?.channels || 3}, ${config?.height || 224}, ${config?.width || 224}]`;
  } else if (inputType === 'sequence') {
    return `[${config?.seqLength || 32}, ${config?.features || 256}]`;
  } else if (inputType === 'text') {
    return `[${config?.seqLength || 128}]`;
  }
  return `[${config?.inputSize || 784}]`;
};

// Helper to get display config for a layer
const getDisplayConfig = (layerType, config) => {
  if (!config) return {};
  
  // For Input layer, show formatted shape instead of individual fields
  if (layerType === 'Input') {
    const inputType = config.inputType || 'flat';
    const typeLabels = { flat: 'Flat', image: 'Image', sequence: 'Sequence', text: 'Text' };
    return {
      'Type': typeLabels[inputType] || 'Flat',
      'Shape': formatInputShape(config)
    };
  }
  
  // For other layers, filter out internal fields and format nicely
  const filtered = {};
  Object.entries(config).forEach(([key, value]) => {
    // Skip internal/technical fields
    if (['inputType', 'inputShape'].includes(key)) return;
    filtered[key] = value;
  });
  return filtered;
};

export const LayerNode = memo(({ data, selected, isConnectable }) => {
  const layerConfig = getLayerConfig(data.layerType);
  const Icon = layerConfig?.icon;
  const color = layerConfig?.color || 'hsl(263, 70%, 50%)';
  
  const isInput = data.layerType === 'Input';
  const isOutput = data.layerType === 'Output';
  const isMultiInput = multiInputLayers.includes(data.layerType);
  const numInputs = data.config?.numInputs || 2;
  
  const displayConfig = getDisplayConfig(data.layerType, data.config);

  // Calculate positions for multiple input handles
  const getInputHandlePositions = () => {
    if (!isMultiInput) return [{ id: 'target', position: 50 }];
    
    const positions = [];
    const spacing = 100 / (numInputs + 1);
    for (let i = 0; i < numInputs; i++) {
      positions.push({
        id: `target-${i}`,
        position: spacing * (i + 1),
        label: i === 0 ? 'Main' : `Skip ${i}`
      });
    }
    return positions;
  };

  const inputHandles = getInputHandlePositions();

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "min-w-[180px] rounded-xl border-2 bg-card shadow-lg transition-all duration-300",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        data.isRunning && "running-animation",
        isMultiInput && "min-w-[200px]"
      )}
      style={{ 
        borderColor: color,
        boxShadow: selected ? `0 0 20px ${color}40` : undefined
      }}
      data-testid={`node-${data.layerType?.toLowerCase()}`}
    >
      {/* Input Handles */}
      {!isInput && (
        isMultiInput ? (
          // Multiple input handles for Add/Concatenate
          inputHandles.map((handle, idx) => (
            <Handle
              key={handle.id}
              id={handle.id}
              type="target"
              position={Position.Top}
              isConnectable={isConnectable}
              className={cn(
                "!w-3 !h-3 !border-2 !border-background transition-all",
                idx === 0 ? "!bg-primary" : "!bg-green-500"
              )}
              style={{ left: `${handle.position}%` }}
              data-testid={`node-input-handle-${idx}`}
              title={handle.label}
            />
          ))
        ) : (
          // Single input handle
          <Handle
            type="target"
            position={Position.Top}
            isConnectable={isConnectable}
            className="!w-3 !h-3 !bg-primary !border-2 !border-background"
            data-testid="node-input-handle"
          />
        )
      )}
      
      {/* Header */}
      <div 
        className="px-4 py-2 border-b border-border/50 flex items-center gap-2"
        style={{ backgroundColor: `${color}15` }}
      >
        {Icon && (
          <Icon 
            className="w-4 h-4" 
            style={{ color }}
          />
        )}
        <span className="font-bold text-sm text-foreground">
          {data.label || data.layerType}
        </span>
        {isMultiInput && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-600 font-medium">
            {numInputs} inputs
          </span>
        )}
      </div>
      
      {/* Body */}
      <div className="p-3 text-xs text-muted-foreground space-y-1">
        {displayConfig && Object.entries(displayConfig).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
            <span className="text-foreground font-mono">
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
            </span>
          </div>
        ))}
        {(!displayConfig || Object.keys(displayConfig).length === 0) && (
          <span className="text-muted-foreground/60 italic">No parameters</span>
        )}
        {isMultiInput && (
          <div className="mt-2 pt-2 border-t border-border/30 text-[10px] text-muted-foreground/70">
            <span className="text-green-600">●</span> Connect skip connections to green handles
          </div>
        )}
      </div>

      {/* Output Handle */}
      {!isOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="!w-3 !h-3 !bg-primary !border-2 !border-background"
          data-testid="node-output-handle"
        />
      )}
    </motion.div>
  );
});

LayerNode.displayName = 'LayerNode';
