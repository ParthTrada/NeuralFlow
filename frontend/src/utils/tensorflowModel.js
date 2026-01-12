import * as tf from '@tensorflow/tfjs';

// Build TensorFlow.js model from our node graph
export const buildTFModel = (nodes, edges) => {
  if (!nodes || nodes.length === 0) {
    throw new Error('No layers defined');
  }

  // Sort nodes by position (top to bottom)
  const sortedNodes = [...nodes].sort((a, b) => {
    const yDiff = a.position.y - b.position.y;
    if (Math.abs(yDiff) > 50) return yDiff;
    return a.position.x - b.position.x;
  });

  // Filter out Input nodes and get layer configs
  const layerNodes = sortedNodes.filter(n => n.data.layerType !== 'Input');
  
  // Find input shape - first check Input node, then first layer's inputSize
  const inputNode = sortedNodes.find(n => n.data.layerType === 'Input');
  let inputShape = null;
  
  if (inputNode?.data?.config) {
    const inputConfig = inputNode.data.config;
    
    // Check for text input (NLP/Embedding)
    if (inputConfig.inputType === 'text' || inputConfig.vocabSize) {
      const seqLength = inputConfig.seqLength || 100;
      inputShape = [seqLength]; // For embedding, input is 1D sequence of token IDs
    }
    // Check for sequence input (LSTM/RNN)
    else if (inputConfig.inputType === 'sequence' || inputConfig.seqLength) {
      const seqLength = inputConfig.seqLength || 50;
      const features = inputConfig.features || inputConfig.inputSize || 100;
      inputShape = [seqLength, features];
    }
    // Check for image input (CNN)
    else if (inputConfig.inputType === 'image' || (inputConfig.height && inputConfig.width)) {
      const height = inputConfig.height || 28;
      const width = inputConfig.width || 28;
      const channels = inputConfig.channels || 1;
      inputShape = [height, width, channels];
    }
    // Check for explicit inputShape
    else if (inputConfig.inputShape) {
      const shapeStr = inputConfig.inputShape;
      if (typeof shapeStr === 'string') {
        try {
          inputShape = JSON.parse(shapeStr.replace(/[\[\]]/g, m => m));
        } catch {
          inputShape = [parseInt(shapeStr) || 784];
        }
      } else if (Array.isArray(shapeStr)) {
        inputShape = shapeStr;
      }
    }
    // Check for inputSize (flat vector)
    else if (inputConfig.inputSize) {
      inputShape = [inputConfig.inputSize];
    }
  }
  
  // If no Input node, get inputSize from first layer
  if (!inputShape && layerNodes.length > 0) {
    const firstLayerConfig = layerNodes[0].data.config || {};
    if (firstLayerConfig.inputSize) {
      inputShape = [firstLayerConfig.inputSize];
    }
  }
  
  // Default fallback
  if (!inputShape) {
    inputShape = [784];
  }
  
  console.log('Building model with input shape:', inputShape);

  const model = tf.sequential();
  let isFirstLayer = true;

  layerNodes.forEach((node) => {
    const config = node.data.config || {};
    const layerType = node.data.layerType;

    try {
      switch (layerType) {
        case 'Dense':
          model.add(tf.layers.dense({
            units: config.units || 128,
            activation: mapActivation(config.activation),
            inputShape: isFirstLayer ? inputShape : undefined,
          }));
          break;

        case 'Conv2D':
          model.add(tf.layers.conv2d({
            filters: config.outChannels || 32,
            kernelSize: config.kernelSize || 3,
            padding: config.padding > 0 ? 'same' : 'valid',
            activation: mapActivation(config.activation),
            inputShape: isFirstLayer ? inputShape : undefined,
          }));
          break;

        case 'MaxPool2D':
          model.add(tf.layers.maxPooling2d({
            poolSize: [config.kernelSize || 2, config.kernelSize || 2],
            strides: [config.stride || 2, config.stride || 2],
          }));
          break;

        case 'Dropout':
          model.add(tf.layers.dropout({
            rate: config.rate || 0.5,
          }));
          break;

        case 'Flatten':
          model.add(tf.layers.flatten({
            inputShape: isFirstLayer ? inputShape : undefined,
          }));
          break;

        case 'BatchNorm1D':
        case 'BatchNorm2D':
          model.add(tf.layers.batchNormalization());
          break;

        case 'LSTM':
          // Check if next layer is LSTM/GRU - if so, return sequences
          const lstmIndex = layerNodes.indexOf(node);
          const nextLayerAfterLSTM = layerNodes[lstmIndex + 1];
          const lstmReturnSeq = nextLayerAfterLSTM && 
            (nextLayerAfterLSTM.data.layerType === 'LSTM' || nextLayerAfterLSTM.data.layerType === 'GRU');
          
          model.add(tf.layers.lstm({
            units: config.hiddenSize || 64,
            returnSequences: lstmReturnSeq,
            inputShape: isFirstLayer ? inputShape : undefined,
          }));
          break;

        case 'GRU':
          // Check if next layer is LSTM/GRU - if so, return sequences
          const gruIndex = layerNodes.indexOf(node);
          const nextLayerAfterGRU = layerNodes[gruIndex + 1];
          const gruReturnSeq = nextLayerAfterGRU && 
            (nextLayerAfterGRU.data.layerType === 'LSTM' || nextLayerAfterGRU.data.layerType === 'GRU');
          
          model.add(tf.layers.gru({
            units: config.hiddenSize || 64,
            returnSequences: gruReturnSeq,
            inputShape: isFirstLayer ? inputShape : undefined,
          }));
          break;

        case 'Embedding':
          model.add(tf.layers.embedding({
            inputDim: config.vocabSize || 10000,
            outputDim: config.embedDim || 128,
            inputLength: inputShape[0], // sequence length
            inputShape: isFirstLayer ? inputShape : undefined,
          }));
          break;

        case 'PositionalEncoding':
          // TensorFlow.js doesn't have built-in positional encoding
          // We simulate it with a learnable embedding added as a Lambda layer
          // For simplicity, we add dropout only (position info comes from embedding order)
          model.add(tf.layers.dropout({
            rate: config.dropout || 0.1,
          }));
          break;

        case 'GlobalAvgPool1D':
          model.add(tf.layers.globalAveragePooling1d());
          break;

        case 'LayerNorm':
          // TensorFlow.js has layerNormalization
          model.add(tf.layers.layerNormalization({
            axis: -1,
          }));
          break;

        case 'MultiHeadAttention':
          // TensorFlow.js doesn't have native MultiHeadAttention in sequential API
          // We'll use dense layers as approximation for the demo
          model.add(tf.layers.dense({
            units: config.embedDim || 256,
            activation: 'relu',
            inputShape: isFirstLayer ? inputShape : undefined,
          }));
          break;

        case 'TransformerEncoder':
          // Simplified transformer encoder for TF.js sequential model
          // Real transformer needs functional API for skip connections
          const encUnits = config.dModel || 256;
          const encLayers = config.numLayers || 2;
          for (let i = 0; i < encLayers; i++) {
            // Self-attention approximation with dense layers
            model.add(tf.layers.dense({
              units: config.dimFeedforward || 1024,
              activation: 'relu',
            }));
            model.add(tf.layers.dropout({ rate: 0.1 }));
            model.add(tf.layers.dense({
              units: encUnits,
              activation: 'linear',
            }));
            model.add(tf.layers.layerNormalization({ axis: -1 }));
          }
          break;

        case 'TransformerDecoder':
          // Simplified transformer decoder for TF.js sequential model
          const decUnits = config.dModel || 256;
          const decLayers = config.numLayers || 2;
          for (let i = 0; i < decLayers; i++) {
            model.add(tf.layers.dense({
              units: config.dimFeedforward || 1024,
              activation: 'relu',
            }));
            model.add(tf.layers.dropout({ rate: 0.1 }));
            model.add(tf.layers.dense({
              units: decUnits,
              activation: 'linear',
            }));
            model.add(tf.layers.layerNormalization({ axis: -1 }));
          }
          break;

        case 'Output':
          // Check if the previous layer outputs sequences (3D tensor)
          // If so, we need to handle it properly for classification
          const outputIndex = layerNodes.indexOf(node);
          const prevLayer = outputIndex > 0 ? layerNodes[outputIndex - 1] : null;
          const needsSequenceCollapse = prevLayer && (
            prevLayer.data.layerType === 'TransformerEncoder' ||
            prevLayer.data.layerType === 'TransformerDecoder' ||
            prevLayer.data.layerType === 'LayerNorm' ||
            prevLayer.data.layerType === 'Dropout'
          );
          
          // Check if this is a text generation model (has Embedding + Transformer)
          const hasEmbeddingLayer = layerNodes.some(n => n.data.layerType === 'Embedding');
          const hasTransformerLayer = layerNodes.some(n => 
            n.data.layerType === 'TransformerDecoder' || n.data.layerType === 'TransformerEncoder'
          );
          const isTextGenModel = hasEmbeddingLayer && hasTransformerLayer;
          
          // For text generation, take only the last position's output
          if (isTextGenModel && needsSequenceCollapse) {
            // Use a Lambda layer to extract last position
            // Lambda not available in sequential, so use GlobalAveragePooling1D as approximation
            model.add(tf.layers.globalAveragePooling1d());
          }
          
          model.add(tf.layers.dense({
            units: config.numClasses || 10,
            activation: config.activation === 'softmax' ? 'softmax' : 
                       config.activation === 'sigmoid' ? 'sigmoid' : 'linear',
            inputShape: isFirstLayer ? inputShape : undefined,
          }));
          break;

        case 'Add':
          // In sequential model, Add is a pass-through (skip connections handled externally)
          // For functional API support, this would merge multiple inputs
          console.log('Add layer - skip connections require functional API for full support');
          break;

        case 'Concatenate':
          // In sequential model, Concatenate is a pass-through
          // For functional API support, this would concatenate multiple inputs
          console.log('Concatenate layer - requires functional API for full support');
          break;

        default:
          console.warn(`Unknown layer type: ${layerType}`);
          return;
      }
      isFirstLayer = false;
    } catch (error) {
      console.error(`Error adding layer ${layerType}:`, error);
    }
  });

  return model;
};

// Map activation functions
const mapActivation = (activation) => {
  const mapping = {
    'relu': 'relu',
    'leaky_relu': 'leakyReLU',
    'sigmoid': 'sigmoid',
    'tanh': 'tanh',
    'softmax': 'softmax',
    'gelu': 'gelu',
    'silu': 'swish',
  };
  return mapping[activation] || 'relu';
};

// Compile model with options
export const compileModel = (model, options = {}) => {
  const {
    optimizer = 'adam',
    learningRate = 0.001,
    loss = 'categoricalCrossentropy',
    metrics = ['acc']  // TensorFlow.js uses 'acc' internally
  } = options;

  let optimizerInstance;
  switch (optimizer) {
    case 'adam':
      optimizerInstance = tf.train.adam(learningRate);
      break;
    case 'sgd':
      optimizerInstance = tf.train.sgd(learningRate);
      break;
    case 'rmsprop':
      optimizerInstance = tf.train.rmsprop(learningRate);
      break;
    default:
      optimizerInstance = tf.train.adam(learningRate);
  }

  model.compile({
    optimizer: optimizerInstance,
    loss: loss,
    metrics: metrics,
  });

  return model;
};

// Train model with callbacks
export const trainModel = async (model, xTrain, yTrain, options = {}, callbacks = {}) => {
  const {
    epochs = 10,
    batchSize = 8,
    validationSplit = 0.2,
  } = options;

  console.log('trainModel called - epochs:', epochs, 'batchSize:', batchSize);

  const history = await model.fit(xTrain, yTrain, {
    epochs,
    batchSize,
    validationSplit,
    shuffle: true,
    callbacks: {
      onTrainBegin: () => {
        console.log('>>> TRAINING STARTED <<<');
      },
      onEpochBegin: (epoch) => {
        console.log(`Epoch ${epoch + 1}/${epochs} starting...`);
        if (callbacks.onEpochBegin) {
          callbacks.onEpochBegin(epoch);
        }
      },
      onBatchEnd: (batch, logs) => {
        if (callbacks.onBatchEnd) {
          callbacks.onBatchEnd(batch, logs);
        }
      },
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}/${epochs} done - loss:`, logs?.loss, 'acc:', logs?.acc);
        if (callbacks.onEpochEnd) {
          callbacks.onEpochEnd(epoch, logs);
        }
      },
      onTrainEnd: () => {
        console.log('>>> TRAINING COMPLETED <<<');
        if (callbacks.onTrainEnd) {
          callbacks.onTrainEnd();
        }
      }
    }
  });

  return history;
};

// Make predictions
export const predict = (model, input) => {
  const prediction = model.predict(input);
  return prediction;
};

// Dispose model to free memory
export const disposeModel = (model) => {
  if (model) {
    model.dispose();
  }
};
