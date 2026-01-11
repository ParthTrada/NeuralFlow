// PyTorch Code Generator for Neural Network

export const generatePyTorchCode = (nodes, edges) => {
  if (!nodes || nodes.length === 0) {
    return `# No layers defined yet
# Drag layers from the sidebar to build your network
`;
  }

  // Sort nodes by position (top to bottom, left to right)
  const sortedNodes = [...nodes].sort((a, b) => {
    const yDiff = a.position.y - b.position.y;
    if (Math.abs(yDiff) > 50) return yDiff;
    return a.position.x - b.position.x;
  });

  // Build adjacency list from edges
  const adjacency = {};
  edges.forEach(edge => {
    if (!adjacency[edge.source]) adjacency[edge.source] = [];
    adjacency[edge.source].push(edge.target);
  });

  // Find input nodes (nodes with no incoming edges)
  const hasIncoming = new Set(edges.map(e => e.target));
  const inputNodes = sortedNodes.filter(n => !hasIncoming.has(n.id));

  // Generate layer definitions
  const layerDefs = [];
  const forwardSteps = [];
  let layerIndex = 0;

  const processedNodes = new Map();
  
  // Track if we need special imports
  let needsTransformer = false;

  // Find the Input layer to get its configuration
  const inputLayerNode = sortedNodes.find(n => n.data.layerType === 'Input');
  const inputConfig = inputLayerNode?.data?.config || {};
  const inputType = inputConfig.inputType || 'flat';
  
  // Calculate network input size based on input type
  let networkInputSize = 784;
  if (inputType === 'flat') {
    networkInputSize = inputConfig.inputSize || 784;
  } else if (inputType === 'image') {
    // For images, Dense after Flatten would receive C*H*W
    networkInputSize = (inputConfig.channels || 3) * (inputConfig.height || 224) * (inputConfig.width || 224);
  } else if (inputType === 'sequence') {
    networkInputSize = inputConfig.features || 256;
  }

  sortedNodes.forEach(node => {
    const layerName = `self.layer${layerIndex}`;
    const config = node.data.config || {};
    const label = node.data.label || node.data.layerType;
    let layerCode = '';
    let forwardCode = '';
    const varName = `x${layerIndex}`;

    switch (node.data.layerType) {
      case 'Input':
        processedNodes.set(node.id, 'x');
        return; // Input is just the forward pass input

      case 'Dense':
        // Check if this Dense layer is connected to Input layer
        const incomingEdgeForDense = edges.find(e => e.target === node.id);
        let inSize = config.inputSize || 784;
        
        // If connected to Input layer, use Input layer's size
        if (incomingEdgeForDense) {
          const sourceNode = sortedNodes.find(n => n.id === incomingEdgeForDense.source);
          if (sourceNode?.data?.layerType === 'Input') {
            inSize = networkInputSize;
          }
        }
        
        const units = config.units || 128;
        layerCode = `${layerName} = nn.Linear(${inSize}, ${units})  # ${label}`;
        if (config.activation && config.activation !== 'none') {
          forwardCode = `${varName} = F.${config.activation}(${layerName}({{input}}))`;
        } else {
          forwardCode = `${varName} = ${layerName}({{input}})`;
        }
        break;

      case 'Conv2D':
        layerCode = `${layerName} = nn.Conv2d(${config.inChannels || 1}, ${config.outChannels || 32}, kernel_size=${config.kernelSize || 3}, padding=${config.padding || 1})  # ${label}`;
        if (config.activation && config.activation !== 'none') {
          forwardCode = `${varName} = F.${config.activation}(${layerName}({{input}}))`;
        } else {
          forwardCode = `${varName} = ${layerName}({{input}})`;
        }
        break;

      case 'MaxPool2D':
        layerCode = `${layerName} = nn.MaxPool2d(kernel_size=${config.kernelSize || 2}, stride=${config.stride || 2})  # ${label}`;
        forwardCode = `${varName} = ${layerName}({{input}})`;
        break;

      case 'Dropout':
        layerCode = `${layerName} = nn.Dropout(p=${config.rate || 0.5})  # ${label}`;
        forwardCode = `${varName} = ${layerName}({{input}})`;
        break;

      case 'Flatten':
        layerCode = `${layerName} = nn.Flatten()  # ${label}`;
        forwardCode = `${varName} = ${layerName}({{input}})`;
        break;

      case 'Embedding':
        layerCode = `${layerName} = nn.Embedding(${config.vocabSize || 10000}, ${config.embedDim || 256})  # ${label}`;
        forwardCode = `${varName} = ${layerName}({{input}})`;
        break;

      case 'BatchNorm1D':
        layerCode = `${layerName} = nn.BatchNorm1d(${config.numFeatures || 128})  # ${label}`;
        forwardCode = `${varName} = ${layerName}({{input}})`;
        break;

      case 'BatchNorm2D':
        layerCode = `${layerName} = nn.BatchNorm2d(${config.numFeatures || 32})  # ${label}`;
        forwardCode = `${varName} = ${layerName}({{input}})`;
        break;

      case 'LayerNorm':
        layerCode = `${layerName} = nn.LayerNorm(${config.normalizedShape || 256})  # ${label}`;
        forwardCode = `${varName} = ${layerName}({{input}})`;
        break;

      case 'LSTM':
        const lstmBidir = config.bidirectional ? 'True' : 'False';
        layerCode = `${layerName} = nn.LSTM(input_size=${config.inputSize || 256}, hidden_size=${config.hiddenSize || 128}, num_layers=${config.numLayers || 1}, batch_first=True, bidirectional=${lstmBidir})  # ${label}`;
        forwardCode = `${varName}, _ = ${layerName}({{input}})`;
        break;

      case 'GRU':
        layerCode = `${layerName} = nn.GRU(input_size=${config.inputSize || 256}, hidden_size=${config.hiddenSize || 128}, num_layers=${config.numLayers || 1}, batch_first=True)  # ${label}`;
        forwardCode = `${varName}, _ = ${layerName}({{input}})`;
        break;

      case 'MultiHeadAttention':
        layerCode = `${layerName} = nn.MultiheadAttention(embed_dim=${config.embedDim || 256}, num_heads=${config.numHeads || 8}, batch_first=True)  # ${label}`;
        forwardCode = `${varName}, _ = ${layerName}({{input}}, {{input}}, {{input}})`;
        break;

      case 'TransformerEncoder':
        needsTransformer = true;
        const encDModel = config.dModel || 256;
        const encNHead = config.nHead || 8;
        const encDimFF = config.dimFeedforward || 1024;
        const encNumLayers = config.numLayers || 2;
        layerCode = `${layerName}_layer = nn.TransformerEncoderLayer(d_model=${encDModel}, nhead=${encNHead}, dim_feedforward=${encDimFF}, batch_first=True)
        ${layerName} = nn.TransformerEncoder(${layerName}_layer, num_layers=${encNumLayers})  # ${label}`;
        forwardCode = `${varName} = ${layerName}({{input}})`;
        break;

      case 'TransformerDecoder':
        needsTransformer = true;
        const decDModel = config.dModel || 256;
        const decNHead = config.nHead || 8;
        const decDimFF = config.dimFeedforward || 1024;
        const decNumLayers = config.numLayers || 2;
        layerCode = `${layerName}_layer = nn.TransformerDecoderLayer(d_model=${decDModel}, nhead=${decNHead}, dim_feedforward=${decDimFF}, batch_first=True)
        ${layerName} = nn.TransformerDecoder(${layerName}_layer, num_layers=${decNumLayers})  # ${label}`;
        // Decoder needs memory from encoder - use same input for simplicity
        forwardCode = `${varName} = ${layerName}({{input}}, {{input}})  # (target, memory)`;
        break;

      case 'PositionalEncoding':
        const peMaxLen = config.maxLen || 512;
        const peDModel = config.dModel || 256;
        const peDropout = config.dropout || 0.1;
        // Positional encoding is typically a custom module in PyTorch
        layerCode = `# Positional Encoding (${label})
        # Using learned positional embeddings
        ${layerName}_pos = nn.Embedding(${peMaxLen}, ${peDModel})
        ${layerName}_dropout = nn.Dropout(p=${peDropout})`;
        forwardCode = `seq_len = {{input}}.size(1)
        positions = torch.arange(seq_len, device={{input}}.device).unsqueeze(0)
        ${varName} = ${layerName}_dropout({{input}} + ${layerName}_pos(positions))`;
        break;

      case 'GlobalAvgPool1D':
        layerCode = `# ${label} - Global Average Pooling over sequence dimension`;
        forwardCode = `${varName} = {{input}}.mean(dim=1)  # (batch, seq_len, features) -> (batch, features)`;
        break;

      case 'Output':
        const outInSize = config.inputSize || 128;
        const numClasses = config.numClasses || 10;
        layerCode = `${layerName} = nn.Linear(${outInSize}, ${numClasses})  # ${label}`;
        if (config.activation === 'softmax') {
          forwardCode = `${varName} = F.log_softmax(${layerName}({{input}}), dim=-1)`;
        } else if (config.activation === 'sigmoid') {
          forwardCode = `${varName} = torch.sigmoid(${layerName}({{input}}))`;
        } else {
          forwardCode = `${varName} = ${layerName}({{input}})`;
        }
        break;

      case 'Add':
        // Add layer combines multiple inputs - find all incoming edges
        layerCode = `# ${label} - Skip Connection (element-wise addition)`;
        forwardCode = `${varName} = {{inputs_add}}  # Add skip connection`;
        break;

      case 'Concatenate':
        const axis = config.axis !== undefined ? config.axis : -1;
        layerCode = `# ${label} - Concatenate along axis ${axis}`;
        forwardCode = `${varName} = torch.cat({{inputs_cat}}, dim=${axis})  # Concatenate`;
        break;

      default:
        // Handle custom labeled layers (like "Encoder 1", "Decoder 1", etc.)
        // These are usually Dense layers with custom names
        if (label.toLowerCase().includes('encoder') || label.toLowerCase().includes('decoder') || label.toLowerCase().includes('latent')) {
          const customUnits = config.units || 128;
          const customInputSize = config.inputSize || 256;
          layerCode = `${layerName} = nn.Linear(${customInputSize}, ${customUnits})  # ${label}`;
          if (config.activation && config.activation !== 'none') {
            forwardCode = `${varName} = F.${config.activation}(${layerName}({{input}}))`;
          } else {
            forwardCode = `${varName} = F.relu(${layerName}({{input}}))`;
          }
        } else {
          return;
        }
    }

    if (layerCode) {
      layerDefs.push(layerCode);
      
      // Find inputs for this layer
      const incomingEdges = edges.filter(e => e.target === node.id);
      
      if (node.data.layerType === 'Add' || node.data.layerType === 'Concatenate') {
        // Multi-input layer - collect all inputs
        const inputVars = incomingEdges.map(edge => {
          if (processedNodes.has(edge.source)) {
            return processedNodes.get(edge.source);
          }
          return 'x';
        });
        
        if (inputVars.length < 2) {
          // Not enough inputs, use placeholder
          inputVars.push('x');
        }
        
        if (node.data.layerType === 'Add') {
          const addExpr = inputVars.join(' + ');
          forwardSteps.push(forwardCode.replace('{{inputs_add}}', addExpr));
        } else {
          const catExpr = `[${inputVars.join(', ')}]`;
          forwardSteps.push(forwardCode.replace('{{inputs_cat}}', catExpr));
        }
      } else {
        // Single input layer
        const incomingEdge = incomingEdges[0];
        let inputVar = 'x';
        if (incomingEdge && processedNodes.has(incomingEdge.source)) {
          inputVar = processedNodes.get(incomingEdge.source);
        }
        forwardSteps.push(forwardCode.replace(/{{input}}/g, inputVar));
      }
      
      processedNodes.set(node.id, varName);
      layerIndex++;
    }
  });

  // Get the last variable name for return
  const lastVar = processedNodes.size > 0 
    ? Array.from(processedNodes.values()).pop() 
    : 'x';

  // Determine input example based on Input layer's type
  let inputExample = `torch.randn(1, ${networkInputSize})  # Example: (batch, features)`;
  
  if (inputType === 'flat') {
    inputExample = `torch.randn(1, ${inputConfig.inputSize || 784})  # Example: (batch, features)`;
  } else if (inputType === 'image') {
    const c = inputConfig.channels || 3;
    const h = inputConfig.height || 224;
    const w = inputConfig.width || 224;
    inputExample = `torch.randn(1, ${c}, ${h}, ${w})  # Example: (batch, channels, height, width)`;
  } else if (inputType === 'sequence') {
    const seqLen = inputConfig.seqLength || 32;
    const feat = inputConfig.features || 256;
    inputExample = `torch.randn(1, ${seqLen}, ${feat})  # Example: (batch, seq_len, features)`;
  }
  
  // Override based on first non-input layer if needed
  const firstNonInput = sortedNodes.find(n => n.data.layerType !== 'Input');
  if (firstNonInput) {
    const config = firstNonInput.data.config || {};
    if (firstNonInput.data.layerType === 'Embedding') {
      const vocabSize = config.vocabSize || 10000;
      const seqLen = inputConfig.seqLength || 32;
      inputExample = `torch.randint(0, ${vocabSize}, (1, ${seqLen}))  # Example: (batch, seq_len) token IDs`;
    } else if (firstNonInput.data.layerType === 'Conv2D' && inputType !== 'image') {
      // If Conv2D is first but input is not image type, use Conv2D's inChannels
      inputExample = `torch.randn(1, ${config.inChannels || 1}, 28, 28)  # Example: (batch, channels, height, width)`;
    }
  }

  const code = `import torch
import torch.nn as nn
import torch.nn.functional as F

class NeuralNetwork(nn.Module):
    """
    Neural Network generated by NeuralFlows
    Architecture: ${sortedNodes.map(n => n.data.label || n.data.layerType).join(' → ')}
    """
    def __init__(self):
        super(NeuralNetwork, self).__init__()
        ${layerDefs.length > 0 ? layerDefs.join('\n        ') : '# Add layers to your network'}
    
    def forward(self, x):
        ${forwardSteps.length > 0 ? forwardSteps.join('\n        ') : '# Define forward pass'}
        return ${lastVar}


# Example usage:
if __name__ == "__main__":
    # Initialize model
    model = NeuralNetwork()
    print(model)
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Total parameters: {total_params:,}")
    print(f"Trainable parameters: {trainable_params:,}")
    
    # Example input
    ${inputExample}
    x = ${inputExample.split('  #')[0]}
    
    # Forward pass
    output = model(x)
    print(f"Input shape: {x.shape}")
    print(f"Output shape: {output.shape}")
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

// TensorFlow/Keras Code Generator
export const generateKerasCode = (nodes, edges) => {
  if (!nodes || nodes.length === 0) {
    return `# No layers defined yet
# Drag layers from the sidebar to build your network
`;
  }

  // Sort nodes by position
  const sortedNodes = [...nodes].sort((a, b) => {
    const yDiff = a.position.y - b.position.y;
    if (Math.abs(yDiff) > 50) return yDiff;
    return a.position.x - b.position.x;
  });

  // Find input layer configuration
  const inputLayerNode = sortedNodes.find(n => n.data.layerType === 'Input');
  const inputConfig = inputLayerNode?.data?.config || {};
  const inputType = inputConfig.inputType || 'flat';

  // Track required custom layers
  let needsPositionalEncoding = false;
  let needsTransformerEncoder = false;
  let needsTransformerDecoder = false;

  // Generate layer code
  const layerLines = [];
  
  sortedNodes.forEach((node, idx) => {
    const config = node.data.config || {};
    const label = node.data.label || node.data.layerType;
    
    switch (node.data.layerType) {
      case 'Input':
        // Input layer handled separately
        break;

      case 'Dense':
        const units = config.units || 128;
        const activation = config.activation && config.activation !== 'none' ? `'${config.activation}'` : 'None';
        layerLines.push(`    layers.Dense(${units}, activation=${activation}, name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'Conv2D':
        const filters = config.outChannels || 32;
        const kernelSize = config.kernelSize || 3;
        const convActivation = config.activation && config.activation !== 'none' ? `'${config.activation}'` : 'None';
        const padding = config.padding === 1 ? "'same'" : "'valid'";
        layerLines.push(`    layers.Conv2D(${filters}, ${kernelSize}, padding=${padding}, activation=${convActivation}, name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'MaxPool2D':
        layerLines.push(`    layers.MaxPooling2D(pool_size=(${config.kernelSize || 2}, ${config.kernelSize || 2}), strides=(${config.stride || 2}, ${config.stride || 2}), name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'Dropout':
        layerLines.push(`    layers.Dropout(${config.rate || 0.5}, name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'Flatten':
        layerLines.push(`    layers.Flatten(name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'GlobalAvgPool1D':
        layerLines.push(`    layers.GlobalAveragePooling1D(name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'Embedding':
        const vocabSize = config.vocabSize || 10000;
        const embedDim = config.embedDim || 256;
        layerLines.push(`    layers.Embedding(${vocabSize}, ${embedDim}, name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'BatchNorm1D':
      case 'BatchNorm2D':
        layerLines.push(`    layers.BatchNormalization(name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'LayerNorm':
        layerLines.push(`    layers.LayerNormalization(name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'LSTM':
        const lstmUnits = config.hiddenSize || 128;
        const returnSeq = idx < sortedNodes.length - 2 ? 'True' : 'False'; // Return sequences if not near end
        const bidir = config.bidirectional;
        if (bidir) {
          layerLines.push(`    layers.Bidirectional(layers.LSTM(${lstmUnits}, return_sequences=${returnSeq}), name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        } else {
          layerLines.push(`    layers.LSTM(${lstmUnits}, return_sequences=${returnSeq}, name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        }
        break;

      case 'GRU':
        const gruUnits = config.hiddenSize || 128;
        const gruReturnSeq = idx < sortedNodes.length - 2 ? 'True' : 'False';
        layerLines.push(`    layers.GRU(${gruUnits}, return_sequences=${gruReturnSeq}, name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'MultiHeadAttention':
        const numHeads = config.numHeads || 8;
        const keyDim = Math.floor((config.embedDim || 256) / numHeads);
        layerLines.push(`    # Multi-Head Attention - requires functional API for proper usage`);
        layerLines.push(`    layers.MultiHeadAttention(num_heads=${numHeads}, key_dim=${keyDim}, name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'PositionalEncoding':
        needsPositionalEncoding = true;
        const peMaxLen = config.maxLen || 512;
        const peDModel = config.dModel || 256;
        const peDropout = config.dropout || 0.1;
        layerLines.push(`    PositionalEncoding(max_len=${peMaxLen}, d_model=${peDModel}, dropout=${peDropout}, name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'TransformerEncoder':
        needsTransformerEncoder = true;
        const encDModel = config.dModel || 256;
        const encNHead = config.nHead || 8;
        const encDimFF = config.dimFeedforward || 1024;
        const encNumLayers = config.numLayers || 2;
        layerLines.push(`    TransformerEncoderBlock(d_model=${encDModel}, num_heads=${encNHead}, ff_dim=${encDimFF}, num_layers=${encNumLayers}, name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'TransformerDecoder':
        needsTransformerDecoder = true;
        const decDModel = config.dModel || 256;
        const decNHead = config.nHead || 8;
        const decDimFF = config.dimFeedforward || 1024;
        const decNumLayers = config.numLayers || 2;
        layerLines.push(`    # TransformerDecoder - requires functional API with encoder output`);
        layerLines.push(`    TransformerDecoderBlock(d_model=${decDModel}, num_heads=${decNHead}, ff_dim=${decDimFF}, num_layers=${decNumLayers}, name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'Output':
        const numClasses = config.numClasses || 10;
        let outputActivation = 'None';
        if (config.activation === 'softmax') {
          outputActivation = "'softmax'";
        } else if (config.activation === 'sigmoid') {
          outputActivation = "'sigmoid'";
        }
        layerLines.push(`    layers.Dense(${numClasses}, activation=${outputActivation}, name='output'),`);
        break;

      case 'Add':
        layerLines.push(`    # Add (Skip Connection) - requires Functional API`);
        layerLines.push(`    # In functional API: output = layers.Add()([input1, input2])`);
        layerLines.push(`    layers.Add(name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      case 'Concatenate':
        const concatAxis = config.axis !== undefined ? config.axis : -1;
        layerLines.push(`    # Concatenate - requires Functional API`);
        layerLines.push(`    # In functional API: output = layers.Concatenate(axis=${concatAxis})([input1, input2])`);
        layerLines.push(`    layers.Concatenate(axis=${concatAxis}, name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        break;

      default:
        // Handle custom labeled layers
        if (label.toLowerCase().includes('encoder') || label.toLowerCase().includes('decoder') || label.toLowerCase().includes('latent')) {
          const customUnits = config.units || 128;
          const customActivation = config.activation && config.activation !== 'none' ? `'${config.activation}'` : "'relu'";
          layerLines.push(`    layers.Dense(${customUnits}, activation=${customActivation}, name='${label.replace(/[^a-zA-Z0-9_]/g, '_')}'),`);
        }
    }
  });

  // Generate input shape based on Input layer type
  let inputShapeStr = '(784,)';
  let inputExample = 'np.random.randn(1, 784).astype(np.float32)';
  
  if (inputType === 'flat') {
    const size = inputConfig.inputSize || 784;
    inputShapeStr = `(${size},)`;
    inputExample = `np.random.randn(1, ${size}).astype(np.float32)`;
  } else if (inputType === 'image') {
    const h = inputConfig.height || 224;
    const w = inputConfig.width || 224;
    const c = inputConfig.channels || 3;
    inputShapeStr = `(${h}, ${w}, ${c})`;
    inputExample = `np.random.randn(1, ${h}, ${w}, ${c}).astype(np.float32)`;
  } else if (inputType === 'sequence') {
    const seqLen = inputConfig.seqLength || 32;
    const feat = inputConfig.features || 256;
    inputShapeStr = `(${seqLen}, ${feat})`;
    inputExample = `np.random.randn(1, ${seqLen}, ${feat}).astype(np.float32)`;
  } else if (inputType === 'text') {
    const seqLen = inputConfig.seqLength || 128;
    const vocabSize = inputConfig.vocabSize || 30000;
    inputShapeStr = `(${seqLen},)`;
    inputExample = `np.random.randint(0, ${vocabSize}, (1, ${seqLen}))`;
  }

  // Check if first layer is Embedding
  const firstNonInput = sortedNodes.find(n => n.data.layerType !== 'Input');
  if (firstNonInput?.data?.layerType === 'Embedding') {
    const seqLen = inputConfig.seqLength || 128;
    const vocabSize = firstNonInput.data.config?.vocabSize || 10000;
    inputShapeStr = `(${seqLen},)`;
    inputExample = `np.random.randint(0, ${vocabSize}, (1, ${seqLen}))`;
  }

  // Build custom layers code
  let customLayers = '';
  
  if (needsPositionalEncoding) {
    customLayers += `
# Custom Positional Encoding Layer
class PositionalEncoding(layers.Layer):
    """Adds positional information to embeddings."""
    def __init__(self, max_len=512, d_model=256, dropout=0.1, **kwargs):
        super().__init__(**kwargs)
        self.max_len = max_len
        self.d_model = d_model
        self.dropout_rate = dropout
        self.pos_embedding = layers.Embedding(max_len, d_model)
        self.dropout = layers.Dropout(dropout)
    
    def call(self, x, training=False):
        seq_len = tf.shape(x)[1]
        positions = tf.range(seq_len)
        pos_enc = self.pos_embedding(positions)
        return self.dropout(x + pos_enc, training=training)
    
    def get_config(self):
        config = super().get_config()
        config.update({"max_len": self.max_len, "d_model": self.d_model, "dropout": self.dropout_rate})
        return config

`;
  }

  if (needsTransformerEncoder) {
    customLayers += `
# Custom Transformer Encoder Block
class TransformerEncoderBlock(layers.Layer):
    """Transformer Encoder with N stacked layers, each with Multi-Head Attention + FFN + residual connections."""
    def __init__(self, d_model=256, num_heads=8, ff_dim=1024, num_layers=2, dropout=0.1, **kwargs):
        super().__init__(**kwargs)
        self.d_model = d_model
        self.num_heads = num_heads
        self.ff_dim = ff_dim
        self.num_layers = num_layers
        self.dropout_rate = dropout
        
        self.attention_layers = []
        self.ffn_layers = []
        self.layernorm1 = []
        self.layernorm2 = []
        self.dropout1 = []
        self.dropout2 = []
        
        for _ in range(num_layers):
            self.attention_layers.append(layers.MultiHeadAttention(num_heads=num_heads, key_dim=d_model // num_heads))
            self.ffn_layers.append(tf.keras.Sequential([
                layers.Dense(ff_dim, activation='relu'),
                layers.Dense(d_model)
            ]))
            self.layernorm1.append(layers.LayerNormalization())
            self.layernorm2.append(layers.LayerNormalization())
            self.dropout1.append(layers.Dropout(dropout))
            self.dropout2.append(layers.Dropout(dropout))
    
    def call(self, x, training=False):
        for i in range(self.num_layers):
            # Self-attention with residual
            attn_output = self.attention_layers[i](x, x)
            attn_output = self.dropout1[i](attn_output, training=training)
            x = self.layernorm1[i](x + attn_output)
            
            # Feed-forward with residual
            ffn_output = self.ffn_layers[i](x)
            ffn_output = self.dropout2[i](ffn_output, training=training)
            x = self.layernorm2[i](x + ffn_output)
        return x
    
    def get_config(self):
        config = super().get_config()
        config.update({
            "d_model": self.d_model, "num_heads": self.num_heads,
            "ff_dim": self.ff_dim, "num_layers": self.num_layers, "dropout": self.dropout_rate
        })
        return config

`;
  }

  if (needsTransformerDecoder) {
    customLayers += `
# Custom Transformer Decoder Block
class TransformerDecoderBlock(layers.Layer):
    """Transformer Decoder with Masked Self-Attention + Cross-Attention + FFN."""
    def __init__(self, d_model=256, num_heads=8, ff_dim=1024, num_layers=2, dropout=0.1, **kwargs):
        super().__init__(**kwargs)
        self.d_model = d_model
        self.num_heads = num_heads
        self.ff_dim = ff_dim
        self.num_layers = num_layers
        self.dropout_rate = dropout
        
        self.self_attention = []
        self.cross_attention = []
        self.ffn_layers = []
        self.layernorm1, self.layernorm2, self.layernorm3 = [], [], []
        self.dropout1, self.dropout2, self.dropout3 = [], [], []
        
        for _ in range(num_layers):
            self.self_attention.append(layers.MultiHeadAttention(num_heads=num_heads, key_dim=d_model // num_heads))
            self.cross_attention.append(layers.MultiHeadAttention(num_heads=num_heads, key_dim=d_model // num_heads))
            self.ffn_layers.append(tf.keras.Sequential([layers.Dense(ff_dim, activation='relu'), layers.Dense(d_model)]))
            self.layernorm1.append(layers.LayerNormalization())
            self.layernorm2.append(layers.LayerNormalization())
            self.layernorm3.append(layers.LayerNormalization())
            self.dropout1.append(layers.Dropout(dropout))
            self.dropout2.append(layers.Dropout(dropout))
            self.dropout3.append(layers.Dropout(dropout))
    
    def call(self, x, encoder_output=None, training=False):
        if encoder_output is None:
            encoder_output = x  # Self-attention only mode
        for i in range(self.num_layers):
            # Masked self-attention
            attn1 = self.self_attention[i](x, x, use_causal_mask=True)
            x = self.layernorm1[i](x + self.dropout1[i](attn1, training=training))
            # Cross-attention
            attn2 = self.cross_attention[i](x, encoder_output)
            x = self.layernorm2[i](x + self.dropout2[i](attn2, training=training))
            # FFN
            ffn = self.ffn_layers[i](x)
            x = self.layernorm3[i](x + self.dropout3[i](ffn, training=training))
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


# Example usage:
if __name__ == "__main__":
    # Create model
    model = create_model()
    
    # Compile model
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',  # Change based on your task
        metrics=['accuracy']
    )
    
    # Model summary
    model.summary()
    
    # Example input
    x = ${inputExample}
    
    # Forward pass
    output = model(x)
    print(f"Input shape: {x.shape}")
    print(f"Output shape: {output.shape}")
`;

  return code;
};
