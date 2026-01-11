// Sample datasets configuration - matched to templates
// These datasets can be used directly for training or downloaded

// MNIST-style sample data (for CNN template)
const generateMNISTSample = (numSamples = 100) => {
  const data = [];
  const labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  for (let i = 0; i < numSamples; i++) {
    const label = labels[i % 10];
    // Generate 784 features (28x28 flattened) with patterns based on digit
    const features = [];
    for (let j = 0; j < 784; j++) {
      // Create digit-like patterns
      const row = Math.floor(j / 28);
      const col = j % 28;
      const digitPattern = (parseInt(label) + 1) / 10;
      const noise = Math.random() * 0.3;
      
      // Create circular/angular patterns based on digit
      const distFromCenter = Math.sqrt((row - 14) ** 2 + (col - 14) ** 2);
      const angle = Math.atan2(row - 14, col - 14);
      const value = Math.max(0, Math.min(1, 
        digitPattern * Math.cos(angle * parseInt(label)) * (1 - distFromCenter / 20) + noise
      ));
      features.push(Math.round(value * 255));
    }
    data.push({ ...Object.fromEntries(features.map((f, idx) => [`pixel_${idx}`, f])), label });
  }
  return data;
};

// Iris dataset (for Simple MLP template)
const irisData = [
  { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.9, sepal_width: 3.0, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.7, sepal_width: 3.2, petal_length: 1.3, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.6, sepal_width: 3.1, petal_length: 1.5, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 5.0, sepal_width: 3.6, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 5.4, sepal_width: 3.9, petal_length: 1.7, petal_width: 0.4, species: 'setosa' },
  { sepal_length: 4.6, sepal_width: 3.4, petal_length: 1.4, petal_width: 0.3, species: 'setosa' },
  { sepal_length: 5.0, sepal_width: 3.4, petal_length: 1.5, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.4, sepal_width: 2.9, petal_length: 1.4, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.9, sepal_width: 3.1, petal_length: 1.5, petal_width: 0.1, species: 'setosa' },
  { sepal_length: 5.4, sepal_width: 3.7, petal_length: 1.5, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.8, sepal_width: 3.4, petal_length: 1.6, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 4.8, sepal_width: 3.0, petal_length: 1.4, petal_width: 0.1, species: 'setosa' },
  { sepal_length: 4.3, sepal_width: 3.0, petal_length: 1.1, petal_width: 0.1, species: 'setosa' },
  { sepal_length: 5.8, sepal_width: 4.0, petal_length: 1.2, petal_width: 0.2, species: 'setosa' },
  { sepal_length: 5.7, sepal_width: 4.4, petal_length: 1.5, petal_width: 0.4, species: 'setosa' },
  { sepal_length: 5.4, sepal_width: 3.9, petal_length: 1.3, petal_width: 0.4, species: 'setosa' },
  { sepal_length: 7.0, sepal_width: 3.2, petal_length: 4.7, petal_width: 1.4, species: 'versicolor' },
  { sepal_length: 6.4, sepal_width: 3.2, petal_length: 4.5, petal_width: 1.5, species: 'versicolor' },
  { sepal_length: 6.9, sepal_width: 3.1, petal_length: 4.9, petal_width: 1.5, species: 'versicolor' },
  { sepal_length: 5.5, sepal_width: 2.3, petal_length: 4.0, petal_width: 1.3, species: 'versicolor' },
  { sepal_length: 6.5, sepal_width: 2.8, petal_length: 4.6, petal_width: 1.5, species: 'versicolor' },
  { sepal_length: 5.7, sepal_width: 2.8, petal_length: 4.5, petal_width: 1.3, species: 'versicolor' },
  { sepal_length: 6.3, sepal_width: 3.3, petal_length: 4.7, petal_width: 1.6, species: 'versicolor' },
  { sepal_length: 4.9, sepal_width: 2.4, petal_length: 3.3, petal_width: 1.0, species: 'versicolor' },
  { sepal_length: 6.6, sepal_width: 2.9, petal_length: 4.6, petal_width: 1.3, species: 'versicolor' },
  { sepal_length: 5.2, sepal_width: 2.7, petal_length: 3.9, petal_width: 1.4, species: 'versicolor' },
  { sepal_length: 5.0, sepal_width: 2.0, petal_length: 3.5, petal_width: 1.0, species: 'versicolor' },
  { sepal_length: 5.9, sepal_width: 3.0, petal_length: 4.2, petal_width: 1.5, species: 'versicolor' },
  { sepal_length: 6.0, sepal_width: 2.2, petal_length: 4.0, petal_width: 1.0, species: 'versicolor' },
  { sepal_length: 6.1, sepal_width: 2.9, petal_length: 4.7, petal_width: 1.4, species: 'versicolor' },
  { sepal_length: 5.6, sepal_width: 2.9, petal_length: 3.6, petal_width: 1.3, species: 'versicolor' },
  { sepal_length: 6.7, sepal_width: 3.1, petal_length: 4.4, petal_width: 1.4, species: 'versicolor' },
  { sepal_length: 5.6, sepal_width: 3.0, petal_length: 4.5, petal_width: 1.5, species: 'versicolor' },
  { sepal_length: 6.3, sepal_width: 3.3, petal_length: 6.0, petal_width: 2.5, species: 'virginica' },
  { sepal_length: 5.8, sepal_width: 2.7, petal_length: 5.1, petal_width: 1.9, species: 'virginica' },
  { sepal_length: 7.1, sepal_width: 3.0, petal_length: 5.9, petal_width: 2.1, species: 'virginica' },
  { sepal_length: 6.3, sepal_width: 2.9, petal_length: 5.6, petal_width: 1.8, species: 'virginica' },
  { sepal_length: 6.5, sepal_width: 3.0, petal_length: 5.8, petal_width: 2.2, species: 'virginica' },
  { sepal_length: 7.6, sepal_width: 3.0, petal_length: 6.6, petal_width: 2.1, species: 'virginica' },
  { sepal_length: 4.9, sepal_width: 2.5, petal_length: 4.5, petal_width: 1.7, species: 'virginica' },
  { sepal_length: 7.3, sepal_width: 2.9, petal_length: 6.3, petal_width: 1.8, species: 'virginica' },
  { sepal_length: 6.7, sepal_width: 2.5, petal_length: 5.8, petal_width: 1.8, species: 'virginica' },
  { sepal_length: 7.2, sepal_width: 3.6, petal_length: 6.1, petal_width: 2.5, species: 'virginica' },
  { sepal_length: 6.5, sepal_width: 3.2, petal_length: 5.1, petal_width: 2.0, species: 'virginica' },
  { sepal_length: 6.4, sepal_width: 2.7, petal_length: 5.3, petal_width: 1.9, species: 'virginica' },
  { sepal_length: 6.8, sepal_width: 3.0, petal_length: 5.5, petal_width: 2.1, species: 'virginica' },
  { sepal_length: 5.7, sepal_width: 2.5, petal_length: 5.0, petal_width: 2.0, species: 'virginica' },
  { sepal_length: 5.8, sepal_width: 2.8, petal_length: 5.1, petal_width: 2.4, species: 'virginica' },
  { sepal_length: 6.4, sepal_width: 3.2, petal_length: 5.3, petal_width: 2.3, species: 'virginica' },
];

// Sentiment Analysis dataset (for Text Classifier template)
const sentimentData = [
  { text: "I absolutely love this product! It exceeded all my expectations.", sentiment: "positive" },
  { text: "This is the best purchase I've ever made. Highly recommend!", sentiment: "positive" },
  { text: "Amazing quality and fast shipping. Will buy again!", sentiment: "positive" },
  { text: "Fantastic experience from start to finish. Five stars!", sentiment: "positive" },
  { text: "Great value for money. Works perfectly as described.", sentiment: "positive" },
  { text: "The customer service was outstanding and very helpful.", sentiment: "positive" },
  { text: "I'm so happy with this purchase. It's exactly what I needed.", sentiment: "positive" },
  { text: "Excellent product quality. Would recommend to everyone.", sentiment: "positive" },
  { text: "This made my life so much easier. Thank you!", sentiment: "positive" },
  { text: "Perfect fit and great design. Love it!", sentiment: "positive" },
  { text: "Wonderful product! My whole family loves it.", sentiment: "positive" },
  { text: "Best decision I ever made buying this. So satisfied!", sentiment: "positive" },
  { text: "Incredible quality at an affordable price point.", sentiment: "positive" },
  { text: "Shipped fast and works great. Very pleased!", sentiment: "positive" },
  { text: "Exceeded my expectations in every way possible.", sentiment: "positive" },
  { text: "Terrible product. Broke after one day of use.", sentiment: "negative" },
  { text: "Complete waste of money. Do not buy this!", sentiment: "negative" },
  { text: "Very disappointed with the quality. Returning it.", sentiment: "negative" },
  { text: "The worst purchase I've ever made. Total garbage.", sentiment: "negative" },
  { text: "Does not work as advertised. Very misleading.", sentiment: "negative" },
  { text: "Poor quality materials and terrible construction.", sentiment: "negative" },
  { text: "Customer service was unhelpful and rude.", sentiment: "negative" },
  { text: "Arrived damaged and company won't refund me.", sentiment: "negative" },
  { text: "This is a scam. Save your money.", sentiment: "negative" },
  { text: "Completely useless product. Very frustrated.", sentiment: "negative" },
  { text: "Cheap quality and falls apart easily.", sentiment: "negative" },
  { text: "Not worth the price at all. Big regret.", sentiment: "negative" },
  { text: "Product looks nothing like the pictures shown.", sentiment: "negative" },
  { text: "Stopped working after a week. Very disappointing.", sentiment: "negative" },
  { text: "I want my money back. This is terrible.", sentiment: "negative" },
  { text: "It's okay, nothing special. Does the job.", sentiment: "neutral" },
  { text: "Average product. Not great, not terrible.", sentiment: "neutral" },
  { text: "Works as expected. Nothing more, nothing less.", sentiment: "neutral" },
  { text: "Decent quality for the price point.", sentiment: "neutral" },
  { text: "It's fine. Meets basic requirements.", sentiment: "neutral" },
  { text: "Neither impressed nor disappointed with this.", sentiment: "neutral" },
  { text: "Standard product. Gets the job done.", sentiment: "neutral" },
  { text: "Acceptable quality. Could be better.", sentiment: "neutral" },
  { text: "Meh. It's alright I suppose.", sentiment: "neutral" },
  { text: "Average experience overall. Nothing special.", sentiment: "neutral" },
  { text: "The product is satisfactory but unremarkable.", sentiment: "neutral" },
  { text: "It works but there's room for improvement.", sentiment: "neutral" },
  { text: "Middle of the road product. Okay value.", sentiment: "neutral" },
  { text: "Neither good nor bad. Just average.", sentiment: "neutral" },
  { text: "Does what it says but nothing more.", sentiment: "neutral" },
];

// Time Series dataset (for RNN/LSTM template)
const generateTimeSeriesData = (numSamples = 150) => {
  const data = [];
  const classes = ['up_trend', 'down_trend', 'stable'];
  
  for (let i = 0; i < numSamples; i++) {
    const classIdx = i % 3;
    const className = classes[classIdx];
    
    // Generate 9 features for each timestep
    for (let t = 0; t < 10; t++) {
      const row = {};
      for (let f = 0; f < 9; f++) {
        let baseValue;
        if (classIdx === 0) {
          // Upward trend
          baseValue = 50 + t * 5 + f * 2 + Math.random() * 10;
        } else if (classIdx === 1) {
          // Downward trend
          baseValue = 100 - t * 5 - f * 2 + Math.random() * 10;
        } else {
          // Stable with oscillation
          baseValue = 75 + Math.sin(t + f) * 10 + Math.random() * 5;
        }
        row[`feature_${f + 1}`] = Math.round(baseValue * 100) / 100;
      }
      row.trend = className;
      data.push(row);
    }
  }
  return data;
};

// SMS Spam dataset (for Text Classifier template)
const smsSpamData = [
  { message: "Congratulations! You've won a free iPhone. Click here to claim now!", label: "spam" },
  { message: "URGENT: Your account has been compromised. Verify immediately!", label: "spam" },
  { message: "FREE MONEY! No credit check required. Apply now!", label: "spam" },
  { message: "You have been selected for a cash prize of $1000!", label: "spam" },
  { message: "Limited time offer! Buy one get ten free! Act now!", label: "spam" },
  { message: "Your loan has been approved! Call this number immediately!", label: "spam" },
  { message: "Win big cash prizes by clicking this link right now!", label: "spam" },
  { message: "ALERT: Suspicious activity detected. Confirm your identity.", label: "spam" },
  { message: "Get rich quick! No experience needed. Start today!", label: "spam" },
  { message: "You're our lucky winner! Claim your prize before it expires!", label: "spam" },
  { message: "Hey, are we still meeting for lunch tomorrow?", label: "ham" },
  { message: "Can you pick up some milk on your way home?", label: "ham" },
  { message: "Thanks for dinner last night! Had a great time.", label: "ham" },
  { message: "Meeting rescheduled to 3pm. See you then!", label: "ham" },
  { message: "Happy birthday! Hope you have an amazing day!", label: "ham" },
  { message: "Running late, be there in 10 minutes.", label: "ham" },
  { message: "Don't forget we have that appointment tomorrow.", label: "ham" },
  { message: "Great job on the presentation today!", label: "ham" },
  { message: "What time does the movie start?", label: "ham" },
  { message: "Let me know when you get home safely.", label: "ham" },
  { message: "The kids are asking about the weekend trip.", label: "ham" },
  { message: "Can you send me the report when you get a chance?", label: "ham" },
  { message: "I'll call you back after my meeting ends.", label: "ham" },
  { message: "Thanks for the help yesterday, really appreciated it!", label: "ham" },
  { message: "See you at the gym tomorrow morning!", label: "ham" },
];

// Fashion-MNIST style dataset info (placeholder - generates sample patterns)
const generateFashionSample = (numSamples = 100) => {
  const data = [];
  const labels = ['t-shirt', 'trouser', 'pullover', 'dress', 'coat', 'sandal', 'shirt', 'sneaker', 'bag', 'ankle_boot'];
  
  for (let i = 0; i < numSamples; i++) {
    const label = labels[i % 10];
    const labelIdx = i % 10;
    const features = [];
    
    for (let j = 0; j < 784; j++) {
      const row = Math.floor(j / 28);
      const col = j % 28;
      
      // Different patterns for different items
      let value = 0;
      if (labelIdx < 5) {
        // Upper body items - concentrate pixels in upper half
        value = row < 20 ? Math.random() * 200 + 55 : Math.random() * 50;
      } else if (labelIdx < 7) {
        // Footwear - concentrate pixels in lower portion
        value = row > 10 ? Math.random() * 200 + 55 : Math.random() * 50;
      } else {
        // Accessories - scattered pattern
        value = Math.random() * 255;
      }
      features.push(Math.round(value));
    }
    data.push({ ...Object.fromEntries(features.map((f, idx) => [`pixel_${idx}`, f])), label });
  }
  return data;
};

// Dataset configurations
export const sampleDatasets = [
  {
    id: 'iris',
    name: 'Iris Flowers',
    description: '150 samples, 4 features, 3 classes',
    longDescription: 'Classic machine learning dataset for flower species classification based on sepal and petal measurements.',
    category: 'tabular',
    compatibleTemplates: ['mlp'],
    features: 4,
    classes: 3,
    samples: 150,
    icon: '🌸',
    color: '#8b5cf6',
    targetColumn: 'species',
    getData: () => irisData,
    previewColumns: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species'],
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: '45 samples, text, 3 classes',
    longDescription: 'Product review sentiment classification with positive, negative, and neutral labels.',
    category: 'text',
    compatibleTemplates: ['text-classifier', 'transformer'],
    features: 'text',
    classes: 3,
    samples: 45,
    icon: '💬',
    color: '#10b981',
    targetColumn: 'sentiment',
    textColumn: 'text',
    getData: () => sentimentData,
    previewColumns: ['text', 'sentiment'],
  },
  {
    id: 'sms-spam',
    name: 'SMS Spam Detection',
    description: '25 samples, text, 2 classes',
    longDescription: 'Binary classification of SMS messages as spam or legitimate (ham).',
    category: 'text',
    compatibleTemplates: ['text-classifier', 'transformer'],
    features: 'text',
    classes: 2,
    samples: 25,
    icon: '📱',
    color: '#f59e0b',
    targetColumn: 'label',
    textColumn: 'message',
    getData: () => smsSpamData,
    previewColumns: ['message', 'label'],
  },
  {
    id: 'time-series',
    name: 'Stock Trends',
    description: '1500 timesteps, 9 features, 3 classes',
    longDescription: 'Time series classification for predicting market trends (up, down, stable).',
    category: 'sequence',
    compatibleTemplates: ['rnn'],
    features: 9,
    classes: 3,
    samples: 1500,
    icon: '📈',
    color: '#22c55e',
    targetColumn: 'trend',
    getData: () => generateTimeSeriesData(150),
    previewColumns: ['feature_1', 'feature_2', 'feature_3', 'trend'],
  },
  {
    id: 'mnist-sample',
    name: 'MNIST Digits',
    description: '100 samples, 28x28 pixels, 10 classes',
    longDescription: 'Handwritten digit recognition sample. Each image is 28x28 grayscale pixels.',
    category: 'image',
    compatibleTemplates: ['cnn', 'mlp'],
    features: 784,
    classes: 10,
    samples: 100,
    icon: '🔢',
    color: '#06b6d4',
    targetColumn: 'label',
    getData: () => generateMNISTSample(100),
    previewColumns: ['pixel_0', 'pixel_1', 'pixel_2', '...', 'label'],
    isGenerated: true,
  },
  {
    id: 'fashion-sample',
    name: 'Fashion Items',
    description: '100 samples, 28x28 pixels, 10 classes',
    longDescription: 'Fashion item classification (t-shirt, trouser, dress, etc). Similar to MNIST format.',
    category: 'image',
    compatibleTemplates: ['cnn', 'mlp'],
    features: 784,
    classes: 10,
    samples: 100,
    icon: '👕',
    color: '#ec4899',
    targetColumn: 'label',
    getData: () => generateFashionSample(100),
    previewColumns: ['pixel_0', 'pixel_1', 'pixel_2', '...', 'label'],
    isGenerated: true,
  },
];

// Get datasets compatible with a template
export const getDatasetsForTemplate = (templateId) => {
  return sampleDatasets.filter(ds => ds.compatibleTemplates.includes(templateId));
};

// Get dataset by ID
export const getDatasetById = (datasetId) => {
  return sampleDatasets.find(ds => ds.id === datasetId);
};

// Convert dataset to CSV string
export const datasetToCSV = (dataset) => {
  const data = dataset.getData();
  if (!data || data.length === 0) return '';
  
  const columns = Object.keys(data[0]);
  const header = columns.join(',');
  const rows = data.map(row => 
    columns.map(col => {
      const val = row[col];
      // Escape strings with commas or quotes
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  
  return [header, ...rows].join('\n');
};

// Download dataset as CSV
export const downloadDatasetCSV = (dataset) => {
  const csvContent = datasetToCSV(dataset);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${dataset.id}_dataset.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default sampleDatasets;
