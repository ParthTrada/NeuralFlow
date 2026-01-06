import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MousePointer2, 
  Cpu, 
  Code2, 
  Share2, 
  ArrowRight,
  Sparkles,
  Zap,
  Layers,
  Play
} from 'lucide-react';
import { Button } from '../components/ui/button';

// Animated background with neural network nodes
const NeuralBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-10" />
    
    {/* Animated nodes */}
    <svg className="absolute inset-0 w-full h-full opacity-20">
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(263, 70%, 50%)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="hsl(263, 70%, 50%)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[...Array(20)].map((_, i) => (
        <motion.circle
          key={i}
          cx={`${Math.random() * 100}%`}
          cy={`${Math.random() * 100}%`}
          r={Math.random() * 3 + 1}
          fill="url(#nodeGlow)"
          initial={{ opacity: 0.3, scale: 0.8 }}
          animate={{ 
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}
      {/* Connection lines */}
      {[...Array(15)].map((_, i) => (
        <motion.line
          key={`line-${i}`}
          x1={`${Math.random() * 100}%`}
          y1={`${Math.random() * 100}%`}
          x2={`${Math.random() * 100}%`}
          y2={`${Math.random() * 100}%`}
          stroke="hsl(263, 70%, 50%)"
          strokeWidth="0.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.2 }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
      ))}
    </svg>
  </div>
);

// Feature card component
const FeatureCard = ({ icon: Icon, title, description, className, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    whileHover={{ scale: 1.02, y: -5 }}
    className={`group relative p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl overflow-hidden ${className}`}
  >
    {/* Glow effect on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-2 tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

// Animated demo preview
const DemoPreview = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: true }}
    className="relative rounded-2xl border border-border/50 bg-card/20 backdrop-blur-xl overflow-hidden"
  >
    {/* Mock builder interface */}
    <div className="aspect-video p-4">
      {/* Header bar */}
      <div className="h-10 rounded-lg bg-background/50 mb-4 flex items-center px-4 gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">NeuralFlows</span>
        </div>
      </div>
      
      {/* Content area */}
      <div className="flex gap-4 h-[calc(100%-3.5rem)]">
        {/* Left sidebar */}
        <div className="w-48 rounded-lg bg-background/30 p-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2">LAYERS</div>
          {['Dense', 'Conv2D', 'LSTM', 'Output'].map((layer, i) => (
            <motion.div
              key={layer}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1 + i * 0.2 }}
              className="flex items-center gap-2 p-2 rounded-md bg-secondary/30 mb-2 text-xs"
            >
              <Layers className="w-3 h-3 text-primary" />
              {layer}
            </motion.div>
          ))}
        </div>
        
        {/* Canvas area */}
        <div className="flex-1 rounded-lg bg-background/20 relative overflow-hidden">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle, hsl(263, 70%, 50%) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
          
          {/* Animated nodes */}
          <svg className="absolute inset-0 w-full h-full">
            {/* Node 1 - Input */}
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
            >
              <rect x="30%" y="20%" width="80" height="40" rx="8" fill="hsl(187, 95%, 42%)" fillOpacity="0.2" stroke="hsl(187, 95%, 42%)" strokeWidth="2" />
              <text x="30%" y="20%" dx="40" dy="25" textAnchor="middle" fill="white" fontSize="12">Input</text>
            </motion.g>
            
            {/* Node 2 - Dense */}
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.8 }}
            >
              <rect x="30%" y="45%" width="80" height="40" rx="8" fill="hsl(263, 70%, 50%)" fillOpacity="0.2" stroke="hsl(263, 70%, 50%)" strokeWidth="2" />
              <text x="30%" y="45%" dx="40" dy="25" textAnchor="middle" fill="white" fontSize="12">Dense</text>
            </motion.g>
            
            {/* Node 3 - Output */}
            <motion.g
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.1 }}
            >
              <rect x="30%" y="70%" width="80" height="40" rx="8" fill="hsl(158, 64%, 40%)" fillOpacity="0.2" stroke="hsl(158, 64%, 40%)" strokeWidth="2" />
              <text x="30%" y="70%" dx="40" dy="25" textAnchor="middle" fill="white" fontSize="12">Output</text>
            </motion.g>
            
            {/* Connection lines */}
            <motion.path
              d="M 70 100 L 70 180"
              stroke="hsl(263, 70%, 50%)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2.3, duration: 0.5 }}
              style={{ transform: 'translate(calc(30% + 10px), 0)' }}
            />
            <motion.path
              d="M 70 220 L 70 300"
              stroke="hsl(263, 70%, 50%)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 2.5, duration: 0.5 }}
              style={{ transform: 'translate(calc(30% + 10px), 0)' }}
            />
          </svg>
        </div>
        
        {/* Right sidebar */}
        <div className="w-48 rounded-lg bg-background/30 p-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2">PROPERTIES</div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="space-y-2"
          >
            <div className="text-xs text-muted-foreground">Units</div>
            <div className="h-8 rounded bg-secondary/50 flex items-center px-2 text-sm">128</div>
            <div className="text-xs text-muted-foreground mt-2">Activation</div>
            <div className="h-8 rounded bg-secondary/50 flex items-center px-2 text-sm">ReLU</div>
          </motion.div>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" data-testid="landing-page">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <NeuralBackground />
        
        <div className="container mx-auto px-6 py-20 relative z-20">
          <div className="max-w-4xl">
            {/* Overline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Free & Open Source
              </span>
            </motion.div>
            
            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none mb-6"
            >
              Build Neural Networks
              <span className="block text-primary">Visually</span>
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
            >
              Drag, drop, and connect layers to design your neural network architecture. 
              Train directly in your browser and export production-ready PyTorch code.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/builder">
                <Button 
                  size="lg" 
                  className="h-14 px-8 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 group"
                  data-testid="start-building-btn"
                >
                  Start Building
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#demo">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 px-8 text-lg font-semibold rounded-full border-border/50 hover:bg-card/50"
                  data-testid="see-demo-btn"
                >
                  <Play className="mr-2 w-5 h-5" />
                  See Demo
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative" id="features">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-primary mb-4 block">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Everything you need to<br />
              <span className="text-muted-foreground">prototype faster</span>
            </h2>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={MousePointer2}
              title="Drag & Drop Builder"
              description="Intuitive visual interface to design neural network architectures. Simply drag layers from the palette and connect them on the canvas."
              className="lg:col-span-2"
              delay={0.1}
            />
            <FeatureCard
              icon={Cpu}
              title="Train in Browser"
              description="Run training directly in your browser with TensorFlow.js. Watch loss and accuracy metrics update in real-time."
              delay={0.2}
            />
            <FeatureCard
              icon={Code2}
              title="Export PyTorch Code"
              description="Generate clean, production-ready PyTorch code with a single click. Download and run your models anywhere."
              delay={0.3}
            />
            <FeatureCard
              icon={Share2}
              title="Share & Collaborate"
              description="Share your network architectures with a link. Let others view, clone, and build upon your designs."
              className="lg:col-span-2"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-32 relative" id="demo">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-primary mb-4 block">
              See it in action
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Design networks in seconds
            </h2>
          </motion.div>

          <DemoPreview />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl border border-border/50 bg-card/20 backdrop-blur-xl p-12 sm:p-20 text-center overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
            
            <div className="relative z-10">
              <Zap className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Ready to build?
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
                Start designing your neural network architecture today. It's completely free.
              </p>
              <Link to="/builder">
                <Button 
                  size="lg" 
                  className="h-16 px-12 text-xl font-semibold rounded-full bg-primary hover:bg-primary/90 group"
                  data-testid="cta-start-building-btn"
                >
                  Start Building
                  <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              <span className="font-bold">NeuralFlows</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 NeuralFlows. Free to use.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
