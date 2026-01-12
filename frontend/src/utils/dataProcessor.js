import * as tf from '@tensorflow/tfjs';
import Papa from 'papaparse';

// Simple tokenizer for text data (word-level)
const simpleTokenize = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
};

// Character-level tokenizer for text generation
export const charTokenize = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text.split('');
};

// Build character vocabulary from text
export const buildCharVocabulary = (text) => {
  const chars = [...new Set(text.split(''))].sort();
  const charToIdx = { '<PAD>': 0 };
  chars.forEach((char, idx) => {
    charToIdx[char] = idx + 1;
  });
  
  const idxToChar = Object.fromEntries(
    Object.entries(charToIdx).map(([char, idx]) => [idx, char])
  );
  
  return { charToIdx, idxToChar, vocabSize: chars.length + 1 };
};

// Convert text to character indices
export const textToCharIndices = (text, charToIdx, maxLength = 64) => {
  const chars = text.split('').slice(0, maxLength);
  const indices = chars.map(c => charToIdx[c] || 0);
  
  // Pad to maxLength
  while (indices.length < maxLength) {
    indices.push(0);
  }
  
  return indices;
};

// Process character-level text generation data
export const processCharLevelData = (textData, options = {}) => {
  const { seqLength = 64, targetVocabSize = null } = options;
  
  // Handle different data formats
  let fullText = '';
  
  if (typeof textData === 'string') {
    fullText = textData;
  } else if (textData.sequences) {
    // Shakespeare dataset format
    fullText = textData.sequences.map(s => s.input).join('');
  } else if (Array.isArray(textData)) {
    fullText = textData.map(item => item.input || item.text || '').join('');
  }
  
  if (!fullText || fullText.length < seqLength + 1) {
    throw new Error('Text too short for character-level training');
  }
  
  // Build character vocabulary
  const { charToIdx, idxToChar, vocabSize } = buildCharVocabulary(fullText);
  
  // Use target vocab size if provided (for matching model), otherwise use actual
  const finalVocabSize = targetVocabSize || vocabSize;
  
  console.log(`Built char vocabulary with ${vocabSize} characters (using ${finalVocabSize} for training)`);
  
  // Create training sequences
  const sequences = [];
  const targets = [];
  const step = Math.max(1, Math.floor(seqLength / 4)); // Overlapping sequences
  
  for (let i = 0; i < fullText.length - seqLength; i += step) {
    const inputSeq = fullText.slice(i, i + seqLength);
    const targetChar = fullText[i + seqLength];
    
    const inputIndices = inputSeq.split('').map(c => charToIdx[c] || 0);
    const targetIdx = charToIdx[targetChar] || 0;
    
    sequences.push(inputIndices);
    targets.push(targetIdx);
    
    if (sequences.length >= 500) break; // Limit for browser performance
  }
  
  console.log(`Created ${sequences.length} training sequences`);
  
  // Create tensors
  const xTensor = tf.tensor2d(sequences, [sequences.length, seqLength], 'int32');
  const yTensor = tf.oneHot(tf.tensor1d(targets, 'int32'), finalVocabSize);
  
  return {
    xTrain: xTensor,
    yTrain: yTensor,
    inputShape: [seqLength],
    numClasses: finalVocabSize,
    charToIdx,
    idxToChar,
    vocabSize: finalVocabSize,
    actualVocabSize: vocabSize,
    seqLength,
    type: 'text-generation',
    fullText,
    sampleCount: sequences.length,
    description: `Character-level generation (${seqLength} chars, ${finalVocabSize} vocab)`,
  };
};

// Generate text using trained model
export const generateText = async (model, seedText, charToIdx, idxToChar, options = {}) => {
  const { 
    length = 200, 
    temperature = 0.8,
    seqLength = 64,
    onToken = null // Callback for streaming
  } = options;
  
  let currentText = seedText;
  
  // Ensure seed text is at least seqLength
  while (currentText.length < seqLength) {
    currentText = ' ' + currentText;
  }
  
  let generated = '';
  
  for (let i = 0; i < length; i++) {
    // Get last seqLength characters
    const inputText = currentText.slice(-seqLength);
    const inputIndices = inputText.split('').map(c => charToIdx[c] || 0);
    
    // Create input tensor
    const inputTensor = tf.tensor2d([inputIndices], [1, seqLength], 'int32');
    
    // Get prediction
    const prediction = model.predict(inputTensor);
    const logits = await prediction.data();
    
    // Apply temperature and sample
    const scaledLogits = logits.map(l => l / temperature);
    const expLogits = scaledLogits.map(l => Math.exp(l - Math.max(...scaledLogits)));
    const sumExp = expLogits.reduce((a, b) => a + b, 0);
    const probs = expLogits.map(e => e / sumExp);
    
    // Sample from distribution
    const random = Math.random();
    let cumSum = 0;
    let sampledIdx = 0;
    for (let j = 0; j < probs.length; j++) {
      cumSum += probs[j];
      if (random < cumSum) {
        sampledIdx = j;
        break;
      }
    }
    
    // Get character
    const nextChar = idxToChar[sampledIdx] || ' ';
    generated += nextChar;
    currentText += nextChar;
    
    // Cleanup tensors
    inputTensor.dispose();
    prediction.dispose();
    
    // Call streaming callback if provided
    if (onToken) {
      onToken(nextChar, generated);
    }
  }
  
  return generated;
};

// ============================================
// Markov Chain Text Generator for Shakespeare
// ============================================

// Build a character-level Markov chain from text
export const buildMarkovChain = (text, order = 3) => {
  const chain = {};
  
  for (let i = 0; i < text.length - order; i++) {
    const state = text.slice(i, i + order);
    const nextChar = text[i + order];
    
    if (!chain[state]) {
      chain[state] = {};
    }
    chain[state][nextChar] = (chain[state][nextChar] || 0) + 1;
  }
  
  // Convert counts to probabilities
  for (const state in chain) {
    const total = Object.values(chain[state]).reduce((a, b) => a + b, 0);
    for (const char in chain[state]) {
      chain[state][char] /= total;
    }
  }
  
  return chain;
};

// Sample from probability distribution with temperature
const sampleFromDistribution = (probs, temperature = 1.0) => {
  const chars = Object.keys(probs);
  const weights = Object.values(probs);
  
  // Apply temperature
  const scaledWeights = weights.map(w => Math.pow(w, 1 / temperature));
  const sum = scaledWeights.reduce((a, b) => a + b, 0);
  const normalizedWeights = scaledWeights.map(w => w / sum);
  
  // Sample
  const random = Math.random();
  let cumSum = 0;
  for (let i = 0; i < chars.length; i++) {
    cumSum += normalizedWeights[i];
    if (random < cumSum) {
      return chars[i];
    }
  }
  return chars[chars.length - 1];
};

// Pre-built Shakespeare Markov chain (cached for performance)
let shakespeareMarkovChain = null;
let shakespeareText = null;

// Initialize Shakespeare Markov chain
export const initShakespeareMarkov = (text) => {
  if (!shakespeareMarkovChain || shakespeareText !== text) {
    console.log('Building Shakespeare Markov chain...');
    shakespeareText = text;
    shakespeareMarkovChain = buildMarkovChain(text, 4); // Order 4 for better quality
    console.log('Markov chain built with', Object.keys(shakespeareMarkovChain).length, 'states');
  }
  return shakespeareMarkovChain;
};

// Generate Shakespeare-style text using Markov chain
export const generateShakespeareText = (seedText, options = {}) => {
  const {
    length = 200,
    temperature = 0.8,
    onToken = null,
    sourceText = null
  } = options;
  
  // Initialize chain if needed
  if (sourceText) {
    initShakespeareMarkov(sourceText);
  }
  
  if (!shakespeareMarkovChain) {
    throw new Error('Markov chain not initialized. Call initShakespeareMarkov first.');
  }
  
  const order = 4; // Must match the order used in buildMarkovChain
  let currentText = seedText || '';
  
  // If seed is too short, pick a random starting point from the source
  if (currentText.length < order && shakespeareText) {
    const startIdx = Math.floor(Math.random() * (shakespeareText.length - 100));
    currentText = shakespeareText.slice(startIdx, startIdx + order);
  }
  
  let generated = '';
  
  for (let i = 0; i < length; i++) {
    const state = currentText.slice(-order);
    
    if (shakespeareMarkovChain[state]) {
      const nextChar = sampleFromDistribution(shakespeareMarkovChain[state], temperature);
      generated += nextChar;
      currentText += nextChar;
      
      if (onToken) {
        onToken(nextChar, generated);
      }
    } else {
      // Fallback: find a similar state or use random character
      const states = Object.keys(shakespeareMarkovChain);
      const similarStates = states.filter(s => s.slice(-2) === state.slice(-2));
      
      if (similarStates.length > 0) {
        const randomState = similarStates[Math.floor(Math.random() * similarStates.length)];
        const nextChar = sampleFromDistribution(shakespeareMarkovChain[randomState], temperature);
        generated += nextChar;
        currentText += nextChar;
        
        if (onToken) {
          onToken(nextChar, generated);
        }
      } else {
        // Ultimate fallback: add a space and continue
        generated += ' ';
        currentText += ' ';
        
        if (onToken) {
          onToken(' ', generated);
        }
      }
    }
  }
  
  return generated;
};

// Build vocabulary from text data (word-level)

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
  
  // Extract texts and targets, trimming whitespace
  const texts = data.map(row => String(row[textColumn] || '').trim());
  const targets = data.map(row => String(row[targetColumn] || '').trim());
  
  // Build vocabulary
  const vocab = buildVocabulary(texts, vocabSize);
  console.log(`Built vocabulary with ${Object.keys(vocab).length} words`);
  
  // Convert texts to indices
  const sequences = texts.map(text => textToIndices(text, vocab, maxLength));
  
  // Create tensor
  const xTensor = tf.tensor2d(sequences, [sequences.length, maxLength], 'int32');
  
  // Process targets - trim whitespace and normalize
  const uniqueTargets = [...new Set(targets)];
  
  console.log(`Found ${uniqueTargets.length} unique classes:`, uniqueTargets.slice(0, 10), uniqueTargets.length > 10 ? '...' : '');
  
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
  } else if (type === 'text') {
    // Generate sample text data for NLP/Text Classification
    const vocabSize = options.vocabSize || 1000;
    const seqLength = options.seqLength || 100;
    const numClasses = options.numClasses || 3;
    
    const sequences = [];
    const labels = [];
    
    // Simulate different "topics" by using different token frequency distributions
    for (let i = 0; i < samples; i++) {
      const classIdx = i % numClasses;
      const sequence = [];
      
      // Generate token IDs with class-dependent patterns
      for (let t = 0; t < seqLength; t++) {
        // Different classes have different "vocabulary" regions
        const baseToken = Math.floor(Math.random() * (vocabSize / numClasses));
        const classOffset = classIdx * Math.floor(vocabSize / numClasses);
        const token = Math.min(baseToken + classOffset, vocabSize - 1);
        sequence.push(token);
      }
      
      sequences.push(sequence);
      labels.push(classIdx);
    }
    
    const xTensor = tf.tensor2d(sequences, [samples, seqLength], 'int32');
    const yTensor = tf.oneHot(tf.tensor1d(labels, 'int32'), numClasses);
    
    return {
      xTrain: xTensor,
      yTrain: yTensor,
      inputShape: [seqLength],
      numClasses,
      vocabSize,
      type: 'text',
      description: `Text classification (${seqLength} tokens, ${numClasses} classes)`,
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
