import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { getLayerConfig, getConfigFields } from '../utils/layerConfigs';
import { ResizablePanel } from './ResizablePanel';

export const PropertiesPanel = ({ selectedNode, onUpdateNode, onDeleteNode, onClose }) => {
  if (!selectedNode) {
    return (
      <ResizablePanel
        side="right"
        defaultWidth={320}
        minWidth={250}
        maxWidth={500}
        className="border-l border-border bg-card/50 backdrop-blur-xl fixed right-0 top-14 bottom-0 z-30"
        data-testid="properties-panel-empty"
      >
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Select a layer to edit properties
        </div>
      </ResizablePanel>
    );
  }

  const layerConfig = getLayerConfig(selectedNode.data.layerType);
  const configFields = getConfigFields(selectedNode.data.layerType);
  const Icon = layerConfig?.icon;

  const handleConfigChange = (key, value) => {
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      config: {
        ...selectedNode.data.config,
        [key]: value
      }
    });
  };

  const handleLabelChange = (label) => {
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      label
    });
  };

  return (
    <AnimatePresence mode="wait">
      <ResizablePanel
        key={selectedNode.id}
        side="right"
        defaultWidth={320}
        minWidth={250}
        maxWidth={500}
        className="border-l border-border bg-card/50 backdrop-blur-xl fixed right-0 top-14 bottom-0 z-30"
        data-testid="properties-panel"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Icon && (
                <div 
                  className="p-2 rounded-md"
                  style={{ backgroundColor: `${layerConfig?.color}20` }}
                >
                  <Icon 
                    className="w-4 h-4" 
                    style={{ color: layerConfig?.color }}
                  />
                </div>
              )}
              <div>
                <h3 className="font-bold text-sm">{selectedNode.data.layerType}</h3>
                <p className="text-xs text-muted-foreground">Properties</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              data-testid="close-properties-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Layer Label */}
              <div className="space-y-2">
                <Label htmlFor="layer-label">Layer Name</Label>
                <Input
                  id="layer-label"
                  value={selectedNode.data.label || selectedNode.data.layerType}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="Enter layer name"
                  data-testid="layer-name-input"
                />
              </div>

              <Separator />

              {/* Config Fields */}
              {configFields.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Parameters
                  </h4>
                  {configFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      
                      {field.type === 'number' && (
                        <Input
                          id={field.key}
                          type="number"
                          min={field.min}
                          max={field.max}
                          step={field.step || 1}
                          value={selectedNode.data.config?.[field.key] ?? ''}
                          onChange={(e) => handleConfigChange(field.key, Number(e.target.value))}
                          data-testid={`config-${field.key}`}
                        />
                      )}
                      
                      {field.type === 'text' && (
                        <Input
                          id={field.key}
                          type="text"
                          placeholder={field.placeholder}
                          value={selectedNode.data.config?.[field.key] ?? ''}
                          onChange={(e) => handleConfigChange(field.key, e.target.value)}
                          data-testid={`config-${field.key}`}
                        />
                      )}
                      
                      {field.type === 'select' && (
                        <Select
                          value={selectedNode.data.config?.[field.key] || ''}
                          onValueChange={(value) => handleConfigChange(field.key, value)}
                        >
                          <SelectTrigger data-testid={`config-${field.key}`}>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      {field.type === 'checkbox' && (
                        <div className="flex items-center gap-2">
                          <Switch
                            id={field.key}
                            checked={selectedNode.data.config?.[field.key] || false}
                            onCheckedChange={(checked) => handleConfigChange(field.key, checked)}
                            data-testid={`config-${field.key}`}
                          />
                          <span className="text-sm text-muted-foreground">
                            {selectedNode.data.config?.[field.key] ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  This layer has no configurable parameters
                </p>
              )}
            </div>
          </ScrollArea>

          {/* Delete Button */}
          <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => onDeleteNode(selectedNode.id)}
              data-testid="delete-layer-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Layer
            </Button>
          </div>
        </motion.div>
      </ResizablePanel>
    </AnimatePresence>
  );
};
