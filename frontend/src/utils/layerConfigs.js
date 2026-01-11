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
  Target,
  FileText,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlignJustify
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
        tip: 'The entry point of your network. Choose input type based on your data: Flat for vectors, Image for CNN, Sequence for RNN/Transformer.',
        defaultConfig: {
          inputType: 'flat',
          inputSize: 784,
          channels: 3,
          height: 224,
          width: 224,
          seqLength: 32,
          features: 256
        }
      },
      {
        type: 'Dense',
        label: 'Dense / Linear',
        icon: Grid3X3,
        color: 'hsl(263, 70%, 50%)',
        description: 'Fully connected layer',
        tip: 'Every neuron connects to all neurons in the previous layer. Great for learning complex patterns. Use ReLU activation for hidden layers.',
        defaultConfig: {
          inputSize: 784,
          units: 128,
          activation: 'relu'
        }
      },
      {
        type: 'Conv2D',
        label: 'Conv2D',
        icon: Layers,
        color: 'hsl(263, 70%, 50%)',
        description: '2D Convolutional layer for image data',
        tip: 'Slides a small filter across the image to detect features like edges, textures, and shapes. Essential for image recognition.',
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
        tip: 'Reduces spatial dimensions by taking the maximum value in each region. Makes the network more efficient and adds translation invariance.',
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
        tip: 'Randomly "drops" neurons during training (sets to 0). Prevents overfitting by forcing the network to not rely on specific neurons. Use 0.2-0.5 rate.',
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
        tip: 'Converts 2D/3D feature maps into a 1D vector. Required before Dense layers when coming from Conv2D layers.',
        defaultConfig: {}
      },
      {
        type: 'Output',
        label: 'Output',
        icon: Target,
        color: 'hsl(158, 64%, 40%)',
        description: 'Output layer for predictions',
        tip: 'Final layer producing predictions. Use Softmax for multi-class classification, Sigmoid for binary, or no activation for regression.',
        defaultConfig: {
          inputSize: 128,
          numClasses: 10,
          activation: 'softmax'
        }
      }
    ]
  },
  advanced: {
    label: 'Advanced Layers',
    layers: [
      {
        type: 'Embedding',
        label: 'Embedding',
        icon: FileText,
        color: 'hsl(200, 80%, 50%)',
        description: 'Converts token IDs to dense vectors',
        tip: 'Maps discrete tokens (words, characters) to continuous vectors. Essential for NLP tasks. vocab_size = number of unique tokens.',
        defaultConfig: {
          vocabSize: 10000,
          embedDim: 256
        }
      },
      {
        type: 'BatchNorm1D',
        label: 'BatchNorm1D',
        icon: BarChart3,
        color: 'hsl(142, 71%, 45%)',
        description: 'Batch normalization for 1D data',
        tip: 'Normalizes layer inputs to have zero mean and unit variance. Speeds up training and allows higher learning rates. Use after Dense layers.',
        defaultConfig: {
          numFeatures: 128
        }
      },
      {
        type: 'BatchNorm2D',
        label: 'BatchNorm2D',
        icon: BarChart3,
        color: 'hsl(142, 71%, 45%)',
        description: 'Batch normalization for 2D data',
        tip: 'Same as BatchNorm1D but for convolutional layers. Place after Conv2D and before activation for best results.',
        defaultConfig: {
          numFeatures: 32
        }
      },
      {
        type: 'LayerNorm',
        label: 'LayerNorm',
        icon: AlignJustify,
        color: 'hsl(142, 71%, 45%)',
        description: 'Layer normalization (used in Transformers)',
        tip: 'Normalizes across features instead of batch. Preferred in Transformers and RNNs. Works well with small batch sizes.',
        defaultConfig: {
          normalizedShape: 256
        }
      },
      {
        type: 'LSTM',
        label: 'LSTM',
        icon: Activity,
        color: 'hsl(330, 81%, 60%)',
        description: 'Long Short-Term Memory for sequences',
        tip: 'Remembers long-term dependencies in sequential data. Has "gates" to control information flow. Great for text, time-series, and speech.',
        defaultConfig: {
          inputSize: 256,
          hiddenSize: 128,
          numLayers: 1,
          bidirectional: false
        }
      },
      {
        type: 'GRU',
        label: 'GRU',
        icon: GitBranch,
        color: 'hsl(280, 68%, 60%)',
        description: 'Gated Recurrent Unit for sequences',
        tip: 'Simpler alternative to LSTM with fewer parameters. Often performs similarly but trains faster. Good choice for smaller datasets.',
        defaultConfig: {
          inputSize: 256,
          hiddenSize: 128,
          numLayers: 1
        }
      },
      {
        type: 'MultiHeadAttention',
        label: 'Multi-Head Attention',
        icon: Zap,
        color: 'hsl(45, 93%, 47%)',
        description: 'Transformer attention mechanism',
        tip: 'Learns which parts of the input to focus on. Multiple "heads" capture different relationships. Core of modern NLP models like GPT and BERT.',
        defaultConfig: {
          embedDim: 256,
          numHeads: 8
        }
      },
      {
        type: 'PositionalEncoding',
        label: 'Positional Encoding',
        icon: AlignJustify,
        color: 'hsl(160, 70%, 45%)',
        description: 'Adds position information to embeddings',
        tip: 'Injects information about token positions into the embeddings. Essential for Transformers since attention has no inherent sense of order.',
        defaultConfig: {
          maxLen: 512,
          dModel: 256,
          dropout: 0.1
        }
      },
      {
        type: 'TransformerEncoder',
        label: 'Transformer Encoder',
        icon: ArrowDownToLine,
        color: 'hsl(220, 80%, 55%)',
        description: 'Full Transformer encoder block',
        tip: 'Complete encoder with self-attention + feed-forward + normalization. Used in BERT for understanding text. Stack multiple for deeper models.',
        defaultConfig: {
          dModel: 256,
          nHead: 8,
          dimFeedforward: 1024,
          numLayers: 2
        }
      },
      {
        type: 'TransformerDecoder',
        label: 'Transformer Decoder',
        icon: ArrowUpFromLine,
        color: 'hsl(280, 80%, 55%)',
        description: 'Full Transformer decoder block',
        tip: 'Decoder with masked self-attention + cross-attention + feed-forward. Used in GPT for text generation. Attends to encoder output.',
        defaultConfig: {
          dModel: 256,
          nHead: 8,
          dimFeedforward: 1024,
          numLayers: 2
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

export const inputTypes = [
  { value: 'flat', label: 'Flat (Vector)' },
  { value: 'image', label: 'Image (C, H, W)' },
  { value: 'sequence', label: 'Sequence (Len, Feat)' },
  { value: 'text', label: 'Text (Token IDs)' }
];

export const getLayerConfig = (layerType) => {
  for (const category of Object.values(layerCategories)) {
    const layer = category.layers.find(l => l.type === layerType);
    if (layer) return layer;
  }
  return null;
};

// Dynamic config fields based on layer type and current config
export const getConfigFields = (layerType, config = {}) => {
  // Input layer has dynamic fields based on inputType
  if (layerType === 'Input') {
    const inputType = config.inputType || 'flat';
    const baseFields = [
      { key: 'inputType', label: 'Input Type', type: 'select', options: inputTypes }
    ];
    
    if (inputType === 'flat') {
      return [...baseFields, { key: 'inputSize', label: 'Input Size', type: 'number', min: 1 }];
    } else if (inputType === 'image') {
      return [
        ...baseFields,
        { key: 'channels', label: 'Channels', type: 'number', min: 1 },
        { key: 'height', label: 'Height', type: 'number', min: 1 },
        { key: 'width', label: 'Width', type: 'number', min: 1 }
      ];
    } else if (inputType === 'sequence') {
      return [
        ...baseFields,
        { key: 'seqLength', label: 'Sequence Length', type: 'number', min: 1, description: 'Number of timesteps (e.g., 50 for 50 time steps)' },
        { key: 'features', label: 'Features per Step', type: 'number', min: 1, description: 'Number of features at each timestep (e.g., 10 sensor readings)' }
      ];
    } else if (inputType === 'text') {
      return [
        ...baseFields,
        { key: 'vocabSize', label: 'Vocabulary Size', type: 'number', min: 100, description: 'Max number of unique words/tokens' },
        { key: 'seqLength', label: 'Max Sequence Length', type: 'number', min: 1, description: 'Maximum number of tokens per text (e.g., 100)' }
      ];
    }
    return baseFields;
  }

  const fields = {
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
    Embedding: [
      { key: 'vocabSize', label: 'Vocab Size', type: 'number', min: 1 },
      { key: 'embedDim', label: 'Embedding Dim', type: 'number', min: 1 }
    ],
    BatchNorm1D: [
      { key: 'numFeatures', label: 'Num Features', type: 'number', min: 1 }
    ],
    BatchNorm2D: [
      { key: 'numFeatures', label: 'Num Features', type: 'number', min: 1 }
    ],
    LayerNorm: [
      { key: 'normalizedShape', label: 'Normalized Shape', type: 'number', min: 1 }
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
    MultiHeadAttention: [
      { key: 'embedDim', label: 'Embed Dimension', type: 'number', min: 1 },
      { key: 'numHeads', label: 'Num Heads', type: 'number', min: 1 }
    ],
    PositionalEncoding: [
      { key: 'maxLen', label: 'Max Length', type: 'number', min: 1 },
      { key: 'dModel', label: 'Model Dimension', type: 'number', min: 1 },
      { key: 'dropout', label: 'Dropout Rate', type: 'number', min: 0, max: 1, step: 0.1 }
    ],
    TransformerEncoder: [
      { key: 'dModel', label: 'Model Dimension', type: 'number', min: 1 },
      { key: 'nHead', label: 'Num Heads', type: 'number', min: 1 },
      { key: 'dimFeedforward', label: 'Feedforward Dim', type: 'number', min: 1 },
      { key: 'numLayers', label: 'Num Layers', type: 'number', min: 1 }
    ],
    TransformerDecoder: [
      { key: 'dModel', label: 'Model Dimension', type: 'number', min: 1 },
      { key: 'nHead', label: 'Num Heads', type: 'number', min: 1 },
      { key: 'dimFeedforward', label: 'Feedforward Dim', type: 'number', min: 1 },
      { key: 'numLayers', label: 'Num Layers', type: 'number', min: 1 }
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
