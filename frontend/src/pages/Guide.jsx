import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  ChevronRight,
  Sparkles,
  Brain,
  MousePointer2,
  Layers,
  Database,
  Code,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';

const Guide = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <Link to="/builder">
            <Button className="bg-violet-600 hover:bg-violet-700" data-testid="start-building-btn">
              Start Building
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 to-transparent" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">Learn in 5 minutes</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Build Your First <br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Neural Network
              </span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto">
              A visual guide to creating, training, and exporting neural networks without writing code.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Step 1: Choose a Template */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
                  1
                </div>
                <span className="text-sm text-violet-400 font-medium uppercase tracking-wider">Step One</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Start with a Template
              </h2>
              <p className="text-zinc-400 text-lg mb-6">
                Choose from pre-built architectures designed for different tasks. Each template is optimized and ready to train.
              </p>
              <div className="space-y-3">
                <FeatureItem icon={Brain} text="Simple MLP for tabular data classification" />
                <FeatureItem icon={Layers} text="CNN for image recognition" />
                <FeatureItem icon={Zap} text="Transformer for text analysis" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/50 shadow-2xl">
                <div className="absolute top-0 left-0 right-0 h-8 bg-zinc-800/80 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <img 
                  src="https://dag-ml-builder.preview.emergentagent.com/api/placeholder/templates"
                  alt="Template Selection"
                  className="w-full pt-8"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div class="pt-8 p-8 text-center">
                        <div class="bg-zinc-800 rounded-xl p-6 space-y-3">
                          <div class="flex items-center gap-3 p-3 bg-zinc-700/50 rounded-lg border border-violet-500/30">
                            <div class="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">🧠</div>
                            <div class="text-left"><div class="font-medium text-sm">Simple MLP</div><div class="text-xs text-zinc-400">3 layers, 128 neurons</div></div>
                          </div>
                          <div class="flex items-center gap-3 p-3 bg-zinc-700/50 rounded-lg">
                            <div class="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">🖼️</div>
                            <div class="text-left"><div class="font-medium text-sm">CNN - Image Classifier</div><div class="text-xs text-zinc-400">Conv2D + Pooling</div></div>
                          </div>
                          <div class="flex items-center gap-3 p-3 bg-zinc-700/50 rounded-lg">
                            <div class="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">📈</div>
                            <div class="text-left"><div class="font-medium text-sm">RNN - Sequence Model</div><div class="text-xs text-zinc-400">LSTM layers</div></div>
                          </div>
                          <div class="flex items-center gap-3 p-3 bg-zinc-700/50 rounded-lg">
                            <div class="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">📝</div>
                            <div class="text-left"><div class="font-medium text-sm">Text Classifier</div><div class="text-xs text-zinc-400">Embedding + LSTM</div></div>
                          </div>
                        </div>
                      </div>
                    `;
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 2: Visual Canvas */}
      <section className="py-16 border-t border-white/5 bg-gradient-to-b from-zinc-900/50 to-transparent">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/50 shadow-2xl">
                <div className="absolute top-0 left-0 right-0 h-8 bg-zinc-800/80 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                {/* Visual representation of the canvas */}
                <div className="pt-8 p-6">
                  <div className="flex items-center justify-center gap-4 flex-wrap py-8">
                    <NodeBlock label="Input" sublabel="4 features" color="from-blue-500 to-blue-600" />
                    <ConnectionLine />
                    <NodeBlock label="Dense" sublabel="64 units" color="from-violet-500 to-violet-600" />
                    <ConnectionLine />
                    <NodeBlock label="Dense" sublabel="32 units" color="from-violet-500 to-violet-600" />
                    <ConnectionLine />
                    <NodeBlock label="Output" sublabel="3 classes" color="from-emerald-500 to-emerald-600" />
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                  2
                </div>
                <span className="text-sm text-cyan-400 font-medium uppercase tracking-wider">Step Two</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Connect Layers Visually
              </h2>
              <p className="text-zinc-400 text-lg mb-6">
                Drag and drop layers onto the canvas. Connect them by drawing lines from output to input. Your network takes shape in real-time.
              </p>
              <div className="space-y-3">
                <FeatureItem icon={MousePointer2} text="Drag layers from the sidebar" />
                <FeatureItem icon={ArrowRight} text="Connect by clicking and dragging" />
                <FeatureItem icon={Sparkles} text="Configure each layer with a click" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 3: Load Dataset */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                  3
                </div>
                <span className="text-sm text-emerald-400 font-medium uppercase tracking-wider">Step Three</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Load a Dataset
              </h2>
              <p className="text-zinc-400 text-lg mb-6">
                Use our built-in datasets or upload your own CSV. The model auto-adjusts to match your data!
              </p>
              <div className="grid grid-cols-2 gap-3">
                <DatasetPill icon="🌸" name="Iris Flowers" />
                <DatasetPill icon="🔢" name="MNIST Digits" />
                <DatasetPill icon="💬" name="Sentiment" />
                <DatasetPill icon="📰" name="News Headlines" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/50 shadow-2xl">
                <div className="absolute top-0 left-0 right-0 h-8 bg-zinc-800/80 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="pt-8 p-6">
                  <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                    <div className="flex gap-2 mb-4">
                      <div className="px-3 py-1.5 bg-violet-500 rounded-lg text-xs font-medium">Datasets</div>
                      <div className="px-3 py-1.5 bg-zinc-700 rounded-lg text-xs text-zinc-400">CSV</div>
                      <div className="px-3 py-1.5 bg-zinc-700 rounded-lg text-xs text-zinc-400">Images</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-violet-500/10 rounded-lg border border-violet-500/30">
                        <span className="text-xl">🌸</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Iris Flowers</div>
                          <div className="text-xs text-zinc-400">150 samples • 4 features</div>
                        </div>
                        <span className="px-2 py-0.5 bg-violet-500 rounded text-[10px] font-medium">Match</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-zinc-700/30 rounded-lg">
                        <span className="text-xl">🔢</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">MNIST Digits</div>
                          <div className="text-xs text-zinc-400">100 samples • Image</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 4: Train */}
      <section className="py-16 border-t border-white/5 bg-gradient-to-b from-zinc-900/50 to-transparent">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/50 shadow-2xl">
                <div className="absolute top-0 left-0 right-0 h-8 bg-zinc-800/80 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="pt-8 p-6">
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Training Progress</span>
                      <span className="text-xs text-emerald-400">Epoch 8/10</span>
                    </div>
                    <div className="h-2 bg-zinc-700 rounded-full mb-4 overflow-hidden">
                      <div className="h-full w-4/5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-emerald-400">94.2%</div>
                        <div className="text-xs text-zinc-400">Accuracy</div>
                      </div>
                      <div className="bg-zinc-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-violet-400">0.18</div>
                        <div className="text-xs text-zinc-400">Loss</div>
                      </div>
                    </div>
                    {/* Mini chart */}
                    <div className="mt-4 h-20 flex items-end gap-1">
                      {[40, 55, 65, 72, 78, 85, 88, 91, 93, 94].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-violet-500/50 to-violet-500 rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 font-bold">
                  4
                </div>
                <span className="text-sm text-fuchsia-400 font-medium uppercase tracking-wider">Step Four</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Train & Watch it Learn
              </h2>
              <p className="text-zinc-400 text-lg mb-6">
                Click "Start Training" and watch your model learn in real-time. Track accuracy and loss as it improves with each epoch.
              </p>
              <div className="space-y-3">
                <FeatureItem icon={Play} text="Training happens in your browser" />
                <FeatureItem icon={Zap} text="Real-time accuracy charts" />
                <FeatureItem icon={Database} text="Save and restore trained models" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 5: Export */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                  5
                </div>
                <span className="text-sm text-orange-400 font-medium uppercase tracking-wider">Step Five</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Export Production Code
              </h2>
              <p className="text-zinc-400 text-lg mb-6">
                Export your model as PyTorch or TensorFlow/Keras code. Copy it directly into your project or download the file.
              </p>
              <div className="flex gap-3">
                <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20">
                  <div className="text-orange-400 font-bold mb-1">PyTorch</div>
                  <div className="text-xs text-zinc-400">Research & flexibility</div>
                </div>
                <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
                  <div className="text-blue-400 font-bold mb-1">Keras</div>
                  <div className="text-xs text-zinc-400">Production & mobile</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/50 shadow-2xl">
                <div className="absolute top-0 left-0 right-0 h-8 bg-zinc-800/80 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="pt-8 p-4">
                  <pre className="text-xs text-zinc-300 font-mono overflow-x-auto">
{`import torch.nn as nn

class NeuralNetwork(nn.Module):
    def __init__(self):
        super().__init__()
        self.layer1 = nn.Linear(4, 64)
        self.layer2 = nn.Linear(64, 32)
        self.output = nn.Linear(32, 3)
    
    def forward(self, x):
        x = torch.relu(self.layer1(x))
        x = torch.relu(self.layer2(x))
        return self.output(x)`}
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-violet-600/20 to-transparent" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Build?</h2>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
              Start with a template and have your first model running in under a minute.
            </p>
            <Link to="/builder">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-lg px-8 py-6" data-testid="start-building-cta">
                <Brain className="w-5 h-5 mr-2" />
                Start Building
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

// Helper Components
const FeatureItem = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-3 text-zinc-300">
    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
      <Icon className="w-4 h-4 text-zinc-400" />
    </div>
    <span className="text-sm">{text}</span>
  </div>
);

const NodeBlock = ({ label, sublabel, color }) => (
  <div className={`px-4 py-3 rounded-xl bg-gradient-to-br ${color} shadow-lg min-w-[90px] text-center`}>
    <div className="font-semibold text-sm text-white">{label}</div>
    <div className="text-[10px] text-white/70">{sublabel}</div>
  </div>
);

const ConnectionLine = () => (
  <div className="w-8 h-0.5 bg-gradient-to-r from-zinc-600 to-zinc-500 hidden sm:block" />
);

const DatasetPill = ({ icon, name }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-white/5">
    <span>{icon}</span>
    <span className="text-sm text-zinc-300">{name}</span>
  </div>
);

export default Guide;
