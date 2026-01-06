import React, { useState, useCallback, useRef } from 'react';
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
  X
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

export const TrainingPanel = ({ nodes, edges, isOpen, onClose, onWeightsTrained }) => {
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
  const [status, setStatus] = useState('idle'); // idle, loading, ready, training, complete, error
  const [errorMessage, setErrorMessage] = useState('');
  
  // Prediction state
  const [predictionInput, setPredictionInput] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  
  const modelRef = useRef(null);
  const stopTrainingRef = useRef(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

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
      setTargetColumn(cols[cols.length - 1]); // Default to last column
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
      toast.success(`Generated ${type} sample dataset (input shape: [${data.inputShape.join(', ')}], ${data.numClasses} classes)`);
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

    setIsTraining(true);
    setTrainingHistory([]);
    setCurrentEpoch(0);
    setStatus('training');
    stopTrainingRef.current = false;

    try {
      // Build model from nodes
      modelRef.current = buildTFModel(nodes, edges);
      
      // Determine loss function based on task - always use accuracy for classification
      const isClassification = processedData.numClasses > 1 || processedData.type === 'classification';
      const loss = isClassification ? 'categoricalCrossentropy' : 'meanSquaredError';
      
      // Compile model - always include accuracy for classification
      compileModel(modelRef.current, {
        optimizer,
        learningRate,
        loss,
        metrics: ['accuracy'],  // Always use accuracy
      });

      // Get training data
      let xTrain, yTrain;
      
      if (processedData.type === 'csv' && processedData.raw) {
        const processed = processCSVData(processedData.raw, targetColumn);
        xTrain = processed.xTrain;
        yTrain = processed.yTrain;
      } else {
        xTrain = processedData.xTrain;
        yTrain = processedData.yTrain;
      }

      // Train model
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
          
          // Debug: log all available metrics
          console.log('Training logs:', logs);
          
          // TensorFlow.js returns 'acc' or 'accuracy' depending on version
          const accuracy = logs.acc ?? logs.accuracy ?? null;
          const valAccuracy = logs.val_acc ?? logs.val_accuracy ?? null;
          
          setCurrentEpoch(epoch + 1);
          setTrainingHistory(prev => [...prev, {
            epoch: epoch + 1,
            loss: logs.loss?.toFixed(4),
            accuracy: accuracy?.toFixed(4),
            valLoss: logs.val_loss?.toFixed(4),
            valAccuracy: valAccuracy?.toFixed(4),
          }]);
        },
        onTrainEnd: async () => {
          setIsTraining(false);
          setStatus('complete');
          
          // Export weights as base64
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

  // Stop training
  const handleStopTraining = () => {
    stopTrainingRef.current = true;
    setIsTraining(false);
    toast.info('Training stopped');
  };

  // Reset
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
  };

  // Make prediction
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
      // Parse input - expect comma-separated values
      const inputValues = predictionInput.split(',').map(v => parseFloat(v.trim()));
      
      if (inputValues.some(isNaN)) {
        throw new Error('Invalid input - please enter comma-separated numbers');
      }

      // Create tensor from input
      const inputTensor = tf.tensor2d([inputValues]);
      
      // Make prediction
      const prediction = modelRef.current.predict(inputTensor);
      const predictionData = await prediction.data();
      
      // Get class labels if available
      const labels = processedData?.uniqueTargets || processedData?.uniqueLabels;
      
      // Format results
      let result;
      if (predictionData.length > 1) {
        // Classification - find highest probability class
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
        // Regression - single value
        result = {
          type: 'regression',
          value: predictionData[0].toFixed(4)
        };
      }
      
      setPredictionResult(result);
      
      // Cleanup tensors
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
          className="absolute right-0 top-0 bottom-0 w-[500px] bg-card border-l border-border shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          data-testid="training-panel"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Train Network</h2>
                <p className="text-xs text-muted-foreground">Browser-based training with TensorFlow.js</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-training-btn">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-4 space-y-6">
              {/* Data Upload Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  1. Load Data
                </h3>
                
                <Tabs value={dataType} onValueChange={setDataType}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="csv" data-testid="tab-csv">
                      <FileSpreadsheet className="w-4 h-4 mr-1" />
                      CSV
                    </TabsTrigger>
                    <TabsTrigger value="images" data-testid="tab-images">
                      <Image className="w-4 h-4 mr-1" />
                      Images
                    </TabsTrigger>
                    <TabsTrigger value="sample" data-testid="tab-sample">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Sample
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="csv" className="space-y-3 mt-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      className="w-full h-20 border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="upload-csv-btn"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="w-5 h-5" />
                        <span>{file ? file.name : 'Upload CSV File'}</span>
                      </div>
                    </Button>
                    
                    {columns.length > 0 && (
                      <div className="space-y-2">
                        <Label>Target Column (Label)</Label>
                        <Select value={targetColumn} onValueChange={setTargetColumn}>
                          <SelectTrigger data-testid="select-target-column">
                            <SelectValue placeholder="Select target column" />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="images" className="space-y-3 mt-4">
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
                      className="w-full h-20 border-dashed"
                      onClick={() => imageInputRef.current?.click()}
                      data-testid="upload-images-btn"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="w-5 h-5" />
                        <span>Upload Image Folder</span>
                        <span className="text-xs text-muted-foreground">Organize by class folders</span>
                      </div>
                    </Button>
                  </TabsContent>

                  <TabsContent value="sample" className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => handleGenerateSample('classification')}
                        data-testid="generate-classification-btn"
                      >
                        Classification
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleGenerateSample('regression')}
                        data-testid="generate-regression-btn"
                      >
                        Regression
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Generate synthetic data for testing your network
                    </p>
                  </TabsContent>
                </Tabs>

                {/* Status indicator */}
                {status !== 'idle' && (
                  <div className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                    status === 'ready' ? 'bg-green-500/10 text-green-500' :
                    status === 'loading' ? 'bg-blue-500/10 text-blue-500' :
                    status === 'training' ? 'bg-primary/10 text-primary' :
                    status === 'complete' ? 'bg-green-500/10 text-green-500' :
                    status === 'error' ? 'bg-red-500/10 text-red-500' : ''
                  }`}>
                    {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {status === 'ready' && <CheckCircle2 className="w-4 h-4" />}
                    {status === 'training' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {status === 'complete' && <CheckCircle2 className="w-4 h-4" />}
                    {status === 'error' && <AlertCircle className="w-4 h-4" />}
                    <span>
                      {status === 'loading' && 'Processing data...'}
                      {status === 'ready' && 'Data ready for training'}
                      {status === 'training' && `Training... Epoch ${currentEpoch}/${epochs}`}
                      {status === 'complete' && 'Training complete!'}
                      {status === 'error' && errorMessage}
                    </span>
                  </div>
                )}
                
                {/* Data info hint */}
                {status === 'ready' && processedData && (
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 text-xs">
                    <p><strong>Tip:</strong> Configure your first layer's input size to match: <code className="font-mono bg-blue-500/20 px-1 rounded">{processedData.inputShape?.[0] || 'N/A'}</code></p>
                    {processedData.numClasses > 1 && (
                      <p className="mt-1">Output layer should have <code className="font-mono bg-blue-500/20 px-1 rounded">{processedData.numClasses}</code> classes</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Training Config */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  2. Training Config
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Epochs</Label>
                      <span className="text-sm text-muted-foreground">{epochs}</span>
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
                    <div className="flex justify-between">
                      <Label>Batch Size</Label>
                      <span className="text-sm text-muted-foreground">{batchSize}</span>
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
                    <div className="flex justify-between">
                      <Label>Learning Rate</Label>
                      <span className="text-sm text-muted-foreground">{learningRate}</span>
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
                    <Label>Optimizer</Label>
                    <Select value={optimizer} onValueChange={setOptimizer} disabled={isTraining}>
                      <SelectTrigger data-testid="select-optimizer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adam">Adam</SelectItem>
                        <SelectItem value="sgd">SGD</SelectItem>
                        <SelectItem value="rmsprop">RMSprop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Training Progress */}
              {trainingHistory.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                    3. Training Progress
                  </h3>
                  
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trainingHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="epoch" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis 
                          yAxisId="left"
                          stroke="hsl(var(--destructive))"
                          fontSize={12}
                          domain={[0, 'auto']}
                          label={{ value: 'Loss', angle: -90, position: 'insideLeft', fontSize: 10 }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="hsl(var(--primary))"
                          fontSize={12}
                          domain={[0, 1]}
                          label={{ value: 'Accuracy', angle: 90, position: 'insideRight', fontSize: 10 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
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
                          name="Accuracy"
                          connectNulls
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="valLoss" 
                          stroke="hsl(var(--destructive))" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Val Loss"
                          connectNulls
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="valAccuracy" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Val Accuracy"
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Latest metrics */}
                  {trainingHistory.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded-lg bg-secondary">
                        <span className="text-muted-foreground">Loss:</span>
                        <span className="ml-2 font-mono">
                          {trainingHistory[trainingHistory.length - 1]?.loss || 'N/A'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary">
                        <span className="text-muted-foreground">Accuracy:</span>
                        <span className="ml-2 font-mono">
                          {trainingHistory[trainingHistory.length - 1]?.accuracy || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {!isTraining ? (
                  <>
                    <Button 
                      className="flex-1 glow-primary"
                      onClick={handleStartTraining}
                      disabled={status !== 'ready' && status !== 'complete'}
                      data-testid="start-training-btn"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Training
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleReset}
                      data-testid="reset-training-btn"
                    >
                      Reset
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={handleStopTraining}
                    data-testid="stop-training-btn"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Training
                  </Button>
                )}
              </div>

              {/* Prediction Section - Show after training */}
              {status === 'complete' && modelRef.current && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                      4. Test Your Model
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="prediction-input">
                          Enter Input Values (comma-separated)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="prediction-input"
                            placeholder={processedData?.inputShape ? 
                              `e.g., ${Array(processedData.inputShape[0]).fill('0.5').join(', ')}` : 
                              'e.g., 0.5, 0.3, 0.8'
                            }
                            value={predictionInput}
                            onChange={(e) => setPredictionInput(e.target.value)}
                            data-testid="prediction-input"
                          />
                          <Button 
                            onClick={handlePredict}
                            disabled={isPredicting || !predictionInput.trim()}
                            data-testid="predict-btn"
                          >
                            {isPredicting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Predict'
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Input shape: {processedData?.inputShape ? `[${processedData.inputShape.join(', ')}]` : 'unknown'}
                        </p>
                      </div>

                      {/* Prediction Result */}
                      {predictionResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-lg bg-primary/10 border border-primary/20"
                          data-testid="prediction-result"
                        >
                          {predictionResult.type === 'classification' ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">Predicted Class:</span>
                                <span className="text-lg font-bold text-primary">
                                  {predictionResult.predictedClass}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Confidence:</span>
                                <span className="font-mono">{predictionResult.confidence}%</span>
                              </div>
                              
                              {/* All probabilities */}
                              <div className="space-y-1 pt-2 border-t border-border">
                                <span className="text-xs text-muted-foreground">All Probabilities:</span>
                                {predictionResult.allProbabilities.slice(0, 5).map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-primary rounded-full transition-all"
                                        style={{ width: `${item.probability}%` }}
                                      />
                                    </div>
                                    <span className="w-20 text-xs">{item.class}</span>
                                    <span className="w-12 text-xs font-mono text-right">{item.probability}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Predicted Value:</span>
                              <span className="text-lg font-bold text-primary font-mono">
                                {predictionResult.value}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
