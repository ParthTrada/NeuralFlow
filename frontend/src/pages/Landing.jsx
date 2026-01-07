import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Layers, 
  Cpu, 
  Share2, 
  Zap,
  Brain,
  Code2,
  MousePointerClick,
  Sun,
  Moon,
  Menu,
  X,
  Github
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { NetworkShowcase } from '../components/NetworkShowcase';

// Animated neural network background
const NeuralBackground = ({ isDark }) => {
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
      ctx.fillStyle = isDark ? 'rgba(5, 5, 5, 0.1)' : 'rgba(250, 250, 250, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      ctx.strokeStyle = isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.2)';
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
        ctx.fillStyle = isDark ? 'rgba(139, 92, 246, 0.6)' : 'rgba(139, 92, 246, 0.5)';
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

// Feature card component
const FeatureCard = ({ icon: Icon, title, description, className = '', delay = 0, isDark }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className={`group relative p-5 sm:p-6 rounded-2xl border backdrop-blur-sm transition-colors duration-300 ${className} ${
      isDark 
        ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30' 
        : 'border-zinc-200 bg-white/60 hover:bg-white/80 hover:border-primary/40 shadow-sm'
    }`}
  >
    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    <div className="relative z-10">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 transition-colors duration-300 ${
        isDark ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-primary/10 group-hover:bg-primary/15'
      }`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
      </div>
      <h3 className={`text-base sm:text-lg font-semibold mb-2 tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
      <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{description}</p>
    </div>
  </motion.div>
);

export default function Landing() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to builder if shared model link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedToken = urlParams.get('shared');
    if (sharedToken) {
      navigate(`/builder?shared=${sharedToken}`, { replace: true });
    }
  }, [navigate]);

  const handleStartBuilding = () => {
    navigate('/builder');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div 
      className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#050505] text-white' : 'bg-[#fafafa] text-zinc-900'
      }`} 
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <NeuralBackground isDark={isDark} />
      
      {/* Gradient overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ 
        background: isDark 
          ? 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.15), transparent)'
          : 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.08), transparent)',
        zIndex: 1 
      }} />

      {/* Navigation - Clean Professional Header */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isDark ? 'bg-[#050505]/80' : 'bg-white/80'
      } backdrop-blur-lg border-b ${isDark ? 'border-white/5' : 'border-zinc-200/50'}`}>
        <div className="px-4 sm:px-6 lg:px-12 py-3 sm:py-4 flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className={`p-1.5 sm:p-2 rounded-lg ${
                isDark ? 'bg-primary/10' : 'bg-primary/10'
              }`}
            >
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </motion.div>
            <span className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`} style={{ fontFamily: "'Manrope', sans-serif" }}>
              NeuralFlows
            </span>
          </div>

          {/* Desktop Navigation - Dark mode first, then links */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={`w-9 h-9 ${isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}
              data-testid="theme-toggle-btn"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {[
              { name: 'Features', href: '#features' },
              { name: 'How It Works', href: '#how-it-works' },
              { name: 'Preview', href: '#preview' },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  const element = document.querySelector(item.href);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDark 
                    ? 'text-zinc-400 hover:text-white hover:bg-white/5' 
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={`w-9 h-9 ${isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}
              data-testid="theme-toggle-mobile-btn"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`w-9 h-9 ${isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`md:hidden overflow-hidden border-t ${
                isDark ? 'bg-[#050505]/95 border-white/5' : 'bg-white/95 border-zinc-200/50'
              }`}
            >
              <div className="px-4 py-4 space-y-2">
                {[
                  { name: 'Features', href: '#features' },
                  { name: 'How It Works', href: '#how-it-works' },
                  { name: 'Preview', href: '#preview' },
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      const element = document.querySelector(item.href);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      setMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isDark 
                        ? 'text-zinc-300 hover:text-white hover:bg-white/5' 
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-12 pt-24 sm:pt-32 pb-16 sm:pb-24 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-6 sm:mb-8 ${
              isDark ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-primary/10 border-primary/20 text-primary'
            }`}>
              Visual AI Development
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className={`text-4xl sm:text-5xl lg:text-7xl font-light tracking-tight leading-[1.1] mb-6 sm:mb-8 ${isDark ? 'text-white' : 'text-zinc-900'}`}
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
            className={`text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mb-8 sm:mb-12 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
          >
            Drag, drop, and connect layers to design your neural network architecture. 
            Train directly in your browser and export production-ready PyTorch code.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <Button 
              onClick={handleStartBuilding}
              size="lg"
              className="group bg-primary hover:bg-primary/90 text-white px-6 sm:px-8 py-5 sm:py-6 text-base rounded-xl w-full sm:w-auto"
              data-testid="hero-start-btn"
            >
              Start Building — Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="ghost"
              size="lg"
              className={`px-6 sm:px-8 py-5 sm:py-6 text-base rounded-xl w-full sm:w-auto ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="learn-more-btn"
            >
              Learn More
            </Button>
          </motion.div>
        </div>

        {/* Hero visual accent - hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 hidden xl:block"
        >
          <div className="relative w-96 h-96">
            <div className={`absolute inset-0 rounded-full blur-3xl ${isDark ? 'bg-gradient-to-br from-primary/20 to-transparent' : 'bg-gradient-to-br from-primary/10 to-transparent'}`} />
            <div className={`absolute inset-8 rounded-full border animate-pulse ${isDark ? 'border-primary/20' : 'border-primary/30'}`} />
            <div className={`absolute inset-16 rounded-full border ${isDark ? 'border-primary/30' : 'border-primary/20'}`} />
            <div className={`absolute inset-24 rounded-full flex items-center justify-center ${isDark ? 'bg-primary/10' : 'bg-primary/5'}`}>
              <Brain className={`w-16 h-16 ${isDark ? 'text-primary/60' : 'text-primary/50'}`} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-4 sm:px-6 lg:px-12 py-16 sm:py-24 max-w-7xl mx-auto scroll-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-16"
        >
          <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4 sm:mb-6 ${
            isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'
          }`}>
            Features
          </span>
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`} style={{ fontFamily: "'Manrope', sans-serif" }}>
            Everything you need to build
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <FeatureCard
            icon={MousePointerClick}
            title="Drag & Drop Builder"
            description="Intuitive canvas interface to design neural networks. Simply drag layers from the palette and connect them."
            className="lg:col-span-2"
            delay={0}
            isDark={isDark}
          />
          <FeatureCard
            icon={Zap}
            title="Train in Browser"
            description="Train models directly in your browser using TensorFlow.js. Upload data and watch real-time progress."
            delay={0.1}
            isDark={isDark}
          />
          <FeatureCard
            icon={Code2}
            title="Export PyTorch Code"
            description="Generate production-ready PyTorch code. Copy to clipboard or download as a .py file."
            delay={0.2}
            isDark={isDark}
          />
          <FeatureCard
            icon={Layers}
            title="Comprehensive Layers"
            description="Dense, Conv2D, LSTM, GRU, Attention, BatchNorm, Dropout, and more for any architecture."
            delay={0.3}
            isDark={isDark}
          />
          <FeatureCard
            icon={Share2}
            title="Save & Share"
            description="Sign in to save models, version them, and share with collaborators via a simple link."
            delay={0.4}
            isDark={isDark}
          />
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative z-10 px-4 sm:px-6 lg:px-12 py-16 sm:py-24 max-w-7xl mx-auto scroll-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-20"
        >
          <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4 sm:mb-6 ${
            isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'
          }`}>
            How it works
          </span>
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`} style={{ fontFamily: "'Manrope', sans-serif" }}>
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
              <div className={`text-5xl sm:text-6xl font-bold mb-3 sm:mb-4 ${isDark ? 'text-primary/20' : 'text-primary/30'}`} style={{ fontFamily: "'Manrope', sans-serif" }}>
                {item.step}
              </div>
              <h3 className={`text-lg sm:text-xl font-semibold mb-2 sm:mb-3 tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`} style={{ fontFamily: "'Manrope', sans-serif" }}>
                {item.title}
              </h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive Network Showcase Section */}
      <section id="preview" className="relative z-10 px-4 sm:px-6 lg:px-12 py-16 sm:py-24 max-w-7xl mx-auto scroll-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12"
        >
          <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4 sm:mb-6 ${
            isDark ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-primary/10 border-primary/20 text-primary'
          }`}>
            Preview
          </span>
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-3 ${isDark ? 'text-white' : 'text-zinc-900'}`} style={{ fontFamily: "'Manrope', sans-serif" }}>
            See It In Action
          </h2>
          <p className={`text-base sm:text-lg max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Explore popular neural network architectures. Click "Try This Template" to start building instantly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <NetworkShowcase 
            isDark={isDark} 
            onTryTemplate={(arch) => {
              // Navigate to builder with template info
              navigate('/builder', { state: { template: arch.name } });
            }}
          />
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-12 py-16 sm:py-32 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`relative rounded-2xl sm:rounded-3xl border p-8 sm:p-12 lg:p-20 text-center overflow-hidden ${
            isDark 
              ? 'border-white/10 bg-gradient-to-br from-primary/10 via-transparent to-transparent' 
              : 'border-zinc-200 bg-gradient-to-br from-primary/5 via-white to-white shadow-lg'
          }`}
        >
          {/* Background glow */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-3xl ${
            isDark ? 'bg-primary/20' : 'bg-primary/10'
          }`} />
          
          <div className="relative z-10">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-zinc-900'}`} style={{ fontFamily: "'Manrope', sans-serif" }}>
              Ready to build?
            </h2>
            <p className={`text-base sm:text-lg mb-8 sm:mb-10 max-w-xl mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Start designing your neural network architecture today. No signup required.
            </p>
            <Button 
              onClick={handleStartBuilding}
              size="lg"
              className={`group px-8 sm:px-10 py-5 sm:py-6 text-base rounded-xl font-semibold w-full sm:w-auto ${
                isDark 
                  ? 'bg-white text-black hover:bg-zinc-100' 
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
              data-testid="cta-start-btn"
            >
              Start Building — Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 px-4 sm:px-6 lg:px-12 py-8 sm:py-12 border-t max-w-7xl mx-auto ${
        isDark ? 'border-white/10' : 'border-zinc-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-primary" />
            <span className={`font-semibold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`} style={{ fontFamily: "'Manrope', sans-serif" }}>
              NeuralFlows
            </span>
          </div>
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            © {new Date().getFullYear()} NeuralFlows. Build smarter.
          </p>
        </div>
      </footer>
    </div>
  );
}
