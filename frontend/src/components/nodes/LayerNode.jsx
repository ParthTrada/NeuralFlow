import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { getLayerConfig } from '../../utils/layerConfigs';
import { cn } from '../../lib/utils';

export const LayerNode = memo(({ data, selected, isConnectable }) => {
  const layerConfig = getLayerConfig(data.layerType);
  const Icon = layerConfig?.icon;
  const color = layerConfig?.color || 'hsl(263, 70%, 50%)';
  
  const isInput = data.layerType === 'Input';
  const isOutput = data.layerType === 'Output';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "min-w-[180px] rounded-xl border-2 bg-card shadow-lg transition-all duration-300",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        data.isRunning && "running-animation"
      )}
      style={{ 
        borderColor: color,
        boxShadow: selected ? `0 0 20px ${color}40` : undefined
      }}
      data-testid={`node-${data.layerType?.toLowerCase()}`}
    >
      {/* Input Handle */}
      {!isInput && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="!w-3 !h-3 !bg-primary !border-2 !border-background"
          data-testid="node-input-handle"
        />
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
      </div>
      
      {/* Body */}
      <div className="p-3 text-xs text-muted-foreground space-y-1">
        {data.config && Object.entries(data.config).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
            <span className="text-foreground font-mono">
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
            </span>
          </div>
        ))}
        {(!data.config || Object.keys(data.config).length === 0) && (
          <span className="text-muted-foreground/60 italic">No parameters</span>
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
