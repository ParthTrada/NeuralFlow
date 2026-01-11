import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  MousePointer2,
  Link2,
  Play,
  Database,
  Code,
  Download,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Target,
  Zap,
  Box,
  GitBranch,
  Brain,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const Guide = () => {
  const [expandedSection, setExpandedSection] = useState('getting-started');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <Link to="/builder">
            <Button size="sm" data-testid="start-building-btn">
              Start Building
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-4">
              <Lightbulb className="w-3 h-3 mr-1" />
              Beginner Friendly
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              How to Use <span className="text-primary">NeuralFlow</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Learn how to build, train, and export neural networks visually — no coding required!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="py-10 sm:py-12 border-b border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">4 Simple Steps</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Layers, title: '1. Add Layers', desc: 'Drag & drop layers', color: 'text-blue-500' },
              { icon: Link2, title: '2. Connect', desc: 'Link layers together', color: 'text-green-500' },
              { icon: Database, title: '3. Load Data', desc: 'Use sample datasets', color: 'text-purple-500' },
              { icon: Play, title: '4. Train', desc: 'Watch it learn!', color: 'text-orange-500' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 text-center"
              >
                <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center ${step.color}`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">{step.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Guide Sections */}
      <section className="py-10 sm:py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* Getting Started */}
          <GuideSection
            id="getting-started"
            title="Getting Started"
            icon={Target}
            isExpanded={expandedSection === 'getting-started'}
            onToggle={() => toggleSection('getting-started')}
          >
            <div className="space-y-6">
              <p className="text-muted-foreground">
                NeuralFlow lets you build neural networks by dragging and dropping layers onto a canvas. 
                No coding experience needed!
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Quick Start (30 seconds)
                </h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                    <span>Click <strong>"Start Building"</strong> on the home page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                    <span>In the left panel, click <strong>"Simple MLP"</strong> template</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                    <span>Click <strong>"Train"</strong> → Select <strong>"Iris Flowers"</strong> dataset</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">4</span>
                    <span>Click <strong>"Start Training"</strong> and watch your model learn!</span>
                  </li>
                </ol>
              </div>

              {/* Visual Diagram */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h4 className="font-semibold mb-4 text-center">Your First Neural Network</h4>
                <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                  <NetworkBlock label="Input" sublabel="4 features" color="bg-blue-500/20 border-blue-500" />
                  <Arrow />
                  <NetworkBlock label="Dense" sublabel="64 neurons" color="bg-purple-500/20 border-purple-500" />
                  <Arrow />
                  <NetworkBlock label="Dense" sublabel="32 neurons" color="bg-purple-500/20 border-purple-500" />
                  <Arrow />
                  <NetworkBlock label="Output" sublabel="3 classes" color="bg-green-500/20 border-green-500" />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  This simple network can classify Iris flowers into 3 species!
                </p>
              </div>
            </div>
          </GuideSection>

          {/* Understanding Layers */}
          <GuideSection
            id="layers"
            title="Understanding Layers"
            icon={Layers}
            isExpanded={expandedSection === 'layers'}
            onToggle={() => toggleSection('layers')}
          >
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Layers are the building blocks of neural networks. Each layer transforms data in a specific way.
              </p>
              
              <div className="grid gap-3">
                <LayerCard 
                  name="Input" 
                  desc="Entry point for your data. Configure the shape based on your dataset."
                  useCase="Always start with this layer"
                  color="blue"
                />
                <LayerCard 
                  name="Dense (Linear)" 
                  desc="Fully connected layer. Each neuron connects to all neurons in the previous layer."
                  useCase="Basic classification, regression"
                  color="purple"
                />
                <LayerCard 
                  name="Conv2D" 
                  desc="Convolutional layer for image processing. Detects patterns like edges and shapes."
                  useCase="Image classification, object detection"
                  color="cyan"
                />
                <LayerCard 
                  name="LSTM" 
                  desc="Long Short-Term Memory. Remembers patterns over time sequences."
                  useCase="Time series, stock prediction"
                  color="green"
                />
                <LayerCard 
                  name="Embedding" 
                  desc="Converts words/tokens into numerical vectors."
                  useCase="Text classification, NLP"
                  color="orange"
                />
                <LayerCard 
                  name="Output" 
                  desc="Final layer that produces predictions. Set the number of classes."
                  useCase="Always end with this layer"
                  color="emerald"
                />
              </div>
            </div>
          </GuideSection>

          {/* Templates */}
          <GuideSection
            id="templates"
            title="Using Templates"
            icon={Box}
            isExpanded={expandedSection === 'templates'}
            onToggle={() => toggleSection('templates')}
          >
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Templates are pre-built architectures for common tasks. Start with a template and customize it!
              </p>
              
              <div className="grid sm:grid-cols-2 gap-3">
                <TemplateCard 
                  name="Simple MLP"
                  desc="Multi-layer perceptron for tabular data classification"
                  datasets={['Iris Flowers', 'MNIST (flat)']}
                />
                <TemplateCard 
                  name="CNN - Image Classifier"
                  desc="Convolutional network for image recognition"
                  datasets={['MNIST', 'Fashion', 'CIFAR-10']}
                />
                <TemplateCard 
                  name="RNN - Sequence Model"
                  desc="LSTM network for time series prediction"
                  datasets={['Stock Trends']}
                />
                <TemplateCard 
                  name="Text Classifier"
                  desc="Embedding + LSTM for text classification"
                  datasets={['Sentiment', 'SMS Spam', 'News']}
                />
                <TemplateCard 
                  name="Transformer"
                  desc="BERT-style attention model for NLP"
                  datasets={['Sentiment', 'Intents']}
                />
                <TemplateCard 
                  name="ResNet Block"
                  desc="Skip connections for deeper networks"
                  datasets={['MNIST', 'Fashion', 'CIFAR-10']}
                />
              </div>
            </div>
          </GuideSection>

          {/* Datasets */}
          <GuideSection
            id="datasets"
            title="Sample Datasets"
            icon={Database}
            isExpanded={expandedSection === 'datasets'}
            onToggle={() => toggleSection('datasets')}
          >
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We provide ready-to-use datasets that automatically match with your model template.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-semibold mb-3">How to Use Datasets</h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Click <strong>"Train"</strong> button in the header</li>
                  <li>2. Go to <strong>"Datasets"</strong> tab</li>
                  <li>3. Select a dataset with <Badge variant="default" className="text-[10px] px-1.5 py-0">Match</Badge> tag</li>
                  <li>4. Model parameters auto-adjust to fit the data!</li>
                </ol>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <DatasetCard icon="🌸" name="Iris Flowers" type="Tabular" samples={150} />
                <DatasetCard icon="🔢" name="MNIST Digits" type="Image" samples={100} />
                <DatasetCard icon="👕" name="Fashion Items" type="Image" samples={100} />
                <DatasetCard icon="💬" name="Sentiment" type="Text" samples={45} />
                <DatasetCard icon="📰" name="News Headlines" type="Text" samples={80} />
                <DatasetCard icon="📈" name="Stock Trends" type="Sequence" samples={1500} />
              </div>
            </div>
          </GuideSection>

          {/* Training */}
          <GuideSection
            id="training"
            title="Training Your Model"
            icon={Play}
            isExpanded={expandedSection === 'training'}
            onToggle={() => toggleSection('training')}
          >
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Training is how your neural network learns patterns from data.
              </p>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Training Parameters</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">Epochs</span>
                    <span className="text-muted-foreground">How many times to go through all data (10-50)</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">Batch Size</span>
                    <span className="text-muted-foreground">Samples processed at once (16-64)</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="font-medium">Learning Rate</span>
                    <span className="text-muted-foreground">How fast to learn (0.001 is good)</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Optimizer</span>
                    <span className="text-muted-foreground">Adam works best for most cases</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Good Training Signs
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Loss decreases over epochs</li>
                  <li>• Accuracy increases steadily</li>
                  <li>• Training and validation curves are close</li>
                </ul>
              </div>
            </div>
          </GuideSection>

          {/* Export Code */}
          <GuideSection
            id="export"
            title="Exporting Code"
            icon={Code}
            isExpanded={expandedSection === 'export'}
            onToggle={() => toggleSection('export')}
          >
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Export your visual model as PyTorch or TensorFlow/Keras code to use in your own projects.
              </p>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Export Options</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                    <h5 className="font-medium text-orange-400 mb-1">PyTorch</h5>
                    <p className="text-xs text-muted-foreground">Industry standard for research. Flexible and Pythonic.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <h5 className="font-medium text-blue-400 mb-1">TensorFlow/Keras</h5>
                    <p className="text-xs text-muted-foreground">Great for production. Easy deployment to mobile/web.</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-semibold mb-2">How to Export</h4>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Build your model on the canvas</li>
                  <li>2. Click <strong>"Code"</strong> button in the header</li>
                  <li>3. Toggle between PyTorch and Keras</li>
                  <li>4. Copy or download the code</li>
                </ol>
              </div>
            </div>
          </GuideSection>

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Build?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start with a template and experiment! The best way to learn is by doing.
          </p>
          <Link to="/builder">
            <Button size="lg" data-testid="start-building-cta">
              <Brain className="w-5 h-5 mr-2" />
              Start Building Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

// Helper Components
const GuideSection = ({ id, title, icon: Icon, isExpanded, onToggle, children }) => (
  <div className="border border-border rounded-xl mb-4 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full p-4 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors"
      data-testid={`guide-section-${id}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="font-semibold">{title}</span>
      </div>
      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
    </button>
    {isExpanded && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="p-4 pt-0 border-t border-border"
      >
        {children}
      </motion.div>
    )}
  </div>
);

const NetworkBlock = ({ label, sublabel, color }) => (
  <div className={`px-3 py-2 rounded-lg border-2 ${color} text-center min-w-[70px]`}>
    <div className="font-semibold text-xs sm:text-sm">{label}</div>
    <div className="text-[10px] text-muted-foreground">{sublabel}</div>
  </div>
);

const Arrow = () => (
  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
);

const LayerCard = ({ name, desc, useCase, color }) => {
  const colors = {
    blue: 'border-blue-500/30 bg-blue-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    cyan: 'border-cyan-500/30 bg-cyan-500/5',
    green: 'border-green-500/30 bg-green-500/5',
    orange: 'border-orange-500/30 bg-orange-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
  };
  
  return (
    <div className={`p-3 rounded-lg border ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <h5 className="font-semibold text-sm">{name}</h5>
          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
        </div>
      </div>
      <div className="mt-2">
        <Badge variant="secondary" className="text-[10px]">{useCase}</Badge>
      </div>
    </div>
  );
};

const TemplateCard = ({ name, desc, datasets }) => (
  <div className="p-3 rounded-lg border border-border bg-card">
    <h5 className="font-semibold text-sm">{name}</h5>
    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    <div className="flex flex-wrap gap-1 mt-2">
      {datasets.map((ds, i) => (
        <Badge key={i} variant="outline" className="text-[10px]">{ds}</Badge>
      ))}
    </div>
  </div>
);

const DatasetCard = ({ icon, name, type, samples }) => (
  <div className="p-3 rounded-lg border border-border bg-card flex items-center gap-3">
    <span className="text-2xl">{icon}</span>
    <div>
      <h5 className="font-semibold text-sm">{name}</h5>
      <p className="text-xs text-muted-foreground">{type} • {samples} samples</p>
    </div>
  </div>
);

export default Guide;
