import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkles, Network, Layers as LayersIcon, MessageSquare, Brain } from 'lucide-react';
import { Button } from './ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { ScrollArea } from './ui/scroll-area';
import { layerCategories } from '../utils/layerConfigs';
import { cn } from '../lib/utils';
import { ResizablePanel } from './ResizablePanel';

// Template definitions
const templates = [
  {
    id: 'mlp',
    name: 'Simple MLP',
    description: 'Multi-layer perceptron for tabular data',
    tip: 'Best for structured/tabular data like CSV files. Stack Dense layers with decreasing units. Start with 2-3 hidden layers.',
    icon: Network,
    color: '#8b5cf6',
    layers: 5,
    nodes: [
      { id: 'node_0', type: 'layerNode', position: { x: 0, y: 0 }, data: { label: 'Input', layerType: 'Input', config: { inputType: 'flat', inputSize: 784 } } },
      { id: 'node_1', type: 'layerNode', position: { x: 0, y: 130 }, data: { label: 'Dense', layerType: 'Dense', config: { inputSize: 784, units: 128, activation: 'relu' } } },
      { id: 'node_2', type: 'layerNode', position: { x: 0, y: 260 }, data: { label: 'Dropout', layerType: 'Dropout', config: { rate: 0.2 } } },
      { id: 'node_3', type: 'layerNode', position: { x: 0, y: 390 }, data: { label: 'Dense', layerType: 'Dense', config: { inputSize: 128, units: 64, activation: 'relu' } } },
      { id: 'node_4', type: 'layerNode', position: { x: 0, y: 520 }, data: { label: 'Output', layerType: 'Output', config: { inputSize: 64, numClasses: 10, activation: 'softmax' } } },
    ],
    edges: [
      { id: 'e0-1', source: 'node_0', target: 'node_1', animated: true },
      { id: 'e1-2', source: 'node_1', target: 'node_2', animated: true },
      { id: 'e2-3', source: 'node_2', target: 'node_3', animated: true },
      { id: 'e3-4', source: 'node_3', target: 'node_4', animated: true },
    ]
  },
  {
    id: 'cnn',
    name: 'CNN',
    description: 'For image classification',
    tip: 'Convolutional Neural Networks excel at image tasks. Conv layers extract features, pooling reduces size, Dense layers classify.',
    icon: LayersIcon,
    color: '#06b6d4',
    layers: 9,
    nodes: [
      { id: 'node_0', type: 'layerNode', position: { x: 0, y: 0 }, data: { label: 'Input', layerType: 'Input', config: { inputType: 'image', channels: 1, height: 28, width: 28 } } },
      { id: 'node_1', type: 'layerNode', position: { x: 0, y: 130 }, data: { label: 'Conv2D', layerType: 'Conv2D', config: { inChannels: 1, outChannels: 32, kernelSize: 3, activation: 'relu', padding: 1 } } },
      { id: 'node_2', type: 'layerNode', position: { x: 0, y: 260 }, data: { label: 'MaxPool2D', layerType: 'MaxPool2D', config: { kernelSize: 2, stride: 2 } } },
      { id: 'node_3', type: 'layerNode', position: { x: 0, y: 390 }, data: { label: 'Conv2D', layerType: 'Conv2D', config: { inChannels: 32, outChannels: 64, kernelSize: 3, activation: 'relu', padding: 1 } } },
      { id: 'node_4', type: 'layerNode', position: { x: 0, y: 520 }, data: { label: 'MaxPool2D', layerType: 'MaxPool2D', config: { kernelSize: 2, stride: 2 } } },
      { id: 'node_5', type: 'layerNode', position: { x: 0, y: 650 }, data: { label: 'Flatten', layerType: 'Flatten', config: {} } },
      { id: 'node_6', type: 'layerNode', position: { x: 0, y: 780 }, data: { label: 'Dense', layerType: 'Dense', config: { inputSize: 3136, units: 128, activation: 'relu' } } },
      { id: 'node_7', type: 'layerNode', position: { x: 0, y: 910 }, data: { label: 'Dropout', layerType: 'Dropout', config: { rate: 0.5 } } },
      { id: 'node_8', type: 'layerNode', position: { x: 0, y: 1040 }, data: { label: 'Output', layerType: 'Output', config: { inputSize: 128, numClasses: 10, activation: 'softmax' } } },
    ],
    edges: [
      { id: 'e0-1', source: 'node_0', target: 'node_1', animated: true },
      { id: 'e1-2', source: 'node_1', target: 'node_2', animated: true },
      { id: 'e2-3', source: 'node_2', target: 'node_3', animated: true },
      { id: 'e3-4', source: 'node_3', target: 'node_4', animated: true },
      { id: 'e4-5', source: 'node_4', target: 'node_5', animated: true },
      { id: 'e5-6', source: 'node_5', target: 'node_6', animated: true },
      { id: 'e6-7', source: 'node_6', target: 'node_7', animated: true },
      { id: 'e7-8', source: 'node_7', target: 'node_8', animated: true },
    ]
  },
  {
    id: 'rnn',
    name: 'RNN (LSTM)',
    description: 'For sequence & time-series',
    tip: 'Recurrent networks process sequential data one step at a time, maintaining memory. Great for text, audio, and time-series.',
    icon: MessageSquare,
    color: '#22c55e',
    layers: 6,
    nodes: [
      { id: 'node_0', type: 'layerNode', position: { x: 0, y: 0 }, data: { label: 'Input', layerType: 'Input', config: { inputType: 'sequence', seqLength: 10, features: 9 } } },
      { id: 'node_1', type: 'layerNode', position: { x: 0, y: 130 }, data: { label: 'LSTM', layerType: 'LSTM', config: { inputSize: 9, hiddenSize: 32, numLayers: 1 } } },
      { id: 'node_2', type: 'layerNode', position: { x: 0, y: 260 }, data: { label: 'Dropout', layerType: 'Dropout', config: { rate: 0.2 } } },
      { id: 'node_3', type: 'layerNode', position: { x: 0, y: 390 }, data: { label: 'LSTM', layerType: 'LSTM', config: { inputSize: 32, hiddenSize: 16, numLayers: 1 } } },
      { id: 'node_4', type: 'layerNode', position: { x: 0, y: 520 }, data: { label: 'Dense', layerType: 'Dense', config: { inputSize: 16, units: 8, activation: 'relu' } } },
      { id: 'node_5', type: 'layerNode', position: { x: 0, y: 650 }, data: { label: 'Output', layerType: 'Output', config: { inputSize: 8, numClasses: 3, activation: 'softmax' } } },
    ],
    edges: [
      { id: 'e0-1', source: 'node_0', target: 'node_1', animated: true },
      { id: 'e1-2', source: 'node_1', target: 'node_2', animated: true },
      { id: 'e2-3', source: 'node_2', target: 'node_3', animated: true },
      { id: 'e3-4', source: 'node_3', target: 'node_4', animated: true },
      { id: 'e4-5', source: 'node_4', target: 'node_5', animated: true },
    ]
  },
  {
    id: 'transformer',
    name: 'Transformer',
    description: 'Attention-based for NLP',
    tip: 'Uses self-attention to process all positions simultaneously. Powers GPT, BERT, and modern language models. Excellent for NLP.',
    icon: Brain,
    color: '#f59e0b',
    layers: 7,
    nodes: [
      { id: 'node_0', type: 'layerNode', position: { x: 0, y: 0 }, data: { label: 'Input', layerType: 'Input', config: { inputType: 'sequence', seqLength: 32, features: 256 } } },
      { id: 'node_1', type: 'layerNode', position: { x: 0, y: 130 }, data: { label: 'Multi-Head Attention', layerType: 'MultiHeadAttention', config: { embedDim: 256, numHeads: 8 } } },
      { id: 'node_2', type: 'layerNode', position: { x: 0, y: 260 }, data: { label: 'LayerNorm', layerType: 'LayerNorm', config: { normalizedShape: 256 } } },
      { id: 'node_3', type: 'layerNode', position: { x: 0, y: 390 }, data: { label: 'Dense', layerType: 'Dense', config: { inputSize: 256, units: 512, activation: 'relu' } } },
      { id: 'node_4', type: 'layerNode', position: { x: 0, y: 520 }, data: { label: 'Dropout', layerType: 'Dropout', config: { rate: 0.1 } } },
      { id: 'node_5', type: 'layerNode', position: { x: 0, y: 650 }, data: { label: 'Dense', layerType: 'Dense', config: { inputSize: 512, units: 128, activation: 'relu' } } },
      { id: 'node_6', type: 'layerNode', position: { x: 0, y: 780 }, data: { label: 'Output', layerType: 'Output', config: { inputSize: 128, numClasses: 10, activation: 'softmax' } } },
    ],
    edges: [
      { id: 'e0-1', source: 'node_0', target: 'node_1', animated: true },
      { id: 'e1-2', source: 'node_1', target: 'node_2', animated: true },
      { id: 'e2-3', source: 'node_2', target: 'node_3', animated: true },
      { id: 'e3-4', source: 'node_3', target: 'node_4', animated: true },
      { id: 'e4-5', source: 'node_4', target: 'node_5', animated: true },
      { id: 'e5-6', source: 'node_5', target: 'node_6', animated: true },
    ]
  },
  {
    id: 'autoencoder',
    name: 'Autoencoder',
    description: 'For dimensionality reduction',
    tip: 'Compresses data to a smaller "latent" space then reconstructs it. Used for denoising, anomaly detection, and feature learning.',
    icon: Sparkles,
    color: '#ec4899',
    layers: 7,
    nodes: [
      { id: 'node_0', type: 'layerNode', position: { x: 0, y: 0 }, data: { label: 'Input', layerType: 'Input', config: { inputType: 'flat', inputSize: 784 } } },
      { id: 'node_1', type: 'layerNode', position: { x: 0, y: 130 }, data: { label: 'Encoder 1', layerType: 'Dense', config: { inputSize: 784, units: 256, activation: 'relu' } } },
      { id: 'node_2', type: 'layerNode', position: { x: 0, y: 260 }, data: { label: 'Encoder 2', layerType: 'Dense', config: { inputSize: 256, units: 128, activation: 'relu' } } },
      { id: 'node_3', type: 'layerNode', position: { x: 0, y: 390 }, data: { label: 'Latent', layerType: 'Dense', config: { inputSize: 128, units: 32, activation: 'relu' } } },
      { id: 'node_4', type: 'layerNode', position: { x: 0, y: 520 }, data: { label: 'Decoder 1', layerType: 'Dense', config: { inputSize: 32, units: 128, activation: 'relu' } } },
      { id: 'node_5', type: 'layerNode', position: { x: 0, y: 650 }, data: { label: 'Decoder 2', layerType: 'Dense', config: { inputSize: 128, units: 256, activation: 'relu' } } },
      { id: 'node_6', type: 'layerNode', position: { x: 0, y: 780 }, data: { label: 'Output', layerType: 'Output', config: { inputSize: 256, numClasses: 784, activation: 'sigmoid' } } },
    ],
    edges: [
      { id: 'e0-1', source: 'node_0', target: 'node_1', animated: true },
      { id: 'e1-2', source: 'node_1', target: 'node_2', animated: true },
      { id: 'e2-3', source: 'node_2', target: 'node_3', animated: true },
      { id: 'e3-4', source: 'node_3', target: 'node_4', animated: true },
      { id: 'e4-5', source: 'node_4', target: 'node_5', animated: true },
      { id: 'e5-6', source: 'node_5', target: 'node_6', animated: true },
    ]
  },
];

// Export templates for drag handling
export { templates };

export const LayerPalette = ({ isMobile, isOpen, onClose, onAddLayer, onLoadTemplate }) => {
  const onDragStart = (event, layer) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(layer));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Drag start for templates
  const onTemplateDragStart = (event, template) => {
    event.dataTransfer.setData('application/template', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Handle tap to add on mobile
  const handleLayerClick = (layer) => {
    if (isMobile && onAddLayer) {
      onAddLayer(layer);
      onClose();
    }
  };

  // Handle template selection (tap on mobile, click on desktop adds to canvas)
  const handleTemplateClick = (template) => {
    if (onLoadTemplate) {
      onLoadTemplate(template.nodes, template.edges, template.name);
      if (isMobile) {
        onClose();
      }
    }
  };

  const renderContent = () => (
    <Accordion type="multiple" defaultValue={['basic', 'advanced', 'templates']} className="w-full">
      {Object.entries(layerCategories).map(([key, category]) => (
        <AccordionItem key={key} value={key} className="border-border">
          <AccordionTrigger 
            className="text-sm font-semibold hover:no-underline px-2"
            data-testid={`accordion-${key}`}
          >
            {category.label}
          </AccordionTrigger>
          <AccordionContent className="space-y-1 px-1">
            {category.layers.map((layer) => {
              const Icon = layer.icon;
              return (
                <motion.div
                  key={layer.type}
                  draggable={!isMobile}
                  onDragStart={(e) => !isMobile && onDragStart(e, layer)}
                  onClick={() => handleLayerClick(layer)}
                  whileHover={!isMobile ? { scale: 1.02, x: 4 } : undefined}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    isMobile ? "cursor-pointer active:border-primary" : "cursor-grab",
                    "bg-secondary/50 hover:bg-secondary border border-transparent",
                    "hover:border-border transition-all duration-200"
                  )}
                  data-testid={`palette-layer-${layer.type.toLowerCase()}`}
                >
                  <div 
                    className="p-2 rounded-md flex-shrink-0"
                    style={{ backgroundColor: `${layer.color}20` }}
                  >
                    <Icon 
                      className="w-4 h-4" 
                      style={{ color: layer.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {layer.label}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {layer.description}
                    </div>
                  </div>
                  {isMobile && <Plus className="w-4 h-4 text-muted-foreground" />}
                </motion.div>
              );
            })}
          </AccordionContent>
        </AccordionItem>
      ))}

      {/* Templates Section */}
      <AccordionItem value="templates" className="border-border">
        <AccordionTrigger 
          className="text-sm font-semibold hover:no-underline px-2"
          data-testid="accordion-templates"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Templates
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-1 px-1">
          <p className="text-xs text-muted-foreground px-2 pb-2">
            {isMobile ? 'Tap to add' : 'Drag to canvas or click to add'}
          </p>
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <motion.div
                key={template.id}
                draggable={!isMobile}
                onDragStart={(e) => !isMobile && onTemplateDragStart(e, template)}
                onClick={() => handleTemplateClick(template)}
                whileHover={!isMobile ? { scale: 1.02, x: 4 } : undefined}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  isMobile ? "cursor-pointer" : "cursor-grab",
                  "bg-secondary/50 hover:bg-secondary border border-transparent",
                  "hover:border-primary/30 transition-all duration-200"
                )}
                data-testid={`template-${template.id}`}
              >
                <div 
                  className="p-2 rounded-md flex-shrink-0"
                  style={{ backgroundColor: `${template.color}20` }}
                >
                  <Icon 
                    className="w-4 h-4" 
                    style={{ color: template.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {template.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {template.description}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full flex-shrink-0">
                  {template.layers}
                </span>
              </motion.div>
            );
          })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  // Mobile slide-over panel
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={onClose}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-14 bottom-0 w-72 bg-card border-r border-border z-50 flex flex-col"
              data-testid="layer-palette-mobile"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg tracking-tight">Layers</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tap to add layer
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div 
                className="flex-1 overflow-y-auto p-2"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {renderContent()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop resizable panel
  return (
    <ResizablePanel
      side="left"
      defaultWidth={256}
      minWidth={200}
      maxWidth={400}
      className="border-r border-border bg-card/50 backdrop-blur-xl fixed left-0 top-14 bottom-0 z-30 hidden md:block"
      data-testid="layer-palette"
      data-tour="layer-palette"
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg tracking-tight">Layers</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Drag layers to the canvas
          </p>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {renderContent()}
          </div>
        </ScrollArea>
      </div>
    </ResizablePanel>
  );
};
