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
  AlignJustify,
  Plus,
  GitMerge,
  // New unique icons for each layer
  Box,
  LayoutGrid,
  Shrink,
  Shuffle,
  Hash,
  Type,
  TrendingUp,
  Repeat,
  Cpu,
  Brain,
  Sparkles,
  Radio,
  Waves,
  Network,
  CircuitBoard,
  Binary,
  SlidersHorizontal,
  Gauge,
  ArrowRightLeft,
  Combine,
  Split,
  ChevronDownSquare,
  Square,
  RectangleHorizontal,
  Grip,
  SquareStack,
  Podcast,
  AudioWaveform
} from 'lucide-react';

// Layers that support multiple inputs (for skip connections)
export const multiInputLayers = ['Add', 'Concatenate'];

export const layerCategories = {
  basic: {
    label: 'Basic Layers',
    layers: [
      {
        type: 'Input',
        label: 'Input',
        icon: Radio,
        color: 'hsl(187, 95%, 42%)',
        description: 'Input layer - defines the shape of input data',
        tip: 'The entry point of your network. Choose input type based on your data: Flat for vectors, Image for CNN, Sequence for RNN/Transformer.',
        learnMore: {
          whatItDoes: 'Defines the shape and type of data your network expects. No computation happens here - it just specifies the input format.',
          whenToUse: 'Every network needs exactly one Input layer at the start.',
          inputTypes: 'Flat (1D vector for tabular data), Image (3D for CNNs), Sequence (2D for RNNs/Transformers), Text (token IDs for NLP).',
          example: 'MNIST: Flat [784] or Image [1, 28, 28]. ImageNet: Image [3, 224, 224]. Text: [128] tokens.'
        },
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
        learnMore: {
          whatItDoes: 'Performs y = activation(Wx + b) where W is a weight matrix. Each output neuron sees ALL inputs.',
          whenToUse: 'For learning non-linear relationships. Stack multiple Dense layers for deeper representations. Always use after Flatten for CNNs.',
          activation: 'ReLU for hidden layers (fast, prevents vanishing gradients). Softmax for classification output. Linear/None for regression.',
          example: 'Dense(128, relu) → Dense(64, relu) → Dense(10, softmax) for 10-class classification.'
        },
        defaultConfig: {
          inputSize: 784,
          units: 128,
          activation: 'relu'
        }
      },
      {
        type: 'Conv2D',
        label: 'Conv2D',
        icon: LayoutGrid,
        color: 'hsl(220, 80%, 55%)',
        description: '2D Convolutional layer for image data',
        tip: 'Slides a small filter across the image to detect features like edges, textures, and shapes. Essential for image recognition.',
        learnMore: {
          whatItDoes: 'Slides learned filters (kernels) across the image. Early layers detect edges, later layers detect complex patterns like faces.',
          whenToUse: 'For any image-related task: classification, detection, segmentation. Stack Conv→Pool→Conv→Pool for deeper features.',
          keyParams: 'Filters: more = more patterns learned. Kernel size: 3x3 is standard. Padding: "same" keeps dimensions, "valid" shrinks.',
          example: 'Conv2D(32, 3x3) → MaxPool → Conv2D(64, 3x3) → MaxPool → Flatten → Dense. Typical CNN pattern.'
        },
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
        icon: ChevronDownSquare,
        color: 'hsl(200, 70%, 50%)',
        description: 'Max pooling operation',
        tip: 'Reduces spatial dimensions by taking the maximum value in each region. Makes the network more efficient and adds translation invariance.',
        learnMore: {
          whatItDoes: 'Divides input into non-overlapping regions and outputs the maximum value from each. Reduces dimensions by factor of pool_size.',
          whenToUse: 'After Conv2D layers to reduce spatial dimensions and computation. Provides translation invariance (small shifts don\'t change output).',
          vsAvgPool: 'MaxPool preserves the strongest activations (better for detecting features). AvgPool smooths (better for some tasks).',
          example: '28x28 image → MaxPool2D(2,2) → 14x14. Reduces parameters by 4x!'
        },
        defaultConfig: {
          kernelSize: 2,
          stride: 2
        }
      },
      {
        type: 'Dropout',
        label: 'Dropout',
        icon: Shuffle,
        color: 'hsl(38, 92%, 50%)',
        description: 'Regularization layer to prevent overfitting',
        tip: 'Randomly "drops" neurons during training (sets to 0). Prevents overfitting by forcing the network to not rely on specific neurons. Use 0.2-0.5 rate.',
        learnMore: {
          whatItDoes: 'During training, randomly sets a fraction of inputs to 0. During inference, all neurons are used but scaled.',
          whenToUse: 'Between Dense layers to prevent overfitting. Higher rate (0.5) for large networks, lower (0.2) for small ones.',
          keyInsight: 'Acts like training an ensemble of networks. Each forward pass uses a different "sub-network".',
          bestPractice: 'Don\'t use after the final output layer. Typical: Dense→Dropout→Dense→Dropout→Output.'
        },
        defaultConfig: {
          rate: 0.5
        }
      },
      {
        type: 'Flatten',
        label: 'Flatten',
        icon: RectangleHorizontal,
        color: 'hsl(280, 60%, 55%)',
        description: 'Flatten multi-dimensional input to 1D',
        tip: 'Converts 2D/3D feature maps into a 1D vector. Required before Dense layers when coming from Conv2D layers.',
        learnMore: {
          whatItDoes: 'Reshapes multi-dimensional input (like 7x7x64 feature maps) into a 1D vector (3136 features).',
          whenToUse: 'Between Conv2D/MaxPool layers and Dense layers. Dense layers expect 1D input.',
          example: '[batch, 7, 7, 64] → [batch, 3136]. The spatial structure is lost but all information is preserved.',
          alternative: 'For sequences, consider GlobalAvgPool1D instead - it averages rather than flattening.'
        },
        defaultConfig: {}
      },
      {
        type: 'GlobalAvgPool1D',
        label: 'Global Avg Pool 1D',
        icon: Shrink,
        color: 'hsl(170, 60%, 45%)',
        description: 'Global average pooling for sequences',
        tip: 'Averages across the sequence dimension, converting [batch, seq_len, features] to [batch, features]. Used after Transformer encoder for classification. Unlike Flatten, it reduces sequence length to 1 by taking the mean, preserving the feature dimension.',
        learnMore: {
          whatItDoes: 'Takes the average of all positions in a sequence, producing a single vector that represents the entire sequence.',
          whenToUse: 'After Transformer/LSTM layers when you need a fixed-size output for classification. Better than Flatten for variable-length sequences.',
          example: 'Input: [batch, 128 tokens, 256 features] → Output: [batch, 256 features]'
        },
        defaultConfig: {}
      },
      {
        type: 'Add',
        label: 'Add (Skip Connection)',
        icon: Plus,
        color: 'hsl(142, 71%, 45%)',
        description: 'Adds multiple inputs element-wise',
        tip: 'Combines multiple inputs by adding them element-wise. Used for skip/residual connections in ResNet and Transformers. All inputs must have the same shape.',
        learnMore: {
          whatItDoes: 'Performs element-wise addition of two or more tensors: output = input1 + input2 + ...',
          whenToUse: 'For residual/skip connections that help train very deep networks (50+ layers). Allows gradients to flow directly through the network.',
          example: 'ResNet: x + F(x), where F(x) is the output of Conv layers. If F learns nothing useful, the network can still pass x through unchanged.',
          keyInsight: 'Skip connections solve the vanishing gradient problem and enable training of very deep networks.'
        },
        defaultConfig: {
          numInputs: 2
        },
        multiInput: true
      },
      {
        type: 'Concatenate',
        label: 'Concatenate',
        icon: Combine,
        color: 'hsl(200, 80%, 50%)',
        description: 'Concatenates multiple inputs along an axis',
        tip: 'Joins multiple inputs along a specified axis. Used in U-Net, DenseNet, and feature fusion. Inputs must match in all dimensions except the concatenation axis.',
        learnMore: {
          whatItDoes: 'Joins tensors along a specified dimension. Unlike Add, it preserves all information from both inputs.',
          whenToUse: 'For feature fusion (combining features from different sources), U-Net skip connections, or DenseNet dense connections.',
          example: 'Two [batch, 128] tensors concatenated on axis=-1 → [batch, 256]. Doubles the feature dimension.',
          vsAdd: 'Add: requires same shape, outputs same shape. Concatenate: combines shapes, outputs larger tensor.'
        },
        defaultConfig: {
          numInputs: 2,
          axis: -1
        },
        multiInput: true
      },
      {
        type: 'Output',
        label: 'Output',
        icon: Target,
        color: 'hsl(158, 64%, 40%)',
        description: 'Output layer for predictions',
        tip: 'Final layer producing predictions. Use Softmax for multi-class classification, Sigmoid for binary, or no activation for regression.',
        learnMore: {
          whatItDoes: 'The final Dense layer that produces your network\'s predictions. Activation function determines output interpretation.',
          whenToUse: 'Always the last layer. Set numClasses to match your task.',
          activations: 'Softmax: multi-class (probabilities sum to 1). Sigmoid: binary or multi-label. Linear: regression (continuous values).',
          example: '10-class image classification: Output(10, softmax). Binary spam detection: Output(1, sigmoid).'
        },
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
        icon: Type,
        color: 'hsl(200, 80%, 50%)',
        description: 'Converts token IDs to dense vectors',
        tip: 'Maps discrete tokens (words, characters) to continuous vectors. Essential for NLP tasks. vocab_size = number of unique tokens.',
        learnMore: {
          whatItDoes: 'Looks up each token ID in a learned table, returning a dense vector. Transforms sparse one-hot encoding to dense representation.',
          whenToUse: 'First layer for any NLP task. Takes integer token IDs as input, outputs continuous vectors.',
          keyParams: 'vocab_size: total unique tokens (e.g., 30000 for English). embed_dim: vector size (128-512 typical).',
          example: 'Word "hello" → ID 42 → lookup → [0.2, -0.5, 0.8, ...] (256-dim vector). Similar words have similar vectors!'
        },
        defaultConfig: {
          vocabSize: 10000,
          embedDim: 256
        }
      },
      {
        type: 'BatchNorm1D',
        label: 'BatchNorm1D',
        icon: TrendingUp,
        color: 'hsl(142, 71%, 45%)',
        description: 'Batch normalization for 1D data',
        tip: 'Normalizes layer inputs to have zero mean and unit variance. Speeds up training and allows higher learning rates. Use after Dense layers.',
        learnMore: {
          whatItDoes: 'Normalizes each feature across the batch to zero mean and unit variance. Learns scale (γ) and shift (β) parameters.',
          whenToUse: 'After Dense layers, before activation. Speeds up training, acts as regularization, allows higher learning rates.',
          keyInsight: 'Reduces "internal covariate shift" - the change in layer input distributions during training.',
          placement: 'Dense → BatchNorm → ReLU is the common pattern. Some prefer Dense → ReLU → BatchNorm.'
        },
        defaultConfig: {
          numFeatures: 128
        }
      },
      {
        type: 'BatchNorm2D',
        label: 'BatchNorm2D',
        icon: Gauge,
        color: 'hsl(142, 71%, 45%)',
        description: 'Batch normalization for 2D data',
        tip: 'Same as BatchNorm1D but for convolutional layers. Place after Conv2D and before activation for best results.',
        learnMore: {
          whatItDoes: 'Normalizes each channel across the batch and spatial dimensions. Same principle as BatchNorm1D but for images.',
          whenToUse: 'After Conv2D layers in CNNs. Almost always improves training stability and speed.',
          keyInsight: 'Made training very deep networks (like ResNet) practical. Now standard in most CNN architectures.',
          placement: 'Conv2D → BatchNorm2D → ReLU → MaxPool is typical.'
        },
        defaultConfig: {
          numFeatures: 32
        }
      },
      {
        type: 'LayerNorm',
        label: 'LayerNorm',
        icon: SlidersHorizontal,
        color: 'hsl(50, 90%, 50%)',
        description: 'Layer normalization (used in Transformers)',
        tip: 'Normalizes across features instead of batch. Preferred in Transformers and RNNs. Works well with small batch sizes.',
        learnMore: {
          whatItDoes: 'Normalizes across the feature dimension for each sample independently. Unlike BatchNorm, doesn\'t depend on batch statistics.',
          whenToUse: 'In Transformers (after attention and FFN). In RNNs. When batch size is small or variable.',
          vsBatchNorm: 'BatchNorm: normalizes across batch (needs large batches). LayerNorm: normalizes across features (works with any batch size).',
          keyInsight: 'Transformers use "Pre-LN" (before attention) or "Post-LN" (after attention). Pre-LN trains more stably.'
        },
        defaultConfig: {
          normalizedShape: 256
        }
      },
      {
        type: 'LSTM',
        label: 'LSTM',
        icon: Waves,
        color: 'hsl(330, 81%, 60%)',
        description: 'Long Short-Term Memory for sequences',
        tip: 'Remembers long-term dependencies in sequential data. Has "gates" to control information flow. Great for text, time-series, and speech.',
        learnMore: {
          whatItDoes: 'Processes sequences step-by-step, maintaining a "cell state" that carries information across long distances. Gates control what to remember/forget.',
          whenToUse: 'For sequential data: text classification, sentiment analysis, time-series forecasting, speech recognition.',
          gates: 'Forget gate (what to discard), Input gate (what to store), Output gate (what to output). Solves vanishing gradient problem of vanilla RNNs.',
          vsTransformer: 'LSTMs process sequentially (slower but less memory). Transformers process in parallel (faster but O(n²) memory). Transformers often win for NLP.',
          bidirectional: 'Enable for tasks where future context helps (classification). Disable for generation (can\'t see future).'
        },
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
        icon: Repeat,
        color: 'hsl(280, 68%, 60%)',
        description: 'Gated Recurrent Unit for sequences',
        tip: 'Simpler alternative to LSTM with fewer parameters. Often performs similarly but trains faster. Good choice for smaller datasets.',
        learnMore: {
          whatItDoes: 'Similar to LSTM but with fewer gates (2 instead of 3). Merges cell state and hidden state into one.',
          whenToUse: 'When you want LSTM-like performance with fewer parameters. Good for smaller datasets or when training speed matters.',
          vsLSTM: 'GRU: 2 gates, fewer params, trains faster. LSTM: 3 gates, more expressive, better for very long sequences.',
          keyInsight: 'In practice, GRU and LSTM perform similarly on most tasks. Try both and pick the one that works better for your data.'
        },
        defaultConfig: {
          inputSize: 256,
          hiddenSize: 128,
          numLayers: 1
        }
      },
      {
        type: 'MultiHeadAttention',
        label: 'Multi-Head Attention',
        icon: Sparkles,
        color: 'hsl(45, 93%, 47%)',
        description: 'Transformer attention mechanism',
        tip: 'Learns which parts of the input to focus on. Multiple "heads" capture different relationships. Core of modern NLP models like GPT and BERT.',
        learnMore: {
          whatItDoes: 'Computes attention scores between all positions in a sequence, allowing each position to "look at" every other position.',
          whenToUse: 'For sequence-to-sequence tasks, NLP, and anywhere long-range dependencies matter. The foundation of Transformers.',
          howItWorks: 'Splits input into Q (query), K (key), V (value). Attention = softmax(QK^T/√d) × V. Multiple heads learn different patterns.',
          keyInsight: 'Unlike RNNs, attention processes all positions in parallel and can directly connect distant tokens.'
        },
        defaultConfig: {
          embedDim: 256,
          numHeads: 8
        }
      },
      {
        type: 'PositionalEncoding',
        label: 'Positional Encoding',
        icon: Hash,
        color: 'hsl(160, 70%, 45%)',
        description: 'Adds position information to embeddings',
        tip: 'Injects information about token positions into the embeddings. Essential for Transformers since attention has no inherent sense of order.',
        learnMore: {
          whatItDoes: 'Adds position-dependent values to embeddings so the model knows word order. Without this, "dog bites man" = "man bites dog".',
          whenToUse: 'Always after Embedding layer and before Transformer encoder/decoder. Required because attention is position-agnostic.',
          types: 'Sinusoidal (fixed, from original paper) or Learned (trainable embeddings for each position). Learned is often better.',
          keyInsight: 'Enables Transformers to understand sequence order without recurrence.'
        },
        defaultConfig: {
          maxLen: 512,
          dModel: 256,
          dropout: 0.1
        }
      },
      {
        type: 'TransformerEncoder',
        label: 'Transformer Encoder',
        icon: Cpu,
        color: 'hsl(220, 80%, 55%)',
        description: 'Full Transformer encoder block',
        tip: 'Complete encoder with self-attention + feed-forward + normalization. Used in BERT for understanding text. Stack multiple for deeper models.',
        learnMore: {
          whatItDoes: 'Each layer: Self-Attention → Add & Norm → Feed-Forward → Add & Norm. Processes input bidirectionally.',
          whenToUse: 'For understanding/encoding text (BERT-style), classification, question answering, named entity recognition.',
          architecture: 'Input → [Multi-Head Self-Attention + Residual] → [FFN + Residual] → Output. Repeated N times.',
          keyInsight: 'BERT uses encoder-only. Each token can attend to all other tokens (bidirectional context).'
        },
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
        icon: Brain,
        color: 'hsl(280, 80%, 55%)',
        description: 'Full Transformer decoder block',
        tip: 'Decoder with masked self-attention + cross-attention + feed-forward. Used in GPT for text generation. Attends to encoder output.',
        learnMore: {
          whatItDoes: 'Each layer: Masked Self-Attention → Cross-Attention (to encoder) → Feed-Forward. Generates output autoregressively.',
          whenToUse: 'For text generation (GPT), translation (encoder-decoder), and any sequence generation task.',
          architecture: 'Masked attention prevents looking at future tokens. Cross-attention allows attending to encoder output.',
          keyInsight: 'GPT uses decoder-only with masked self-attention. Full Transformer (translation) uses encoder + decoder with cross-attention.',
          maskedAttention: 'Each position can only attend to previous positions - ensures autoregressive property for generation.'
        },
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
    Add: [
      { key: 'numInputs', label: 'Number of Inputs', type: 'number', min: 2, max: 5, description: 'Number of input connections (for skip connections)' }
    ],
    Concatenate: [
      { key: 'numInputs', label: 'Number of Inputs', type: 'number', min: 2, max: 5, description: 'Number of input connections to concatenate' },
      { key: 'axis', label: 'Axis', type: 'number', min: -1, description: 'Axis to concatenate along (-1 for last axis)' }
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
