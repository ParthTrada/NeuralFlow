import React, { useState, useEffect, createContext, useContext } from 'react';
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
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { Button } from './ui/button';

const TOUR_STORAGE_KEY = 'neuralflows_tour_completed';

// Tour steps configuration - matched to actual UI elements
const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to NeuralFlows! 🎉',
    description: 'Build neural networks visually without writing code. Let\'s take a 30-second tour to get you started!',
    icon: Sparkles,
    position: 'center',
    target: null,
  },
  {
    id: 'layer-palette',
    title: 'Layer Palette',
    description: 'Find all your neural network layers here - Dense, Conv2D, LSTM, Attention, and more. Use Templates at the top for quick starts!',
    icon: Layers,
    position: 'right',
    target: '[data-tour="layer-palette"]',
    mobileDescription: 'Tap the layers icon in the header to access all neural network layers and templates.',
  },
  {
    id: 'canvas',
    title: 'Design Canvas',
    description: 'Drag layers here and connect them by drawing lines between the handles. Your network architecture takes shape visually!',
    icon: MousePointerClick,
    position: 'center',
    target: '[data-tour="canvas"]',
  },
  {
    id: 'properties',
    title: 'Properties Panel',
    description: 'Click any layer on the canvas to configure it here. Adjust units, activations, kernel sizes, and more.',
    icon: Settings,
    position: 'left',
    target: '[data-tour="properties-panel"]',
    mobileDescription: 'Tap any layer to see its properties. Configure units, activations, and other settings.',
    mobilePosition: 'center',
  },
  {
    id: 'train',
    title: 'Train Your Model',
    description: 'Train your network in the browser! Load datasets, configure training parameters, and watch accuracy improve in real-time.',
    icon: GraduationCap,
    position: 'bottom-left',
    target: '[data-tour="train-btn"]',
    mobileTarget: '[data-testid="mobile-actions-btn"]',
    mobileDescription: 'Tap the menu icon to access training options. Train your model right in your browser!',
  },
  {
    id: 'view-code',
    title: 'Export Code',
    description: 'Generate production-ready PyTorch or Keras code from your design. Copy to clipboard or download as a file!',
    icon: Code2,
    position: 'bottom-left',
    target: '[data-testid="view-code-btn"]',
  },
  {
    id: 'tutorial',
    title: 'Need Help?',
    description: 'Click this book icon anytime to access our detailed tutorial with screenshots and examples.',
    icon: BookOpen,
    position: 'bottom-left',
    target: '[data-testid="tutorial-btn"]',
    skipOnMobile: true, // Tutorial button might not be visible on mobile
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'Start by choosing a template from the Layer Palette, or drag an Input layer onto the canvas. Happy building!',
    icon: Sparkles,
    position: 'center',
    target: null,
    mobileDescription: 'Start by tapping the layers icon and choosing a template. Happy building!',
  },
];

// Create context for tour state
const ProductTourContext = createContext(null);

export const useProductTour = () => {
  const context = useContext(ProductTourContext);
  if (!context) {
    return {
      restartTour: () => {
        if (window.restartProductTour) {
          window.restartProductTour();
        }
      },
      resetTour: () => {
        localStorage.removeItem(TOUR_STORAGE_KEY);
      }
    };
  }
  return context;
};

// Tour tooltip component
const TourTooltip = ({ step, currentStep, totalSteps, onNext, onPrev, onSkip, onComplete, isDark, isMobile }) => {
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isWelcome = step.id === 'welcome';
  const isComplete = step.id === 'complete';
  const actualSteps = totalSteps - 2;
  const actualCurrentStep = currentStep - 1;
  
  const description = isMobile && step.mobileDescription ? step.mobileDescription : step.description;
  
  const [position, setPosition] = useState({ 
    top: '50%', 
    left: '50%', 
    transform: 'translate(-50%, -50%)' 
  });
  
  useEffect(() => {
    const calculatePosition = () => {
      // Center position for welcome, complete, or center-positioned steps
      if (step.position === 'center' || !step.target || isWelcome || isComplete) {
        setPosition({ 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          maxWidth: isMobile ? 'calc(100vw - 32px)' : '360px',
        });
        return;
      }
      
      // On mobile, use center position for most steps
      if (isMobile) {
        const mobilePos = step.mobilePosition || 'center';
        if (mobilePos === 'center') {
          setPosition({ 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            maxWidth: 'calc(100vw - 32px)',
          });
          return;
        }
      }
      
      const targetSelector = isMobile && step.mobileTarget ? step.mobileTarget : step.target;
      const target = document.querySelector(targetSelector);
      
      if (!target) {
        setPosition({ 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          maxWidth: isMobile ? 'calc(100vw - 32px)' : '360px',
        });
        return;
      }
      
      const rect = target.getBoundingClientRect();
      const tooltipWidth = isMobile ? Math.min(320, window.innerWidth - 32) : 360;
      const tooltipHeight = 280;
      const padding = 16;
      
      let newPosition = {};
      const effectivePosition = isMobile && step.mobilePosition ? step.mobilePosition : step.position;
      
      switch (effectivePosition) {
        case 'right':
          newPosition = {
            top: Math.min(Math.max(rect.top, padding + 56), window.innerHeight - tooltipHeight - padding),
            left: Math.min(rect.right + padding, window.innerWidth - tooltipWidth - padding),
          };
          break;
        case 'left':
          newPosition = {
            top: Math.min(Math.max(rect.top, padding + 56), window.innerHeight - tooltipHeight - padding),
            left: Math.max(rect.left - tooltipWidth - padding, padding),
          };
          break;
        case 'bottom':
          newPosition = {
            top: rect.bottom + padding,
            left: Math.max(Math.min(rect.left - (tooltipWidth / 2) + (rect.width / 2), window.innerWidth - tooltipWidth - padding), padding),
          };
          break;
        case 'bottom-left':
          newPosition = {
            top: rect.bottom + padding,
            left: Math.max(rect.left - tooltipWidth + rect.width + 50, padding),
          };
          break;
        default:
          newPosition = { 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)' 
          };
      }
      
      // Ensure tooltip stays within viewport
      if (newPosition.left && newPosition.left + tooltipWidth > window.innerWidth - padding) {
        newPosition.left = window.innerWidth - tooltipWidth - padding;
      }
      if (newPosition.top && newPosition.top + tooltipHeight > window.innerHeight - padding) {
        newPosition.top = window.innerHeight - tooltipHeight - padding;
      }
      
      setPosition(newPosition);
    };
    
    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [step, currentStep, isMobile, isWelcome, isComplete]);
  
  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.25 }}
      className={`fixed z-[10001] rounded-2xl shadow-2xl border ${
        isDark 
          ? 'bg-zinc-900/95 border-zinc-700 text-white backdrop-blur-xl' 
          : 'bg-white/95 border-zinc-200 text-zinc-900 backdrop-blur-xl'
      }`}
      style={{
        ...position,
        width: isMobile ? 'auto' : '360px',
        maxWidth: isMobile ? 'calc(100vw - 32px)' : '360px',
        margin: isMobile ? '0 16px' : '0',
      }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${
              isDark ? 'bg-violet-500/20' : 'bg-violet-100'
            }`}>
              <Icon className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{step.title}</h3>
              {!isWelcome && !isComplete && (
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Step {actualCurrentStep + 1} of {actualSteps}
                </p>
              )}
            </div>
          </div>
          {!isComplete && (
            <button
              onClick={onSkip}
              className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
              }`}
              aria-label="Skip tour"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Description */}
        <p className={`text-sm leading-relaxed mb-5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
          {description}
        </p>
        
        {/* Progress dots */}
        {!isWelcome && !isComplete && (
          <div className="flex justify-center gap-1.5 mb-5">
            {Array.from({ length: actualSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === actualCurrentStep
                    ? 'w-6 bg-violet-500'
                    : idx < actualCurrentStep
                    ? 'w-1.5 bg-violet-500/50'
                    : `w-1.5 ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {isWelcome ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onSkip}
                className={`flex-1 ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : ''}`}
              >
                Skip
              </Button>
              <Button
                size="sm"
                onClick={onNext}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              >
                Let's Go!
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          ) : isComplete ? (
            <Button
              size="sm"
              onClick={onComplete}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Building!
            </Button>
          ) : (
            <>
              {!isFirst && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrev}
                  className={`${isDark ? 'border-zinc-700 hover:bg-zinc-800' : ''}`}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                onClick={onNext}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Highlight ring around target element
const TargetHighlight = ({ target, isDark, isMobile }) => {
  const [rect, setRect] = useState(null);
  
  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    
    const element = document.querySelector(target);
    if (!element) {
      setRect(null);
      return;
    }
    
    const updateRect = () => {
      const newRect = element.getBoundingClientRect();
      setRect(newRect);
    };
    
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [target]);
  
  if (!rect) return null;
  
  const padding = isMobile ? 4 : 8;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed z-[10000] pointer-events-none"
      style={{
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }}
    >
      {/* Animated ring */}
      <div className="absolute inset-0 rounded-xl border-2 border-violet-500 animate-pulse" />
      <div className="absolute inset-0 rounded-xl bg-violet-500/10" />
      
      {/* Glow effect */}
      <div className="absolute -inset-2 rounded-2xl bg-violet-500/20 blur-md" />
    </motion.div>
  );
};

// Main ProductTour component
export const ProductTour = ({ isDark = true, forceShow = false, onComplete: onTourComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Filter steps for mobile (skip steps marked as skipOnMobile)
  const activeSteps = isMobile 
    ? tourSteps.filter(step => !step.skipOnMobile)
    : tourSteps;
  
  // Check if tour should show on mount
  useEffect(() => {
    if (forceShow) {
      setIsActive(true);
      setCurrentStep(0);
      return;
    }
    
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);
  
  const handleNext = () => {
    if (currentStep < activeSteps.length - 1) {
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
  
  // Expose restart method globally
  useEffect(() => {
    window.restartProductTour = restartTour;
    return () => {
      delete window.restartProductTour;
    };
  }, []);
  
  if (!isActive) return null;
  
  const currentStepData = activeSteps[currentStep];
  const targetSelector = isMobile && currentStepData.mobileTarget 
    ? currentStepData.mobileTarget 
    : currentStepData.target;
  
  // Don't show highlight for center-positioned steps
  const showHighlight = currentStepData.target && 
    currentStepData.position !== 'center' && 
    currentStepData.id !== 'welcome' && 
    currentStepData.id !== 'complete';
  
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <>
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/70"
            onClick={currentStep === 0 ? undefined : handleSkip}
          />
          
          {/* Target highlight - only show when not center positioned */}
          {showHighlight && (
            <TargetHighlight 
              target={targetSelector} 
              isDark={isDark} 
              isMobile={isMobile}
            />
          )}
          
          {/* Tooltip */}
          <TourTooltip
            step={currentStepData}
            currentStep={currentStep}
            totalSteps={activeSteps.length}
            onNext={handleNext}
            onPrev={handlePrev}
            onSkip={handleSkip}
            onComplete={handleComplete}
            isDark={isDark}
            isMobile={isMobile}
          />
        </>
      )}
    </AnimatePresence>
  );
};

// Provider component for tour context
export const ProductTourProvider = ({ children }) => {
  const restartTour = () => {
    if (window.restartProductTour) {
      window.restartProductTour();
    }
  };
  
  const resetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  };
  
  return (
    <ProductTourContext.Provider value={{ restartTour, resetTour }}>
      {children}
    </ProductTourContext.Provider>
  );
};

export default ProductTour;
