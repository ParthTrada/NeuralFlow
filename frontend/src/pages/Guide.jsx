import React, { useEffect, useRef, useState } from 'react';
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
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '../components/ui/button';

// Real platform screenshots
const SCREENSHOTS = {
  templates: 'https://customer-assets.emergentagent.com/job_model-dataset-sync/artifacts/hsdt4rak_Screenshot%202026-01-11%20at%202.37.06%E2%80%AFAM.png',
  canvas: 'https://customer-assets.emergentagent.com/job_model-dataset-sync/artifacts/r71b3f5q_Screenshot%202026-01-11%20at%202.25.09%E2%80%AFAM.png',
  datasets: 'https://customer-assets.emergentagent.com/job_model-dataset-sync/artifacts/dgaibmco_Screenshot%202026-01-11%20at%202.25.40%E2%80%AFAM.png',
  training: 'https://customer-assets.emergentagent.com/job_model-dataset-sync/artifacts/uimg73xe_Screenshot%202026-01-11%20at%202.37.58%E2%80%AFAM.png',
  code: 'https://customer-assets.emergentagent.com/job_model-dataset-sync/artifacts/725etyvq_Screenshot%202026-01-11%20at%202.27.14%E2%80%AFAM.png',
};

// Animated Background Component (same as Landing page)
const AnimatedBackground = ({ isDark }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let nodes = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 3;
      initNodes();
    };

    const initNodes = () => {
      nodes = [];
      const nodeCount = Math.floor((canvas.width * canvas.height) / 30000);
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 2 + 1,
        });
      }
    };

    const draw = () => {
      ctx.fillStyle = isDark ? 'rgba(5, 5, 5, 0.1)' : 'rgba(250, 250, 250, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.2)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.globalAlpha = (1 - dist / 150) * 0.4;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      nodes.forEach(node => {
        ctx.fillStyle = isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.6)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

// Screenshot Card with glow effect
const ScreenshotCard = ({ src, alt, className = '', isDark }) => (
  <div className={`relative group ${className}`}>
    <div className={`absolute -inset-1 bg-gradient-to-r rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300 ${
      isDark ? 'from-violet-600/30 to-fuchsia-600/30' : 'from-violet-500/20 to-fuchsia-500/20'
    }`} />
    <div className={`relative rounded-xl overflow-hidden border backdrop-blur-sm ${
      isDark ? 'border-white/10 bg-black/50' : 'border-zinc-200 bg-white/50'
    }`}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-auto object-cover"
        loading="lazy"
      />
    </div>
  </div>
);

const Guide = () => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className={`min-h-screen relative transition-colors duration-300 ${
      isDark ? 'bg-[#050505] text-white' : 'bg-[#fafafa] text-zinc-900'
    }`}>
      <AnimatedBackground isDark={isDark} />
      
      {/* Header */}
      <header className={`border-b backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300 ${
        isDark ? 'border-white/10 bg-[#050505]/80' : 'border-zinc-200 bg-white/80'
      }`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className={`flex items-center gap-2 transition-colors ${
            isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
          }`}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={`w-9 h-9 ${isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}
              data-testid="theme-toggle-btn"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Link to="/builder">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="start-building-btn">
                Start Building
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 ${
              isDark ? 'bg-violet-500/10 border-violet-500/20' : 'bg-violet-500/10 border-violet-500/30'
            }`}>
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className={`text-sm ${isDark ? 'text-violet-300' : 'text-violet-600'}`}>Learn in 5 minutes</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Build Your First <br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Neural Network
              </span>
            </h1>
            <p className={`text-lg max-w-xl mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              A visual guide to creating, training, and exporting neural networks without writing code.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Step 1: Choose a Template */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <StepBadge number="1" color="violet" label="Step One" isDark={isDark} />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Start with a Template
              </h2>
              <p className={`text-lg mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Choose from pre-built architectures designed for different tasks. Each template is optimized and ready to train.
              </p>
              <div className="space-y-3">
                <FeatureItem icon={Brain} text="Simple MLP for tabular data classification" isDark={isDark} />
                <FeatureItem icon={Layers} text="CNN for image recognition" isDark={isDark} />
                <FeatureItem icon={Zap} text="Transformer for text analysis" isDark={isDark} />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <ScreenshotCard 
                src={SCREENSHOTS.templates} 
                alt="Template selection panel showing MLP, CNN, RNN, Transformer options"
                isDark={isDark}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 2: Visual Canvas */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <ScreenshotCard 
                src={SCREENSHOTS.canvas} 
                alt="Visual canvas showing connected neural network layers"
                isDark={isDark}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <StepBadge number="2" color="cyan" label="Step Two" isDark={isDark} />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Connect Layers Visually
              </h2>
              <p className={`text-lg mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Drag and drop layers onto the canvas. Connect them by drawing lines. Your network takes shape in real-time.
              </p>
              <div className="space-y-3">
                <FeatureItem icon={MousePointer2} text="Drag layers from the sidebar" isDark={isDark} />
                <FeatureItem icon={ArrowRight} text="Connect by clicking and dragging" isDark={isDark} />
                <FeatureItem icon={Sparkles} text="Configure each layer with a click" isDark={isDark} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 3: Load Dataset */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <StepBadge number="3" color="emerald" label="Step Three" isDark={isDark} />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Load a Dataset
              </h2>
              <p className={`text-lg mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Use built-in datasets or upload your own CSV. The model auto-adjusts parameters to match your data!
              </p>
              <div className="space-y-3">
                <FeatureItem icon={Database} text="Browse sample datasets with smart matching" isDark={isDark} />
                <FeatureItem icon={Layers} text="Filter by type: Tabular, Image, Text" isDark={isDark} />
                <FeatureItem icon={Zap} text="Auto-adjust model to fit your data" isDark={isDark} />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <ScreenshotCard 
                src={SCREENSHOTS.datasets} 
                alt="Sample datasets browser showing Iris, MNIST, Fashion Items"
                isDark={isDark}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 4: Train */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <ScreenshotCard 
                src={SCREENSHOTS.training} 
                alt="Training panel showing epochs, learning rate, and accuracy/loss chart"
                isDark={isDark}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <StepBadge number="4" color="fuchsia" label="Step Four" isDark={isDark} />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Train & Watch it Learn
              </h2>
              <p className={`text-lg mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Click "Train" and watch your model learn in real-time. Track accuracy and loss as it improves epoch by epoch.
              </p>
              <div className="space-y-3">
                <FeatureItem icon={Play} text="Training happens in your browser" isDark={isDark} />
                <FeatureItem icon={Zap} text="Real-time accuracy & loss charts" isDark={isDark} />
                <FeatureItem icon={Database} text="Configure epochs, batch size, learning rate" isDark={isDark} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 5: Export */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <StepBadge number="5" color="orange" label="Step Five" isDark={isDark} />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Export Production Code
              </h2>
              <p className={`text-lg mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Export your model as PyTorch or TensorFlow/Keras code. Copy directly or download the file.
              </p>
              <div className="flex gap-3">
                <div className={`flex-1 p-4 rounded-xl border transition-colors ${
                  isDark 
                    ? 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40' 
                    : 'bg-orange-50 border-orange-200 hover:border-orange-400'
                }`}>
                  <div className="text-orange-500 font-bold mb-1">PyTorch</div>
                  <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Research & flexibility</div>
                </div>
                <div className={`flex-1 p-4 rounded-xl border transition-colors ${
                  isDark 
                    ? 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40' 
                    : 'bg-blue-50 border-blue-200 hover:border-blue-400'
                }`}>
                  <div className="text-blue-500 font-bold mb-1">Keras</div>
                  <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Production & mobile</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <ScreenshotCard 
                src={SCREENSHOTS.code} 
                alt="Generated PyTorch code with copy and download options"
                isDark={isDark}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA - Simple text with button */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Build?</h2>
            <p className={`mb-8 max-w-md mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Start with a template and have your first model running in under a minute.
            </p>
            <Link to="/builder">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white text-lg px-8 py-6" data-testid="start-building-cta">
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
const StepBadge = ({ number, color, label, isDark }) => {
  const colors = {
    violet: 'bg-violet-500/20 text-violet-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    fuchsia: 'bg-fuchsia-500/20 text-fuchsia-400',
    orange: 'bg-orange-500/20 text-orange-400',
  };
  
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center font-bold`}>
        {number}
      </div>
      <span className={`text-sm font-medium uppercase tracking-wider ${colors[color].split(' ')[1]}`}>{label}</span>
    </div>
  );
};

const FeatureItem = ({ icon: Icon, text, isDark }) => (
  <div className={`flex items-center gap-3 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
      isDark ? 'bg-white/5 border border-white/10' : 'bg-violet-50 border border-violet-100'
    }`}>
      <Icon className="w-4 h-4 text-violet-400" />
    </div>
    <span className="text-sm">{text}</span>
  </div>
);

export default Guide;
