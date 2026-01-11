// PyTorch and Keras Code Generator for Neural Network
// Generates production-ready, executable code

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
      // Assuming same padding, output spatial dims stay same
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
      return inputShape; // Shape doesn't change
      
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

export const generatePyTorchCode = (nodes, edges) => {
  if (!nodes || nodes.length === 0) {
    return `# No layers defined yet
# Drag layers from the sidebar to build your network
`;
  }

  const sortedNodes = topologicalSort(nodes, edges);
  
  // Build adjacency for forward pass
  const adjacency = {};
  edges.forEach(edge => {
    if (!adjacency[edge.source]) adjacency[edge.source] = [];
    adjacency[edge.source].push({ target: edge.target, handle: edge.targetHandle });
  });

  // Calculate shapes through the network
  const nodeShapes = new Map();
  const nodeOutputVars = new Map();
  
  // First pass: calculate all shapes
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

  // Find input node
  const inputNode = sortedNodes.find(n => n.data.layerType === 'Input');
  const inputConfig = inputNode?.data?.config || {};
  const inputType = inputConfig.inputType || 'flat';
  
  nodeOutputVars.set(inputNode?.id, 'x');

  sortedNodes.forEach(node => {
    const config = node.data.config || {};
    const label = node.data.label || node.data.layerType;
    const layerName = `self.layer${layerIndex}`;
    const varName = `x${layerIndex}`;
    
    // Get input variable from previous layer
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
        // Calculate input features from previous layer's output shape
        const inFeatures = getFlatFeatures(inputShape);
        const outFeatures = config.units || 128;
        layerCode = `${layerName} = nn.Linear(${inFeatures}, ${outFeatures})  # ${label}`;
        
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
        layerCode = `${layerName} = nn.Conv2d(${inChannels}, ${outChannels}, kernel_size=${kernelSize}, padding=${padding})  # ${label}`;
        
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
        layerCode = `${layerName} = nn.MaxPool2d(kernel_size=${kernelSize}, stride=${stride})  # ${label}`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'Dropout': {
        const rate = config.rate || 0.5;
        layerCode = `${layerName} = nn.Dropout(p=${rate})  # ${label}`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'Flatten': {
        layerCode = `${layerName} = nn.Flatten()  # ${label}`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'Embedding': {
        const vocabSize = config.vocabSize || 10000;
        const embedDim = config.embedDim || 256;
        layerCode = `${layerName} = nn.Embedding(${vocabSize}, ${embedDim})  # ${label}`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'BatchNorm1D': {
        const numFeatures = inputShape?.features || config.numFeatures || 128;
        layerCode = `${layerName} = nn.BatchNorm1d(${numFeatures})  # ${label}`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'BatchNorm2D': {
        const numFeatures = inputShape?.channels || config.numFeatures || 32;
        layerCode = `${layerName} = nn.BatchNorm2d(${numFeatures})  # ${label}`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'LayerNorm': {
        const normalizedShape = inputShape?.features || config.normalizedShape || 256;
        layerCode = `${layerName} = nn.LayerNorm(${normalizedShape})  # ${label}`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'LSTM': {
        const lstmInputSize = inputShape?.features || config.inputSize || 256;
        const hiddenSize = config.hiddenSize || 128;
        const numLayers = config.numLayers || 1;
        const bidir = config.bidirectional ? 'True' : 'False';
        layerCode = `${layerName} = nn.LSTM(input_size=${lstmInputSize}, hidden_size=${hiddenSize}, num_layers=${numLayers}, batch_first=True, bidirectional=${bidir})  # ${label}`;
        forwardCode = `${varName}, _ = ${layerName}(${inputVar})`;
        break;
      }

      case 'GRU': {
        const gruInputSize = inputShape?.features || config.inputSize || 256;
        const hiddenSize = config.hiddenSize || 128;
        const numLayers = config.numLayers || 1;
        layerCode = `${layerName} = nn.GRU(input_size=${gruInputSize}, hidden_size=${hiddenSize}, num_layers=${numLayers}, batch_first=True)  # ${label}`;
        forwardCode = `${varName}, _ = ${layerName}(${inputVar})`;
        break;
      }

      case 'MultiHeadAttention': {
        const embedDim = inputShape?.features || config.embedDim || 256;
        const numHeads = config.numHeads || 8;
        layerCode = `${layerName} = nn.MultiheadAttention(embed_dim=${embedDim}, num_heads=${numHeads}, batch_first=True)  # ${label}`;
        forwardCode = `${varName}, _ = ${layerName}(${inputVar}, ${inputVar}, ${inputVar})`;
        break;
      }

      case 'TransformerEncoder': {
        const dModel = inputShape?.features || config.dModel || 256;
        const nHead = config.nHead || 8;
        const dimFF = config.dimFeedforward || 1024;
        const numLayers = config.numLayers || 2;
        layerCode = `${layerName}_layer = nn.TransformerEncoderLayer(d_model=${dModel}, nhead=${nHead}, dim_feedforward=${dimFF}, batch_first=True)
        ${layerName} = nn.TransformerEncoder(${layerName}_layer, num_layers=${numLayers})  # ${label}`;
        forwardCode = `${varName} = ${layerName}(${inputVar})`;
        break;
      }

      case 'TransformerDecoder': {
        const dModel = inputShape?.features || config.dModel || 256;
        const nHead = config.nHead || 8;
        const dimFF = config.dimFeedforward || 1024;
        const numLayers = config.numLayers || 1;
        // For GPT-style decoder-only models, use causal self-attention
        layerCode = `# Transformer Decoder Block (${label}) - with causal masking for autoregressive generation
        ${layerName}_layer = nn.TransformerEncoderLayer(d_model=${dModel}, nhead=${nHead}, dim_feedforward=${dimFF}, batch_first=True, dropout=0.1)
        ${layerName} = nn.TransformerEncoder(${layerName}_layer, num_layers=${numLayers})`;
        forwardCode = `# Generate causal mask for autoregressive attention
        seq_len = ${inputVar}.size(1)
        causal_mask = torch.triu(torch.ones(seq_len, seq_len, device=${inputVar}.device) * float('-inf'), diagonal=1)
        ${varName} = ${layerName}(${inputVar}, mask=causal_mask)`;
        break;
      }

      case 'PositionalEncoding': {
        const maxLen = config.maxLen || 512;
        const dModel = inputShape?.features || config.dModel || 256;
        const dropout = config.dropout || 0.1;
        layerCode = `# Positional Encoding (${label}) - using learned embeddings
        ${layerName}_pos = nn.Embedding(${maxLen}, ${dModel})
        ${layerName}_dropout = nn.Dropout(p=${dropout})`;
        forwardCode = `seq_len = ${inputVar}.size(1)
        positions = torch.arange(seq_len, device=${inputVar}.device).unsqueeze(0)
        ${varName} = ${layerName}_dropout(${inputVar} + ${layerName}_pos(positions))`;
        break;
      }

      case 'GlobalAvgPool1D': {
        layerCode = `# ${label} - Global Average Pooling over sequence dimension`;
        forwardCode = `${varName} = ${inputVar}.mean(dim=1)  # (batch, seq_len, features) -> (batch, features)`;
        break;
      }

      case 'Output': {
        // Calculate input features from previous layer
        const inFeatures = inputShape?.features || getFlatFeatures(inputShape);
        const numClasses = config.numClasses || 10;
        
        // For sequence models (text generation), output is per-position
        const isSequenceOutput = inputShape?.type === 'sequence';
        
        layerCode = `${layerName} = nn.Linear(${inFeatures}, ${numClasses})  # ${label}`;
        
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
        // Multi-input: collect all inputs
        const incomingEdges = edges.filter(e => e.target === node.id);
        const inputVars = incomingEdges.map(e => nodeOutputVars.get(e.source) || 'x');
        if (inputVars.length < 2) inputVars.push('x');
        layerCode = `# ${label} - Skip Connection (element-wise addition)`;
        forwardCode = `${varName} = ${inputVars.join(' + ')}`;
        break;
      }

      case 'Concatenate': {
        const axis = config.axis !== undefined ? config.axis : -1;
        const incomingEdges = edges.filter(e => e.target === node.id);
        const inputVars = incomingEdges.map(e => nodeOutputVars.get(e.source) || 'x');
        if (inputVars.length < 2) inputVars.push('x');
        layerCode = `# ${label} - Concatenate along axis ${axis}`;
        forwardCode = `${varName} = torch.cat([${inputVars.join(', ')}], dim=${axis})`;
        break;
      }

      default:
        // Handle custom labeled layers (encoder, decoder, latent)
        if (label.toLowerCase().includes('encoder') || label.toLowerCase().includes('decoder') || label.toLowerCase().includes('latent')) {
          const inFeatures = getFlatFeatures(inputShape);
          const outFeatures = config.units || 128;
          const activation = config.activation && config.activation !== 'none' ? config.activation : 'relu';
          layerCode = `${layerName} = nn.Linear(${inFeatures}, ${outFeatures})  # ${label}`;
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

  // Get last variable for return
  const lastVar = layerIndex > 0 ? `x${layerIndex - 1}` : 'x';

  // Generate input example based on input type
  let inputExample = '';
  let inputComment = '';
  
  if (inputType === 'image') {
    const c = inputConfig.channels || 3;
    const h = inputConfig.height || 224;
    const w = inputConfig.width || 224;
    inputExample = `torch.randn(1, ${c}, ${h}, ${w})`;
    inputComment = `# (batch, channels, height, width)`;
  } else if (inputType === 'sequence') {
    const seqLen = inputConfig.seqLength || 32;
    const feat = inputConfig.features || 256;
    inputExample = `torch.randn(1, ${seqLen}, ${feat})`;
    inputComment = `# (batch, seq_len, features)`;
  } else {
    const size = inputConfig.inputSize || 784;
    inputExample = `torch.randn(1, ${size})`;
    inputComment = `# (batch, features)`;
  }

  // Check if first layer is Embedding (needs integer input)
  const firstNonInput = sortedNodes.find(n => n.data.layerType !== 'Input');
  if (firstNonInput?.data?.layerType === 'Embedding') {
    const vocabSize = firstNonInput.data.config?.vocabSize || 10000;
    const seqLen = inputConfig.seqLength || 32;
    inputExample = `torch.randint(0, ${vocabSize}, (1, ${seqLen}))`;
    inputComment = `# (batch, seq_len) - token IDs`;
  }

  const architecture = sortedNodes.map(n => n.data.label || n.data.layerType).join(' → ');

  const code = `import torch
import torch.nn as nn
import torch.nn.functional as F


class NeuralNetwork(nn.Module):
    """
    Neural Network generated by NeuralFlows
    Architecture: ${architecture}
    """
    
    def __init__(self):
        super(NeuralNetwork, self).__init__()
        ${layerDefs.length > 0 ? layerDefs.join('\n        ') : '# Add layers to your network'}
    
    def forward(self, x):
        ${forwardSteps.length > 0 ? forwardSteps.join('\n        ') : '# Define forward pass'}
        return ${lastVar}


# ============================================================
# Example usage and verification
# ============================================================
if __name__ == "__main__":
    # Set device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Initialize model
    model = NeuralNetwork().to(device)
    print("\\nModel Architecture:")
    print(model)
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"\\nTotal parameters: {total_params:,}")
    print(f"Trainable parameters: {trainable_params:,}")
    
    # Test forward pass
    print("\\n--- Testing Forward Pass ---")
    x = ${inputExample}  ${inputComment}
    x = x.to(device)
    
    # Verify model works
    model.eval()
    with torch.no_grad():
        output = model(x)
    
    print(f"Input shape:  {x.shape}")
    print(f"Output shape: {output.shape}")
    print("✓ Forward pass successful!")
    
    # Optional: Test training step
    print("\\n--- Testing Training Step ---")
    model.train()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.CrossEntropyLoss()
    
    # Dummy target (adjust based on your task)
    target = torch.zeros(1, dtype=torch.long).to(device)
    
    # Forward + backward
    optimizer.zero_grad()
    output = model(x)
    
    # Handle different output shapes for loss
    if len(output.shape) > 2:
        output = output.view(output.size(0), -1)
    if output.shape[1] > 1:
        loss = criterion(output, target)
    else:
        loss = F.mse_loss(output, target.float().unsqueeze(1))
    
    loss.backward()
    optimizer.step()
    
    print(f"Loss: {loss.item():.4f}")
    print("✓ Training step successful!")
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

  // Calculate shapes through the network
  const nodeShapes = new Map();
  
  sortedNodes.forEach(node => {
    const incomingEdge = edges.find(e => e.target === node.id);
    const sourceShape = incomingEdge ? nodeShapes.get(incomingEdge.source) : null;
    const outputShape = calculateOutputShape(node.data.layerType, node.data.config || {}, sourceShape);
    nodeShapes.set(node.id, outputShape);
  });

  // Find input node
  const inputNode = sortedNodes.find(n => n.data.layerType === 'Input');
  const inputConfig = inputNode?.data?.config || {};
  const inputType = inputConfig.inputType || 'flat';

  // Track custom layers needed
  let needsPositionalEncoding = false;
  let needsTransformerEncoder = false;
  let needsTransformerDecoder = false;

  // Generate layer lines
  const layerLines = [];
  
  sortedNodes.forEach((node, idx) => {
    const config = node.data.config || {};
    const label = node.data.label || node.data.layerType;
    const safeName = label.replace(/[^a-zA-Z0-9_]/g, '_');
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
        layerLines.push(`        layers.MaxPooling2D(pool_size=(${poolSize}, ${poolSize}), strides=(${strides}, ${strides}), name='${safeName}'),`);
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
        const returnSeq = idx < sortedNodes.length - 2 ? 'True' : 'False';
        if (config.bidirectional) {
          layerLines.push(`        layers.Bidirectional(layers.LSTM(${units}, return_sequences=${returnSeq}), name='${safeName}'),`);
        } else {
          layerLines.push(`        layers.LSTM(${units}, return_sequences=${returnSeq}, name='${safeName}'),`);
        }
        break;
      }

      case 'GRU': {
        const units = config.hiddenSize || 128;
        const returnSeq = idx < sortedNodes.length - 2 ? 'True' : 'False';
        layerLines.push(`        layers.GRU(${units}, return_sequences=${returnSeq}, name='${safeName}'),`);
        break;
      }

      case 'MultiHeadAttention': {
        const numHeads = config.numHeads || 8;
        const embedDim = inputShape?.features || config.embedDim || 256;
        const keyDim = Math.floor(embedDim / numHeads);
        layerLines.push(`        # MultiHeadAttention - For proper usage, use Functional API`);
        layerLines.push(`        # layers.MultiHeadAttention(num_heads=${numHeads}, key_dim=${keyDim}),`);
        layerLines.push(`        layers.Dense(${embedDim}, name='${safeName}_proj'),  # Simplified projection`);
        break;
      }

      case 'PositionalEncoding':
        needsPositionalEncoding = true;
        layerLines.push(`        PositionalEncoding(max_len=${config.maxLen || 512}, d_model=${config.dModel || 256}, dropout=${config.dropout || 0.1}, name='${safeName}'),`);
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
        layerLines.push(`        # Add layer - requires Functional API for skip connections`);
        break;

      case 'Concatenate': {
        const axis = config.axis !== undefined ? config.axis : -1;
        layerLines.push(`        # Concatenate - requires Functional API`);
        layerLines.push(`        # layers.Concatenate(axis=${axis}),`);
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

  // Generate input shape
  let inputShapeStr = '(784,)';
  let inputExample = 'np.random.randn(1, 784).astype(np.float32)';
  let inputComment = '# (batch, features)';
  
  if (inputType === 'image') {
    const h = inputConfig.height || 224;
    const w = inputConfig.width || 224;
    const c = inputConfig.channels || 3;
    inputShapeStr = `(${h}, ${w}, ${c})`;
    inputExample = `np.random.randn(1, ${h}, ${w}, ${c}).astype(np.float32)`;
    inputComment = '# (batch, height, width, channels)';
  } else if (inputType === 'sequence') {
    const seqLen = inputConfig.seqLength || 32;
    const feat = inputConfig.features || 256;
    inputShapeStr = `(${seqLen}, ${feat})`;
    inputExample = `np.random.randn(1, ${seqLen}, ${feat}).astype(np.float32)`;
    inputComment = '# (batch, seq_len, features)';
  } else {
    const size = inputConfig.inputSize || 784;
    inputShapeStr = `(${size},)`;
    inputExample = `np.random.randn(1, ${size}).astype(np.float32)`;
    inputComment = '# (batch, features)';
  }

  // Check for Embedding layer
  const firstNonInput = sortedNodes.find(n => n.data.layerType !== 'Input');
  if (firstNonInput?.data?.layerType === 'Embedding') {
    const seqLen = inputConfig.seqLength || 128;
    const vocabSize = firstNonInput.data.config?.vocabSize || 10000;
    inputShapeStr = `(${seqLen},)`;
    inputExample = `np.random.randint(0, ${vocabSize}, (1, ${seqLen}))`;
    inputComment = '# (batch, seq_len) - token IDs';
  }

  // Build custom layers
  let customLayers = '';
  
  if (needsPositionalEncoding) {
    customLayers += `
class PositionalEncoding(layers.Layer):
    """Adds learned positional embeddings to input."""
    def __init__(self, max_len=512, d_model=256, dropout=0.1, **kwargs):
        super().__init__(**kwargs)
        self.max_len = max_len
        self.d_model = d_model
        self.dropout_rate = dropout
        
    def build(self, input_shape):
        self.pos_embedding = self.add_weight(
            "pos_embedding", shape=[self.max_len, self.d_model],
            initializer="uniform", trainable=True
        )
        self.dropout = layers.Dropout(self.dropout_rate)
        
    def call(self, x, training=False):
        seq_len = tf.shape(x)[1]
        x = x + self.pos_embedding[:seq_len]
        return self.dropout(x, training=training)

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
        self.layernorm1 = []
        self.layernorm2 = []
        
        for _ in range(self.num_layers):
            self.attention_layers.append(
                layers.MultiHeadAttention(num_heads=self.num_heads, key_dim=self.d_model // self.num_heads)
            )
            self.ffn_layers.append(tf.keras.Sequential([
                layers.Dense(self.ff_dim, activation='relu'),
                layers.Dense(self.d_model),
                layers.Dropout(self.dropout_rate)
            ]))
            self.layernorm1.append(layers.LayerNormalization())
            self.layernorm2.append(layers.LayerNormalization())
    
    def call(self, x, training=False):
        for i in range(self.num_layers):
            attn = self.attention_layers[i](x, x, training=training)
            x = self.layernorm1[i](x + attn)
            ffn = self.ffn_layers[i](x, training=training)
            x = self.layernorm2[i](x + ffn)
        return x

`;
  }

  if (needsTransformerDecoder) {
    customLayers += `
class TransformerDecoderBlock(layers.Layer):
    """Transformer Decoder with Masked Self-Attention + Cross-Attention + FFN."""
    def __init__(self, d_model=256, num_heads=8, ff_dim=1024, num_layers=2, dropout=0.1, **kwargs):
        super().__init__(**kwargs)
        self.d_model = d_model
        self.num_heads = num_heads
        self.ff_dim = ff_dim
        self.num_layers = num_layers
        self.dropout_rate = dropout
        
    def build(self, input_shape):
        self.self_attn = []
        self.cross_attn = []
        self.ffn_layers = []
        self.ln1, self.ln2, self.ln3 = [], [], []
        
        for _ in range(self.num_layers):
            self.self_attn.append(layers.MultiHeadAttention(num_heads=self.num_heads, key_dim=self.d_model // self.num_heads))
            self.cross_attn.append(layers.MultiHeadAttention(num_heads=self.num_heads, key_dim=self.d_model // self.num_heads))
            self.ffn_layers.append(tf.keras.Sequential([
                layers.Dense(self.ff_dim, activation='relu'),
                layers.Dense(self.d_model),
                layers.Dropout(self.dropout_rate)
            ]))
            self.ln1.append(layers.LayerNormalization())
            self.ln2.append(layers.LayerNormalization())
            self.ln3.append(layers.LayerNormalization())
    
    def call(self, x, encoder_output=None, training=False):
        if encoder_output is None:
            encoder_output = x
        for i in range(self.num_layers):
            attn1 = self.self_attn[i](x, x, use_causal_mask=True, training=training)
            x = self.ln1[i](x + attn1)
            attn2 = self.cross_attn[i](x, encoder_output, training=training)
            x = self.ln2[i](x + attn2)
            ffn = self.ffn_layers[i](x, training=training)
            x = self.ln3[i](x + ffn)
        return x

`;
  }

  const architecture = sortedNodes.map(n => n.data.label || n.data.layerType).join(' → ');

  const code = `import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np

${customLayers}
def create_model():
    """
    Neural Network generated by NeuralFlows
    Architecture: ${architecture}
    """
    model = models.Sequential([
        layers.InputLayer(input_shape=${inputShapeStr}),
${layerLines.join('\n')}
    ])
    return model


# ============================================================
# Example usage and verification
# ============================================================
if __name__ == "__main__":
    # Check GPU availability
    print(f"TensorFlow version: {tf.__version__}")
    print(f"GPU available: {len(tf.config.list_physical_devices('GPU')) > 0}")
    
    # Create model
    model = create_model()
    
    # Compile model
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',  # Adjust based on your task
        metrics=['accuracy']
    )
    
    # Model summary
    print("\\nModel Architecture:")
    model.summary()
    
    # Test forward pass
    print("\\n--- Testing Forward Pass ---")
    x = ${inputExample}  ${inputComment}
    
    output = model(x, training=False)
    print(f"Input shape:  {x.shape}")
    print(f"Output shape: {output.shape}")
    print("✓ Forward pass successful!")
    
    # Test training step
    print("\\n--- Testing Training Step ---")
    y = np.zeros((1,), dtype=np.int32)  # Dummy label
    
    history = model.fit(x, y, epochs=1, verbose=0)
    print(f"Loss: {history.history['loss'][0]:.4f}")
    print("✓ Training step successful!")
    
    # Save model (optional)
    # model.save('model.keras')
    # print("Model saved to 'model.keras'")
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
