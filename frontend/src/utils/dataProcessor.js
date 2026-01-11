import * as tf from '@tensorflow/tfjs';
import Papa from 'papaparse';

// Parse CSV file
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
  });
};

// Process CSV data for training
export const processCSVData = (data, targetColumn, options = {}) => {
  const { normalize = true, oneHotEncode = true, isSequenceModel = false, seqLength = 10 } = options;
  
  if (!data || data.length === 0) {
    throw new Error('No data provided');
  }

  // Separate features and target
  const features = [];
  const targets = [];
  const columns = Object.keys(data[0]).filter(col => col !== targetColumn);

  data.forEach(row => {
    const featureRow = columns.map(col => {
      const val = row[col];
      return typeof val === 'number' ? val : parseFloat(val) || 0;
    });
    features.push(featureRow);
    targets.push(row[targetColumn]);
  });

  // Check if we need to reshape for sequence models (LSTM/GRU)
  const numFeatures = columns.length;
  
  let xTensor;
  let inputShape;
  
  if (isSequenceModel) {
    // Reshape 2D data [samples, features] into 3D [samples, timesteps, features_per_step]
    // If user has 50 rows x 10 columns, we can interpret this as:
    // Option 1: 50 separate sequences of 1 timestep each with 10 features -> [50, 1, 10]
    // Option 2: Sliding window - create sequences from continuous data
    
    // For simplicity, treat each row as a single timestep with all features
    // This creates [num_rows, 1, num_features] which can be expanded
    const numSamples = features.length;
    
    // If seqLength is 1, each row is one timestep
    if (seqLength === 1 || numSamples < seqLength) {
      // Each row becomes a sequence of length 1
      xTensor = tf.tensor3d(features.map(row => [row])); // [samples, 1, features]
      inputShape = [1, numFeatures];
    } else {
      // Create overlapping sequences using sliding window
      const sequences = [];
      const sequenceTargets = [];
      
      for (let i = 0; i <= numSamples - seqLength; i++) {
        const sequence = features.slice(i, i + seqLength);
        sequences.push(sequence);
        sequenceTargets.push(targets[i + seqLength - 1]); // Use last target in sequence
      }
      
      xTensor = tf.tensor3d(sequences); // [num_sequences, seqLength, features]
      inputShape = [seqLength, numFeatures];
      
      // Update targets to match sequences
      targets.length = 0;
      targets.push(...sequenceTargets);
    }
  } else {
    // Standard 2D tensor for Dense/MLP models
    xTensor = tf.tensor2d(features);
    inputShape = [numFeatures];
  }
  
  // Normalize features
  if (normalize) {
    const originalShape = xTensor.shape;
    // Flatten for normalization, then reshape back
    const flatTensor = xTensor.reshape([-1, originalShape[originalShape.length - 1]]);
    const { mean, variance } = tf.moments(flatTensor, 0);
    const std = tf.sqrt(variance);
    const normalizedFlat = flatTensor.sub(mean).div(std.add(1e-7));
    xTensor = normalizedFlat.reshape(originalShape);
  }

  // Process targets
  let yTensor;
  const uniqueTargets = [...new Set(targets)];
  
  if (oneHotEncode && uniqueTargets.length <= 20) {
    // One-hot encode for classification
    const targetIndices = targets.map(t => uniqueTargets.indexOf(t));
    yTensor = tf.oneHot(tf.tensor1d(targetIndices, 'int32'), uniqueTargets.length);
  } else {
    // Regression or too many classes
    yTensor = tf.tensor2d(targets.map(t => [typeof t === 'number' ? t : 0]));
  }

  return {
    xTrain: xTensor,
    yTrain: yTensor,
    inputShape,
    numClasses: uniqueTargets.length,
    featureColumns: columns,
    targetColumn,
    uniqueTargets,
    isSequence: isSequenceModel,
  };
};

// Load and process image
export const loadImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Process image for model input
export const processImage = async (img, targetSize = [28, 28], grayscale = true) => {
  let tensor = tf.browser.fromPixels(img);
  
  // Convert to grayscale if needed
  if (grayscale && tensor.shape[2] === 3) {
    tensor = tensor.mean(2).expandDims(2);
  }
  
  // Resize
  tensor = tf.image.resizeBilinear(tensor, targetSize);
  
  // Normalize to [0, 1]
  tensor = tensor.div(255.0);
  
  // Flatten if needed
  const flattened = tensor.reshape([targetSize[0] * targetSize[1] * (grayscale ? 1 : 3)]);
  
  return flattened;
};

// Process multiple images with labels from folder structure
export const processImageFolder = async (files, options = {}) => {
  const { targetSize = [28, 28], grayscale = true } = options;
  
  const images = [];
  const labels = [];
  const labelSet = new Set();

  // Extract labels from file names or paths
  for (const file of files) {
    // Try to get label from folder name or file prefix
    const pathParts = file.webkitRelativePath?.split('/') || file.name.split('_');
    const label = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'unknown';
    labelSet.add(label);
  }

  const uniqueLabels = Array.from(labelSet);

  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    
    try {
      const img = await loadImage(file);
      const tensor = await processImage(img, targetSize, grayscale);
      images.push(tensor);
      
      const pathParts = file.webkitRelativePath?.split('/') || file.name.split('_');
      const label = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'unknown';
      labels.push(uniqueLabels.indexOf(label));
    } catch (error) {
      console.error(`Error processing image ${file.name}:`, error);
    }
  }

  if (images.length === 0) {
    throw new Error('No valid images found');
  }

  const xTensor = tf.stack(images);
  const yTensor = tf.oneHot(tf.tensor1d(labels, 'int32'), uniqueLabels.length);

  return {
    xTrain: xTensor,
    yTrain: yTensor,
    inputShape: [targetSize[0] * targetSize[1] * (grayscale ? 1 : 3)],
    numClasses: uniqueLabels.length,
    uniqueLabels,
    imageCount: images.length,
  };
};

// Generate sample data for testing
export const generateSampleData = (type = 'classification', samples = 1000, options = {}) => {
  if (type === 'classification') {
    // Generate spiral dataset
    const numClasses = 3;
    const pointsPerClass = Math.floor(samples / numClasses);
    const features = [];
    const labels = [];

    for (let c = 0; c < numClasses; c++) {
      for (let i = 0; i < pointsPerClass; i++) {
        const r = i / pointsPerClass;
        const t = c * 4 + i / pointsPerClass * 4 + Math.random() * 0.2;
        features.push([r * Math.sin(t), r * Math.cos(t)]);
        labels.push(c);
      }
    }

    const xTensor = tf.tensor2d(features);
    const yTensor = tf.oneHot(tf.tensor1d(labels, 'int32'), numClasses);

    return {
      xTrain: xTensor,
      yTrain: yTensor,
      inputShape: [2],
      numClasses,
      type: 'classification',
      description: 'Spiral classification dataset',
    };
  } else if (type === 'sequence') {
    // Generate sequence data for LSTM/RNN models
    const seqLength = options.seqLength || 50;
    const features = options.features || 10;
    const numClasses = options.numClasses || 3;
    
    const sequences = [];
    const labels = [];
    
    for (let i = 0; i < samples; i++) {
      // Create a sequence with a pattern that determines the class
      const classIdx = i % numClasses;
      const sequence = [];
      
      for (let t = 0; t < seqLength; t++) {
        const step = [];
        for (let f = 0; f < features; f++) {
          // Generate pattern based on class
          const basePattern = Math.sin((t + classIdx * 10) / 5 * (f + 1));
          const noise = (Math.random() - 0.5) * 0.3;
          step.push(basePattern + noise);
        }
        sequence.push(step);
      }
      
      sequences.push(sequence);
      labels.push(classIdx);
    }
    
    const xTensor = tf.tensor3d(sequences); // [samples, seqLength, features]
    const yTensor = tf.oneHot(tf.tensor1d(labels, 'int32'), numClasses);
    
    return {
      xTrain: xTensor,
      yTrain: yTensor,
      inputShape: [seqLength, features],
      numClasses,
      type: 'sequence',
      description: `Sequence classification (${seqLength} steps × ${features} features)`,
    };
  } else {
    // Generate regression dataset
    const features = [];
    const targets = [];

    for (let i = 0; i < samples; i++) {
      const x = Math.random() * 10 - 5;
      const noise = Math.random() * 0.5 - 0.25;
      const y = 0.5 * x * x + 2 * x + 1 + noise;
      features.push([x]);
      targets.push([y]);
    }

    const xTensor = tf.tensor2d(features);
    const yTensor = tf.tensor2d(targets);

    return {
      xTrain: xTensor,
      yTrain: yTensor,
      inputShape: [1],
      numClasses: 1,
      type: 'regression',
      description: 'Quadratic regression dataset',
    };
  }
};
