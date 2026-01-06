import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Layers, 
  Brain, 
  MessageSquare, 
  Network,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

// Template definitions with nodes and edges
const templates = [
  {
    id: 'mlp',
    name: 'Simple MLP',
    description: 'Multi-layer perceptron for tabular data classification',
    icon: Network,
    color: '#8b5cf6',
    tags: ['Classification', 'Regression', 'Tabular'],
    nodes: [
      { id: 'node_0', type: 'layerNode', position: { x: 250, y: 50 }, data: { label: 'Input', layerType: 'Input', config: { inputSize: 784 } } },
      { id: 'node_1', type: 'layerNode', position: { x: 250, y: 150 }, data: { label: 'Dense', layerType: 'Dense', config: { units: 128, activation: 'relu', inputSize: 784 } } },
      { id: 'node_2', type: 'layerNode', position: { x: 250, y: 250 }, data: { label: 'Dropout', layerType: 'Dropout', config: { rate: 0.2 } } },
      { id: 'node_3', type: 'layerNode', position: { x: 250, y: 350 }, data: { label: 'Dense', layerType: 'Dense', config: { units: 64, activation: 'relu' } } },
      { id: 'node_4', type: 'layerNode', position: { x: 250, y: 450 }, data: { label: 'Output', layerType: 'Output', config: { numClasses: 10, activation: 'softmax' } } },
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
    description: 'Convolutional neural network for image classification',
    icon: Layers,
    color: '#06b6d4',
    tags: ['Image', 'Classification', 'Computer Vision'],
    nodes: [
      { id: 'node_0', type: 'layerNode', position: { x: 250, y: 30 }, data: { label: 'Input', layerType: 'Input', config: { inputSize: 784 } } },
      { id: 'node_1', type: 'layerNode', position: { x: 250, y: 110 }, data: { label: 'Conv2D', layerType: 'Conv2D', config: { filters: 32, kernelSize: 3, activation: 'relu', padding: 'same' } } },
      { id: 'node_2', type: 'layerNode', position: { x: 250, y: 190 }, data: { label: 'MaxPool2D', layerType: 'MaxPool2D', config: { poolSize: 2 } } },
      { id: 'node_3', type: 'layerNode', position: { x: 250, y: 270 }, data: { label: 'Conv2D', layerType: 'Conv2D', config: { filters: 64, kernelSize: 3, activation: 'relu', padding: 'same' } } },
      { id: 'node_4', type: 'layerNode', position: { x: 250, y: 350 }, data: { label: 'MaxPool2D', layerType: 'MaxPool2D', config: { poolSize: 2 } } },
      { id: 'node_5', type: 'layerNode', position: { x: 250, y: 430 }, data: { label: 'Flatten', layerType: 'Flatten', config: {} } },
      { id: 'node_6', type: 'layerNode', position: { x: 250, y: 510 }, data: { label: 'Dense', layerType: 'Dense', config: { units: 128, activation: 'relu' } } },
      { id: 'node_7', type: 'layerNode', position: { x: 250, y: 590 }, data: { label: 'Dropout', layerType: 'Dropout', config: { rate: 0.5 } } },
      { id: 'node_8', type: 'layerNode', position: { x: 250, y: 670 }, data: { label: 'Output', layerType: 'Output', config: { numClasses: 10, activation: 'softmax' } } },
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
    description: 'Recurrent network for sequence and time-series data',
    icon: MessageSquare,
    color: '#22c55e',
    tags: ['Sequence', 'Time Series', 'NLP'],
    nodes: [
      { id: 'node_0', type: 'layerNode', position: { x: 250, y: 50 }, data: { label: 'Input', layerType: 'Input', config: { inputSize: 100 } } },
      { id: 'node_1', type: 'layerNode', position: { x: 250, y: 150 }, data: { label: 'LSTM', layerType: 'LSTM', config: { units: 128, returnSequences: true } } },
      { id: 'node_2', type: 'layerNode', position: { x: 250, y: 250 }, data: { label: 'Dropout', layerType: 'Dropout', config: { rate: 0.2 } } },
      { id: 'node_3', type: 'layerNode', position: { x: 250, y: 350 }, data: { label: 'LSTM', layerType: 'LSTM', config: { units: 64, returnSequences: false } } },
      { id: 'node_4', type: 'layerNode', position: { x: 250, y: 450 }, data: { label: 'Dense', layerType: 'Dense', config: { units: 32, activation: 'relu' } } },
      { id: 'node_5', type: 'layerNode', position: { x: 250, y: 550 }, data: { label: 'Output', layerType: 'Output', config: { numClasses: 10, activation: 'softmax' } } },
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
    description: 'Attention-based architecture for advanced NLP tasks',
    icon: Brain,
    color: '#f59e0b',
    tags: ['Attention', 'NLP', 'Advanced'],
    nodes: [
      { id: 'node_0', type: 'layerNode', position: { x: 250, y: 50 }, data: { label: 'Input', layerType: 'Input', config: { inputSize: 512 } } },
      { id: 'node_1', type: 'layerNode', position: { x: 250, y: 150 }, data: { label: 'Multi-Head Attention', layerType: 'MultiHeadAttention', config: { numHeads: 8, keyDim: 64 } } },
      { id: 'node_2', type: 'layerNode', position: { x: 250, y: 250 }, data: { label: 'BatchNorm1D', layerType: 'BatchNorm1D', config: {} } },
      { id: 'node_3', type: 'layerNode', position: { x: 250, y: 350 }, data: { label: 'Dense', layerType: 'Dense', config: { units: 256, activation: 'relu' } } },
      { id: 'node_4', type: 'layerNode', position: { x: 250, y: 450 }, data: { label: 'Dropout', layerType: 'Dropout', config: { rate: 0.1 } } },
      { id: 'node_5', type: 'layerNode', position: { x: 250, y: 550 }, data: { label: 'Dense', layerType: 'Dense', config: { units: 128, activation: 'relu' } } },
      { id: 'node_6', type: 'layerNode', position: { x: 250, y: 650 }, data: { label: 'Output', layerType: 'Output', config: { numClasses: 10, activation: 'softmax' } } },
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
    description: 'Encoder-decoder network for dimensionality reduction',
    icon: Sparkles,
    color: '#ec4899',
    tags: ['Unsupervised', 'Compression', 'Feature Learning'],
    nodes: [
      { id: 'node_0', type: 'layerNode', position: { x: 250, y: 30 }, data: { label: 'Input', layerType: 'Input', config: { inputSize: 784 } } },
      { id: 'node_1', type: 'layerNode', position: { x: 250, y: 110 }, data: { label: 'Encoder 1', layerType: 'Dense', config: { units: 256, activation: 'relu', inputSize: 784 } } },
      { id: 'node_2', type: 'layerNode', position: { x: 250, y: 190 }, data: { label: 'Encoder 2', layerType: 'Dense', config: { units: 128, activation: 'relu' } } },
      { id: 'node_3', type: 'layerNode', position: { x: 250, y: 270 }, data: { label: 'Latent', layerType: 'Dense', config: { units: 32, activation: 'relu' } } },
      { id: 'node_4', type: 'layerNode', position: { x: 250, y: 350 }, data: { label: 'Decoder 1', layerType: 'Dense', config: { units: 128, activation: 'relu' } } },
      { id: 'node_5', type: 'layerNode', position: { x: 250, y: 430 }, data: { label: 'Decoder 2', layerType: 'Dense', config: { units: 256, activation: 'relu' } } },
      { id: 'node_6', type: 'layerNode', position: { x: 250, y: 510 }, data: { label: 'Output', layerType: 'Output', config: { numClasses: 784, activation: 'sigmoid' } } },
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

export const TemplatesPanel = ({ isOpen, onClose, onLoadTemplate }) => {
  const handleSelectTemplate = (template) => {
    onLoadTemplate(template.nodes, template.edges);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed inset-4 sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:inset-auto w-auto sm:w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          data-testid="templates-panel"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg sm:text-xl">Network Templates</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Start with a pre-built architecture</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-templates-btn">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="p-4 sm:p-6 grid gap-4 pb-8">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectTemplate(template)}
                    className="group relative p-4 sm:p-5 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 hover:border-primary/30 cursor-pointer transition-all duration-200"
                    data-testid={`template-${template.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="p-3 rounded-xl flex-shrink-0 transition-colors duration-200"
                        style={{ backgroundColor: `${template.color}15` }}
                      >
                        <Icon 
                          className="w-6 h-6 sm:w-7 sm:h-7" 
                          style={{ color: template.color }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-base sm:text-lg">{template.name}</h3>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {template.tags.map((tag) => (
                            <span 
                              key={tag}
                              className="px-2 py-0.5 text-xs rounded-full bg-background/50 text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                            {template.nodes.length} layers
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
