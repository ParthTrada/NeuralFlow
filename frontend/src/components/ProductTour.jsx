import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Layers,
  MousePointerClick,
  Settings,
  Code2,
  Play,
  Save,
  Share2,
  GraduationCap
} from 'lucide-react';
import { Button } from './ui/button';

const TOUR_STORAGE_KEY = 'neuralflows_tour_completed';

// Tour steps configuration
const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to NeuralFlows! 🎉',
    description: 'Let\'s take a quick tour to help you build your first neural network. This will only take 30 seconds!',
    icon: Sparkles,
    position: 'center',
    target: null,
  },
  {
    id: 'layer-palette',
    title: 'Layer Palette',
    description: 'Drag layers from here onto the canvas. Choose from Dense, Conv2D, LSTM, Attention, and more. Use templates for quick starts!',
    icon: Layers,
    position: 'right',
    target: '[data-tour="layer-palette"]',
    highlight: { top: 56, left: 0, width: 280, height: 'calc(100vh - 56px)' },
  },
  {
    id: 'canvas',
    title: 'Design Canvas',
    description: 'This is where you build your network. Drop layers here and connect them by dragging from output to input handles.',
    icon: MousePointerClick,
    position: 'center',
    target: '[data-tour="canvas"]',
    highlight: { top: 56, left: 280, width: 'calc(100vw - 560px)', height: 'calc(100vh - 56px)' },
  },
  {
    id: 'properties',
    title: 'Properties Panel',
    description: 'Click any layer to configure it here. Adjust units, activation functions, kernel sizes, and more.',
    icon: Settings,
    position: 'left',
    target: '[data-tour="properties-panel"]',
    highlight: { top: 56, right: 0, width: 280, height: 'calc(100vh - 56px)' },
  },
  {
    id: 'generate-code',
    title: 'Generate PyTorch Code',
    description: 'Click here to see the auto-generated PyTorch code for your network. Download it anytime!',
    icon: Code2,
    position: 'bottom',
    target: '[data-tour="generate-code"]',
    arrowPosition: 'top',
  },
  {
    id: 'train',
    title: 'Train Your Model',
    description: 'Train your network right in the browser! Upload data, set parameters, and watch it learn in real-time.',
    icon: Play,
    position: 'bottom',
    target: '[data-tour="train-btn"]',
    arrowPosition: 'top',
  },
  {
    id: 'save',
    title: 'Save & Share',
    description: 'Sign in to save your models and share them with others via unique links. Your work is always safe!',
    icon: Save,
    position: 'bottom',
    target: '[data-tour="save-btn"]',
    arrowPosition: 'top',
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 🚀',
    description: 'Start by dragging an Input layer onto the canvas, or pick a template from the palette. Have fun building!',
    icon: GraduationCap,
    position: 'center',
    target: null,
  },
];

// Spotlight overlay component
const Spotlight = ({ highlight, isDark }) => {
  if (!highlight) return null;
  
  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Dark overlay with cutout */}
      <svg className="w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect 
              x={highlight.left || 'auto'} 
              y={highlight.top || 'auto'}
              width={highlight.width}
              height={highlight.height}
              rx="12"
              fill="black"
              style={{
                right: highlight.right ? highlight.right : 'auto'
              }}
            />
          </mask>
        </defs>
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill={isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.75)'}
          mask="url(#spotlight-mask)" 
        />
      </svg>
      
      {/* Highlight border */}
      <div 
        className="absolute border-2 border-primary rounded-xl animate-pulse"
        style={{
          top: highlight.top,
          left: highlight.left,
          right: highlight.right,
          width: highlight.width,
          height: highlight.height,
        }}
      />
    </div>
  );
};

// Tour tooltip component
const TourTooltip = ({ step, currentStep, totalSteps, onNext, onPrev, onSkip, onComplete, isDark }) => {
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const isWelcome = step.id === 'welcome';
  const isComplete = step.id === 'complete';
  
  // Position styles based on step configuration
  const getPositionStyles = () => {
    if (step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }
    
    // For targeted elements, position near them
    const target = step.target ? document.querySelector(step.target) : null;
    if (target) {
      const rect = target.getBoundingClientRect();
      
      if (step.position === 'right') {
        return {
          top: Math.min(rect.top + 100, window.innerHeight - 300),
          left: rect.right + 20,
        };
      }
      if (step.position === 'left') {
        return {
          top: Math.min(rect.top + 100, window.innerHeight - 300),
          right: window.innerWidth - rect.left + 20,
        };
      }
      if (step.position === 'bottom') {
        return {
          top: rect.bottom + 15,
          left: Math.max(rect.left - 100, 20),
        };
      }
    }
    
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  };
  
  const positionStyles = getPositionStyles();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.2 }}
      className={`fixed z-[9999] w-[340px] rounded-2xl shadow-2xl border ${
        isDark 
          ? 'bg-zinc-900 border-zinc-700 text-white' 
          : 'bg-white border-zinc-200 text-zinc-900'
      }`}
      style={positionStyles}
    >
      {/* Arrow for positioned tooltips */}
      {step.arrowPosition === 'top' && (
        <div 
          className={`absolute -top-2 left-8 w-4 h-4 rotate-45 ${
            isDark ? 'bg-zinc-900 border-l border-t border-zinc-700' : 'bg-white border-l border-t border-zinc-200'
          }`}
        />
      )}
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-primary/20' : 'bg-primary/10'}`}>
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{step.title}</h3>
              {!isWelcome && !isComplete && (
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Step {currentStep} of {totalSteps - 2}
                </p>
              )}
            </div>
          </div>
          {!isComplete && (
            <button
              onClick={onSkip}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Description */}
        <p className={`text-sm leading-relaxed mb-5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
          {step.description}
        </p>
        
        {/* Progress dots */}
        {!isWelcome && !isComplete && (
          <div className="flex justify-center gap-1.5 mb-4">
            {tourSteps.slice(1, -1).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep - 1
                    ? 'w-6 bg-primary'
                    : idx < currentStep - 1
                    ? 'w-1.5 bg-primary/50'
                    : `w-1.5 ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isFirst && !isWelcome && !isComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              className={`flex-1 ${isDark ? 'border-zinc-700' : ''}`}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          
          {isWelcome && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onSkip}
                className={`flex-1 ${isDark ? 'border-zinc-700' : ''}`}
              >
                Skip Tour
              </Button>
              <Button
                size="sm"
                onClick={onNext}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Start Tour
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}
          
          {isComplete && (
            <Button
              size="sm"
              onClick={onComplete}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Building!
            </Button>
          )}
          
          {!isWelcome && !isComplete && (
            <Button
              size="sm"
              onClick={isLast ? onComplete : onNext}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isLast ? 'Finish' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Main ProductTour component
export const ProductTour = ({ isDark = true, forceShow = false, onComplete: onTourComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Check if tour should show on mount
  useEffect(() => {
    if (forceShow) {
      setIsActive(true);
      setCurrentStep(0);
      return;
    }
    
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);
  
  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleSkip = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsActive(false);
    onTourComplete?.();
  };
  
  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsActive(false);
    onTourComplete?.();
  };
  
  // Public method to restart tour
  const restartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };
  
  // Expose restart method
  useEffect(() => {
    window.restartProductTour = restartTour;
    return () => {
      delete window.restartProductTour;
    };
  }, []);
  
  if (!isActive) return null;
  
  const currentStepData = tourSteps[currentStep];
  
  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Backdrop / Spotlight */}
          {currentStepData.position === 'center' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/80"
              onClick={currentStep === 0 ? undefined : handleSkip}
            />
          ) : (
            <Spotlight highlight={currentStepData.highlight} isDark={isDark} />
          )}
          
          {/* Tooltip */}
          <TourTooltip
            step={currentStepData}
            currentStep={currentStep}
            totalSteps={tourSteps.length}
            onNext={handleNext}
            onPrev={handlePrev}
            onSkip={handleSkip}
            onComplete={handleComplete}
            isDark={isDark}
          />
        </>
      )}
    </AnimatePresence>
  );
};

// Hook to control tour from other components
export const useProductTour = () => {
  const restartTour = () => {
    if (window.restartProductTour) {
      window.restartProductTour();
    }
  };
  
  const resetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  };
  
  return { restartTour, resetTour };
};

export default ProductTour;
