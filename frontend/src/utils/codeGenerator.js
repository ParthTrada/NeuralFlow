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
        const inSize = config.inputSize || 784;
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
      
      // Find input for this layer
      const incomingEdge = edges.find(e => e.target === node.id);
      let inputVar = 'x';
      if (incomingEdge && processedNodes.has(incomingEdge.source)) {
        inputVar = processedNodes.get(incomingEdge.source);
      }
      
      forwardSteps.push(forwardCode.replace(/{{input}}/g, inputVar));
      processedNodes.set(node.id, varName);
      layerIndex++;
    }
  });

  // Get the last variable name for return
  const lastVar = processedNodes.size > 0 
    ? Array.from(processedNodes.values()).pop() 
    : 'x';

  // Determine input example based on first layer
  let inputExample = 'torch.randn(1, 784)  # Example: flattened 28x28 image';
  const firstNonInput = sortedNodes.find(n => n.data.layerType !== 'Input');
  if (firstNonInput) {
    const config = firstNonInput.data.config || {};
    if (firstNonInput.data.layerType === 'Embedding') {
      inputExample = 'torch.randint(0, 1000, (1, 32))  # Example: batch of token IDs (batch_size, seq_len)';
    } else if (firstNonInput.data.layerType === 'Conv2D') {
      inputExample = `torch.randn(1, ${config.inChannels || 1}, 28, 28)  # Example: (batch, channels, height, width)`;
    } else if (firstNonInput.data.layerType === 'LSTM' || firstNonInput.data.layerType === 'GRU') {
      inputExample = `torch.randn(1, 32, ${config.inputSize || 256})  # Example: (batch, seq_len, features)`;
    } else if (firstNonInput.data.layerType === 'TransformerEncoder' || firstNonInput.data.layerType === 'MultiHeadAttention') {
      inputExample = `torch.randn(1, 32, ${config.dModel || config.embedDim || 256})  # Example: (batch, seq_len, d_model)`;
    } else if (firstNonInput.data.layerType === 'Dense') {
      inputExample = `torch.randn(1, ${config.inputSize || 784})  # Example: (batch, features)`;
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
