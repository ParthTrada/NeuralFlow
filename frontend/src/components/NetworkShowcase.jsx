import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Layers, 
  Grid3X3, 
  Minimize2, 
  Droplets, 
  Rows3, 
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  ArrowDown
} from 'lucide-react';
import { Button } from './ui/button';

// Layer type configurations with icons and colors
const layerTypes = {
  Input: { icon: Box, color: '#22c55e', label: 'Input' },
  Conv2D: { icon: Grid3X3, color: '#06b6d4', label: 'Conv2D' },
  MaxPool2D: { icon: Minimize2, color: '#0ea5e9', label: 'MaxPool' },
  BatchNorm: { icon: Layers, color: '#f59e0b', label: 'BatchNorm' },
  Dropout: { icon: Droplets, color: '#ef4444', label: 'Dropout' },
  Flatten: { icon: Rows3, color: '#a855f7', label: 'Flatten' },
  Dense: { icon: Layers, color: '#8b5cf6', label: 'Dense' },
  LSTM: { icon: Sparkles, color: '#22c55e', label: 'LSTM' },
  Attention: { icon: Target, color: '#f59e0b', label: 'Attention' },
  Output: { icon: Target, color: '#ec4899', label: 'Output' },
};

// Sample architectures to showcase
const architectures = [
  {
    name: 'Image Classifier (CNN)',
    description: 'Convolutional neural network for image classification tasks',
    layers: [
      { type: 'Input', config: '3×224×224' },
      { type: 'Conv2D', config: '64 filters' },
      { type: 'BatchNorm', config: '' },
      { type: 'MaxPool2D', config: '2×2' },
      { type: 'Conv2D', config: '128 filters' },
      { type: 'Dropout', config: '0.3' },
      { type: 'Flatten', config: '' },
      { type: 'Dense', config: '256 units' },
      { type: 'Output', config: '10 classes' },
    ],
  },
  {
    name: 'Sentiment Analyzer (LSTM)',
    description: 'Recurrent network for text sentiment analysis',
    layers: [
      { type: 'Input', config: '100 tokens' },
      { type: 'Dense', config: '128 embed' },
      { type: 'LSTM', config: '256 units' },
      { type: 'Dropout', config: '0.2' },
      { type: 'LSTM', config: '128 units' },
      { type: 'Dense', config: '64 units' },
      { type: 'Output', config: '3 classes' },
    ],
  },
  {
    name: 'Transformer Block',
    description: 'Self-attention based architecture for NLP tasks',
    layers: [
      { type: 'Input', config: '512 dim' },
      { type: 'Attention', config: '8 heads' },
      { type: 'BatchNorm', config: '' },
      { type: 'Dense', config: '2048 units' },
      { type: 'Dropout', config: '0.1' },
      { type: 'Dense', config: '512 units' },
      { type: 'BatchNorm', config: '' },
      { type: 'Output', config: '512 dim' },
    ],
  },
];

// Single layer node component - Vertical layout
const LayerNode = ({ layer, index, totalLayers, isAnimating, isDark }) => {
  const config = layerTypes[layer.type] || layerTypes.Dense;
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="relative flex flex-col items-center"
    >
      {/* Layer card - horizontal layout with icon, label, and config */}
      <motion.div
        animate={isAnimating ? {
          boxShadow: [
            `0 0 0 0 ${config.color}00`,
            `0 0 20px 4px ${config.color}40`,
            `0 0 0 0 ${config.color}00`,
          ],
        } : {}}
        transition={{ 
          duration: 1.5, 
          delay: index * 0.15,
          repeat: isAnimating ? Infinity : 0,
          repeatDelay: 0.5
        }}
        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 min-w-[180px] sm:min-w-[220px] ${
          isDark 
            ? 'bg-zinc-900/80 border-zinc-700 hover:border-zinc-500' 
            : 'bg-white border-zinc-200 hover:border-zinc-400 shadow-sm'
        }`}
        style={{ 
          borderColor: isAnimating ? config.color : undefined,
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon 
            className="w-5 h-5 sm:w-6 sm:h-6" 
            style={{ color: config.color }} 
          />
        </div>
        
        {/* Label and config */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm sm:text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
            {config.label}
          </p>
          {layer.config && (
            <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {layer.config}
            </p>
          )}
        </div>
        
        {/* Pulse effect during animation */}
        {isAnimating && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.1, opacity: 0 }}
            transition={{ 
              duration: 1, 
              delay: index * 0.15,
              repeat: Infinity 
            }}
            className="absolute inset-0 rounded-xl"
            style={{ backgroundColor: config.color }}
          />
        )}
      </motion.div>
      
      {/* Connection line to next node - vertical */}
      {index < totalLayers - 1 && (
        <div className="flex flex-col items-center py-1">
          <motion.div
            animate={isAnimating ? {
              background: [
                `linear-gradient(180deg, ${config.color}40 0%, transparent 100%)`,
                `linear-gradient(180deg, ${config.color} 0%, ${config.color}40 50%, transparent 100%)`,
                `linear-gradient(180deg, transparent 0%, ${config.color}40 100%)`,
              ],
            } : {}}
            transition={{ 
              duration: 0.8, 
              delay: index * 0.15,
              repeat: isAnimating ? Infinity : 0,
            }}
            className={`w-0.5 h-4 sm:h-6 ${isDark ? 'bg-zinc-600' : 'bg-zinc-300'}`}
          />
          {/* Arrow pointing down */}
          <div 
            className={`w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] ${
              isDark ? 'border-t-zinc-600' : 'border-t-zinc-300'
            }`}
            style={isAnimating ? { borderTopColor: config.color } : {}}
          />
        </div>
      )}
    </motion.div>
  );
};

// Main showcase component
export const NetworkShowcase = ({ isDark, onTryTemplate }) => {
  const [currentArch, setCurrentArch] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  const architecture = architectures[currentArch];

  // Auto-cycle through architectures
  useEffect(() => {
    if (!autoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentArch((prev) => (prev + 1) % architectures.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoPlay]);

  const handlePrev = () => {
    setAutoPlay(false);
    setCurrentArch((prev) => (prev - 1 + architectures.length) % architectures.length);
  };

  const handleNext = () => {
    setAutoPlay(false);
    setCurrentArch((prev) => (prev + 1) % architectures.length);
  };

  const handleAnimate = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 3000);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <AnimatePresence mode="wait">
            <motion.h3
              key={architecture.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`text-lg sm:text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {architecture.name}
            </motion.h3>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={architecture.description}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
            >
              {architecture.description}
            </motion.p>
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            className={`w-8 h-8 ${isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {/* Dots indicator */}
          <div className="flex items-center gap-1.5">
            {architectures.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { setAutoPlay(false); setCurrentArch(idx); }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentArch 
                    ? 'bg-primary w-4' 
                    : isDark ? 'bg-zinc-600 hover:bg-zinc-500' : 'bg-zinc-300 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className={`w-8 h-8 ${isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Network visualization - Vertical layout */}
      <div className={`relative rounded-2xl border p-4 sm:p-6 md:p-8 overflow-hidden ${
        isDark 
          ? 'bg-zinc-900/50 border-zinc-800' 
          : 'bg-white/80 border-zinc-200 shadow-sm'
      }`}>
        {/* Background grid */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: isDark 
              ? 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 1px, transparent 1px)'
              : 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        
        {/* Vertical scrollable container */}
        <div className="relative max-h-[400px] sm:max-h-[500px] overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="flex flex-col items-center py-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentArch}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                {architecture.layers.map((layer, idx) => (
                  <LayerNode
                    key={`${currentArch}-${idx}`}
                    layer={layer}
                    index={idx}
                    totalLayers={architecture.layers.length}
                    isAnimating={isAnimating}
                    isDark={isDark}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Scroll hint */}
        <div className="flex justify-center mt-2">
          <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <ArrowDown className="w-3 h-3" />
            Scroll to see all layers
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
        <Button
          variant="outline"
          onClick={handleAnimate}
          disabled={isAnimating}
          className={`w-full sm:w-auto ${
            isDark 
              ? 'border-zinc-700 hover:bg-white/5' 
              : 'border-zinc-300 hover:bg-zinc-50'
          }`}
        >
          <Play className={`w-4 h-4 mr-2 ${isAnimating ? 'animate-pulse' : ''}`} />
          {isAnimating ? 'Running...' : 'Simulate Forward Pass'}
        </Button>
        
        {onTryTemplate && (
          <Button
            onClick={() => onTryTemplate(architecture)}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Try This Template
          </Button>
        )}
      </div>
    </div>
  );
};

export default NetworkShowcase;
