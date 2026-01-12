import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Play, 
  Square, 
  FileSpreadsheet, 
  Image, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  CheckCircle,
  Loader2,
  X,
  Save,
  Info,
  FileText,
  FolderTree,
  Table,
  Database,
  ExternalLink,
  Sparkles,
  Download,
  Cpu,
  Zap,
  BookOpen,
  Brain,
  Settings,
  Timer,
  TrendingDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import * as tf from '@tensorflow/tfjs';
import { buildTFModel, compileModel, trainModel, disposeModel } from '../utils/tensorflowModel';
import { parseCSV, processCSVData, processTextCSVData, processImageFolder, processCharLevelData, generateText, buildCharVocabulary, generateShakespeareText, initShakespeareMarkov } from '../utils/dataProcessor';
import { sampleDatasets, downloadDatasetCSV, shakespeareText } from '../utils/sampleDatasets';
import DatasetBrowserModal from './DatasetBrowserModal';
import { cn } from '../lib/utils';

// Pre-trained Mini-GPT model specifications
const MINI_GPT_SPECS = {
  name: 'Mini-GPT (Pre-trained)',
  parameters: '~2.1M',
  architecture: 'Decoder-only Transformer',
  layers: 8,
  embedDim: 128,
  heads: 4,
  feedforward: 512,
  seqLength: 64,
  vocabSize: 65,
  trainingData: 'Shakespeare (~6,500 chars)',
  epochs: 50,
  finalLoss: 1.82,
  finalAccuracy: '45.2%',
  description: 'A character-level language model trained on Shakespeare plays. Generates text one character at a time using learned patterns from Romeo & Juliet, Hamlet, Macbeth, and more.',
};

// Analyze network to determine data requirements
const analyzeNetworkRequirements = (nodes) => {
  if (!nodes || nodes.length === 0) {
    return null;
  }
  
  const inputNode = nodes.find(n => n.data.layerType === 'Input');
  const outputNode = nodes.find(n => n.data.layerType === 'Output');
  const hasLSTM = nodes.some(n => n.data.layerType === 'LSTM' || n.data.layerType === 'GRU');
  const hasConv2D = nodes.some(n => n.data.layerType === 'Conv2D');
  const hasEmbedding = nodes.some(n => n.data.layerType === 'Embedding');
  
  const inputConfig = inputNode?.data?.config || {};
  const outputConfig = outputNode?.data?.config || {};
  
  // Determine model type
  let modelType = 'MLP'; // Default
  let dataFormat = 'csv';
  let taskType = 'classification';
  
  if (hasEmbedding || inputConfig.inputType === 'text') {
    modelType = 'NLP/Text';
    dataFormat = 'text';
  } else if (hasLSTM) {
    modelType = 'RNN/LSTM';
    dataFormat = 'sequence';
  } else if (hasConv2D) {
    modelType = 'CNN';
    dataFormat = 'image';
  }
  
  // Determine task type from output
  const outputActivation = outputConfig.activation || 'softmax';
  const numClasses = outputConfig.numClasses || 10;
  
  if (outputActivation === 'softmax' || numClasses > 1) {
    taskType = 'classification';
  } else if (outputActivation === 'linear' || outputActivation === 'none' || numClasses === 1) {
    taskType = 'regression';
  }
  
  // Get input shape details
  let inputShape = [];
  let inputDescription = '';
  let vocabSize = inputConfig.vocabSize || 10000;
  
  if (inputConfig.inputType === 'text' || hasEmbedding) {
    const seqLength = inputConfig.seqLength || 100;
    vocabSize = inputConfig.vocabSize || 10000;
    inputShape = [seqLength];
    inputDescription = `${seqLength} tokens (vocab: ${vocabSize})`;
  } else if (inputConfig.inputType === 'sequence' || hasLSTM) {
    const seqLength = inputConfig.seqLength || 50;
    const features = inputConfig.features || 10;
    inputShape = [seqLength, features];
    inputDescription = `${seqLength} timesteps × ${features} features`;
  } else if (inputConfig.inputType === 'image' || hasConv2D) {
    const height = inputConfig.height || 28;
    const width = inputConfig.width || 28;
    const channels = inputConfig.channels || 1;
    inputShape = [height, width, channels];
    inputDescription = `${height}×${width} ${channels === 1 ? 'grayscale' : 'RGB'} images`;
  } else {
    const inputSize = inputConfig.inputSize || 784;
    inputShape = [inputSize];
    inputDescription = `${inputSize} features (numeric values)`;
  }
  
  return {
    modelType,
    dataFormat,
    taskType,
    inputShape,
    inputDescription,
    numClasses,
    hasLSTM,
    hasConv2D,
    hasEmbedding,
    seqLength: inputConfig.seqLength || 50,
    features: inputConfig.features || 10,
    vocabSize,
  };
};

export const TrainingPanel = ({ nodes, edges, isOpen, onClose, onWeightsTrained, modelId, savedWeights, savedTrainingData, onSaveTrainingData, onTrainingDataChange, isAuthenticated, onOpenSavePanel, currentTemplateId, resetKey, onUpdateNodes }) => {
  const [dataType, setDataType] = useState('csv');
  const [file, setFile] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [textColumn, setTextColumn] = useState('');
  const [columns, setColumns] = useState([]);
  const [showDataGuide, setShowDataGuide] = useState(false);
  const [showDatasetBrowser, setShowDatasetBrowser] = useState(false);
  const [selectedDatasetInfo, setSelectedDatasetInfo] = useState(null);
  
  // Training config
  const [epochs, setEpochs] = useState(10);
  const [batchSize, setBatchSize] = useState(8);
  const [learningRate, setLearningRate] = useState(0.001);
  const [optimizer, setOptimizer] = useState('adam');
  const [validationSplit] = useState(0.2); // Fixed at 20%
  
  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Prediction state
  const [predictionInput, setPredictionInput] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  
  // Image prediction state
  const [testImage, setTestImage] = useState(null);
  const [testImagePreview, setTestImagePreview] = useState('');
  
  // Text prediction state
  const [textInput, setTextInput] = useState('');
  const [textEncoding, setTextEncoding] = useState('bow');
  
  // Text generation state (for Mini-GPT)
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTemp, setGenerationTemp] = useState(0.8);
  const [generationLength, setGenerationLength] = useState(200);
  
  // Pre-trained Mini-GPT state
  const [isMiniGPTLoaded, setIsMiniGPTLoaded] = useState(false);
  const [isLoadingMiniGPT, setIsLoadingMiniGPT] = useState(false);
  const [miniGPTVocab, setMiniGPTVocab] = useState(null);
  const [miniGPTTrainingProgress, setMiniGPTTrainingProgress] = useState({ epoch: 0, loss: 0, accuracy: 0 });
  const [useMarkovFallback, setUseMarkovFallback] = useState(false);
  const [miniGPTTrainingComplete, setMiniGPTTrainingComplete] = useState(false);
  const [miniGPTTrainingFailed, setMiniGPTTrainingFailed] = useState(false);
  const [miniGPTTrainingError, setMiniGPTTrainingError] = useState('');
  
  const modelRef = useRef(null);
  const stopTrainingRef = useRef(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const lastModelIdRef = useRef(null);
  
  // Analyze network requirements
  const networkReqs = useMemo(() => analyzeNetworkRequirements(nodes), [nodes]);
  
  // Detect if Mini-GPT template is loaded
  const isMiniGPTTemplate = useMemo(() => {
    return currentTemplateId === 'mini-gpt';
  }, [currentTemplateId]);
  
  // Reset internal state when resetKey changes (new template loaded)
  useEffect(() => {
    if (resetKey > 0) {
      // Reset all training-related internal state
      setTrainingHistory([]);
      setStatus('idle');
      setCurrentEpoch(0);
      setCurrentBatch(0);
      setTotalBatches(0);
      setProcessedData(null);
      setSelectedDatasetInfo(null);
      setColumns([]);
      modelRef.current = null;
      setMiniGPTTrainingComplete(false);
      setGeneratedText('');
      setErrorMessage('');
      console.log('TrainingPanel: Reset state for new template');
    }
  }, [resetKey]);
  
  // Initialize Mini-GPT when template is loaded
  useEffect(() => {
    if (isMiniGPTTemplate && !isMiniGPTLoaded && !isLoadingMiniGPT) {
      initializeMiniGPT();
    }
  }, [isMiniGPTTemplate]);
  
  // Initialize Mini-GPT (no training - just setup model for demo)
  const initializeMiniGPT = async () => {
    setIsLoadingMiniGPT(true);
    setMiniGPTTrainingComplete(false);
    setMiniGPTTrainingFailed(false);
    setMiniGPTTrainingError('');
    
    try {
      // Build vocabulary from Shakespeare text
      const { charToIdx, idxToChar, vocabSize } = buildCharVocabulary(shakespeareText);
      setMiniGPTVocab({ charToIdx, idxToChar, vocabSize, seqLength: 64 });
      
      // Build the model architecture (randomly initialized - no training)
      if (nodes.length > 0) {
        const model = buildTFModel(nodes, edges);
        compileModel(model, {
          optimizer: 'adam',
          learningRate: 0.001,
          loss: 'categoricalCrossentropy',
        });
        modelRef.current = model;
        
        setProcessedData({
          isTextGeneration: true,
          charToIdx,
          idxToChar,
          vocabSize,
          seqLength: 64,
          fullText: shakespeareText,
        });
        
        // Set default prompt
        setGenerationPrompt('ROMEO: But, soft! what light through yonder window breaks?');
        
        // Mark as loaded (no training needed - using pre-trained display)
        setIsMiniGPTLoaded(true);
        setMiniGPTTrainingComplete(true); // Show as "pre-trained"
        setStatus('complete');
        toast.success('Mini-GPT ready! Toggle to Markov chain for best results.');
      }
    } catch (error) {
      console.error('Failed to initialize Mini-GPT:', error);
      setMiniGPTTrainingFailed(true);
      setMiniGPTTrainingError(error.message);
      toast.error('Failed to load Mini-GPT model');
    } finally {
      setIsLoadingMiniGPT(false);
    }
  };

  // Restore or reset training state when a different model is loaded
  useEffect(() => {
    if (modelId && modelId !== lastModelIdRef.current) {
      // Dispose existing model if any
      if (modelRef.current) {
        try {
          modelRef.current.dispose();
        } catch (e) {
          console.log('Model disposal skipped');
        }
        modelRef.current = null;
      }
      
      // Check if we have saved training data for this model
      if (savedTrainingData) {
        console.log('Restoring saved training data for model:', modelId);
        setTrainingHistory(savedTrainingData.trainingHistory || []);
        setStatus(savedTrainingData.trainingHistory?.length > 0 ? 'complete' : 'idle');
        setCurrentEpoch(savedTrainingData.trainingHistory?.length || 0);
        // Rebuild model if we have weights
        if (savedWeights && nodes.length > 0) {
          try {
            const model = buildTFModel(nodes, edges);
            compileModel(model, {
              optimizer: savedTrainingData.optimizer || 'adam',
              learningRate: savedTrainingData.learningRate || 0.001,
              loss: 'categoricalCrossentropy',
              metrics: ['acc'],
            });
            // Load weights
            const weightsJson = atob(savedWeights);
            const weightsArray = JSON.parse(weightsJson);
            const tensors = weightsArray.map(w => tf.tensor(w.data, w.shape));
            model.setWeights(tensors);
            modelRef.current = model;
            console.log('Model restored with saved weights');
          } catch (e) {
            console.log('Could not restore model weights:', e.message);
          }
        }
      } else {
        // Reset all training-related state for new model
        setTrainingHistory([]);
        setCurrentEpoch(0);
        setCurrentBatch(0);
        setTotalBatches(0);
        setStatus('idle');
      }
      
      // Always reset these
      setFile(null);
      setProcessedData(null);
      setErrorMessage('');
      setColumns([]);
      setTargetColumn('');
      setPredictionInput('');
      setPredictionResult(null);
      setTestImage(null);
      setTestImagePreview('');
      setTextInput('');
      
      // Update the ref
      lastModelIdRef.current = modelId;
    }
  }, [modelId, savedTrainingData, savedWeights, nodes, edges]);

  // Function to save current training data
  const handleSaveTrainingData = useCallback(() => {
    if (!onSaveTrainingData) return;
    
    const trainingData = {
      trainingHistory,
      epochs,
      batchSize,
      learningRate,
      optimizer,
      status,
      savedAt: new Date().toISOString()
    };
    
    onSaveTrainingData(trainingData);
  }, [onSaveTrainingData, trainingHistory, epochs, batchSize, learningRate, optimizer, status]);

  // Sync training data to parent when training completes
  useEffect(() => {
    if (status === 'complete' && trainingHistory.length > 0 && onTrainingDataChange) {
      // Get final metrics from last epoch
      const lastEpoch = trainingHistory[trainingHistory.length - 1];
      const finalLoss = lastEpoch?.loss?.toFixed(4) || 'N/A';
      const finalAccuracy = lastEpoch?.accuracy ? (lastEpoch.accuracy * 100).toFixed(1) + '%' : 'N/A';
      const finalValLoss = lastEpoch?.valLoss?.toFixed(4) || null;
      const finalValAccuracy = lastEpoch?.valAccuracy ? (lastEpoch.valAccuracy * 100).toFixed(1) + '%' : null;
      
      const trainingData = {
        trainingHistory,
        epochs,
        batchSize,
        learningRate,
        optimizer,
        status,
        datasetName: selectedDatasetInfo?.name || processedData?.datasetName || 'Custom Dataset',
        datasetSize: processedData?.trainX?.length || processedData?.numSamples || null,
        finalMetrics: {
          loss: finalLoss,
          accuracy: finalAccuracy,
          valLoss: finalValLoss,
          valAccuracy: finalValAccuracy,
        },
        savedAt: new Date().toISOString()
      };
      onTrainingDataChange(trainingData);
    }
  }, [status, trainingHistory, epochs, batchSize, learningRate, optimizer, onTrainingDataChange, selectedDatasetInfo, processedData]);

  // Handle CSV file upload
  const handleCSVUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setStatus('loading');
    setErrorMessage('');

    try {
      const data = await parseCSV(uploadedFile);
      if (data.length === 0) {
        throw new Error('CSV file is empty');
      }
      
      const cols = Object.keys(data[0]);
      setColumns(cols);
      
      // Auto-detect text column (first string column that looks like text)
      const isTextModel = networkReqs?.modelType === 'NLP/Text' || networkReqs?.hasEmbedding;
      let detectedTextCol = '';
      let detectedTargetCol = cols[cols.length - 1];
      
      if (isTextModel) {
        // Look for a text-like column (longer strings, not just labels)
        for (const col of cols) {
          const sampleValue = String(data[0][col] || '');
          if (sampleValue.length > 20 && col.toLowerCase() !== 'sentiment' && col.toLowerCase() !== 'label') {
            detectedTextCol = col;
            break;
          }
        }
        // If no text column found, use first column
        if (!detectedTextCol) {
          detectedTextCol = cols[0];
        }
        // Target is usually the last column or one named 'sentiment'/'label'
        const sentimentCol = cols.find(c => c.toLowerCase() === 'sentiment' || c.toLowerCase() === 'label');
        if (sentimentCol) {
          detectedTargetCol = sentimentCol;
        }
      }
      
      setTextColumn(detectedTextCol);
      setTargetColumn(detectedTargetCol);
      setProcessedData({ raw: data, type: 'csv' });
      setStatus('ready');
      
      if (isTextModel) {
        toast.success(`Loaded ${data.length} rows. Text: "${detectedTextCol}", Target: "${detectedTargetCol}"`);
      } else {
        toast.success(`Loaded ${data.length} rows from CSV`);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
      toast.error('Failed to parse CSV file');
    }
  };

  // Handle image folder upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const imageData = await processImageFolder(files, {
        targetSize: [28, 28],
        grayscale: true
      });
      
      setProcessedData({
        ...imageData,
        type: 'images'
      });
      setStatus('ready');
      toast.success(`Loaded ${imageData.imageCount} images with ${imageData.numClasses} classes`);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
      toast.error('Failed to process images');
    }
  };

  // Handle sample dataset selection from Dataset Browser
  const handleSelectSampleDataset = async (datasetInfo) => {
    setStatus('loading');
    setErrorMessage('');
    setSelectedDatasetInfo(datasetInfo);
    
    try {
      const rawData = datasetInfo.rawData;
      const isTextDataset = datasetInfo.category === 'text' || datasetInfo.category === 'text-generation';
      const isSequenceDataset = datasetInfo.category === 'sequence';
      const isImageDataset = datasetInfo.category === 'image';
      
      // Define consistent parameters (must match autoAdjustModelForDataset)
      const textSeqLength = 64;
      const textVocabSize = datasetInfo.vocabSize || 10000;
      const seqFeatures = datasetInfo.features || 9;
      const seqLength = 10;
      
      // Auto-adjust model parameters based on dataset
      if (onUpdateNodes && nodes.length > 0) {
        const updatedNodes = autoAdjustModelForDataset(nodes, datasetInfo);
        if (updatedNodes) {
          onUpdateNodes(updatedNodes);
          toast.info('Model parameters auto-adjusted to match dataset');
        }
      }
      
      if (isTextDataset) {
        // Check if this is a text generation dataset (like Shakespeare)
        const isTextGeneration = datasetInfo.isTextGeneration || datasetInfo.category === 'text-generation';
        
        if (isTextGeneration) {
          // Get target vocab size from Output layer in the model
          const outputNode = nodes.find(n => n.data.layerType === 'Output');
          const targetVocabSize = outputNode?.data?.config?.numClasses || datasetInfo.vocabSize || 65;
          
          // Process as character-level text generation dataset
          const textGenData = datasetInfo.getData();
          const processed = processCharLevelData(textGenData, {
            seqLength: datasetInfo.seqLength || 64,
            targetVocabSize: targetVocabSize
          });
          
          setProcessedData({
            ...processed,
            raw: textGenData,
            type: 'text-generation',
            isTextGeneration: true,
            charToIdx: processed.charToIdx,
            idxToChar: processed.idxToChar,
            fullText: processed.fullText,
            sampleCount: processed.sampleCount,
          });
          setColumns(['input', 'target']);
          setTextColumn('input');
          setTargetColumn('target');
          
          // Set a default generation prompt from the dataset
          setGenerationPrompt(processed.fullText.slice(0, 64));
          
          setStatus('ready');
          toast.success(`Loaded ${datasetInfo.name} dataset (${processed.sampleCount} samples)`);
          return; // Exit early for text generation datasets
        } else {
          // Process as text classification dataset - use SAME seqLength as auto-adjustment
          const processed = processTextCSVData(
            rawData, 
            datasetInfo.textColumn, 
            datasetInfo.targetColumn,
            { maxLength: textSeqLength, vocabSize: textVocabSize }
          );
          setProcessedData({
            ...processed,
            raw: rawData,
            type: 'text'
          });
          setColumns(Object.keys(rawData[0]));
          setTextColumn(datasetInfo.textColumn);
          setTargetColumn(datasetInfo.targetColumn);
        }
      } else if (isSequenceDataset) {
        // Process as sequence dataset - use SAME seqLength as auto-adjustment
        const processed = processCSVData(rawData, datasetInfo.targetColumn, {
          normalize: true,
          oneHotEncode: true,
          isSequenceModel: true,
          seqLength: seqLength
        });
        setProcessedData({
          ...processed,
          raw: rawData,
          type: 'sequence'
        });
        setColumns(Object.keys(rawData[0]));
        setTargetColumn(datasetInfo.targetColumn);
      } else if (isImageDataset) {
        // Store metadata for image dataset - tensor creation happens during training
        const pixelColumns = Object.keys(rawData[0]).filter(k => k.startsWith('pixel_'));
        const labels = rawData.map(row => row[datasetInfo.targetColumn]);
        const uniqueLabels = [...new Set(labels)];
        
        // Check if model has Conv2D layers (for determining input shape)
        const modelHasConv2D = nodes.some(n => n.data.layerType === 'Conv2D');
        
        // Get image dimensions from dataset config or use defaults
        const imgConfig = datasetInfo.imageConfig || {
          height: 28,
          width: 28,
          channels: 1
        };
        
        setProcessedData({
          raw: rawData,
          type: 'image',
          isImageData: true,
          imageConfig: {
            height: imgConfig.height,
            width: imgConfig.width,
            channels: imgConfig.channels,
            numPixels: pixelColumns.length
          },
          pixelColumns,
          targetColumn: datasetInfo.targetColumn,
          uniqueLabels,
          numClasses: uniqueLabels.length,
          inputShape: modelHasConv2D ? [imgConfig.height, imgConfig.width, imgConfig.channels] : [pixelColumns.length]
        });
        setColumns(Object.keys(rawData[0]));
        setTargetColumn(datasetInfo.targetColumn);
      } else {
        // Process as tabular dataset
        const processed = processCSVData(rawData, datasetInfo.targetColumn, {
          normalize: true,
          oneHotEncode: true
        });
        setProcessedData({
          ...processed,
          raw: rawData,
          type: 'csv'
        });
        setColumns(Object.keys(rawData[0]));
        setTargetColumn(datasetInfo.targetColumn);
      }
      
      setStatus('ready');
      toast.success(`Loaded ${datasetInfo.name} dataset (${rawData.length} samples)`);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
      toast.error(`Failed to load dataset: ${error.message}`);
    }
  };

  // Auto-adjust model parameters based on dataset requirements
  const autoAdjustModelForDataset = (currentNodes, datasetInfo) => {
    const updatedNodes = [...currentNodes];
    let hasChanges = false;
    
    // Define consistent parameters for each dataset type
    const textSeqLength = 64; // Consistent sequence length for text models
    const textVocabSize = datasetInfo.vocabSize || 10000;
    
    // Get image config from dataset or use defaults
    const imgConfig = datasetInfo.imageConfig || { height: 28, width: 28, channels: 1 };
    
    // Find all relevant layers
    const inputNode = updatedNodes.find(n => n.data.layerType === 'Input');
    const outputNode = updatedNodes.find(n => n.data.layerType === 'Output');
    const embeddingNodes = updatedNodes.filter(n => n.data.layerType === 'Embedding');
    const posEncodingNodes = updatedNodes.filter(n => n.data.layerType === 'PositionalEncoding');
    const multiHeadNodes = updatedNodes.filter(n => n.data.layerType === 'MultiHeadAttention');
    const lstmNodes = updatedNodes.filter(n => n.data.layerType === 'LSTM' || n.data.layerType === 'GRU');
    const denseNodes = updatedNodes.filter(n => n.data.layerType === 'Dense');
    const conv2dNodes = updatedNodes.filter(n => n.data.layerType === 'Conv2D');
    
    // Check if model has Conv2D layers (CNN vs MLP)
    const hasConv2D = conv2dNodes.length > 0;
    
    // Adjust Input layer based on dataset type
    if (inputNode) {
      const inputIdx = updatedNodes.findIndex(n => n.id === inputNode.id);
      const newConfig = { ...inputNode.data.config };
      
      if (datasetInfo.category === 'image') {
        if (hasConv2D) {
          // For CNN models - use image input type (4D tensor)
          newConfig.inputType = 'image';
          newConfig.height = imgConfig.height;
          newConfig.width = imgConfig.width;
          newConfig.channels = imgConfig.channels;
        } else {
          // For MLP models - use flat input type (2D tensor)
          // Image pixels are flattened: height * width * channels
          const flattenedSize = imgConfig.height * imgConfig.width * imgConfig.channels;
          newConfig.inputType = 'flat';
          newConfig.inputSize = flattenedSize;
        }
        hasChanges = true;
      } else if (datasetInfo.category === 'text') {
        // For text datasets - use consistent sequence length
        newConfig.inputType = 'text';
        newConfig.seqLength = textSeqLength;
        newConfig.vocabSize = textVocabSize;
        hasChanges = true;
      } else if (datasetInfo.category === 'sequence') {
        // For sequence/time-series datasets
        newConfig.inputType = 'sequence';
        newConfig.seqLength = 10;
        newConfig.features = datasetInfo.features || 9;
        hasChanges = true;
      } else if (datasetInfo.category === 'tabular') {
        // For tabular datasets
        newConfig.inputType = 'flat';
        newConfig.inputSize = datasetInfo.features || 4;
        hasChanges = true;
      }
      
      updatedNodes[inputIdx] = {
        ...inputNode,
        data: {
          ...inputNode.data,
          config: newConfig
        }
      };
    }
    
    // Adjust Output layer based on number of classes
    if (outputNode && datasetInfo.classes) {
      const outputIdx = updatedNodes.findIndex(n => n.id === outputNode.id);
      updatedNodes[outputIdx] = {
        ...outputNode,
        data: {
          ...outputNode.data,
          config: {
            ...outputNode.data.config,
            numClasses: datasetInfo.classes
          }
        }
      };
      hasChanges = true;
    }
    
    // Adjust ALL Embedding layers for text datasets
    if (datasetInfo.category === 'text') {
      embeddingNodes.forEach(embNode => {
        const embIdx = updatedNodes.findIndex(n => n.id === embNode.id);
        updatedNodes[embIdx] = {
          ...embNode,
          data: {
            ...embNode.data,
            config: {
              ...embNode.data.config,
              vocabSize: textVocabSize,
              inputLength: textSeqLength
            }
          }
        };
        hasChanges = true;
      });
      
      // Adjust PositionalEncoding layers
      posEncodingNodes.forEach(posNode => {
        const posIdx = updatedNodes.findIndex(n => n.id === posNode.id);
        updatedNodes[posIdx] = {
          ...posNode,
          data: {
            ...posNode.data,
            config: {
              ...posNode.data.config,
              maxLen: textSeqLength
            }
          }
        };
        hasChanges = true;
      });
      
      // Adjust MultiHeadAttention layers
      multiHeadNodes.forEach(mhaNode => {
        const mhaIdx = updatedNodes.findIndex(n => n.id === mhaNode.id);
        // Keep existing config but ensure it's consistent
        updatedNodes[mhaIdx] = {
          ...mhaNode,
          data: {
            ...mhaNode.data,
            config: {
              ...mhaNode.data.config
            }
          }
        };
      });
    }
    
    // Adjust LSTM/GRU layers for sequence data
    if (datasetInfo.category === 'sequence') {
      lstmNodes.forEach(lstmNode => {
        const lstmIdx = updatedNodes.findIndex(n => n.id === lstmNode.id);
        updatedNodes[lstmIdx] = {
          ...lstmNode,
          data: {
            ...lstmNode.data,
            config: {
              ...lstmNode.data.config,
              inputSize: datasetInfo.features || 9
            }
          }
        };
        hasChanges = true;
      });
    }
    
    // Adjust first Conv2D layer for image data (input channels)
    if (datasetInfo.category === 'image' && conv2dNodes.length > 0) {
      const firstConv = conv2dNodes[0];
      const convIdx = updatedNodes.findIndex(n => n.id === firstConv.id);
      updatedNodes[convIdx] = {
        ...firstConv,
        data: {
          ...firstConv.data,
          config: {
            ...firstConv.data.config,
            inChannels: imgConfig.channels
          }
        }
      };
      hasChanges = true;
    }
    
    // Adjust first Dense layer for image data when NO Conv2D layers (MLP with images)
    // The flattened image size = height * width * channels
    if (datasetInfo.category === 'image' && conv2dNodes.length === 0 && denseNodes.length > 0) {
      const flattenedSize = imgConfig.height * imgConfig.width * imgConfig.channels;
      const firstDense = denseNodes[0];
      const denseIdx = updatedNodes.findIndex(n => n.id === firstDense.id);
      updatedNodes[denseIdx] = {
        ...firstDense,
        data: {
          ...firstDense.data,
          config: {
            ...firstDense.data.config,
            inputSize: flattenedSize
          }
        }
      };
      hasChanges = true;
    }
    
    // Adjust first Dense layer input size for tabular data
    if (datasetInfo.category === 'tabular' && denseNodes.length > 0) {
      const firstDense = denseNodes[0];
      const denseIdx = updatedNodes.findIndex(n => n.id === firstDense.id);
      updatedNodes[denseIdx] = {
        ...firstDense,
        data: {
          ...firstDense.data,
          config: {
            ...firstDense.data.config,
            inputSize: datasetInfo.features || 4
          }
        }
      };
      hasChanges = true;
    }
    
    return hasChanges ? updatedNodes : null;
  };

  // Start training
  const handleStartTraining = async () => {
    if (!processedData) {
      toast.error('Please upload data first');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Please add layers to your network first');
      return;
    }

    // Check input compatibility - different rules for different model types
    const hasLSTM = nodes.some(n => n.data.layerType === 'LSTM' || n.data.layerType === 'GRU');
    const hasConv2D = nodes.some(n => n.data.layerType === 'Conv2D');
    const inputNode = nodes.find(n => n.data.layerType === 'Input');
    
    if (!hasLSTM && !hasConv2D) {
      // For Dense/MLP models - check flat input size
      const firstDense = nodes.find(n => n.data.layerType === 'Dense');
      if (firstDense && processedData.inputShape && processedData.type !== 'sequence') {
        const expectedInput = processedData.inputShape[0];
        const configuredInput = firstDense.data.config?.inputSize || 784;
        if (configuredInput !== expectedInput) {
          toast.error(`Input size mismatch! Layer expects ${configuredInput}, data has ${expectedInput}.`);
          return;
        }
      }
    }
    
    // For LSTM/RNN models - check sequence dimensions match
    if (hasLSTM && processedData.type === 'sequence' && inputNode?.data?.config) {
      const dataSeqLength = processedData.inputShape[0];
      const dataFeatures = processedData.inputShape[1];
      const configSeqLength = inputNode.data.config.seqLength;
      const configFeatures = inputNode.data.config.features;
      
      if (configSeqLength && configSeqLength !== dataSeqLength) {
        toast.warning(`Sequence length mismatch: Input expects ${configSeqLength}, data has ${dataSeqLength}. Training anyway...`);
      }
      if (configFeatures && configFeatures !== dataFeatures) {
        toast.warning(`Features mismatch: Input expects ${configFeatures}, data has ${dataFeatures}. Training anyway...`);
      }
    }

    const outputLayer = nodes.find(n => n.data.layerType === 'Output');
    if (outputLayer && processedData.numClasses > 1) {
      const configuredClasses = outputLayer.data.config?.numClasses || 10;
      if (configuredClasses !== processedData.numClasses) {
        toast.error(`Output mismatch! Layer has ${configuredClasses} classes, data has ${processedData.numClasses}.`);
        return;
      }
    }

    setIsTraining(true);
    setTrainingHistory([]);
    setCurrentEpoch(0);
    setCurrentBatch(0);
    setTotalBatches(0);
    setStatus('training');
    stopTrainingRef.current = false;

    try {
      let xTrain, yTrain;
      let actualNumClasses = null;
      
      // Check model type
      const hasLSTM = nodes.some(n => n.data.layerType === 'LSTM' || n.data.layerType === 'GRU');
      const hasEmbedding = nodes.some(n => n.data.layerType === 'Embedding');
      const inputNode = nodes.find(n => n.data.layerType === 'Input');
      const outputNode = nodes.find(n => n.data.layerType === 'Output');
      const seqLength = inputNode?.data?.config?.seqLength || 100;
      const vocabSize = inputNode?.data?.config?.vocabSize || 10000;
      const isTextModel = hasEmbedding || inputNode?.data?.config?.inputType === 'text';
      
      // FIRST: Process data to get actual number of classes
      if (processedData.type === 'csv' && processedData.raw) {
        if (isTextModel && textColumn) {
          // Use text processor for NLP models
          console.log(`Processing text data: text="${textColumn}", target="${targetColumn}"`);
          const processed = processTextCSVData(processedData.raw, textColumn, targetColumn, {
            maxLength: seqLength,
            vocabSize: vocabSize
          });
          xTrain = processed.xTrain;
          yTrain = processed.yTrain;
          actualNumClasses = processed.numClasses;
          
          // Store vocab for prediction
          setProcessedData(prev => ({
            ...prev,
            ...processed,
            type: 'text'
          }));
          
          console.log('Processed text data shape:', xTrain.shape, 'vocab size:', processed.vocabSize, 'classes:', actualNumClasses);
          toast.info(`Vocabulary: ${processed.vocabSize} words, ${actualNumClasses} classes`);
        } else {
          // Use numeric processor for standard models
          const processed = processCSVData(processedData.raw, targetColumn, {
            normalize: true,
            oneHotEncode: true,
            isSequenceModel: hasLSTM && !hasEmbedding,
            seqLength: hasLSTM ? seqLength : 1
          });
          xTrain = processed.xTrain;
          yTrain = processed.yTrain;
          actualNumClasses = processed.numClasses;
          
          // Log the shape for debugging
          console.log('Processed CSV data shape:', xTrain.shape, 'isSequence:', hasLSTM, 'classes:', actualNumClasses);
        }
      } else if (processedData.type === 'image' && processedData.isImageData) {
        // Process image data - create tensors now for training
        const { raw, pixelColumns, targetColumn: imgTargetCol, uniqueLabels } = processedData;
        const numSamples = raw.length;
        const height = processedData.imageConfig?.height || 28;
        const width = processedData.imageConfig?.width || 28;
        const channels = processedData.imageConfig?.channels || 1;
        
        // Check if model has Conv2D layers
        const modelHasConv2D = nodes.some(n => n.data.layerType === 'Conv2D');
        
        if (modelHasConv2D) {
          // Create 4D tensor for CNN: [batch, height, width, channels]
          const imageData = raw.map(row => {
            const pixels = pixelColumns.map(col => (row[col] || 0) / 255.0);
            // Reshape flat array to [height, width, channels]
            const image = [];
            for (let h = 0; h < height; h++) {
              const rowData = [];
              for (let w = 0; w < width; w++) {
                const pixelChannels = [];
                for (let c = 0; c < channels; c++) {
                  // For RGB images, pixels are stored as R,G,B,R,G,B... or as separate pixel_0, pixel_1...
                  const pixelIdx = (h * width + w) * channels + c;
                  pixelChannels.push(pixels[pixelIdx] || 0);
                }
                rowData.push(pixelChannels);
              }
              image.push(rowData);
            }
            return image;
          });
          xTrain = tf.tensor4d(imageData, [numSamples, height, width, channels]);
          console.log('Created 4D tensor for CNN:', xTrain.shape);
        } else {
          // Create 2D tensor for MLP: [batch, features]
          const flatData = raw.map(row => 
            pixelColumns.map(col => (row[col] || 0) / 255.0)
          );
          xTrain = tf.tensor2d(flatData, [numSamples, pixelColumns.length]);
          console.log('Created 2D tensor for MLP:', xTrain.shape);
        }
        
        // Create one-hot encoded labels
        const labels = raw.map(row => row[imgTargetCol]);
        const labelIndices = labels.map(l => uniqueLabels.indexOf(l));
        yTrain = tf.oneHot(tf.tensor1d(labelIndices, 'int32'), uniqueLabels.length);
        actualNumClasses = uniqueLabels.length;
        
        console.log('Image data processed - samples:', numSamples, 'classes:', actualNumClasses);
        toast.info(`Image data: ${numSamples} samples, ${actualNumClasses} classes`);
      } else {
        xTrain = processedData.xTrain;
        yTrain = processedData.yTrain;
        actualNumClasses = processedData.numClasses;
        console.log('Using pre-processed data - type:', processedData.type, 'isSequence:', processedData.isSequence);
      }
      
      // Validate tensors before training
      if (!xTrain || !yTrain) {
        throw new Error('Training data not available. Please load a dataset first.');
      }
      
      console.log('Tensor validation - xTrain:', xTrain?.shape, 'yTrain:', yTrain?.shape);
      console.log('xTrain dtype:', xTrain?.dtype, 'yTrain dtype:', yTrain?.dtype);
      
      // Check if we need to adjust the output layer
      const configuredClasses = outputNode?.data?.config?.numClasses || 3;
      if (actualNumClasses && actualNumClasses !== configuredClasses) {
        throw new Error(
          `Output layer mismatch: Your data has ${actualNumClasses} classes, but the Output layer is configured for ${configuredClasses} classes. ` +
          `Please update the Output layer's "Classes" setting to ${actualNumClasses}, or modify your dataset to have ${configuredClasses} classes.`
        );
      }
      
      // Build the model
      console.log('Building model with', nodes.length, 'layers');
      modelRef.current = buildTFModel(nodes, edges);
      console.log('Model built successfully');
      
      const isClassification = actualNumClasses > 1 || processedData.type === 'classification' || processedData.type === 'text';
      const loss = isClassification ? 'categoricalCrossentropy' : 'meanSquaredError';
      
      console.log('Compiling model with loss:', loss, 'optimizer:', optimizer, 'lr:', learningRate);
      compileModel(modelRef.current, {
        optimizer,
        learningRate,
        loss,
        metrics: ['acc'],
      });
      console.log('Model compiled, starting training...');
      console.log('Training data shapes - X:', xTrain?.shape, 'Y:', yTrain?.shape);

      // Calculate total batches for progress tracking
      const numSamples = xTrain?.shape?.[0] || 0;
      const trainingSamples = Math.floor(numSamples * (1 - validationSplit));
      const calculatedTotalBatches = Math.ceil(trainingSamples / batchSize);
      console.log(`Starting training: ${numSamples} samples, batch ${batchSize}, ${epochs} epochs, ~${calculatedTotalBatches} batches/epoch`);
      
      setCurrentEpoch(1);
      setCurrentBatch(0);
      setTotalBatches(calculatedTotalBatches);

      await trainModel(modelRef.current, xTrain, yTrain, {
        epochs,
        batchSize,
        validationSplit: validationSplit,
      }, {
        onEpochBegin: (epoch, info) => {
          setCurrentEpoch(epoch + 1);
          setCurrentBatch(0); // Reset batch counter at start of each epoch
          if (info?.totalBatches) {
            setTotalBatches(info.totalBatches);
          }
        },
        onBatchEnd: (batch, logs) => {
          setCurrentBatch(batch + 1);
          if (stopTrainingRef.current) {
            modelRef.current.stopTraining = true;
          }
        },
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1} done - loss: ${logs?.loss?.toFixed(4)}, acc: ${logs?.acc?.toFixed(4)}`);
          if (stopTrainingRef.current) {
            modelRef.current.stopTraining = true;
            return;
          }
          
          setTrainingHistory(prev => [...prev, {
            epoch: epoch + 1,
            loss: logs.loss != null ? Number(logs.loss.toFixed(4)) : null,
            accuracy: logs.acc != null ? Number(logs.acc.toFixed(4)) : null,
            valLoss: logs.val_loss != null ? Number(logs.val_loss.toFixed(4)) : null,
            valAccuracy: logs.val_acc != null ? Number(logs.val_acc.toFixed(4)) : null,
          }]);
        },
        onTrainEnd: async () => {
          console.log('>>> onTrainEnd callback triggered');
          
          // Update UI immediately
          setIsTraining(false);
          setStatus('complete');
          setCurrentEpoch(epochs); // Ensure epoch counter shows completion
          setCurrentBatch(0);
          toast.success('Training complete!');
          
          // Export weights in background (don't block UI)
          if (modelRef.current && onWeightsTrained) {
            setTimeout(async () => {
              try {
                console.log('Exporting model weights...');
                const weightsData = await modelRef.current.getWeights();
                const weightsArray = await Promise.all(
                  weightsData.map(async (w) => ({
                    name: w.name,
                    shape: w.shape,
                    data: Array.from(await w.data())
                  }))
                );
                const weightsJson = JSON.stringify(weightsArray);
                const weightsBase64 = btoa(weightsJson);
                onWeightsTrained(weightsBase64);
                console.log('Weights exported successfully');
              } catch (e) {
                console.error('Failed to export weights:', e);
              }
            }, 100);
          }
        }
      });

    } catch (error) {
      console.error('Training error:', error);
      setStatus('error');
      setErrorMessage(error.message);
      setIsTraining(false);
      toast.error(`Training failed: ${error.message}`);
    }
  };

  const handleStopTraining = () => {
    stopTrainingRef.current = true;
    setIsTraining(false);
    toast.info('Training stopped');
  };

  const handleReset = () => {
    if (modelRef.current) {
      disposeModel(modelRef.current);
      modelRef.current = null;
    }
    setFile(null);
    setProcessedData(null);
    setTrainingHistory([]);
    setCurrentEpoch(0);
    setCurrentBatch(0);
    setTotalBatches(0);
    setStatus('idle');
    setErrorMessage('');
    setColumns([]);
    setTargetColumn('');
    setTextColumn('');
    setPredictionInput('');
    setPredictionResult(null);
    setTestImage(null);
    setTestImagePreview('');
    setTextInput('');
  };

  const handlePredict = async () => {
    if (!modelRef.current) {
      toast.error('No trained model available');
      return;
    }

    if (!predictionInput.trim()) {
      toast.error('Please enter input values');
      return;
    }

    setIsPredicting(true);
    setPredictionResult(null);

    try {
      const inputValues = predictionInput.split(',').map(v => parseFloat(v.trim()));
      
      if (inputValues.some(isNaN)) {
        throw new Error('Invalid input - please enter comma-separated numbers');
      }

      const inputTensor = tf.tensor2d([inputValues]);
      const prediction = modelRef.current.predict(inputTensor);
      const predictionData = await prediction.data();
      
      const labels = processedData?.uniqueTargets || processedData?.uniqueLabels;
      
      let result;
      if (predictionData.length > 1) {
        const maxIndex = predictionData.indexOf(Math.max(...predictionData));
        const probabilities = Array.from(predictionData).map((prob, idx) => ({
          class: labels ? labels[idx] : `Class ${idx}`,
          probability: (prob * 100).toFixed(2)
        })).sort((a, b) => b.probability - a.probability);
        
        result = {
          type: 'classification',
          predictedClass: labels ? labels[maxIndex] : `Class ${maxIndex}`,
          confidence: (predictionData[maxIndex] * 100).toFixed(2),
          allProbabilities: probabilities
        };
      } else {
        result = {
          type: 'regression',
          value: predictionData[0].toFixed(4)
        };
      }
      
      setPredictionResult(result);
      inputTensor.dispose();
      prediction.dispose();
      toast.success('Prediction complete!');
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error(`Prediction failed: ${error.message}`);
    } finally {
      setIsPredicting(false);
    }
  };

  // Handle image file selection for prediction
  const handleImagePredict = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setTestImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setTestImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    setPredictionResult(null);
  };

  // Handle image prediction
  const handleImagePrediction = async () => {
    if (!modelRef.current || !testImage) {
      toast.error('No model or image available');
      return;
    }

    setIsPredicting(true);
    setPredictionResult(null);

    try {
      // Create image element
      const img = document.createElement('img');
      img.src = testImagePreview;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Determine input shape from model or processedData
      let targetHeight = 28;
      let targetWidth = 28;
      let channels = 1;

      // Try to get input shape from the first layer
      const inputLayer = nodes.find(n => n.data.layerType === 'Input');
      if (inputLayer?.data?.config) {
        const config = inputLayer.data.config;
        if (config.inputHeight) targetHeight = config.inputHeight;
        if (config.inputWidth) targetWidth = config.inputWidth;
        if (config.inputChannels) channels = config.inputChannels;
      }

      // Process image with TensorFlow.js
      let imageTensor = tf.browser.fromPixels(img);
      
      // Convert to grayscale if needed
      if (channels === 1 && imageTensor.shape[2] === 3) {
        imageTensor = imageTensor.mean(2).expandDims(2);
      }
      
      // Resize
      imageTensor = tf.image.resizeBilinear(imageTensor, [targetHeight, targetWidth]);
      
      // Normalize to [0, 1]
      imageTensor = imageTensor.div(255.0);
      
      // Determine if we need to flatten the image for Dense/MLP models
      // Check 1: Look at visual nodes for Conv2D layers
      const hasConv2D = nodes.some(n => 
        n.data.layerType === 'Conv2D' || 
        n.data.layerType === 'MaxPool2D' ||
        n.data.layerType === 'AvgPool2D'
      );
      
      // Check 2: Inspect the actual model's input shape
      let modelInputDims = null;
      try {
        if (modelRef.current?.inputs?.[0]?.shape) {
          modelInputDims = modelRef.current.inputs[0].shape.length;
          console.log('Model input shape:', modelRef.current.inputs[0].shape, 'dims:', modelInputDims);
        }
      } catch (e) {
        console.log('Could not determine model input shape:', e.message);
      }
      
      // Decide whether to flatten:
      // - Flatten if model expects 2D input (e.g., Dense layer) 
      // - Flatten if no Conv2D layers in the visual network
      // - Keep 4D only if we have Conv2D AND model confirms it needs 4D input
      const shouldFlatten = modelInputDims === 2 || (!hasConv2D && modelInputDims !== 4);
      
      let inputTensor;
      if (shouldFlatten) {
        // Flatten for Dense/MLP models: [1, height * width * channels]
        const flatSize = targetHeight * targetWidth * channels;
        inputTensor = imageTensor.reshape([1, flatSize]);
        console.log('Flattened input for Dense model - shape:', inputTensor.shape);
      } else {
        // Keep 4D for Conv2D models: [1, height, width, channels]
        inputTensor = imageTensor.expandDims(0);
        console.log('4D input for Conv2D model - shape:', inputTensor.shape);
      }

      const prediction = modelRef.current.predict(inputTensor);
      const predictionData = await prediction.data();
      
      const labels = processedData?.uniqueTargets || processedData?.uniqueLabels || 
        Array.from({length: predictionData.length}, (_, i) => `Class ${i}`);
      
      const maxIndex = predictionData.indexOf(Math.max(...predictionData));
      const probabilities = Array.from(predictionData).map((prob, idx) => ({
        class: labels[idx] || `Class ${idx}`,
        probability: (prob * 100).toFixed(2)
      })).sort((a, b) => b.probability - a.probability);
      
      setPredictionResult({
        type: 'classification',
        predictedClass: labels[maxIndex] || `Class ${maxIndex}`,
        confidence: (predictionData[maxIndex] * 100).toFixed(2),
        allProbabilities: probabilities
      });

      // Cleanup
      imageTensor.dispose();
      inputTensor.dispose();
      prediction.dispose();
      
      toast.success('Image classified!');
    } catch (error) {
      console.error('Image prediction error:', error);
      toast.error(`Image classification failed: ${error.message}`);
    } finally {
      setIsPredicting(false);
    }
  };

  // Handle text/sequence prediction
  const handleTextPrediction = async () => {
    if (!modelRef.current || !textInput.trim()) {
      toast.error('No model or text available');
      return;
    }

    setIsPredicting(true);
    setPredictionResult(null);

    try {
      // Get expected input size
      const inputLayer = nodes.find(n => n.data.layerType === 'Input');
      const hasEmbedding = nodes.some(n => n.data.layerType === 'Embedding');
      const hasLSTM = nodes.some(n => 
        n.data.layerType === 'LSTM' || 
        n.data.layerType === 'GRU' ||
        n.data.layerType === 'RNN'
      );
      
      let inputTensor;
      
      // Check if this is an Embedding-based text model
      if (hasEmbedding) {
        // For Embedding models, we need token IDs (integers)
        const seqLength = inputLayer?.data?.config?.seqLength || 100;
        
        // Use the vocabulary from training if available
        const vocab = processedData?.vocab;
        
        if (vocab) {
          // Tokenize using the trained vocabulary
          const tokens = textInput
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 0);
          
          const indices = tokens.slice(0, seqLength).map(token => vocab[token] || 1); // 1 = UNK
          
          // Pad to seqLength
          while (indices.length < seqLength) {
            indices.push(0); // 0 = PAD
          }
          
          // Create 2D tensor for Embedding input: [batch, sequence_length]
          inputTensor = tf.tensor2d([indices], [1, seqLength], 'int32');
        } else {
          // Fallback: use simple hash-based tokenization
          const tokens = textInput
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 0);
          
          const vocabSize = inputLayer?.data?.config?.vocabSize || 10000;
          const indices = tokens.slice(0, seqLength).map(token => {
            // Simple hash function to map words to indices
            let hash = 0;
            for (let i = 0; i < token.length; i++) {
              hash = ((hash << 5) - hash + token.charCodeAt(i)) % vocabSize;
            }
            return Math.abs(hash) + 2; // +2 to avoid PAD (0) and UNK (1)
          });
          
          // Pad to seqLength
          while (indices.length < seqLength) {
            indices.push(0);
          }
          
          inputTensor = tf.tensor2d([indices], [1, seqLength], 'int32');
        }
      } else {
        // For non-Embedding models, use the original encoding methods
        const inputSize = inputLayer?.data?.config?.inputSize || 100;
        let inputVector;
        
        switch (textEncoding) {
          case 'bow': {
            // Simple bag of words - character frequency
            const chars = textInput.toLowerCase().split('');
            const charCounts = {};
            chars.forEach(c => {
              const code = c.charCodeAt(0);
              if (code >= 32 && code <= 126) {
                charCounts[code - 32] = (charCounts[code - 32] || 0) + 1;
              }
            });
            inputVector = new Array(inputSize).fill(0);
            Object.entries(charCounts).forEach(([idx, count]) => {
              if (parseInt(idx) < inputSize) {
                inputVector[parseInt(idx)] = count / chars.length;
              }
            });
            break;
          }
          
          case 'tfidf': {
            // Simple TF approximation
            const words = textInput.toLowerCase().split(/\s+/);
            const wordCounts = {};
            words.forEach(w => {
              const hash = w.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) % inputSize, 0);
              wordCounts[hash] = (wordCounts[hash] || 0) + 1;
            });
            inputVector = new Array(inputSize).fill(0);
            Object.entries(wordCounts).forEach(([idx, count]) => {
              inputVector[parseInt(idx)] = Math.log(1 + count) / Math.log(1 + words.length);
            });
            break;
          }
          
          case 'char': {
            // Character-level encoding
            inputVector = new Array(inputSize).fill(0);
            const chars = textInput.slice(0, inputSize).split('');
            chars.forEach((c, i) => {
              inputVector[i] = (c.charCodeAt(0) - 32) / 94; // Normalize ASCII printable range
            });
            break;
          }
          
          case 'word': {
            // Word index encoding (simple hash)
            const words = textInput.toLowerCase().split(/\s+/).slice(0, inputSize);
            inputVector = new Array(inputSize).fill(0);
            words.forEach((word, i) => {
              const hash = word.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1000, 0);
              inputVector[i] = hash / 1000;
            });
            break;
          }
          
          default:
            throw new Error('Unknown encoding type');
        }

        if (hasLSTM) {
          // Reshape for RNN: [batch, timesteps, features]
          const seqLength = inputLayer?.data?.config?.seqLength || inputSize;
          const features = Math.ceil(inputSize / seqLength);
          const paddedVector = [...inputVector, ...new Array(seqLength * features - inputVector.length).fill(0)];
          inputTensor = tf.tensor3d([paddedVector.slice(0, seqLength * features).map(row => [row])].flat(), [1, seqLength, features]);
        } else {
          inputTensor = tf.tensor2d([inputVector], [1, inputSize]);
        }
      }

      const prediction = modelRef.current.predict(inputTensor);
      const predictionData = await prediction.data();
      
      const labels = processedData?.uniqueTargets || processedData?.uniqueLabels ||
        ['Negative', 'Neutral', 'Positive'].slice(0, predictionData.length);
      
      let result;
      if (predictionData.length > 1) {
        const maxIndex = predictionData.indexOf(Math.max(...predictionData));
        const probabilities = Array.from(predictionData).map((prob, idx) => ({
          class: labels[idx] || `Class ${idx}`,
          probability: (prob * 100).toFixed(2)
        })).sort((a, b) => b.probability - a.probability);
        
        result = {
          type: 'classification',
          predictedClass: labels[maxIndex] || `Class ${maxIndex}`,
          confidence: (predictionData[maxIndex] * 100).toFixed(2),
          allProbabilities: probabilities
        };
      } else {
        result = {
          type: 'regression',
          value: predictionData[0].toFixed(4)
        };
      }
      
      setPredictionResult(result);
      inputTensor.dispose();
      prediction.dispose();
      
      toast.success('Text analyzed!');
    } catch (error) {
      console.error('Text prediction error:', error);
      toast.error(`Text analysis failed: ${error.message}`);
    } finally {
      setIsPredicting(false);
    }
  };

  // Handle Mini-GPT text generation (uses trained model or Markov chain fallback)
  const handleMiniGPTGeneration = async () => {
    if (!generationPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedText('');

    try {
      // Use trained neural network if available and training is complete
      if (miniGPTTrainingComplete && modelRef.current && !useMarkovFallback) {
        console.log('Using trained neural network for generation');
        const result = await generateText(
          modelRef.current,
          generationPrompt,
          processedData.charToIdx,
          processedData.idxToChar,
          {
            length: generationLength,
            temperature: generationTemp,
            seqLength: processedData.seqLength || 64,
            onToken: (char, fullText) => {
              setGeneratedText(fullText);
            }
          }
        );
        toast.success(`Generated ${result.length} characters using trained model!`);
      } else {
        // Fallback to Markov chain
        console.log('Using Markov chain for generation');
        initShakespeareMarkov(shakespeareText);
        
        const result = generateShakespeareText(
          generationPrompt,
          {
            length: generationLength,
            temperature: generationTemp,
            sourceText: shakespeareText,
            onToken: (char, fullText) => {
              setGeneratedText(fullText);
            }
          }
        );
        toast.success(`Generated ${result.length} characters!`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      // If neural network fails, try Markov chain
      if (!useMarkovFallback) {
        console.log('Neural network failed, trying Markov chain fallback');
        try {
          initShakespeareMarkov(shakespeareText);
          const result = generateShakespeareText(
            generationPrompt,
            {
              length: generationLength,
              temperature: generationTemp,
              sourceText: shakespeareText,
              onToken: (char, fullText) => {
                setGeneratedText(fullText);
              }
            }
          );
          toast.success(`Generated ${result.length} characters (fallback)!`);
        } catch (fallbackError) {
          toast.error(`Generation failed: ${fallbackError.message}`);
        }
      } else {
        toast.error(`Generation failed: ${error.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle text generation (for Mini-GPT style models)
  const handleTextGeneration = async () => {
    if (!modelRef.current) {
      toast.error('Please train the model first');
      return;
    }

    if (!generationPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!processedData?.charToIdx || !processedData?.idxToChar) {
      toast.error('Character vocabulary not found. Make sure to train with a text generation dataset.');
      return;
    }

    setIsGenerating(true);
    setGeneratedText('');

    try {
      const result = await generateText(
        modelRef.current,
        generationPrompt,
        processedData.charToIdx,
        processedData.idxToChar,
        {
          length: generationLength,
          temperature: generationTemp,
          seqLength: processedData.seqLength || 64,
          onToken: (char, fullText) => {
            setGeneratedText(fullText);
          }
        }
      );

      toast.success(`Generated ${result.length} characters!`);
    } catch (error) {
      console.error('Text generation error:', error);
      toast.error(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="absolute right-0 top-0 bottom-0 w-full sm:w-[500px] bg-card border-l border-border shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
          data-testid="training-panel"
        >
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-md bg-primary/10">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <h2 className="font-bold text-base sm:text-lg">Train Network</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-training-btn">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div 
            className="flex-1 overflow-y-auto overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="p-3 sm:p-4 space-y-4 sm:space-y-6 pb-24">
              
              {/* Pre-trained Mini-GPT Section */}
              {isMiniGPTTemplate && (
                <div className="space-y-4">
                  {/* Pre-trained Badge */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <div>
                      <p className="font-semibold text-sm text-violet-300">Pre-trained Model Ready</p>
                      <p className="text-xs text-muted-foreground">No training required - start generating text immediately!</p>
                    </div>
                  </div>
                  
                  {/* Model Specifications */}
                  <div className="p-4 rounded-lg bg-card border border-border space-y-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">Model Specifications</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Parameters</p>
                        <p className="text-sm font-mono font-bold">{MINI_GPT_SPECS.parameters}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Architecture</p>
                        <p className="text-sm font-mono font-bold">{MINI_GPT_SPECS.layers} Layers</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Embed Dim</p>
                        <p className="text-sm font-mono font-bold">{MINI_GPT_SPECS.embedDim}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Attention Heads</p>
                        <p className="text-sm font-mono font-bold">{MINI_GPT_SPECS.heads}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sequence Length</p>
                        <p className="text-sm font-mono font-bold">{MINI_GPT_SPECS.seqLength} chars</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vocabulary</p>
                        <p className="text-sm font-mono font-bold">{MINI_GPT_SPECS.vocabSize} chars</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Pre-trained Model Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        <h4 className="font-medium text-xs">Training Details</h4>
                      </div>
                      
                      {isLoadingMiniGPT ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                          <span className="ml-2 text-xs text-muted-foreground">Loading model...</span>
                        </div>
                      ) : (
                        <>
                          {/* Static Pre-trained Stats */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-center">
                              <p className="text-lg font-bold text-blue-400">{MINI_GPT_SPECS.epochs}</p>
                              <p className="text-[10px] text-muted-foreground">Epochs</p>
                            </div>
                            <div className="p-2 rounded bg-green-500/10 border border-green-500/20 text-center">
                              <p className="text-lg font-bold text-green-400">{MINI_GPT_SPECS.finalAccuracy}</p>
                              <p className="text-[10px] text-muted-foreground">Accuracy</p>
                            </div>
                            <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20 text-center">
                              <p className="text-lg font-bold text-orange-400">{MINI_GPT_SPECS.finalLoss}</p>
                              <p className="text-[10px] text-muted-foreground">Loss</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Trained on: {MINI_GPT_SPECS.trainingData}
                          </p>
                        </>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Markov Chain Toggle - Always show */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-violet-400" />
                          <div>
                            <span className="text-xs font-medium text-violet-300">Use Markov Chain</span>
                            <p className="text-[10px] text-muted-foreground">Recommended for better results</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setUseMarkovFallback(!useMarkovFallback)}
                          className={cn(
                            "relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out",
                            useMarkovFallback ? "bg-violet-500" : "bg-muted-foreground/30"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
                              useMarkovFallback ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>
                      
                      {/* Explanation based on toggle state */}
                      <div className={cn(
                        "p-3 rounded-lg border",
                        useMarkovFallback 
                          ? "bg-green-500/10 border-green-500/20" 
                          : "bg-amber-500/10 border-amber-500/20"
                      )}>
                        <div className="flex items-start gap-2">
                          {useMarkovFallback ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-green-300">Markov Chain Active</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Using statistical patterns from Shakespeare text. Generates readable, coherent text instantly!
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-amber-300">Neural Network (Demo Mode)</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  The model uses random weights in-browser. Output will be random characters. 
                                  <strong className="text-amber-300"> Enable Markov Chain above for readable text</strong>, 
                                  or export the PyTorch code to train with real data on a GPU.
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Text Generation Section */}
                  <div className="space-y-3 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <span className="font-semibold text-sm text-violet-300">Generate Shakespeare-Style Text</span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Uses a statistical language model trained on Shakespeare's works. Enter a prompt to continue the text in his style.
                    </p>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Prompt (seed text)</Label>
                      <textarea
                        placeholder="To be or not to be..."
                        value={generationPrompt}
                        onChange={(e) => setGenerationPrompt(e.target.value)}
                        className="w-full h-24 p-3 rounded-lg bg-secondary border border-border text-sm resize-none font-mono"
                        style={{ fontSize: '13px' }}
                        data-testid="generation-prompt"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Temperature: {generationTemp.toFixed(2)}</Label>
                        <Slider
                          value={[generationTemp]}
                          onValueChange={([val]) => setGenerationTemp(val)}
                          min={0.1}
                          max={2.0}
                          step={0.1}
                          className="py-2"
                        />
                        <p className="text-[9px] text-muted-foreground">Lower = predictable, Higher = creative</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Length: {generationLength}</Label>
                        <Slider
                          value={[generationLength]}
                          onValueChange={([val]) => setGenerationLength(val)}
                          min={50}
                          max={500}
                          step={50}
                          className="py-2"
                        />
                        <p className="text-[9px] text-muted-foreground">Characters to generate</p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleMiniGPTGeneration}
                      disabled={isGenerating || !generationPrompt.trim() || isLoadingMiniGPT}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                      data-testid="generate-text-btn"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : isLoadingMiniGPT ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Text {useMarkovFallback ? '(Markov)' : '(Neural - Demo)'}
                        </>
                      )}
                    </Button>
                    
                    {/* Generated Output */}
                    {generatedText && (
                      <div className="space-y-2">
                        <Label className="text-xs">Generated Output</Label>
                        <div className="p-3 rounded-lg bg-card border border-border max-h-64 overflow-y-auto">
                          <p className="text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed">
                            <span className="text-muted-foreground">{generationPrompt}</span>
                            <span className="text-violet-400">{generatedText}</span>
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(generationPrompt + generatedText);
                            toast.success('Copied to clipboard!');
                          }}
                        >
                          Copy Full Text
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Info about exporting */}
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-300">
                      <strong>Want to train on your own data?</strong> Click "View Code" in the header to export 
                      production-ready PyTorch code. Train it on any GPU with your custom text corpus!
                    </p>
                  </div>
                </div>
              )}
              
              {/* Regular Training Section (hidden for Mini-GPT) */}
              {!isMiniGPTTemplate && (
              <>
              {/* Network Requirements Summary */}
              {networkReqs && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowDataGuide(!showDataGuide)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Data Requirements Guide</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {showDataGuide ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  
                  {showDataGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 rounded-lg bg-muted/50 border border-border space-y-3"
                    >
                      {/* Model Summary */}
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary">
                          {networkReqs.modelType}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                          {networkReqs.taskType}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                          {networkReqs.numClasses} {networkReqs.taskType === 'classification' ? 'classes' : 'output'}
                        </span>
                      </div>
                      
                      {/* Input Requirements */}
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-foreground/80">Expected Input:</p>
                        <p className="text-xs text-muted-foreground">{networkReqs.inputDescription}</p>
                      </div>
                      
                      {/* Data Format Guide based on model type */}
                      {networkReqs.modelType === 'RNN/LSTM' && (
                        <div className="space-y-2 pt-2 border-t border-border/50">
                          <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                            <Table className="w-3 h-3" /> CSV Format for LSTM:
                          </p>
                          <div className="bg-background/50 rounded p-2 font-mono text-[10px] overflow-x-auto">
                            <div className="text-muted-foreground"># {networkReqs.features} features + 1 target column</div>
                            <div className="text-muted-foreground"># Each row = 1 timestep in sequence</div>
                            <div className="mt-1">f1, f2, f3, ..., f{networkReqs.features}, label</div>
                            <div>0.1, 0.5, 0.3, ..., 0.8, class_A</div>
                            <div>0.2, 0.4, 0.2, ..., 0.7, class_A</div>
                            <div>0.3, 0.3, 0.4, ..., 0.9, class_B</div>
                            <div className="text-muted-foreground">... (min {networkReqs.seqLength}+ rows)</div>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            💡 Sliding window creates sequences of {networkReqs.seqLength} timesteps from your data.
                            Need at least 2 different labels for classification.
                          </p>
                        </div>
                      )}
                      
                      {networkReqs.modelType === 'CNN' && (
                        <div className="space-y-2 pt-2 border-t border-border/50">
                          <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                            <FolderTree className="w-3 h-3" /> Image Folder Structure:
                          </p>
                          <div className="bg-background/50 rounded p-2 font-mono text-[10px]">
                            <div>📁 training_data/</div>
                            <div>├── 📁 class_A/</div>
                            <div>│   ├── image1.jpg</div>
                            <div>│   ├── image2.jpg</div>
                            <div>│   └── ...</div>
                            <div>├── 📁 class_B/</div>
                            <div>│   ├── image1.jpg</div>
                            <div>│   └── ...</div>
                            <div>└── 📁 class_C/</div>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            💡 Images will be resized to {networkReqs.inputShape[0]}×{networkReqs.inputShape[1]}.
                            Each subfolder = one class.
                          </p>
                        </div>
                      )}
                      
                      {networkReqs.modelType === 'MLP' && (
                        <div className="space-y-2 pt-2 border-t border-border/50">
                          <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                            <Table className="w-3 h-3" /> CSV Format for MLP:
                          </p>
                          <div className="bg-background/50 rounded p-2 font-mono text-[10px] overflow-x-auto">
                            <div className="text-muted-foreground"># {networkReqs.inputShape[0]} features + 1 target column</div>
                            <div className="mt-1">feature1, feature2, ..., feature{networkReqs.inputShape[0]}, label</div>
                            <div>0.5, 0.3, ..., 0.8, class_A</div>
                            <div>0.2, 0.7, ..., 0.4, class_B</div>
                            <div>0.9, 0.1, ..., 0.6, class_A</div>
                            <div className="text-muted-foreground">...</div>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            💡 Each row = 1 sample. Last column = target label.
                            Numeric values work best.
                          </p>
                        </div>
                      )}
                      
                      {networkReqs.modelType === 'NLP/Text' && (
                        <div className="space-y-2 pt-2 border-t border-border/50">
                          <p className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> CSV Format for Text Classification:
                          </p>
                          <div className="bg-background/50 rounded p-2 font-mono text-[10px] overflow-x-auto">
                            <div className="text-muted-foreground"># text column + label column</div>
                            <div className="mt-1">text, sentiment</div>
                            <div>"I love this product!", positive</div>
                            <div>"Terrible experience.", negative</div>
                            <div>"It's okay I guess", neutral</div>
                            <div className="text-muted-foreground">...</div>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            💡 Text will be tokenized to {networkReqs.seqLength || 100} tokens.
                            Vocab size: {networkReqs.vocabSize || 10000}. Use Sample → Text/NLP to test.
                          </p>
                        </div>
                      )}
                      
                      {/* Quick Generate Button */}
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-[10px] text-muted-foreground mb-2">
                          🚀 Quick start: Use Sample data to test your network
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              
              {/* Data Upload Section */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                  1. Load Data
                </h3>
                
                <Tabs value={dataType} onValueChange={setDataType}>
                  <TabsList className="grid grid-cols-3 w-full h-9 sm:h-10">
                    <TabsTrigger value="datasets" className="text-xs sm:text-sm" data-testid="tab-datasets">
                      <Database className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Datasets
                    </TabsTrigger>
                    <TabsTrigger value="csv" className="text-xs sm:text-sm" data-testid="tab-csv">
                      <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      CSV
                    </TabsTrigger>
                    <TabsTrigger value="images" className="text-xs sm:text-sm" data-testid="tab-images">
                      <Image className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Images
                    </TabsTrigger>
                  </TabsList>

                  {/* Sample Datasets Tab */}
                  <TabsContent value="datasets" className="space-y-3 mt-3 sm:mt-4">
                    {/* Quick Dataset Cards */}
                    <div className="space-y-2">
                      {sampleDatasets
                        .filter(ds => !currentTemplateId || ds.compatibleTemplates.includes(currentTemplateId))
                        .slice(0, 4)
                        .map((dataset) => (
                          <div
                            key={dataset.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 ${
                              selectedDatasetInfo?.id === dataset.id 
                                ? 'bg-primary/10 border-primary' 
                                : 'bg-secondary/30 border-border'
                            }`}
                            onClick={() => handleSelectSampleDataset({
                              ...dataset,
                              rawData: dataset.getData()
                            })}
                            data-testid={`quick-dataset-${dataset.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{dataset.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{dataset.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {dataset.description}
                                </div>
                              </div>
                              {selectedDatasetInfo?.id === dataset.id && (
                                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {/* Browse All Button */}
                    <Button
                      variant="outline"
                      className="w-full text-xs sm:text-sm"
                      onClick={() => setShowDatasetBrowser(true)}
                      data-testid="browse-all-datasets-btn"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      Browse All Datasets
                    </Button>
                    
                    {/* Dataset Info */}
                    <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground/80">🎯 Recommended:</strong> Datasets shown are compatible with your current model template.
                        <br />
                        <strong className="text-foreground/80">💾 Download:</strong> Click "Browse All" to preview data and download CSVs.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="csv" className="space-y-3 mt-3 sm:mt-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      className="w-full h-16 sm:h-20 border-dashed text-xs sm:text-sm"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="upload-csv-btn"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="truncate max-w-[200px]">{file ? file.name : 'Upload CSV File'}</span>
                      </div>
                    </Button>
                    
                    {/* CSV Instructions */}
                    <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground/80">Format:</strong> CSV with headers. Last column = target.
                        <br />
                        <strong className="text-foreground/80">Example:</strong> feature1, feature2, ..., label
                        <br />
                        <strong className="text-foreground/80">For LSTM:</strong> Each row = 1 timestep. Use sliding window for sequences.
                      </p>
                    </div>
                    
                    {columns.length > 0 && (
                      <div className="space-y-3">
                        {/* Show text column selector for NLP models */}
                        {(networkReqs?.modelType === 'NLP/Text' || networkReqs?.hasEmbedding) && (
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Text Column
                            </Label>
                            <Select value={textColumn} onValueChange={setTextColumn}>
                              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm" data-testid="select-text-column">
                                <SelectValue placeholder="Select text column" />
                              </SelectTrigger>
                              <SelectContent>
                                {columns.map(col => (
                                  <SelectItem key={col} value={col} className="text-xs sm:text-sm">{col}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm">Target Column</Label>
                          <Select value={targetColumn} onValueChange={setTargetColumn}>
                            <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm" data-testid="select-target-column">
                              <SelectValue placeholder="Select target" />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map(col => (
                                <SelectItem key={col} value={col} className="text-xs sm:text-sm">{col}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="images" className="space-y-3 mt-3 sm:mt-4">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      webkitdirectory="true"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      className="w-full h-16 sm:h-20 border-dashed text-xs sm:text-sm"
                      onClick={() => imageInputRef.current?.click()}
                      data-testid="upload-images-btn"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Upload Image Folder</span>
                      </div>
                    </Button>
                    
                    {/* Images Instructions */}
                    <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground/80">Structure:</strong> Folder with subfolders per class.
                        <br />
                        <strong className="text-foreground/80">Example:</strong> images/cat/*.jpg, images/dog/*.jpg
                        <br />
                        <strong className="text-foreground/80">Tip:</strong> Use Conv2D layers for image data, or Dense with Input size 784 for 28x28 grayscale.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Status indicator */}
                {status !== 'idle' && (
                  <div className={`flex items-center gap-2 p-2 rounded-lg text-xs sm:text-sm ${
                    status === 'ready' ? 'bg-green-500/10 text-green-500' :
                    status === 'loading' ? 'bg-blue-500/10 text-blue-500' :
                    status === 'training' ? 'bg-primary/10 text-primary' :
                    status === 'complete' ? 'bg-green-500/10 text-green-500' :
                    status === 'error' ? 'bg-red-500/10 text-red-500' : ''
                  }`}>
                    {status === 'loading' && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin flex-shrink-0" />}
                    {status === 'ready' && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
                    {status === 'training' && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin flex-shrink-0" />}
                    {status === 'complete' && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
                    {status === 'error' && <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
                    <span className="truncate">
                      {status === 'loading' && 'Processing...'}
                      {status === 'ready' && 'Data ready'}
                      {status === 'training' && (
                        <>
                          Epoch {currentEpoch}/{epochs}
                          {totalBatches > 0 && <span className="mx-1">·</span>}
                          {totalBatches > 0 && `Batch ${currentBatch}/${totalBatches}`}
                        </>
                      )}
                      {status === 'complete' && 'Complete!'}
                      {status === 'error' && errorMessage}
                    </span>
                  </div>
                )}
                
                {/* Data info hint */}
                {status === 'ready' && processedData && (
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] sm:text-xs">
                    <p><strong>Input size:</strong> <code className="font-mono bg-blue-500/20 px-1 rounded">{processedData.inputShape?.[0] || 'N/A'}</code></p>
                    {processedData.numClasses > 1 && (
                      <p className="mt-1"><strong>Classes:</strong> <code className="font-mono bg-blue-500/20 px-1 rounded">{processedData.numClasses}</code></p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Training Config - Simplified */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                  2. Config
                </h3>

                {/* Basic Hyperparameters */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <Label className="flex items-center gap-1.5">
                        <Timer className="w-3 h-3 text-muted-foreground" />
                        Epochs
                      </Label>
                      <span className="text-muted-foreground font-mono">{epochs}</span>
                    </div>
                    <Slider
                      value={[epochs]}
                      onValueChange={([v]) => setEpochs(v)}
                      min={1}
                      max={100}
                      step={1}
                      disabled={isTraining}
                      data-testid="epochs-slider"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <Label className="flex items-center gap-1.5">
                        <Database className="w-3 h-3 text-muted-foreground" />
                        Batch Size
                      </Label>
                      <span className="text-muted-foreground font-mono">{batchSize}</span>
                    </div>
                    <Slider
                      value={[batchSize]}
                      onValueChange={([v]) => setBatchSize(v)}
                      min={1}
                      max={64}
                      step={1}
                      disabled={isTraining}
                      data-testid="batch-size-slider"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <Label className="flex items-center gap-1.5">
                        <TrendingDown className="w-3 h-3 text-muted-foreground" />
                        Learning Rate
                      </Label>
                      <span className="text-muted-foreground font-mono">{learningRate.toFixed(4)}</span>
                    </div>
                    <Slider
                      value={[Math.log10(learningRate) + 4]}
                      onValueChange={([v]) => setLearningRate(Math.pow(10, v - 4))}
                      min={0}
                      max={3}
                      step={0.1}
                      disabled={isTraining}
                      data-testid="learning-rate-slider"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm flex items-center gap-1.5">
                      <Settings className="w-3 h-3 text-muted-foreground" />
                      Optimizer
                    </Label>
                    <Select value={optimizer} onValueChange={setOptimizer} disabled={isTraining}>
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm" data-testid="select-optimizer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adam" className="text-xs sm:text-sm">Adam (Recommended)</SelectItem>
                        <SelectItem value="sgd" className="text-xs sm:text-sm">SGD + Momentum</SelectItem>
                        <SelectItem value="rmsprop" className="text-xs sm:text-sm">RMSprop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Training Progress - Shows during training OR when there's history */}
              {(status === 'training' || trainingHistory.length > 0) && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                    3. Results
                  </h3>
                  
                  {/* Training Summary Card - Shows when loaded from saved model */}
                  {savedTrainingData && savedTrainingData.finalMetrics && (
                    <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-primary">Trained Model Loaded</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Dataset:</span>
                          <span className="ml-1 font-medium">{savedTrainingData.datasetName || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Epochs:</span>
                          <span className="ml-1 font-medium">{savedTrainingData.epochs || trainingHistory.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Final Loss:</span>
                          <span className="ml-1 font-medium text-red-400">{savedTrainingData.finalMetrics.loss}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Final Accuracy:</span>
                          <span className="ml-1 font-medium text-green-400">{savedTrainingData.finalMetrics.accuracy}</span>
                        </div>
                        {savedTrainingData.finalMetrics.valAccuracy && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Val Loss:</span>
                              <span className="ml-1 font-medium text-orange-400">{savedTrainingData.finalMetrics.valLoss}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Val Accuracy:</span>
                              <span className="ml-1 font-medium text-blue-400">{savedTrainingData.finalMetrics.valAccuracy}</span>
                            </div>
                          </>
                        )}
                      </div>
                      {savedTrainingData.savedAt && (
                        <div className="mt-2 pt-2 border-t border-primary/10 text-[10px] text-muted-foreground">
                          Trained on {new Date(savedTrainingData.savedAt).toLocaleDateString()} at {new Date(savedTrainingData.savedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Graph section */}
                  <div className="h-36 sm:h-48 w-full">
                    {trainingHistory.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trainingHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="epoch" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            tickMargin={5}
                          />
                          <YAxis 
                            yAxisId="left"
                            stroke="hsl(var(--destructive))"
                            fontSize={10}
                            domain={[0, 'auto']}
                            width={35}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            stroke="hsl(var(--primary))"
                            fontSize={10}
                            domain={[0, 1]}
                            width={35}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '11px'
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="loss" 
                            stroke="hsl(var(--destructive))" 
                          strokeWidth={2}
                          dot={false}
                          name="Loss"
                          connectNulls
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="accuracy" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={false}
                          name="Acc"
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                        <div className="text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                          <p>Training in progress...</p>
                          <p className="text-xs mt-1">Graph will appear after first epoch</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Latest metrics */}
                  {trainingHistory.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div className="p-2 rounded-lg bg-secondary">
                        <span className="text-muted-foreground">Loss:</span>
                        <span className="ml-1 sm:ml-2 font-mono">
                          {trainingHistory[trainingHistory.length - 1]?.loss || 'N/A'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary">
                        <span className="text-muted-foreground">Acc:</span>
                        <span className="ml-1 sm:ml-2 font-mono">
                          {trainingHistory[trainingHistory.length - 1]?.accuracy || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 sm:pt-4">
                {!isTraining ? (
                  <>
                    <Button 
                      className="flex-1 glow-primary text-xs sm:text-sm h-9 sm:h-10"
                      onClick={handleStartTraining}
                      disabled={status !== 'ready' && status !== 'complete'}
                      data-testid="start-training-btn"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Train
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleReset}
                      className="text-xs sm:text-sm h-9 sm:h-10"
                      data-testid="reset-training-btn"
                    >
                      Reset
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="destructive"
                    className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                    onClick={handleStopTraining}
                    data-testid="stop-training-btn"
                  >
                    <Square className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Stop
                  </Button>
                )}
              </div>

              {/* Prediction Section */}
              {status === 'complete' && modelRef.current && (
                <>
                  <Separator />
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                      4. Test Model
                    </h3>
                    
                    {/* Text Generation UI - Show for text-generation models */}
                    {processedData?.isTextGeneration && (
                      <div className="space-y-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-violet-400" />
                          <span className="font-medium text-sm text-violet-300">Generate Text</span>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Prompt (seed text)</Label>
                          <textarea
                            placeholder="Enter starting text..."
                            value={generationPrompt}
                            onChange={(e) => setGenerationPrompt(e.target.value)}
                            className="w-full h-20 p-3 rounded-lg bg-secondary border border-border text-sm resize-none font-mono"
                            style={{ fontSize: '14px' }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Temperature: {generationTemp.toFixed(2)}</Label>
                            <Slider
                              value={[generationTemp]}
                              onValueChange={([val]) => setGenerationTemp(val)}
                              min={0.1}
                              max={2.0}
                              step={0.1}
                              className="py-2"
                            />
                            <p className="text-[9px] text-muted-foreground">Lower = predictable, Higher = creative</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Length: {generationLength}</Label>
                            <Slider
                              value={[generationLength]}
                              onValueChange={([val]) => setGenerationLength(val)}
                              min={50}
                              max={500}
                              step={50}
                              className="py-2"
                            />
                            <p className="text-[9px] text-muted-foreground">Characters to generate</p>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleTextGeneration}
                          disabled={isGenerating || !generationPrompt.trim()}
                          className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Text
                            </>
                          )}
                        </Button>
                        
                        {/* Generated Output */}
                        {generatedText && (
                          <div className="space-y-2">
                            <Label className="text-xs">Generated Output</Label>
                            <div className="p-3 rounded-lg bg-card border border-border max-h-48 overflow-y-auto">
                              <p className="text-sm font-mono whitespace-pre-wrap text-foreground">
                                <span className="text-muted-foreground">{generationPrompt}</span>
                                <span className="text-violet-400">{generatedText}</span>
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(generationPrompt + generatedText);
                                toast.success('Copied to clipboard!');
                              }}
                            >
                              Copy Full Text
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Standard prediction UI for non-text-generation models */}
                    {!processedData?.isTextGeneration && (
                    <div className="space-y-3">
                      {/* Input Type Tabs */}
                      <Tabs defaultValue="csv" className="w-full">
                        <TabsList className="grid grid-cols-3 w-full h-8">
                          <TabsTrigger value="csv" className="text-xs">
                            <FileSpreadsheet className="w-3 h-3 mr-1" />
                            Values
                          </TabsTrigger>
                          <TabsTrigger value="image" className="text-xs">
                            <Image className="w-3 h-3 mr-1" />
                            Image
                          </TabsTrigger>
                          <TabsTrigger value="text" className="text-xs">
                            <span className="text-xs mr-1">Aa</span>
                            Text
                          </TabsTrigger>
                        </TabsList>

                        {/* CSV/Values Input */}
                        <TabsContent value="csv" className="space-y-3 mt-3">
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm">
                              Input (comma-separated values)
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder={processedData?.inputShape ? 
                                  `${processedData.inputShape[0]} values` : 
                                  'e.g., 0.5, 0.3, 0.8'
                                }
                                value={predictionInput}
                                onChange={(e) => setPredictionInput(e.target.value)}
                                className="text-base sm:text-sm h-10"
                                style={{ fontSize: '16px' }}
                                data-testid="prediction-input"
                              />
                              <Button 
                                onClick={handlePredict}
                                disabled={isPredicting || !predictionInput.trim()}
                                className="text-xs sm:text-sm h-9 sm:h-10 px-3"
                                data-testid="predict-btn"
                              >
                                {isPredicting ? (
                                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                ) : (
                                  'Test'
                                )}
                              </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Enter {processedData?.inputShape?.[0] || 'N'} comma-separated numbers
                            </p>
                          </div>
                        </TabsContent>

                        {/* Image Input */}
                        <TabsContent value="image" className="space-y-3 mt-3">
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm">
                              Upload Image to Classify
                            </Label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImagePredict}
                              className="hidden"
                              id="test-image-input"
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1 h-20 border-dashed"
                                onClick={() => document.getElementById('test-image-input')?.click()}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <Upload className="w-5 h-5" />
                                  <span className="text-xs">
                                    {testImage ? 'Change Image' : 'Upload Image'}
                                  </span>
                                </div>
                              </Button>
                              {testImage && (
                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                                  <img 
                                    src={testImagePreview} 
                                    alt="Test" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </div>
                            {testImage && (
                              <Button 
                                onClick={handleImagePrediction}
                                disabled={isPredicting}
                                className="w-full text-xs sm:text-sm h-9"
                              >
                                {isPredicting ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <Sparkles className="w-4 h-4 mr-2" />
                                )}
                                Classify Image
                              </Button>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              Best for CNN models. Image will be resized to match input layer.
                            </p>
                          </div>
                        </TabsContent>

                        {/* Text/Sequence Input */}
                        <TabsContent value="text" className="space-y-3 mt-3">
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm">
                              Enter Text or Sequence
                            </Label>
                            <textarea
                              placeholder="Enter text for sentiment analysis or sequence data..."
                              value={textInput}
                              onChange={(e) => setTextInput(e.target.value)}
                              className="w-full h-24 p-3 rounded-lg bg-secondary border border-border text-sm resize-none"
                              style={{ fontSize: '16px' }}
                            />
                            <div className="flex gap-2">
                              <Select value={textEncoding} onValueChange={setTextEncoding}>
                                <SelectTrigger className="h-9 text-xs flex-1">
                                  <SelectValue placeholder="Encoding" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bow" className="text-xs">Bag of Words</SelectItem>
                                  <SelectItem value="tfidf" className="text-xs">TF-IDF</SelectItem>
                                  <SelectItem value="char" className="text-xs">Character Level</SelectItem>
                                  <SelectItem value="word" className="text-xs">Word Index</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button 
                                onClick={handleTextPrediction}
                                disabled={isPredicting || !textInput.trim()}
                                className="text-xs sm:text-sm h-9 px-4"
                              >
                                {isPredicting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Analyze'
                                )}
                              </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Best for RNN/LSTM models. Text will be encoded based on selection.
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>

                      {/* Prediction Result */}
                      {predictionResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/20"
                          data-testid="prediction-result"
                        >
                          {predictionResult.type === 'classification' ? (
                            <div className="space-y-2 sm:space-y-3">
                              <div className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="font-semibold">Predicted:</span>
                                <span className="font-bold text-primary text-base">
                                  {predictionResult.predictedClass}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground">Confidence:</span>
                                <span className="font-mono">{predictionResult.confidence}%</span>
                              </div>
                              
                              {/* Top probabilities */}
                              <div className="space-y-1 pt-2 border-t border-border">
                                {predictionResult.allProbabilities.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${item.probability}%` }}
                                      />
                                    </div>
                                    <span className="w-14 truncate">{item.class}</span>
                                    <span className="w-10 font-mono text-right">{item.probability}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="font-semibold">Value:</span>
                              <span className="font-bold text-primary font-mono">
                                {predictionResult.value}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                    )}
                    
                    {/* Save Section - Shows after training completes */}
                    {status === 'complete' && trainingHistory.length > 0 && (
                      <div className="pt-4 border-t border-border mt-4">
                        {/* Authenticated - show save button */}
                        {isAuthenticated && (
                          <div className="space-y-3">
                            <Button
                              onClick={onOpenSavePanel}
                              className="w-full"
                              variant="default"
                              data-testid="save-model-btn"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Model & Training
                            </Button>
                            <p className="text-[10px] text-muted-foreground text-center">
                              Save your trained model to restore it later
                            </p>
                          </div>
                        )}
                        
                        {/* Not authenticated - prompt to sign in */}
                        {!isAuthenticated && (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs text-amber-400 text-center">
                              🔐 Sign in to save your trained model
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
              </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
    
    {/* Dataset Browser Modal */}
    <DatasetBrowserModal
      isOpen={showDatasetBrowser}
      onClose={() => setShowDatasetBrowser(false)}
      onSelectDataset={handleSelectSampleDataset}
      currentTemplateId={currentTemplateId}
    />
    </>
  );
};
