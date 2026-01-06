import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Layers, 
  Cpu, 
  Download, 
  Share2, 
  Zap,
  Brain,
  Code2,
  MousePointerClick
} from 'lucide-react';
import { Button } from '../components/ui/button';

// Animated neural network background
const NeuralBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let nodes = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    };

    const initNodes = () => {
      nodes = [];
      const nodeCount = Math.floor((canvas.width * canvas.height) / 25000);
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
        });
      }
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.globalAlpha = (1 - dist / 150) * 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      ctx.globalAlpha = 1;
      nodes.forEach(node => {
        ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

// Feature card component
const FeatureCard = ({ icon: Icon, title, description, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className={`group relative p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] hover:border-primary/30 transition-colors duration-300 ${className}`}
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export default function Landing() {
  const navigate = useNavigate();

  const handleStartBuilding = () => {
    navigate('/builder');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <NeuralBackground />
      
      {/* Gradient overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ 
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.15), transparent)',
        zIndex: 1 
      }} />

      {/* Navigation */}
      <nav className="relative z-20 px-6 lg:px-12 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="p-2 rounded-lg bg-primary/10 border border-primary/20"
          >
            <Cpu className="w-6 h-6 text-primary" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
            NeuralFlows
          </span>
        </div>
        <Button 
          onClick={handleStartBuilding}
          variant="outline"
          className="border-white/20 hover:bg-white/10 hover:border-white/40"
          data-testid="nav-start-btn"
        >
          Start Building
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 lg:px-12 pt-20 pb-32 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs uppercase tracking-[0.2em] mb-8">
              Visual AI Development
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight leading-none mb-8"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Build Neural Networks
            <br />
            <span className="text-primary font-semibold">Visually</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl mb-12"
          >
            Drag, drop, and connect layers to design your neural network architecture. 
            Train directly in your browser and export production-ready PyTorch code.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button 
              onClick={handleStartBuilding}
              size="lg"
              className="group bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base rounded-xl"
              data-testid="hero-start-btn"
            >
              Start Building — Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="ghost"
              size="lg"
              className="text-zinc-400 hover:text-white hover:bg-white/5 px-8 py-6 text-base rounded-xl"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="learn-more-btn"
            >
              Learn More
            </Button>
          </motion.div>
        </div>

        {/* Hero visual accent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 hidden xl:block"
        >
          <div className="relative w-96 h-96">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
            <div className="absolute inset-8 rounded-full border border-primary/20 animate-pulse" />
            <div className="absolute inset-16 rounded-full border border-primary/30" />
            <div className="absolute inset-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="w-16 h-16 text-primary/60" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 lg:px-12 py-32 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs uppercase tracking-[0.2em] mb-6">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Everything you need to build
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Hero Card - Drag & Drop */}
          <FeatureCard
            icon={MousePointerClick}
            title="Drag & Drop Builder"
            description="Intuitive canvas interface to design neural networks. Simply drag layers from the palette and connect them to build your architecture."
            className="lg:col-span-2 lg:row-span-1"
            delay={0}
          />

          {/* Train in Browser */}
          <FeatureCard
            icon={Zap}
            title="Train in Browser"
            description="Train your models directly in the browser using TensorFlow.js. Upload CSV or image data and watch real-time training progress."
            delay={0.1}
          />

          {/* Export Code */}
          <FeatureCard
            icon={Code2}
            title="Export PyTorch Code"
            description="Generate production-ready PyTorch code from your visual design. Copy to clipboard or download as a .py file."
            delay={0.2}
          />

          {/* Layer Library */}
          <FeatureCard
            icon={Layers}
            title="Comprehensive Layers"
            description="Dense, Conv2D, LSTM, GRU, Attention, BatchNorm, Dropout, and more. All the layers you need for any architecture."
            delay={0.3}
          />

          {/* Save & Share */}
          <FeatureCard
            icon={Share2}
            title="Save & Share"
            description="Sign in to save your models, version them, and share with collaborators via a simple link. Your work is always accessible."
            delay={0.4}
          />
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 px-6 lg:px-12 py-32 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs uppercase tracking-[0.2em] mb-6">
            How it works
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Three steps to your model
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {[
            { step: '01', title: 'Design', desc: 'Drag and drop layers onto the canvas to build your network architecture.' },
            { step: '02', title: 'Train', desc: 'Upload your data and train the model directly in your browser.' },
            { step: '03', title: 'Export', desc: 'Download production-ready PyTorch code or share your model.' },
          ].map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="text-center"
            >
              <div className="text-6xl font-bold text-primary/20 mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-3 tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {item.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 lg:px-12 py-32 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-12 lg:p-20 text-center overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight mb-6" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Ready to build?
            </h2>
            <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
              Start designing your neural network architecture today. No signup required.
            </p>
            <Button 
              onClick={handleStartBuilding}
              size="lg"
              className="group bg-white text-black hover:bg-zinc-100 px-10 py-6 text-base rounded-xl font-semibold"
              data-testid="cta-start-btn"
            >
              Start Building — Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-12 border-t border-white/10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-primary" />
            <span className="font-semibold tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
              NeuralFlows
            </span>
          </div>
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} NeuralFlows. Build smarter.
          </p>
        </div>
      </footer>
    </div>
  );
}
