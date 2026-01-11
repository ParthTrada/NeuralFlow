import * as tf from '@tensorflow/tfjs';
import Papa from 'papaparse';

// Simple tokenizer for text data
const simpleTokenize = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
};

// Build vocabulary from text data
export const buildVocabulary = (texts, maxVocabSize = 10000) => {
  const wordCounts = {};
  
  texts.forEach(text => {
    const tokens = simpleTokenize(text);
    tokens.forEach(token => {
      wordCounts[token] = (wordCounts[token] || 0) + 1;
    });
  });
  
  // Sort by frequency and take top maxVocabSize
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxVocabSize - 2) // Reserve space for PAD and UNK
    .map(([word]) => word);
  
  // Create word to index mapping
  const vocab = { '<PAD>': 0, '<UNK>': 1 };
  sortedWords.forEach((word, idx) => {
    vocab[word] = idx + 2;
  });
  
  return vocab;
};

// Tokenize text to indices using vocabulary
export const textToIndices = (text, vocab, maxLength = 100) => {
  const tokens = simpleTokenize(text);
  const indices = tokens.slice(0, maxLength).map(token => vocab[token] || 1); // 1 = UNK
  
  // Pad to maxLength
  while (indices.length < maxLength) {
    indices.push(0); // 0 = PAD
  }
  
  return indices;
};

// Process text CSV data (text column + label column)
export const processTextCSVData = (data, textColumn, targetColumn, options = {}) => {
  const { maxLength = 100, vocabSize = 10000 } = options;
  
  if (!data || data.length === 0) {
    throw new Error('No data provided');
  }
  
  // Extract texts and targets
  const texts = data.map(row => String(row[textColumn] || ''));
  const targets = data.map(row => row[targetColumn]);
  
  // Build vocabulary
  const vocab = buildVocabulary(texts, vocabSize);
  console.log(`Built vocabulary with ${Object.keys(vocab).length} words`);
  
  // Convert texts to indices
  const sequences = texts.map(text => textToIndices(text, vocab, maxLength));
  
  // Create tensor
  const xTensor = tf.tensor2d(sequences, [sequences.length, maxLength], 'int32');
  
  // Process targets
  const uniqueTargets = [...new Set(targets)];
  
  if (uniqueTargets.length < 2) {
    throw new Error('Need at least 2 classes for text classification');
  }
  
  const targetIndices = targets.map(t => uniqueTargets.indexOf(t));
  const yTensor = tf.oneHot(tf.tensor1d(targetIndices, 'int32'), uniqueTargets.length);
  
  return {
    xTrain: xTensor,
    yTrain: yTensor,
    inputShape: [maxLength],
    numClasses: uniqueTargets.length,
    vocab,
    vocabSize: Object.keys(vocab).length,
    uniqueTargets,
    type: 'text',
    description: `Text classification (${maxLength} tokens, ${uniqueTargets.length} classes)`,
  };
};

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

  // Get all columns except target
  const allColumns = Object.keys(data[0]).filter(col => col !== targetColumn);
  
  // Filter to only numeric columns (check first row)
  const numericColumns = allColumns.filter(col => {
    const val = data[0][col];
    // Check if it's a number or can be parsed as a pure number
    if (typeof val === 'number') return true;
    if (typeof val === 'string') {
      // Check if it's a pure numeric string (not a date or mixed string)
      const trimmed = val.trim();
      const parsed = parseFloat(trimmed);
      // It's numeric if the parse result matches the original (no extra chars)
      return !isNaN(parsed) && trimmed === String(parsed);
    }
    return false;
  });
  
  // If we filtered out columns that look like dates or strings, notify
  const skippedColumns = allColumns.filter(c => !numericColumns.includes(c));
  if (skippedColumns.length > 0) {
    console.log(`Skipped non-numeric columns: ${skippedColumns.join(', ')}`);
  }
  
  if (numericColumns.length === 0) {
    throw new Error('No numeric feature columns found. Please ensure your CSV has numeric data columns.');
  }

  // Separate features and target
  const features = [];
  const targets = [];

  data.forEach(row => {
    const featureRow = numericColumns.map(col => {
      const val = row[col];
      return typeof val === 'number' ? val : parseFloat(val) || 0;
    });
    features.push(featureRow);
    targets.push(row[targetColumn]);
  });

  // Check if we need to reshape for sequence models (LSTM/GRU)
  const numFeatures = numericColumns.length;
  
  let xTensor;
  let inputShape;
  
  if (isSequenceModel) {
    // Reshape 2D data [samples, features] into 3D [samples, timesteps, features_per_step]
    const numSamples = features.length;
    let actualSeqLength = seqLength;
    
    // Auto-adjust sequence length if data is too small
    if (numSamples <= seqLength) {
      // Use smaller sequence length that allows at least 5 sequences
      actualSeqLength = Math.max(1, Math.floor(numSamples / 5));
      console.log(`Auto-adjusted sequence length from ${seqLength} to ${actualSeqLength} (only ${numSamples} rows)`);
    }
    
    if (actualSeqLength === 1) {
      // Each row becomes a sequence of length 1
      xTensor = tf.tensor3d(features.map(row => [row])); // [samples, 1, features]
      inputShape = [1, numFeatures];
    } else {
      // Create overlapping sequences using sliding window
      const sequences = [];
      const sequenceTargets = [];
      
      for (let i = 0; i <= numSamples - actualSeqLength; i++) {
        const sequence = features.slice(i, i + actualSeqLength);
        sequences.push(sequence);
        sequenceTargets.push(targets[i + actualSeqLength - 1]); // Use last target in sequence
      }
      
      if (sequences.length === 0) {
        throw new Error(`Not enough data rows. Need at least ${actualSeqLength + 1} rows for sequences of length ${actualSeqLength}. You have ${numSamples} rows.`);
      }
      
      xTensor = tf.tensor3d(sequences); // [num_sequences, seqLength, features]
      inputShape = [actualSeqLength, numFeatures];
      
      // Update targets to match sequences
      targets.length = 0;
      targets.push(...sequenceTargets);
      
      console.log(`Created ${sequences.length} sequences of length ${actualSeqLength} with ${numFeatures} features`);
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
  
  // Need at least 2 classes for one-hot encoding
  if (oneHotEncode && uniqueTargets.length >= 2 && uniqueTargets.length <= 20) {
    // One-hot encode for classification
    const targetIndices = targets.map(t => uniqueTargets.indexOf(t));
    yTensor = tf.oneHot(tf.tensor1d(targetIndices, 'int32'), uniqueTargets.length);
  } else if (uniqueTargets.length === 1) {
    // Only 1 class - this is likely an error in the data
    throw new Error(`Only 1 class found in target column. Classification requires at least 2 classes. Found: "${uniqueTargets[0]}"`);
  } else {
    // Regression or too many classes
    yTensor = tf.tensor2d(targets.map(t => [typeof t === 'number' ? t : parseFloat(t) || 0]));
  }

  return {
    xTrain: xTensor,
    yTrain: yTensor,
    inputShape,
    numClasses: uniqueTargets.length,
    featureColumns: numericColumns,
    skippedColumns,
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
