import * as tf from '@tensorflow/tfjs';

// Ensure WebGL backend is ready
tf.ready().then(() => {
  console.log('TensorFlow.js backend:', tf.getBackend());
});

// Force browser repaint helper
const forceRepaint = () => {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
};

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
  
  if (inputNode?.data?.config?.inputShape) {
    const shapeStr = inputNode.data.config.inputShape;
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
          model.add(tf.layers.lstm({
            units: config.hiddenSize || 64,
            returnSequences: false,
            inputShape: isFirstLayer ? inputShape : undefined,
          }));
          break;

        case 'GRU':
          model.add(tf.layers.gru({
            units: config.hiddenSize || 64,
            returnSequences: false,
            inputShape: isFirstLayer ? inputShape : undefined,
          }));
          break;

        case 'Output':
          model.add(tf.layers.dense({
            units: config.numClasses || 10,
            activation: config.activation === 'softmax' ? 'softmax' : 
                       config.activation === 'sigmoid' ? 'sigmoid' : 'linear',
            inputShape: isFirstLayer ? inputShape : undefined,
          }));
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
    metrics = ['accuracy']
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
    batchSize = 32,
    validationSplit = 0.2,
  } = options;

  const history = await model.fit(xTrain, yTrain, {
    epochs,
    batchSize,
    validationSplit,
    shuffle: true,
    yieldEvery: 'epoch',
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        if (callbacks.onEpochEnd) {
          callbacks.onEpochEnd(epoch, logs);
        }
        // Force browser to repaint after React state update
        await forceRepaint();
      },
      onBatchEnd: (batch, logs) => {
        if (callbacks.onBatchEnd) {
          callbacks.onBatchEnd(batch, logs);
        }
      },
      onTrainEnd: async () => {
        if (callbacks.onTrainEnd) {
          callbacks.onTrainEnd();
        }
        await forceRepaint();
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
