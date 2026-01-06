import { 
  Layers, 
  Grid3X3, 
  Maximize2, 
  Scissors, 
  Minimize2, 
  BarChart3,
  Activity,
  GitBranch,
  Zap,
  CircleDot,
  Target
} from 'lucide-react';

export const layerCategories = {
  basic: {
    label: 'Basic Layers',
    layers: [
      {
        type: 'Input',
        label: 'Input',
        icon: CircleDot,
        color: 'hsl(187, 95%, 42%)',
        description: 'Input layer - defines the shape of input data',
        defaultConfig: {
          inputShape: [2],
        }
      },
      {
        type: 'Dense',
        label: 'Dense / Linear',
        icon: Grid3X3,
        color: 'hsl(263, 70%, 50%)',
        description: 'Fully connected layer',
        defaultConfig: {
          inputSize: 2,
          units: 16,
          activation: 'relu'
        }
      },
      {
        type: 'Conv2D',
        label: 'Conv2D',
        icon: Layers,
        color: 'hsl(263, 70%, 50%)',
        description: '2D Convolutional layer for image data',
        defaultConfig: {
          inChannels: 1,
          outChannels: 32,
          kernelSize: 3,
          padding: 1,
          activation: 'relu'
        }
      },
      {
        type: 'MaxPool2D',
        label: 'MaxPool2D',
        icon: Maximize2,
        color: 'hsl(263, 70%, 50%)',
        description: 'Max pooling operation',
        defaultConfig: {
          kernelSize: 2,
          stride: 2
        }
      },
      {
        type: 'Dropout',
        label: 'Dropout',
        icon: Scissors,
        color: 'hsl(38, 92%, 50%)',
        description: 'Regularization layer to prevent overfitting',
        defaultConfig: {
          rate: 0.5
        }
      },
      {
        type: 'Flatten',
        label: 'Flatten',
        icon: Minimize2,
        color: 'hsl(263, 70%, 50%)',
        description: 'Flatten multi-dimensional input to 1D',
        defaultConfig: {}
      },
      {
        type: 'Output',
        label: 'Output',
        icon: Target,
        color: 'hsl(158, 64%, 40%)',
        description: 'Output layer for predictions',
        defaultConfig: {
          inputSize: 16,
          numClasses: 3,
          activation: 'softmax'
        }
      }
    ]
  },
  advanced: {
    label: 'Advanced Layers',
    layers: [
      {
        type: 'BatchNorm1D',
        label: 'BatchNorm1D',
        icon: BarChart3,
        color: 'hsl(263, 70%, 50%)',
        description: 'Batch normalization for 1D data',
        defaultConfig: {
          numFeatures: 128
        }
      },
      {
        type: 'BatchNorm2D',
        label: 'BatchNorm2D',
        icon: BarChart3,
        color: 'hsl(263, 70%, 50%)',
        description: 'Batch normalization for 2D data (images)',
        defaultConfig: {
          numFeatures: 32
        }
      },
      {
        type: 'LSTM',
        label: 'LSTM',
        icon: Activity,
        color: 'hsl(280, 70%, 50%)',
        description: 'Long Short-Term Memory layer for sequences',
        defaultConfig: {
          inputSize: 128,
          hiddenSize: 64,
          numLayers: 1,
          bidirectional: false
        }
      },
      {
        type: 'GRU',
        label: 'GRU',
        icon: GitBranch,
        color: 'hsl(280, 70%, 50%)',
        description: 'Gated Recurrent Unit layer',
        defaultConfig: {
          inputSize: 128,
          hiddenSize: 64,
          numLayers: 1
        }
      },
      {
        type: 'Attention',
        label: 'Multi-Head Attention',
        icon: Zap,
        color: 'hsl(45, 90%, 50%)',
        description: 'Self-attention mechanism',
        defaultConfig: {
          embedDim: 64,
          numHeads: 8
        }
      }
    ]
  }
};

export const activationFunctions = [
  { value: 'relu', label: 'ReLU' },
  { value: 'leaky_relu', label: 'Leaky ReLU' },
  { value: 'sigmoid', label: 'Sigmoid' },
  { value: 'tanh', label: 'Tanh' },
  { value: 'softmax', label: 'Softmax' },
  { value: 'gelu', label: 'GELU' },
  { value: 'silu', label: 'SiLU / Swish' }
];

export const getLayerConfig = (layerType) => {
  for (const category of Object.values(layerCategories)) {
    const layer = category.layers.find(l => l.type === layerType);
    if (layer) return layer;
  }
  return null;
};

export const getConfigFields = (layerType) => {
  const fields = {
    Input: [
      { key: 'inputShape', label: 'Input Shape', type: 'text', placeholder: '[784] or [1, 28, 28]' }
    ],
    Dense: [
      { key: 'inputSize', label: 'Input Size', type: 'number', min: 1 },
      { key: 'units', label: 'Units', type: 'number', min: 1 },
      { key: 'activation', label: 'Activation', type: 'select', options: activationFunctions }
    ],
    Conv2D: [
      { key: 'inChannels', label: 'In Channels', type: 'number', min: 1 },
      { key: 'outChannels', label: 'Out Channels', type: 'number', min: 1 },
      { key: 'kernelSize', label: 'Kernel Size', type: 'number', min: 1 },
      { key: 'padding', label: 'Padding', type: 'number', min: 0 },
      { key: 'activation', label: 'Activation', type: 'select', options: activationFunctions }
    ],
    MaxPool2D: [
      { key: 'kernelSize', label: 'Kernel Size', type: 'number', min: 1 },
      { key: 'stride', label: 'Stride', type: 'number', min: 1 }
    ],
    Dropout: [
      { key: 'rate', label: 'Dropout Rate', type: 'number', min: 0, max: 1, step: 0.1 }
    ],
    Flatten: [],
    BatchNorm1D: [
      { key: 'numFeatures', label: 'Num Features', type: 'number', min: 1 }
    ],
    BatchNorm2D: [
      { key: 'numFeatures', label: 'Num Features', type: 'number', min: 1 }
    ],
    LSTM: [
      { key: 'inputSize', label: 'Input Size', type: 'number', min: 1 },
      { key: 'hiddenSize', label: 'Hidden Size', type: 'number', min: 1 },
      { key: 'numLayers', label: 'Num Layers', type: 'number', min: 1 },
      { key: 'bidirectional', label: 'Bidirectional', type: 'checkbox' }
    ],
    GRU: [
      { key: 'inputSize', label: 'Input Size', type: 'number', min: 1 },
      { key: 'hiddenSize', label: 'Hidden Size', type: 'number', min: 1 },
      { key: 'numLayers', label: 'Num Layers', type: 'number', min: 1 }
    ],
    Attention: [
      { key: 'embedDim', label: 'Embed Dimension', type: 'number', min: 1 },
      { key: 'numHeads', label: 'Num Heads', type: 'number', min: 1 }
    ],
    Output: [
      { key: 'inputSize', label: 'Input Size', type: 'number', min: 1 },
      { key: 'numClasses', label: 'Num Classes', type: 'number', min: 1 },
      { key: 'activation', label: 'Activation', type: 'select', options: [
        { value: 'none', label: 'None (Linear)' },
        { value: 'softmax', label: 'Softmax' },
        { value: 'sigmoid', label: 'Sigmoid' }
      ]}
    ]
  };
  
  return fields[layerType] || [];
};
