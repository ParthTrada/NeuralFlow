import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Lightbulb, BookOpen, Layers, Zap, Brain, ArrowRight } from 'lucide-react';
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

// Learning content for the empty state
const learningContent = {
  intro: {
    title: "Welcome to NeuralFlows",
    description: "Build neural networks visually by dragging layers from the left panel onto the canvas."
  },
  quickTips: [
    {
      icon: Layers,
      title: "Start with Input",
      description: "Every network begins with an Input layer that defines your data shape."
    },
    {
      icon: ArrowRight,
      title: "Connect Layers",
      description: "Drag from one layer's handle to another to create connections."
    },
    {
      icon: Zap,
      title: "End with Output",
      description: "Finish with an Output layer. Use Softmax for classification, Linear for regression."
    },
    {
      icon: Brain,
      title: "Use Templates",
      description: "Try pre-built architectures like CNN or Transformer from the Templates section."
    }
  ],
  concepts: [
    {
      term: "Neurons",
      definition: "Basic units that receive inputs, apply weights, and output a value through an activation function."
    },
    {
      term: "Weights",
      definition: "Learnable parameters that determine the strength of connections between neurons."
    },
    {
      term: "Activation",
      definition: "Functions like ReLU or Sigmoid that add non-linearity, enabling complex pattern learning."
    },
    {
      term: "Loss Function",
      definition: "Measures how wrong predictions are. Training minimizes this value."
    },
    {
      term: "Backpropagation",
      definition: "Algorithm that calculates gradients to update weights and improve the network."
    }
  ]
};

// Layer-specific detailed tips
const layerTips = {
  Input: {
    title: "Input Layer",
    description: "The entry point of your neural network. Defines the shape of incoming data.",
    details: [
      "Shape [784] = flattened 28×28 grayscale image",
      "Shape [3, 224, 224] = RGB image (channels, height, width)",
      "Shape [100] = sequence of 100 features"
    ],
    bestPractices: "Match input shape exactly to your data dimensions. Normalize inputs to [0,1] or [-1,1] range for better training."
  },
  Dense: {
    title: "Dense / Fully Connected",
    description: "Every neuron connects to all neurons in the previous layer. The workhorse of neural networks.",
    details: [
      "Units: Number of neurons (start with 128-512)",
      "Activation: ReLU for hidden layers, varies for output",
      "Learns complex combinations of input features"
    ],
    bestPractices: "Use decreasing units as you go deeper (e.g., 512→256→128). Add Dropout after Dense layers to prevent overfitting."
  },
  Conv2D: {
    title: "2D Convolution",
    description: "Slides small filters across images to detect local patterns like edges, textures, and shapes.",
    details: [
      "Filters: Number of feature detectors (32, 64, 128...)",
      "Kernel Size: Filter size, typically 3×3 or 5×5",
      "Padding: 'same' keeps dimensions, 'valid' shrinks"
    ],
    bestPractices: "Stack Conv2D layers, doubling filters each time. Always follow with MaxPool2D to reduce spatial dimensions."
  },
  MaxPool2D: {
    title: "Max Pooling",
    description: "Reduces spatial dimensions by taking the maximum value in each region, making the network more efficient.",
    details: [
      "Pool Size 2×2 halves width and height",
      "Reduces computation and parameters",
      "Provides translation invariance"
    ],
    bestPractices: "Place after Conv2D layers. Use 2×2 pooling with stride 2. Don't pool too aggressively—preserve important spatial info."
  },
  Dropout: {
    title: "Dropout Regularization",
    description: "Randomly 'drops' neurons during training by setting them to zero. Prevents overfitting.",
    details: [
      "Rate 0.2 = drop 20% of neurons",
      "Rate 0.5 = drop 50% (typical for Dense layers)",
      "Only active during training, not inference"
    ],
    bestPractices: "Use 0.2-0.3 after Conv2D, 0.4-0.5 after Dense layers. If model underfits, reduce dropout rate."
  },
  Flatten: {
    title: "Flatten Layer",
    description: "Converts multi-dimensional data (like images) into a 1D vector for Dense layers.",
    details: [
      "No learnable parameters",
      "Shape [batch, 32, 7, 7] → [batch, 1568]",
      "Required bridge between Conv and Dense"
    ],
    bestPractices: "Always place between your last Conv2D/Pool layer and first Dense layer. No configuration needed."
  },
  Output: {
    title: "Output Layer",
    description: "Final layer that produces predictions. Configuration depends on your task type.",
    details: [
      "Classification: Softmax activation, units = num classes",
      "Binary: Sigmoid activation, 1 unit",
      "Regression: No activation (Linear), units = outputs"
    ],
    bestPractices: "Match units to your target. For 10 classes, use 10 units with Softmax. For yes/no, use 1 unit with Sigmoid."
  },
  Embedding: {
    title: "Embedding Layer",
    description: "Converts discrete tokens (words, characters) into dense continuous vectors for NLP tasks.",
    details: [
      "Vocab Size: Number of unique tokens in your data",
      "Embed Dim: Size of output vectors (128-512 typical)",
      "Learns semantic relationships between tokens"
    ],
    bestPractices: "Use pre-trained embeddings (Word2Vec, GloVe) when possible. Embed dim should be sqrt(vocab_size) as a starting point."
  },
  BatchNorm1D: {
    title: "Batch Normalization (1D)",
    description: "Normalizes layer inputs to have zero mean and unit variance. Dramatically speeds up training.",
    details: [
      "Reduces internal covariate shift",
      "Allows higher learning rates",
      "Has slight regularization effect"
    ],
    bestPractices: "Place after Dense layer, before activation. Use with caution in small batch sizes (<32)."
  },
  BatchNorm2D: {
    title: "Batch Normalization (2D)",
    description: "Same as BatchNorm1D but for convolutional layers. Normalizes across spatial dimensions.",
    details: [
      "Normalizes per feature map/channel",
      "Essential for deep CNN training",
      "Momentum controls running stats update"
    ],
    bestPractices: "Place after Conv2D, before ReLU. Standard in modern architectures like ResNet."
  },
  LayerNorm: {
    title: "Layer Normalization",
    description: "Normalizes across features (not batch). Preferred in Transformers and RNNs.",
    details: [
      "Independent of batch size",
      "Normalizes each sample individually",
      "Standard in Transformer architectures"
    ],
    bestPractices: "Use in Transformers after attention and feed-forward layers. Works well with small batches and variable sequence lengths."
  },
  LSTM: {
    title: "Long Short-Term Memory",
    description: "Recurrent layer that can learn long-term dependencies in sequential data using memory gates.",
    details: [
      "Forget Gate: What to discard from memory",
      "Input Gate: What new info to store",
      "Output Gate: What to output from memory"
    ],
    bestPractices: "Use for text, time-series, audio. Stack 2-3 layers max. Consider bidirectional for better context."
  },
  GRU: {
    title: "Gated Recurrent Unit",
    description: "Simplified LSTM with fewer parameters. Often performs similarly but trains faster.",
    details: [
      "Reset Gate: How much past to forget",
      "Update Gate: Balance of old vs new info",
      "Fewer parameters than LSTM"
    ],
    bestPractices: "Try GRU first—if LSTM doesn't outperform, stick with GRU. Good for smaller datasets."
  },
  MultiHeadAttention: {
    title: "Multi-Head Attention",
    description: "Core mechanism of Transformers. Learns which parts of the input to focus on.",
    details: [
      "Query, Key, Value: Three projections of input",
      "Multiple heads capture different relationships",
      "Self-attention: Input attends to itself"
    ],
    bestPractices: "Use 8 heads as baseline. Embed dim should be divisible by num heads. Follow with LayerNorm."
  },
  TransformerEncoder: {
    title: "Transformer Encoder",
    description: "Complete encoder block with self-attention, feed-forward network, and layer normalization.",
    details: [
      "Self-attention captures global dependencies",
      "Feed-forward processes each position",
      "Residual connections prevent gradient vanishing"
    ],
    bestPractices: "Use 2-6 layers for most tasks. d_model typically 256-512. Used in BERT for understanding tasks."
  },
  TransformerDecoder: {
    title: "Transformer Decoder",
    description: "Decoder block with masked self-attention, cross-attention to encoder, and feed-forward network.",
    details: [
      "Masked attention: Can only see previous tokens",
      "Cross-attention: Attends to encoder output",
      "Used for generation tasks (GPT, translation)"
    ],
    bestPractices: "Match d_model with encoder. Use causal masking for autoregressive generation. 2-6 layers typical."
  },
  Add: {
    title: "Add (Skip Connection)",
    description: "Element-wise addition of multiple inputs. Core component of residual networks (ResNet).",
    details: [
      "Enables training of very deep networks (100+ layers)",
      "Allows gradients to flow directly through shortcuts",
      "All inputs must have identical shapes"
    ],
    bestPractices: "Connect the skip from before a block to after. In ResNet: x + F(x). Combine with BatchNorm for stability."
  },
  Concatenate: {
    title: "Concatenate Layer",
    description: "Joins multiple inputs along a specified axis. Used for feature fusion in U-Net, DenseNet.",
    details: [
      "Unlike Add, preserves all information from both inputs",
      "Output size = sum of input sizes along concat axis",
      "Inputs must match in all dimensions except concat axis"
    ],
    bestPractices: "Use axis=-1 (last dimension) for feature concatenation. Common in U-Net skip connections and DenseNet dense blocks."
  },
  GlobalAvgPool1D: {
    title: "Global Average Pooling 1D",
    description: "Reduces sequence to a single vector by averaging across all positions. Used in Transformers for classification.",
    details: [
      "[batch, seq_len, features] → [batch, features]",
      "No learnable parameters",
      "Alternative to Flatten that handles variable lengths"
    ],
    bestPractices: "Use after Transformer/LSTM for classification tasks. Better than Flatten for variable-length sequences."
  },
  PositionalEncoding: {
    title: "Positional Encoding",
    description: "Adds position information to embeddings. Essential for Transformers since attention has no sense of order.",
    details: [
      "Sinusoidal: Fixed mathematical patterns",
      "Learned: Trainable position embeddings",
      "Without this, 'dog bites man' = 'man bites dog'"
    ],
    bestPractices: "Always use after Embedding, before Transformer. max_len should cover your longest sequence. Add dropout after."
  }
};

const LearningPanel = () => {
  const navigate = useNavigate();
  
  return (
  <div className="p-4 space-y-6">
    {/* Header */}
    <div className="text-center pb-2">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
        <BookOpen className="w-6 h-6 text-primary" />
      </div>
      <h2 className="font-bold text-lg">{learningContent.intro.title}</h2>
      <p className="text-sm text-muted-foreground mt-1">
        {learningContent.intro.description}
      </p>
      {/* Tutorial Button */}
      <Button
        variant="outline"
        size="sm"
        className="mt-3 gap-2"
        onClick={() => navigate('/guide')}
        data-testid="tutorial-btn-panel"
      >
        <BookOpen className="w-4 h-4" />
        View Tutorial
      </Button>
    </div>

    <Separator />

    {/* Quick Tips */}
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Quick Start
      </h3>
      <div className="space-y-3">
        {learningContent.quickTips.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <div key={index} className="flex gap-3 p-2 rounded-lg bg-secondary/30">
              <div className="p-1.5 rounded-md bg-primary/10 h-fit">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <Separator />

    {/* Key Concepts */}
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Key Concepts
      </h3>
      <div className="space-y-3">
        {learningContent.concepts.map((concept, index) => (
          <div key={index} className="p-3 rounded-lg border border-border bg-card/50">
            <p className="text-sm font-semibold text-primary">{concept.term}</p>
            <p className="text-xs text-muted-foreground mt-1">{concept.definition}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);
};

const LayerTipsPanel = ({ layerType }) => {
  const tips = layerTips[layerType];
  if (!tips) return null;

  return (
    <div className="p-4 border-t border-border bg-secondary/20">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Learn
        </h4>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{tips.description}</p>
        
        <div className="space-y-1.5">
          {tips.details.map((detail, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <span className="text-primary mt-0.5">•</span>
              <span className="text-muted-foreground">{detail}</span>
            </div>
          ))}
        </div>
        
        <div className="p-2 rounded-md bg-primary/5 border border-primary/10">
          <p className="text-xs text-primary/80">
            <span className="font-semibold">Tip:</span> {tips.bestPractices}
          </p>
        </div>
      </div>
    </div>
  );
};

export const PropertiesPanel = ({ selectedNode, onUpdateNode, onDeleteNode, onClose, isMobile }) => {
  // Empty state - show learning content (desktop only, not on mobile when nothing selected)
  if (!selectedNode && !isMobile) {
    return (
      <ResizablePanel
        side="right"
        defaultWidth={320}
        minWidth={280}
        maxWidth={500}
        className="border-l border-border bg-card/50 backdrop-blur-xl fixed right-0 top-14 bottom-0 z-30 hidden md:block"
        data-testid="properties-panel-empty"
      >
        <ScrollArea className="h-full">
          <LearningPanel />
        </ScrollArea>
      </ResizablePanel>
    );
  }

  // No panel on mobile when nothing selected
  if (!selectedNode) {
    return null;
  }

  const layerConfig = getLayerConfig(selectedNode.data.layerType);
  const configFields = getConfigFields(selectedNode.data.layerType, selectedNode.data.config);
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

  const panelContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
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
              className="text-base"
              style={{ fontSize: '16px' }}
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
                      className="text-base"
                      style={{ fontSize: '16px' }}
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
                      className="text-base"
                      style={{ fontSize: '16px' }}
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

        {/* Layer-specific learning tips */}
        <LayerTipsPanel layerType={selectedNode.data.layerType} />
      </ScrollArea>

      {/* Delete Button */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
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
  );

  // Mobile slide-over
  if (isMobile) {
    return (
      <AnimatePresence mode="wait">
        {selectedNode && (
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
              key={selectedNode.id}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-14 bottom-0 w-80 max-w-[85vw] bg-card border-l border-border z-50"
              data-testid="properties-panel-mobile"
            >
              {panelContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop resizable panel
  return (
    <AnimatePresence mode="wait">
      <ResizablePanel
        key={selectedNode.id}
        side="right"
        defaultWidth={320}
        minWidth={280}
        maxWidth={500}
        className="border-l border-border bg-card/50 backdrop-blur-xl fixed right-0 top-14 bottom-0 z-30 hidden md:block"
        data-testid="properties-panel"
        data-tour="properties-panel"
      >
        {panelContent}
      </ResizablePanel>
    </AnimatePresence>
  );
};
