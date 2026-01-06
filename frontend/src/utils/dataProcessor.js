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
  const { normalize = true, oneHotEncode = true } = options;
  
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
      return typeof val === 'number' ? val : 0;
    });
    features.push(featureRow);
    targets.push(row[targetColumn]);
  });

  // Convert to tensors
  let xTensor = tf.tensor2d(features);
  
  // Normalize features
  if (normalize) {
    const { mean, variance } = tf.moments(xTensor, 0);
    const std = tf.sqrt(variance);
    xTensor = xTensor.sub(mean).div(std.add(1e-7));
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
    inputShape: [columns.length],
    numClasses: uniqueTargets.length,
    featureColumns: columns,
    targetColumn,
    uniqueTargets,
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
export const generateSampleData = (type = 'classification', samples = 1000) => {
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
