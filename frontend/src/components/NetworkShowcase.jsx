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
  Play
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

// Single layer node component
const LayerNode = ({ layer, index, totalLayers, isAnimating, isDark }) => {
  const config = layerTypes[layer.type] || layerTypes.Dense;
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="relative flex flex-col items-center"
    >
      {/* Layer node */}
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
        className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
          isDark 
            ? 'bg-zinc-900/80 border-zinc-700 hover:border-zinc-500' 
            : 'bg-white border-zinc-200 hover:border-zinc-400 shadow-sm'
        }`}
        style={{ 
          borderColor: isAnimating ? config.color : undefined,
        }}
      >
        <div
          className="absolute inset-0 rounded-xl opacity-20"
          style={{ backgroundColor: config.color }}
        />
        <Icon 
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 relative z-10" 
          style={{ color: config.color }} 
        />
        
        {/* Pulse effect during animation */}
        {isAnimating && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
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
      
      {/* Layer label */}
      <div className="mt-1.5 sm:mt-2 text-center">
        <p className={`text-[10px] sm:text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
          {config.label}
        </p>
        {layer.config && (
          <p className={`text-[9px] sm:text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            {layer.config}
          </p>
        )}
      </div>
      
      {/* Connection line to next node */}
      {index < totalLayers - 1 && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 w-4 sm:w-6 md:w-8 flex items-center" style={{ marginTop: '-12px' }}>
          <motion.div
            animate={isAnimating ? {
              background: [
                `linear-gradient(90deg, ${config.color}40 0%, transparent 100%)`,
                `linear-gradient(90deg, ${config.color} 0%, ${config.color}40 50%, transparent 100%)`,
                `linear-gradient(90deg, transparent 0%, ${config.color}40 100%)`,
              ],
            } : {}}
            transition={{ 
              duration: 0.8, 
              delay: index * 0.15,
              repeat: isAnimating ? Infinity : 0,
            }}
            className={`h-0.5 w-full ${isDark ? 'bg-zinc-600' : 'bg-zinc-300'}`}
          />
          {/* Arrow */}
          <div 
            className={`w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] ${
              isDark ? 'border-l-zinc-600' : 'border-l-zinc-300'
            }`}
            style={isAnimating ? { borderLeftColor: config.color } : {}}
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

      {/* Network visualization */}
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
        
        {/* Horizontal scrollable container for mobile */}
        <div className="relative overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
          <div className="flex items-start justify-start sm:justify-center gap-4 sm:gap-6 md:gap-8 min-w-max sm:min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentArch}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-4 sm:gap-6 md:gap-8"
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
        
        {/* Scroll hint for mobile */}
        <div className="sm:hidden flex justify-center mt-2">
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            ← Scroll to see all layers →
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
