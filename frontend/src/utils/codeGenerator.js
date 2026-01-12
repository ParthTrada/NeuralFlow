// PyTorch, Keras, and TensorFlow Code Generator for Neural Network
// Generates production-ready, executable code with complete training pipelines

// Topological sort for DAG (Directed Acyclic Graph)
const topologicalSort = (nodes, edges) => {
  const adjacency = {};
  const inDegree = {};
  const nodeMap = {};
  
  nodes.forEach(node => {
    adjacency[node.id] = [];
    inDegree[node.id] = 0;
    nodeMap[node.id] = node;
  });
  
  edges.forEach(edge => {
    if (adjacency[edge.source]) {
      adjacency[edge.source].push(edge.target);
      inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
    }
  });
  
  const queue = nodes.filter(node => inDegree[node.id] === 0);
  const sorted = [];
  
  while (queue.length > 0) {
    queue.sort((a, b) => {
      const yDiff = a.position.y - b.position.y;
      if (Math.abs(yDiff) > 50) return yDiff;
      return a.position.x - b.position.x;
    });
    
    const node = queue.shift();
    sorted.push(node);
    
    adjacency[node.id].forEach(targetId => {
      inDegree[targetId]--;
      if (inDegree[targetId] === 0) {
        queue.push(nodeMap[targetId]);
      }
    });
  }
  
  if (sorted.length !== nodes.length) {
    console.warn('Graph has a cycle, falling back to position-based sorting');
    return [...nodes].sort((a, b) => {
      const yDiff = a.position.y - b.position.y;
      if (Math.abs(yDiff) > 50) return yDiff;
      return a.position.x - b.position.x;
    });
  }
  
  return sorted;
};

// Calculate the output shape of a layer given its input shape
const calculateOutputShape = (layerType, config, inputShape) => {
  switch (layerType) {
    case 'Input':
      const inputConfig = config || {};
      if (inputConfig.inputType === 'image') {
        return { 
          type: 'image', 
          channels: inputConfig.channels || 3, 
          height: inputConfig.height || 224, 
          width: inputConfig.width || 224 
        };
      } else if (inputConfig.inputType === 'sequence') {
        return { 
          type: 'sequence', 
          seqLength: inputConfig.seqLength || 32, 
          features: inputConfig.features || 256 
        };
      } else {
        return { type: 'flat', features: inputConfig.inputSize || 784 };
      }
      
    case 'Dense':
      return { type: 'flat', features: config.units || 128 };
      
    case 'Conv2D':
      return { 
        type: 'image', 
        channels: config.outChannels || 32, 
        height: inputShape?.height || 28, 
        width: inputShape?.width || 28 
      };
      
    case 'MaxPool2D':
      const stride = config.stride || 2;
      return { 
        type: 'image', 
        channels: inputShape?.channels || 32, 
        height: Math.floor((inputShape?.height || 28) / stride), 
        width: Math.floor((inputShape?.width || 28) / stride) 
      };
      
    case 'Flatten':
      if (inputShape?.type === 'image') {
        const flat = (inputShape.channels || 1) * (inputShape.height || 28) * (inputShape.width || 28);
        return { type: 'flat', features: flat };
      } else if (inputShape?.type === 'sequence') {
        return { type: 'flat', features: (inputShape.seqLength || 32) * (inputShape.features || 256) };
      }
      return { type: 'flat', features: inputShape?.features || 784 };
      
    case 'Embedding':
      return { 
        type: 'sequence', 
        seqLength: inputShape?.seqLength || 32, 
        features: config.embedDim || 256 
      };
      
    case 'LSTM':
    case 'GRU':
      const hiddenSize = config.hiddenSize || 128;
      const bidir = config.bidirectional ? 2 : 1;
      return { 
        type: 'sequence', 
        seqLength: inputShape?.seqLength || 32, 
        features: hiddenSize * bidir 
      };
      
    case 'MultiHeadAttention':
    case 'TransformerEncoder':
    case 'TransformerDecoder':
    case 'PositionalEncoding':
      return { 
        type: 'sequence', 
        seqLength: inputShape?.seqLength || 32, 
        features: config.embedDim || config.dModel || inputShape?.features || 256 
      };
      
    case 'GlobalAvgPool1D':
      return { type: 'flat', features: inputShape?.features || 256 };
      
    case 'BatchNorm1D':
    case 'BatchNorm2D':
    case 'LayerNorm':
    case 'Dropout':
      return inputShape;
      
    case 'Output':
      return { type: 'flat', features: config.numClasses || 10 };
      
    default:
      return inputShape;
  }
};

// Get flat feature count from shape
const getFlatFeatures = (shape) => {
  if (!shape) return 784;
  if (shape.type === 'flat') return shape.features || 784;
  if (shape.type === 'image') return (shape.channels || 1) * (shape.height || 28) * (shape.width || 28);
  if (shape.type === 'sequence') return shape.features || 256;
  return 784;
};

// Detect model type from layers
const detectModelType = (sortedNodes) => {
  const layerTypes = sortedNodes.map(n => n.data.layerType);
  
  if (layerTypes.includes('Conv2D')) return 'cnn';
  if (layerTypes.includes('LSTM') || layerTypes.includes('GRU')) return 'rnn';
  if (layerTypes.includes('TransformerEncoder') || layerTypes.includes('TransformerDecoder')) return 'transformer';
  if (layerTypes.includes('Embedding')) return 'text';
  return 'mlp';
};

// Get output info from output node
const getOutputInfo = (sortedNodes) => {
  const outputNode = sortedNodes.find(n => n.data.layerType === 'Output');
  const config = outputNode?.data?.config || {};
  return {
    numClasses: config.numClasses || 10,
    activation: config.activation || 'softmax',
    taskType: config.numClasses === 1 ? 'regression' : 'classification'
  };
};

export const generatePyTorchCode = (nodes, edges) => {
  if (!nodes || nodes.length === 0) {
    return `# No layers defined yet
# Drag layers from the sidebar to build your network
`;
  }

  const sortedNodes = topologicalSort(nodes, edges);
  const modelType = detectModelType(sortedNodes);
  const outputInfo = getOutputInfo(sortedNodes);
  
  // Calculate shapes through the network
  const nodeShapes = new Map();
  const nodeOutputVars = new Map();
  
  sortedNodes.forEach(node => {
    const incomingEdge = edges.find(e => e.target === node.id);
    const sourceShape = incomingEdge ? nodeShapes.get(incomingEdge.source) : null;
    const outputShape = calculateOutputShape(node.data.layerType, node.data.config || {}, sourceShape);
    nodeShapes.set(node.id, outputShape);
  });

  // Generate layer definitions and forward pass
  const layerDefs = [];
  const forwardSteps = [];
  let layerIndex = 0;

  const inputNode = sortedNodes.find(n => n.data.layerType === 'Input');
  const inputConfig = inputNode?.data?.config || {};
  const inputType = inputConfig.inputType || 'flat';
  
  nodeOutputVars.set(inputNode?.id, 'x');

  sortedNodes.forEach(node => {
    const config = node.data.config || {};
    const label = node.data.label || node.data.layerType;
    const layerName = `self.layer${layerIndex}`;
    const varName = `x${layerIndex}`;
    
    const incomingEdge = edges.find(e => e.target === node.id);
    const inputVar = incomingEdge ? (nodeOutputVars.get(incomingEdge.source) || 'x') : 'x';
    const inputShape = incomingEdge ? nodeShapes.get(incomingEdge.source) : null;
    
    let layerCode = '';
    let forwardCode = '';

    switch (node.data.layerType) {
      case 'Input':
        nodeOutputVars.set(node.id, 'x');
        return;

      case 'Dense': {
        const inFeatures = getFlatFeatures(inputShape);
        const outFeatures = config.units || 128;
        layerCode = `${layerName} = nn.Linear(${inFeatures}, ${outFeatures})`;
        
        if (config.activation && config.activation !== 'none') {
          forwardCode = `${varName} = F.${config.activation}(${layerName}(${inputVar}))`;
        } else {
          forwardCode = `${varName} = ${layerName}(${inputVar})`;
        }
        break;
      }

      case 'Conv2D': {
        const inChannels = inputShape?.channels || config.inChannels || 1;
        const outChannels = config.outChannels || 32;
        const kernelSize = config.kernelSize || 3;
        const padding = config.padding !== undefined ? config.padding : 1;
        layerCode = `${layerName} = nn.Conv2d(${inChannels}, ${outChannels}, kernel_size=${kernelSize}, padding=${padding})`;
        
        if (config.activation && config.activation !== 'none') {
          forwardCode = `${varName} = F.${config.activation}(${layerName}(${inputVar}))`;
        } else {
          forwardCode = `${varName} = ${layerName}(${inputVar})`;
        }
        break;
      }

      case 'MaxPool2D': {
        const kernelSize = config.kernelSize || 2;
        const stride = config.stride || 2;
        layerCode = `${layerName} = nn.MaxPool2d(kernel_size=${kernelSize}, stride=${stride})`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'Dropout': {
        const rate = config.rate || 0.5;
        layerCode = `${layerName} = nn.Dropout(p=${rate})`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'Flatten': {
        layerCode = `${layerName} = nn.Flatten()`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'Embedding': {
        const vocabSize = config.vocabSize || 10000;
        const embedDim = config.embedDim || 256;
        layerCode = `${layerName} = nn.Embedding(${vocabSize}, ${embedDim})`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'BatchNorm1D': {
        const numFeatures = inputShape?.features || config.numFeatures || 128;
        layerCode = `${layerName} = nn.BatchNorm1d(${numFeatures})`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'BatchNorm2D': {
        const numFeatures = inputShape?.channels || config.numFeatures || 32;
        layerCode = `${layerName} = nn.BatchNorm2d(${numFeatures})`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'LayerNorm': {
        const normalizedShape = inputShape?.features || config.normalizedShape || 256;
        layerCode = `${layerName} = nn.LayerNorm(${normalizedShape})`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'LSTM': {
        const lstmInputSize = inputShape?.features || config.inputSize || 256;
        const hiddenSize = config.hiddenSize || 128;
        const numLayers = config.numLayers || 1;
        const bidir = config.bidirectional ? 'True' : 'False';
        layerCode = `${layerName} = nn.LSTM(input_size=${lstmInputSize}, hidden_size=${hiddenSize}, num_layers=${numLayers}, batch_first=True, bidirectional=${bidir})`;
        forwardCode = `${varName}, _ = ${layerName}(${inputVar})`;
        break;
      }

      case 'GRU': {
        const gruInputSize = inputShape?.features || config.inputSize || 256;
        const hiddenSize = config.hiddenSize || 128;
        const numLayers = config.numLayers || 1;
        layerCode = `${layerName} = nn.GRU(input_size=${gruInputSize}, hidden_size=${hiddenSize}, num_layers=${numLayers}, batch_first=True)`;
        forwardCode = `${varName}, _ = ${layerName}(${inputVar})`;
        break;
      }

      case 'MultiHeadAttention': {
        const embedDim = inputShape?.features || config.embedDim || 256;
        const numHeads = config.numHeads || 8;
        layerCode = `${layerName} = nn.MultiheadAttention(embed_dim=${embedDim}, num_heads=${numHeads}, batch_first=True)`;
        forwardCode = `${varName}, _ = ${layerName}(${inputVar}, ${inputVar}, ${inputVar})`;
        break;
      }

      case 'TransformerEncoder': {
        const dModel = inputShape?.features || config.dModel || 256;
        const nHead = config.nHead || 8;
        const dimFF = config.dimFeedforward || 1024;
        const numLayers = config.numLayers || 2;
        layerCode = `${layerName}_layer = nn.TransformerEncoderLayer(d_model=${dModel}, nhead=${nHead}, dim_feedforward=${dimFF}, batch_first=True)
        ${layerName} = nn.TransformerEncoder(${layerName}_layer, num_layers=${numLayers})`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'TransformerDecoder': {
        const dModel = inputShape?.features || config.dModel || 256;
        const nHead = config.nHead || 8;
        const dimFF = config.dimFeedforward || 1024;
        const numLayers = config.numLayers || 1;
        layerCode = `${layerName}_layer = nn.TransformerEncoderLayer(d_model=${dModel}, nhead=${nHead}, dim_feedforward=${dimFF}, batch_first=True)
        ${layerName} = nn.TransformerEncoder(${layerName}_layer, num_layers=${numLayers})`;
        forwardCode = `seq_len = ${inputVar}.size(1)
        causal_mask = torch.triu(torch.ones(seq_len, seq_len, device=${inputVar}.device) * float('-inf'), diagonal=1)
        ${varName} = ${layerName}(${inputVar}, mask=causal_mask)`;
        break;
      }

      case 'PositionalEncoding': {
        const maxLen = config.maxLen || 512;
        const dModel = inputShape?.features || config.dModel || 256;
        const dropout = config.dropout || 0.1;
        layerCode = `${layerName}_pos = nn.Embedding(${maxLen}, ${dModel})
        ${layerName}_dropout = nn.Dropout(p=${dropout})`;
        forwardCode = `seq_len = ${inputVar}.size(1)
        positions = torch.arange(seq_len, device=${inputVar}.device).unsqueeze(0)
        ${varName} = ${layerName}_dropout(${inputVar} + ${layerName}_pos(positions))`;
        break;
      }

      case 'GlobalAvgPool1D': {
        layerCode = `# Global Average Pooling over sequence`;
        forwardCode = `${varName} = ${inputVar}.mean(dim=1)`;
        break;
      }

      case 'Output': {
        const inFeatures = inputShape?.features || getFlatFeatures(inputShape);
        const numClasses = config.numClasses || 10;
        
        layerCode = `${layerName} = nn.Linear(${inFeatures}, ${numClasses})`;
        
        if (config.activation === 'softmax') {
          forwardCode = `${varName} = F.log_softmax(${layerName}(${inputVar}), dim=-1)`;
        } else if (config.activation === 'sigmoid') {
          forwardCode = `${varName} = torch.sigmoid(${layerName}(${inputVar}))`;
        } else {
          forwardCode = `${varName} = ${layerName}(${inputVar})`;
        }
        break;
      }

      case 'Add': {
        const incomingEdges = edges.filter(e => e.target === node.id);
        const inputVars = incomingEdges.map(e => nodeOutputVars.get(e.source) || 'x');
        if (inputVars.length < 2) inputVars.push('x');
        layerCode = `# Skip Connection`;
        forwardCode = `${varName} = ${inputVars.join(' + ')}`;
        break;
      }

      case 'Concatenate': {
        const axis = config.axis !== undefined ? config.axis : -1;
        const incomingEdges = edges.filter(e => e.target === node.id);
        const inputVars = incomingEdges.map(e => nodeOutputVars.get(e.source) || 'x');
        if (inputVars.length < 2) inputVars.push('x');
        layerCode = `# Concatenate`;
        forwardCode = `${varName} = torch.cat([${inputVars.join(', ')}], dim=${axis})`;
        break;
      }

      default:
        if (label.toLowerCase().includes('encoder') || label.toLowerCase().includes('decoder') || label.toLowerCase().includes('latent')) {
          const inFeatures = getFlatFeatures(inputShape);
          const outFeatures = config.units || 128;
          const activation = config.activation && config.activation !== 'none' ? config.activation : 'relu';
          layerCode = `${layerName} = nn.Linear(${inFeatures}, ${outFeatures})`;
          forwardCode = `${varName} = F.${activation}(${layerName}(${inputVar}))`;
        } else {
          return;
        }
    }

    if (layerCode) {
      layerDefs.push(layerCode);
      forwardSteps.push(forwardCode);
      nodeOutputVars.set(node.id, varName);
      layerIndex++;
    }
  });

  const lastVar = layerIndex > 0 ? `x${layerIndex - 1}` : 'x';

  // Generate input/data config based on model type
  let dataLoaderCode = '';
  let inputExample = '';
  let trainLoopExtra = '';
  
  if (inputType === 'image' || modelType === 'cnn') {
    const c = inputConfig.channels || 1;
    const h = inputConfig.height || 28;
    const w = inputConfig.width || 28;
    inputExample = `torch.randn(batch_size, ${c}, ${h}, ${w})`;
    
    dataLoaderCode = `
# =============================================================================
# DATA LOADING - Image Classification
# =============================================================================
from torchvision import datasets, transforms

def get_data_loaders(batch_size=32, data_dir='./data'):
    """
    Load and preprocess image data.
    Replace with your own dataset as needed.
    """
    # Data augmentation for training
    train_transform = transforms.Compose([
        transforms.Resize((${h}, ${w})),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5] * ${c}, std=[0.5] * ${c})
    ])
    
    # No augmentation for validation/test
    test_transform = transforms.Compose([
        transforms.Resize((${h}, ${w})),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5] * ${c}, std=[0.5] * ${c})
    ])
    
    # Example: MNIST dataset (replace with your dataset)
    # For custom images, use datasets.ImageFolder(root='path/to/data', transform=...)
    train_dataset = datasets.MNIST(
        root=data_dir, train=True, download=True, transform=train_transform
    )
    test_dataset = datasets.MNIST(
        root=data_dir, train=False, download=True, transform=test_transform
    )
    
    # Split training into train/val
    train_size = int(0.9 * len(train_dataset))
    val_size = len(train_dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(
        train_dataset, [train_size, val_size]
    )
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=True)
    
    return train_loader, val_loader, test_loader
`;
  } else if (inputType === 'sequence' || modelType === 'rnn' || modelType === 'transformer' || modelType === 'text') {
    const seqLen = inputConfig.seqLength || 64;
    const vocabSize = sortedNodes.find(n => n.data.layerType === 'Embedding')?.data?.config?.vocabSize || 10000;
    inputExample = `torch.randint(0, ${vocabSize}, (batch_size, ${seqLen}))`;
    
    dataLoaderCode = `
# =============================================================================
# DATA LOADING - Text/Sequence Data
# =============================================================================
from torch.nn.utils.rnn import pad_sequence

class TextDataset(Dataset):
    """Custom dataset for text classification or generation."""
    
    def __init__(self, texts, labels=None, vocab=None, max_length=${seqLen}):
        self.texts = texts
        self.labels = labels
        self.max_length = max_length
        
        # Build vocabulary if not provided
        if vocab is None:
            self.vocab = self._build_vocab(texts)
        else:
            self.vocab = vocab
        
        self.vocab_size = len(self.vocab)
    
    def _build_vocab(self, texts):
        """Build character or word vocabulary."""
        chars = set()
        for text in texts:
            chars.update(text)
        vocab = {c: i + 1 for i, c in enumerate(sorted(chars))}  # 0 reserved for padding
        vocab['<PAD>'] = 0
        vocab['<UNK>'] = len(vocab)
        return vocab
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        
        # Convert to indices
        indices = [self.vocab.get(c, self.vocab['<UNK>']) for c in text[:self.max_length]]
        
        # Pad or truncate
        if len(indices) < self.max_length:
            indices = indices + [0] * (self.max_length - len(indices))
        
        x = torch.tensor(indices, dtype=torch.long)
        
        if self.labels is not None:
            y = torch.tensor(self.labels[idx], dtype=torch.long)
            return x, y
        return x

def get_data_loaders(batch_size=32):
    """
    Create data loaders for text data.
    Replace with your actual text data.
    """
    # Example: Generate dummy data (replace with real data)
    sample_texts = ["Hello world", "Deep learning is amazing", "Neural networks"] * 1000
    sample_labels = [0, 1, 2] * 1000
    
    dataset = TextDataset(sample_texts, sample_labels)
    
    # Split into train/val/test
    train_size = int(0.8 * len(dataset))
    val_size = int(0.1 * len(dataset))
    test_size = len(dataset) - train_size - val_size
    
    train_dataset, val_dataset, test_dataset = torch.utils.data.random_split(
        dataset, [train_size, val_size, test_size]
    )
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    return train_loader, val_loader, test_loader, dataset.vocab
`;
  } else {
    const size = inputConfig.inputSize || 784;
    inputExample = `torch.randn(batch_size, ${size})`;
    
    dataLoaderCode = `
# =============================================================================
# DATA LOADING - Tabular/Feature Data
# =============================================================================
class TabularDataset(Dataset):
    """Dataset for tabular/feature data."""
    
    def __init__(self, X, y=None):
        self.X = torch.tensor(X, dtype=torch.float32) if not isinstance(X, torch.Tensor) else X
        self.y = torch.tensor(y, dtype=torch.long) if y is not None else None
    
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        if self.y is not None:
            return self.X[idx], self.y[idx]
        return self.X[idx]

def get_data_loaders(X, y, batch_size=32, test_size=0.2, val_size=0.1):
    """
    Create data loaders from numpy arrays or tensors.
    
    Args:
        X: Features array of shape (n_samples, n_features)
        y: Labels array of shape (n_samples,)
        batch_size: Batch size for training
        test_size: Fraction of data for testing
        val_size: Fraction of training data for validation
    """
    from sklearn.model_selection import train_test_split
    
    # Split into train+val and test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )
    
    # Split train into train and val
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=val_size, random_state=42, stratify=y_train
    )
    
    train_dataset = TabularDataset(X_train, y_train)
    val_dataset = TabularDataset(X_val, y_val)
    test_dataset = TabularDataset(X_test, y_test)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    return train_loader, val_loader, test_loader

# Example usage with dummy data:
# X = np.random.randn(1000, ${inputConfig.inputSize || 784})
# y = np.random.randint(0, ${outputInfo.numClasses}, 1000)
# train_loader, val_loader, test_loader = get_data_loaders(X, y)
`;
  }

  const architecture = sortedNodes.map(n => n.data.label || n.data.layerType).join(' → ');
  const hasTextGen = modelType === 'transformer' && sortedNodes.some(n => n.data.layerType === 'TransformerDecoder');

  const code = `"""
Neural Network - PyTorch Implementation
========================================
Generated by NeuralFlows

Architecture: ${architecture}
Model Type: ${modelType.toUpperCase()}
Task: ${outputInfo.taskType}
Output Classes: ${outputInfo.numClasses}

Requirements:
    pip install torch torchvision tqdm numpy scikit-learn
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torch.optim.lr_scheduler import ReduceLROnPlateau
import numpy as np
from tqdm import tqdm
import os
from datetime import datetime

# =============================================================================
# CONFIGURATION
# =============================================================================
class Config:
    """Training configuration."""
    # Model
    num_classes = ${outputInfo.numClasses}
    
    # Training
    batch_size = 32
    epochs = 50
    learning_rate = 1e-3
    weight_decay = 1e-4
    
    # Early stopping
    patience = 10
    min_delta = 1e-4
    
    # Paths
    checkpoint_dir = './checkpoints'
    model_name = 'neural_network'
    
    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

config = Config()
${dataLoaderCode}

# =============================================================================
# MODEL DEFINITION
# =============================================================================
class NeuralNetwork(nn.Module):
    """${modelType.toUpperCase()} Neural Network."""
    
    def __init__(self):
        super(NeuralNetwork, self).__init__()
        ${layerDefs.length > 0 ? layerDefs.join('\n        ') : '# Add layers to your network'}
    
    def forward(self, x):
        ${forwardSteps.length > 0 ? forwardSteps.join('\n        ') : '# Define forward pass'}
        return ${lastVar}

# =============================================================================
# TRAINING UTILITIES
# =============================================================================
class EarlyStopping:
    """Early stopping to prevent overfitting."""
    
    def __init__(self, patience=10, min_delta=0, mode='min'):
        self.patience = patience
        self.min_delta = min_delta
        self.mode = mode
        self.counter = 0
        self.best_score = None
        self.early_stop = False
    
    def __call__(self, score):
        if self.best_score is None:
            self.best_score = score
        elif self._is_improvement(score):
            self.best_score = score
            self.counter = 0
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True
        return self.early_stop
    
    def _is_improvement(self, score):
        if self.mode == 'min':
            return score < self.best_score - self.min_delta
        return score > self.best_score + self.min_delta

def train_one_epoch(model, train_loader, criterion, optimizer, device):
    """Train for one epoch."""
    model.train()
    total_loss = 0
    correct = 0
    total = 0
    
    pbar = tqdm(train_loader, desc='Training', leave=False)
    for batch_x, batch_y in pbar:
        batch_x, batch_y = batch_x.to(device), batch_y.to(device)
        
        optimizer.zero_grad()
        outputs = model(batch_x)
        
        # Handle different output shapes
        if len(outputs.shape) > 2:
            outputs = outputs.view(outputs.size(0), -1, outputs.size(-1))
            outputs = outputs[:, -1, :]  # Take last timestep for sequence models
        
        loss = criterion(outputs, batch_y)
        loss.backward()
        
        # Gradient clipping for stability
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        
        optimizer.step()
        
        total_loss += loss.item()
        _, predicted = outputs.max(1)
        total += batch_y.size(0)
        correct += predicted.eq(batch_y).sum().item()
        
        pbar.set_postfix({'loss': f'{loss.item():.4f}', 'acc': f'{100.*correct/total:.2f}%'})
    
    return total_loss / len(train_loader), 100. * correct / total

@torch.no_grad()
def evaluate(model, data_loader, criterion, device):
    """Evaluate model on validation/test data."""
    model.eval()
    total_loss = 0
    correct = 0
    total = 0
    
    for batch_x, batch_y in data_loader:
        batch_x, batch_y = batch_x.to(device), batch_y.to(device)
        
        outputs = model(batch_x)
        
        if len(outputs.shape) > 2:
            outputs = outputs.view(outputs.size(0), -1, outputs.size(-1))
            outputs = outputs[:, -1, :]
        
        loss = criterion(outputs, batch_y)
        
        total_loss += loss.item()
        _, predicted = outputs.max(1)
        total += batch_y.size(0)
        correct += predicted.eq(batch_y).sum().item()
    
    return total_loss / len(data_loader), 100. * correct / total

def save_checkpoint(model, optimizer, epoch, val_loss, path):
    """Save model checkpoint."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'val_loss': val_loss,
    }, path)
    print(f'Checkpoint saved: {path}')

def load_checkpoint(model, optimizer, path):
    """Load model checkpoint."""
    checkpoint = torch.load(path)
    model.load_state_dict(checkpoint['model_state_dict'])
    optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    return checkpoint['epoch'], checkpoint['val_loss']

# =============================================================================
# MAIN TRAINING LOOP
# =============================================================================
def train(model, train_loader, val_loader, config):
    """Complete training pipeline."""
    
    print(f"\\n{'='*60}")
    print(f"Training on {config.device}")
    print(f"{'='*60}\\n")
    
    model = model.to(config.device)
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(
        model.parameters(), 
        lr=config.learning_rate, 
        weight_decay=config.weight_decay
    )
    scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5, verbose=True)
    early_stopping = EarlyStopping(patience=config.patience, min_delta=config.min_delta)
    
    # Training history
    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}
    best_val_loss = float('inf')
    
    for epoch in range(config.epochs):
        print(f"\\nEpoch {epoch+1}/{config.epochs}")
        print("-" * 40)
        
        # Train
        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, config.device
        )
        
        # Validate
        val_loss, val_acc = evaluate(model, val_loader, criterion, config.device)
        
        # Update scheduler
        scheduler.step(val_loss)
        
        # Log results
        print(f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%")
        print(f"Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc:.2f}%")
        
        # Save history
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        
        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            save_checkpoint(
                model, optimizer, epoch, val_loss,
                os.path.join(config.checkpoint_dir, f'{config.model_name}_best.pt')
            )
        
        # Early stopping
        if early_stopping(val_loss):
            print(f"\\nEarly stopping triggered at epoch {epoch+1}")
            break
    
    print(f"\\n{'='*60}")
    print(f"Training complete! Best validation loss: {best_val_loss:.4f}")
    print(f"{'='*60}")
    
    return history

# =============================================================================
# INFERENCE
# =============================================================================
@torch.no_grad()
def predict(model, x, device=None):
    """Make predictions on new data."""
    if device is None:
        device = next(model.parameters()).device
    
    model.eval()
    
    if not isinstance(x, torch.Tensor):
        x = torch.tensor(x, dtype=torch.float32)
    
    if len(x.shape) == 1:
        x = x.unsqueeze(0)
    
    x = x.to(device)
    outputs = model(x)
    
    if len(outputs.shape) > 2:
        outputs = outputs[:, -1, :]
    
    probabilities = F.softmax(outputs, dim=-1)
    predictions = torch.argmax(probabilities, dim=-1)
    
    return predictions.cpu().numpy(), probabilities.cpu().numpy()

# =============================================================================
# MAIN
# =============================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("NeuralFlows - PyTorch Model")
    print("=" * 60)
    
    # Initialize model
    model = NeuralNetwork()
    
    # Print model summary
    print("\\nModel Architecture:")
    print(model)
    
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\\nTotal parameters: {total_params:,}")
    print(f"Trainable parameters: {trainable_params:,}")
    
    # Quick forward pass test
    print("\\n--- Testing Forward Pass ---")
    batch_size = 2
    x = ${inputExample}
    x = x.to(config.device)
    model = model.to(config.device)
    
    model.eval()
    with torch.no_grad():
        output = model(x)
    
    print(f"Input shape:  {x.shape}")
    print(f"Output shape: {output.shape}")
    print("✓ Forward pass successful!")
    
    # Uncomment below to train with your data:
    # train_loader, val_loader, test_loader = get_data_loaders(batch_size=config.batch_size)
    # history = train(model, train_loader, val_loader, config)
    # 
    # # Final evaluation
    # criterion = nn.CrossEntropyLoss()
    # test_loss, test_acc = evaluate(model, test_loader, criterion, config.device)
    # print(f"\\nTest Loss: {test_loss:.4f} | Test Accuracy: {test_acc:.2f}%")
`;

  return code;
};


export const generateKerasCode = (nodes, edges) => {
  if (!nodes || nodes.length === 0) {
    return `# No layers defined yet
# Drag layers from the sidebar to build your network
`;
  }

  const sortedNodes = topologicalSort(nodes, edges);
  const modelType = detectModelType(sortedNodes);
  const outputInfo = getOutputInfo(sortedNodes);

  // Calculate shapes through the network
  const nodeShapes = new Map();
  
  sortedNodes.forEach(node => {
    const incomingEdge = edges.find(e => e.target === node.id);
    const sourceShape = incomingEdge ? nodeShapes.get(incomingEdge.source) : null;
    const outputShape = calculateOutputShape(node.data.layerType, node.data.config || {}, sourceShape);
    nodeShapes.set(node.id, outputShape);
  });

  const inputNode = sortedNodes.find(n => n.data.layerType === 'Input');
  const inputConfig = inputNode?.data?.config || {};
  const inputType = inputConfig.inputType || 'flat';

  let needsPositionalEncoding = false;
  let needsTransformerEncoder = false;
  let needsTransformerDecoder = false;

  const layerTypeCounts = {};
  const getUniqueName = (layerType, label) => {
    const baseName = label.replace(/[^a-zA-Z0-9_]/g, '_');
    layerTypeCounts[layerType] = (layerTypeCounts[layerType] || 0) + 1;
    return `${baseName.toLowerCase()}_${layerTypeCounts[layerType]}`;
  };

  const layerLines = [];
  
  sortedNodes.forEach((node, idx) => {
    const config = node.data.config || {};
    const label = node.data.label || node.data.layerType;
    const safeName = getUniqueName(node.data.layerType, label);
    const incomingEdge = edges.find(e => e.target === node.id);
    const inputShape = incomingEdge ? nodeShapes.get(incomingEdge.source) : null;
    
    switch (node.data.layerType) {
      case 'Input':
        break;

      case 'Dense': {
        const units = config.units || 128;
        const activation = config.activation && config.activation !== 'none' ? `'${config.activation}'` : 'None';
        layerLines.push(`        layers.Dense(${units}, activation=${activation}, name='${safeName}'),`);
        break;
      }

      case 'Conv2D': {
        const filters = config.outChannels || 32;
        const kernelSize = config.kernelSize || 3;
        const activation = config.activation && config.activation !== 'none' ? `'${config.activation}'` : 'None';
        const padding = config.padding === 1 || config.padding === 'same' ? "'same'" : "'valid'";
        layerLines.push(`        layers.Conv2D(${filters}, ${kernelSize}, padding=${padding}, activation=${activation}, name='${safeName}'),`);
        break;
      }

      case 'MaxPool2D': {
        const poolSize = config.kernelSize || 2;
        const strides = config.stride || 2;
        layerLines.push(`        layers.MaxPooling2D(pool_size=${poolSize}, strides=${strides}, name='${safeName}'),`);
        break;
      }

      case 'Dropout': {
        const rate = config.rate || 0.5;
        layerLines.push(`        layers.Dropout(${rate}, name='${safeName}'),`);
        break;
      }

      case 'Flatten':
        layerLines.push(`        layers.Flatten(name='${safeName}'),`);
        break;

      case 'GlobalAvgPool1D':
        layerLines.push(`        layers.GlobalAveragePooling1D(name='${safeName}'),`);
        break;

      case 'Embedding': {
        const vocabSize = config.vocabSize || 10000;
        const embedDim = config.embedDim || 256;
        layerLines.push(`        layers.Embedding(${vocabSize}, ${embedDim}, name='${safeName}'),`);
        break;
      }

      case 'BatchNorm1D':
      case 'BatchNorm2D':
        layerLines.push(`        layers.BatchNormalization(name='${safeName}'),`);
        break;

      case 'LayerNorm':
        layerLines.push(`        layers.LayerNormalization(name='${safeName}'),`);
        break;

      case 'LSTM': {
        const units = config.hiddenSize || 128;
        const nextNode = sortedNodes[idx + 1];
        const nextLayerType = nextNode?.data?.layerType;
        const sequenceLayers = ['LSTM', 'GRU', 'MultiHeadAttention', 'TransformerEncoder', 'TransformerDecoder'];
        const returnSeq = sequenceLayers.includes(nextLayerType) ? 'True' : 'False';
        if (config.bidirectional) {
          layerLines.push(`        layers.Bidirectional(layers.LSTM(${units}, return_sequences=${returnSeq}), name='${safeName}'),`);
        } else {
          layerLines.push(`        layers.LSTM(${units}, return_sequences=${returnSeq}, name='${safeName}'),`);
        }
        break;
      }

      case 'GRU': {
        const units = config.hiddenSize || 128;
        const nextNode = sortedNodes[idx + 1];
        const nextLayerType = nextNode?.data?.layerType;
        const sequenceLayers = ['LSTM', 'GRU', 'MultiHeadAttention', 'TransformerEncoder', 'TransformerDecoder'];
        const returnSeq = sequenceLayers.includes(nextLayerType) ? 'True' : 'False';
        layerLines.push(`        layers.GRU(${units}, return_sequences=${returnSeq}, name='${safeName}'),`);
        break;
      }

      case 'MultiHeadAttention': {
        const numHeads = config.numHeads || 8;
        const embedDim = inputShape?.features || config.embedDim || 256;
        const keyDim = Math.floor(embedDim / numHeads);
        layerLines.push(`        layers.MultiHeadAttention(num_heads=${numHeads}, key_dim=${keyDim}, name='${safeName}'),`);
        break;
      }

      case 'PositionalEncoding':
        needsPositionalEncoding = true;
        layerLines.push(`        PositionalEncoding(max_len=${config.maxLen || 512}, d_model=${config.dModel || 256}, name='${safeName}'),`);
        break;

      case 'TransformerEncoder':
        needsTransformerEncoder = true;
        layerLines.push(`        TransformerEncoderBlock(d_model=${config.dModel || 256}, num_heads=${config.nHead || 8}, ff_dim=${config.dimFeedforward || 1024}, num_layers=${config.numLayers || 2}, name='${safeName}'),`);
        break;

      case 'TransformerDecoder':
        needsTransformerDecoder = true;
        layerLines.push(`        TransformerDecoderBlock(d_model=${config.dModel || 256}, num_heads=${config.nHead || 8}, ff_dim=${config.dimFeedforward || 1024}, num_layers=${config.numLayers || 2}, name='${safeName}'),`);
        break;

      case 'Output': {
        const numClasses = config.numClasses || 10;
        let activation = 'None';
        if (config.activation === 'softmax') activation = "'softmax'";
        else if (config.activation === 'sigmoid') activation = "'sigmoid'";
        layerLines.push(`        layers.Dense(${numClasses}, activation=${activation}, name='output'),`);
        break;
      }

      case 'Add':
        layerLines.push(`        # Add: Use Functional API for skip connections`);
        break;

      case 'Concatenate': {
        const axis = config.axis !== undefined ? config.axis : -1;
        layerLines.push(`        # Concatenate: Use layers.Concatenate(axis=${axis}) with Functional API`);
        break;
      }

      default:
        if (label.toLowerCase().includes('encoder') || label.toLowerCase().includes('decoder') || label.toLowerCase().includes('latent')) {
          const units = config.units || 128;
          const activation = config.activation && config.activation !== 'none' ? `'${config.activation}'` : "'relu'";
          layerLines.push(`        layers.Dense(${units}, activation=${activation}, name='${safeName}'),`);
        }
    }
  });

  // Generate input shape and data loading code
  let inputShapeStr = '(784,)';
  let dataLoaderCode = '';
  
  if (inputType === 'image' || modelType === 'cnn') {
    const h = inputConfig.height || 28;
    const w = inputConfig.width || 28;
    const c = inputConfig.channels || 1;
    inputShapeStr = `(${h}, ${w}, ${c})`;
    
    dataLoaderCode = `
# =============================================================================
# DATA LOADING - Image Classification
# =============================================================================
def get_data():
    """
    Load and preprocess image data.
    Replace with your own dataset as needed.
    """
    # Example: MNIST dataset
    (x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
    
    # Normalize and reshape
    x_train = x_train.astype('float32') / 255.0
    x_test = x_test.astype('float32') / 255.0
    
    # Add channel dimension if needed
    if len(x_train.shape) == 3:
        x_train = x_train[..., np.newaxis]
        x_test = x_test[..., np.newaxis]
    
    # Resize if needed (current model expects ${h}x${w})
    if x_train.shape[1:3] != (${h}, ${w}):
        x_train = tf.image.resize(x_train, (${h}, ${w})).numpy()
        x_test = tf.image.resize(x_test, (${h}, ${w})).numpy()
    
    # Split training into train/val
    val_split = int(0.9 * len(x_train))
    x_val, y_val = x_train[val_split:], y_train[val_split:]
    x_train, y_train = x_train[:val_split], y_train[:val_split]
    
    return (x_train, y_train), (x_val, y_val), (x_test, y_test)
`;
  } else if (inputType === 'sequence' || modelType === 'rnn' || modelType === 'transformer' || modelType === 'text') {
    const seqLen = inputConfig.seqLength || 64;
    inputShapeStr = `(${seqLen},)`;
    
    dataLoaderCode = `
# =============================================================================
# DATA LOADING - Text/Sequence Data
# =============================================================================
def get_data(max_features=10000, max_length=${seqLen}):
    """
    Load and preprocess text data.
    Replace with your own dataset as needed.
    """
    # Example: IMDB sentiment classification
    (x_train, y_train), (x_test, y_test) = tf.keras.datasets.imdb.load_data(num_words=max_features)
    
    # Pad sequences to fixed length
    x_train = tf.keras.preprocessing.sequence.pad_sequences(x_train, maxlen=max_length)
    x_test = tf.keras.preprocessing.sequence.pad_sequences(x_test, maxlen=max_length)
    
    # Split training into train/val
    val_split = int(0.9 * len(x_train))
    x_val, y_val = x_train[val_split:], y_train[val_split:]
    x_train, y_train = x_train[:val_split], y_train[:val_split]
    
    return (x_train, y_train), (x_val, y_val), (x_test, y_test)
`;
  } else {
    const size = inputConfig.inputSize || 784;
    inputShapeStr = `(${size},)`;
    
    dataLoaderCode = `
# =============================================================================
# DATA LOADING - Tabular Data
# =============================================================================
def get_data(X, y, test_size=0.2, val_size=0.1):
    """
    Prepare tabular data for training.
    
    Args:
        X: Features array of shape (n_samples, n_features)
        y: Labels array of shape (n_samples,)
    """
    from sklearn.model_selection import train_test_split
    
    # Split into train+val and test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )
    
    # Split train into train and val
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=val_size, random_state=42, stratify=y_train
    )
    
    return (X_train, y_train), (X_val, y_val), (X_test, y_test)

# Example:
# X = np.random.randn(1000, ${inputConfig.inputSize || 784}).astype('float32')
# y = np.random.randint(0, ${outputInfo.numClasses}, 1000)
# (x_train, y_train), (x_val, y_val), (x_test, y_test) = get_data(X, y)
`;
  }

  // Build custom layers
  let customLayers = '';
  
  if (needsPositionalEncoding) {
    customLayers += `
class PositionalEncoding(layers.Layer):
    """Learned positional embeddings."""
    
    def __init__(self, max_len=512, d_model=256, **kwargs):
        super().__init__(**kwargs)
        self.max_len = max_len
        self.d_model = d_model
        
    def build(self, input_shape):
        self.pos_embedding = self.add_weight(
            name="pos_embedding", 
            shape=[self.max_len, self.d_model],
            initializer="uniform", 
            trainable=True
        )
        
    def call(self, x):
        seq_len = tf.shape(x)[1]
        return x + self.pos_embedding[:seq_len]

`;
  }

  if (needsTransformerEncoder) {
    customLayers += `
class TransformerEncoderBlock(layers.Layer):
    """Transformer Encoder with Multi-Head Attention + FFN."""
    
    def __init__(self, d_model=256, num_heads=8, ff_dim=1024, num_layers=2, dropout=0.1, **kwargs):
        super().__init__(**kwargs)
        self.d_model = d_model
        self.num_heads = num_heads
        self.ff_dim = ff_dim
        self.num_layers = num_layers
        self.dropout_rate = dropout
        
    def build(self, input_shape):
        self.attention_layers = []
        self.ffn_layers = []
        self.ln1 = []
        self.ln2 = []
        
        for _ in range(self.num_layers):
            self.attention_layers.append(
                layers.MultiHeadAttention(num_heads=self.num_heads, key_dim=self.d_model // self.num_heads)
            )
            self.ffn_layers.append(tf.keras.Sequential([
                layers.Dense(self.ff_dim, activation='relu'),
                layers.Dense(self.d_model),
                layers.Dropout(self.dropout_rate)
            ]))
            self.ln1.append(layers.LayerNormalization())
            self.ln2.append(layers.LayerNormalization())
    
    def call(self, x, training=False):
        for i in range(self.num_layers):
            attn = self.attention_layers[i](x, x, training=training)
            x = self.ln1[i](x + attn)
            ffn = self.ffn_layers[i](x, training=training)
            x = self.ln2[i](x + ffn)
        return x

`;
  }

  if (needsTransformerDecoder) {
    customLayers += `
class TransformerDecoderBlock(layers.Layer):
    """Transformer Decoder with causal self-attention."""
    
    def __init__(self, d_model=256, num_heads=8, ff_dim=1024, num_layers=2, dropout=0.1, **kwargs):
        super().__init__(**kwargs)
        self.d_model = d_model
        self.num_heads = num_heads
        self.ff_dim = ff_dim
        self.num_layers = num_layers
        self.dropout_rate = dropout
        
    def build(self, input_shape):
        self.attention_layers = []
        self.ffn_layers = []
        self.ln1 = []
        self.ln2 = []
        
        for _ in range(self.num_layers):
            self.attention_layers.append(
                layers.MultiHeadAttention(num_heads=self.num_heads, key_dim=self.d_model // self.num_heads)
            )
            self.ffn_layers.append(tf.keras.Sequential([
                layers.Dense(self.ff_dim, activation='relu'),
                layers.Dense(self.d_model),
                layers.Dropout(self.dropout_rate)
            ]))
            self.ln1.append(layers.LayerNormalization())
            self.ln2.append(layers.LayerNormalization())
    
    def call(self, x, training=False):
        for i in range(self.num_layers):
            attn = self.attention_layers[i](x, x, use_causal_mask=True, training=training)
            x = self.ln1[i](x + attn)
            ffn = self.ffn_layers[i](x, training=training)
            x = self.ln2[i](x + ffn)
        return x

`;
  }

  const architecture = sortedNodes.map(n => n.data.label || n.data.layerType).join(' → ');

  const code = `"""
Neural Network - TensorFlow/Keras Implementation
=================================================
Generated by NeuralFlows

Architecture: ${architecture}
Model Type: ${modelType.toUpperCase()}
Task: ${outputInfo.taskType}
Output Classes: ${outputInfo.numClasses}

Requirements:
    pip install tensorflow numpy scikit-learn
"""

import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
import numpy as np
import os
from datetime import datetime

# =============================================================================
# CONFIGURATION
# =============================================================================
class Config:
    """Training configuration."""
    # Model
    num_classes = ${outputInfo.numClasses}
    
    # Training
    batch_size = 32
    epochs = 50
    learning_rate = 1e-3
    
    # Early stopping
    patience = 10
    
    # Paths
    checkpoint_dir = './checkpoints'
    log_dir = './logs'
    model_name = 'neural_network'

config = Config()

# Check GPU
print(f"TensorFlow version: {tf.__version__}")
print(f"GPU available: {len(tf.config.list_physical_devices('GPU')) > 0}")
${dataLoaderCode}
${customLayers}
# =============================================================================
# MODEL DEFINITION
# =============================================================================
def create_model():
    """Create the neural network model."""
    model = models.Sequential([
        layers.InputLayer(input_shape=${inputShapeStr}),
${layerLines.join('\n')}
    ])
    return model

# =============================================================================
# TRAINING CALLBACKS
# =============================================================================
def get_callbacks():
    """Create training callbacks."""
    return [
        # Early stopping
        callbacks.EarlyStopping(
            monitor='val_loss',
            patience=config.patience,
            restore_best_weights=True,
            verbose=1
        ),
        
        # Model checkpoint
        callbacks.ModelCheckpoint(
            filepath=os.path.join(config.checkpoint_dir, f'{config.model_name}_best.keras'),
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        ),
        
        # Learning rate reduction
        callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        ),
        
        # TensorBoard logging
        callbacks.TensorBoard(
            log_dir=os.path.join(config.log_dir, datetime.now().strftime("%Y%m%d-%H%M%S")),
            histogram_freq=1
        )
    ]

# =============================================================================
# TRAINING
# =============================================================================
def train(model, train_data, val_data):
    """Train the model."""
    
    x_train, y_train = train_data
    x_val, y_val = val_data
    
    # Compile model
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=config.learning_rate),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Create directories
    os.makedirs(config.checkpoint_dir, exist_ok=True)
    os.makedirs(config.log_dir, exist_ok=True)
    
    # Train
    print("\\n" + "=" * 60)
    print("Starting Training")
    print("=" * 60 + "\\n")
    
    history = model.fit(
        x_train, y_train,
        batch_size=config.batch_size,
        epochs=config.epochs,
        validation_data=(x_val, y_val),
        callbacks=get_callbacks(),
        verbose=1
    )
    
    return history

# =============================================================================
# EVALUATION
# =============================================================================
def evaluate(model, test_data):
    """Evaluate the model on test data."""
    x_test, y_test = test_data
    
    print("\\n" + "=" * 60)
    print("Evaluation Results")
    print("=" * 60)
    
    loss, accuracy = model.evaluate(x_test, y_test, verbose=0)
    print(f"Test Loss:     {loss:.4f}")
    print(f"Test Accuracy: {accuracy*100:.2f}%")
    
    return loss, accuracy

def predict(model, x):
    """Make predictions on new data."""
    if not isinstance(x, np.ndarray):
        x = np.array(x)
    
    if len(x.shape) == len(${inputShapeStr}):
        x = np.expand_dims(x, 0)
    
    predictions = model.predict(x, verbose=0)
    predicted_classes = np.argmax(predictions, axis=-1)
    
    return predicted_classes, predictions

# =============================================================================
# MAIN
# =============================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("NeuralFlows - TensorFlow/Keras Model")
    print("=" * 60)
    
    # Create model
    model = create_model()
    
    # Print model summary
    print("\\nModel Architecture:")
    model.summary()
    
    # Quick forward pass test
    print("\\n--- Testing Forward Pass ---")
    
    # Create sample input
    input_shape = ${inputShapeStr}
    x_sample = np.random.randn(2, *input_shape).astype('float32')
    
    # Handle integer inputs for embedding layers
    if 'Embedding' in str(model.layers):
        x_sample = np.random.randint(0, 1000, (2, *input_shape))
    
    output = model(x_sample, training=False)
    print(f"Input shape:  {x_sample.shape}")
    print(f"Output shape: {output.shape}")
    print("✓ Forward pass successful!")
    
    # Uncomment below to train with your data:
    # (x_train, y_train), (x_val, y_val), (x_test, y_test) = get_data()
    # history = train(model, (x_train, y_train), (x_val, y_val))
    # evaluate(model, (x_test, y_test))
    #
    # # Save final model
    # model.save(f'{config.model_name}_final.keras')
    # print(f"\\nModel saved to '{config.model_name}_final.keras'")
`;

  return code;
};


export const downloadCode = (code, filename = 'neural_network.py') => {
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
