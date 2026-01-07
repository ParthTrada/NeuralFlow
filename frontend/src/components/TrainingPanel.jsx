import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Play, 
  Square, 
  FileSpreadsheet, 
  Image, 
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Save
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
import { parseCSV, processCSVData, processImageFolder, generateSampleData } from '../utils/dataProcessor';

export const TrainingPanel = ({ nodes, edges, isOpen, onClose, onWeightsTrained, modelId, savedWeights, savedTrainingData, onSaveTrainingData }) => {
  const [dataType, setDataType] = useState('csv');
  const [file, setFile] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [columns, setColumns] = useState([]);
  
  // Training config
  const [epochs, setEpochs] = useState(10);
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState(0.001);
  const [optimizer, setOptimizer] = useState('adam');
  
  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [currentEpoch, setCurrentEpoch] = useState(0);
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
  
  const modelRef = useRef(null);
  const stopTrainingRef = useRef(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const lastModelIdRef = useRef(null);

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
      setTargetColumn(cols[cols.length - 1]);
      setProcessedData({ raw: data, type: 'csv' });
      setStatus('ready');
      toast.success(`Loaded ${data.length} rows from CSV`);
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

  // Generate sample data
  const handleGenerateSample = (type) => {
    setStatus('loading');
    try {
      const data = generateSampleData(type, 500);
      setProcessedData({
        ...data,
        type: 'sample'
      });
      setStatus('ready');
      toast.success(`Generated ${type} sample dataset`);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
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

    const firstLayer = nodes.find(n => n.data.layerType === 'Dense' || n.data.layerType === 'Conv2D');
    if (firstLayer && processedData.inputShape) {
      const expectedInput = processedData.inputShape[0];
      const configuredInput = firstLayer.data.config?.inputSize || 784;
      if (configuredInput !== expectedInput) {
        toast.error(`Input size mismatch! Layer expects ${configuredInput}, data has ${expectedInput}.`);
        return;
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
    setStatus('training');
    stopTrainingRef.current = false;

    try {
      modelRef.current = buildTFModel(nodes, edges);
      
      const isClassification = processedData.numClasses > 1 || processedData.type === 'classification';
      const loss = isClassification ? 'categoricalCrossentropy' : 'meanSquaredError';
      
      compileModel(modelRef.current, {
        optimizer,
        learningRate,
        loss,
        metrics: ['acc'],
      });

      let xTrain, yTrain;
      
      if (processedData.type === 'csv' && processedData.raw) {
        const processed = processCSVData(processedData.raw, targetColumn);
        xTrain = processed.xTrain;
        yTrain = processed.yTrain;
      } else {
        xTrain = processedData.xTrain;
        yTrain = processedData.yTrain;
      }

      await trainModel(modelRef.current, xTrain, yTrain, {
        epochs,
        batchSize,
        validationSplit: 0.2,
      }, {
        onEpochEnd: (epoch, logs) => {
          if (stopTrainingRef.current) {
            modelRef.current.stopTraining = true;
            return;
          }
          
          setCurrentEpoch(epoch + 1);
          setTrainingHistory(prev => [...prev, {
            epoch: epoch + 1,
            loss: logs.loss != null ? Number(logs.loss).toFixed(4) : null,
            accuracy: logs.acc != null ? Number(logs.acc).toFixed(4) : null,
            valLoss: logs.val_loss != null ? Number(logs.val_loss).toFixed(4) : null,
            valAccuracy: logs.val_acc != null ? Number(logs.val_acc).toFixed(4) : null,
          }]);
        },
        onTrainEnd: async () => {
          setIsTraining(false);
          setStatus('complete');
          
          if (modelRef.current && onWeightsTrained) {
            try {
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
            } catch (e) {
              console.error('Failed to export weights:', e);
            }
          }
          
          toast.success('Training complete!');
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
    setStatus('idle');
    setErrorMessage('');
    setColumns([]);
    setTargetColumn('');
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

      // Check if model expects sequence input (3D) or flat input (2D)
      const hasLSTM = nodes.some(n => 
        n.data.layerType === 'LSTM' || 
        n.data.layerType === 'GRU' ||
        n.data.layerType === 'RNN'
      );
      
      let inputTensor;
      if (hasLSTM) {
        // Reshape for RNN: [batch, timesteps, features]
        const seqLength = inputLayer?.data?.config?.sequenceLength || inputSize;
        const features = Math.ceil(inputSize / seqLength);
        const paddedVector = [...inputVector, ...new Array(seqLength * features - inputVector.length).fill(0)];
        inputTensor = tf.tensor3d([paddedVector.slice(0, seqLength * features)], [1, seqLength, features]);
      } else {
        inputTensor = tf.tensor2d([inputVector], [1, inputSize]);
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

  if (!isOpen) return null;

  return (
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
              <div>
                <h2 className="font-bold text-base sm:text-lg">Train Network</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">TensorFlow.js</p>
              </div>
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
              {/* Data Upload Section */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                  1. Load Data
                </h3>
                
                <Tabs value={dataType} onValueChange={setDataType}>
                  <TabsList className="grid grid-cols-3 w-full h-9 sm:h-10">
                    <TabsTrigger value="csv" className="text-xs sm:text-sm" data-testid="tab-csv">
                      <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      CSV
                    </TabsTrigger>
                    <TabsTrigger value="images" className="text-xs sm:text-sm" data-testid="tab-images">
                      <Image className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Images
                    </TabsTrigger>
                    <TabsTrigger value="sample" className="text-xs sm:text-sm" data-testid="tab-sample">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Sample
                    </TabsTrigger>
                  </TabsList>

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
                    
                    {columns.length > 0 && (
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
                  </TabsContent>

                  <TabsContent value="sample" className="space-y-3 mt-3 sm:mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline"
                        className="text-xs sm:text-sm h-9 sm:h-10"
                        onClick={() => handleGenerateSample('classification')}
                        data-testid="generate-classification-btn"
                      >
                        Classification
                      </Button>
                      <Button 
                        variant="outline"
                        className="text-xs sm:text-sm h-9 sm:h-10"
                        onClick={() => handleGenerateSample('regression')}
                        data-testid="generate-regression-btn"
                      >
                        Regression
                      </Button>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Generate synthetic data for testing
                    </p>
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
                      {status === 'training' && `Epoch ${currentEpoch}/${epochs}`}
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

              {/* Training Config */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                  2. Config
                </h3>

                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <Label>Epochs</Label>
                      <span className="text-muted-foreground">{epochs}</span>
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
                      <Label>Batch Size</Label>
                      <span className="text-muted-foreground">{batchSize}</span>
                    </div>
                    <Slider
                      value={[batchSize]}
                      onValueChange={([v]) => setBatchSize(v)}
                      min={8}
                      max={128}
                      step={8}
                      disabled={isTraining}
                      data-testid="batch-size-slider"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <Label>Learning Rate</Label>
                      <span className="text-muted-foreground">{learningRate}</span>
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
                    <Label className="text-xs sm:text-sm">Optimizer</Label>
                    <Select value={optimizer} onValueChange={setOptimizer} disabled={isTraining}>
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm" data-testid="select-optimizer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adam" className="text-xs sm:text-sm">Adam</SelectItem>
                        <SelectItem value="sgd" className="text-xs sm:text-sm">SGD</SelectItem>
                        <SelectItem value="rmsprop" className="text-xs sm:text-sm">RMSprop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Training Progress */}
              {trainingHistory.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                    3. Progress
                  </h3>
                  
                  <div className="h-36 sm:h-48 w-full">
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
                    
                    {/* Save Training Results Button */}
                    {trainingHistory.length > 0 && onSaveTrainingData && (
                      <div className="pt-4 border-t border-border mt-4">
                        <Button
                          onClick={handleSaveTrainingData}
                          className="w-full"
                          variant="outline"
                          data-testid="save-training-btn"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Training Results
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                          Save training history with your model to restore it later
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
