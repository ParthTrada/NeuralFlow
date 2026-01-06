import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Play, Code, Trash2, Cpu, GraduationCap } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export const Header = ({ 
  isDarkMode, 
  onToggleTheme, 
  onRun, 
  onShowCode, 
  onClearCanvas,
  onOpenTraining,
  isRunning,
  nodeCount 
}) => {
  return (
    <header 
      className="h-14 border-b border-border bg-background/80 backdrop-blur-md fixed top-0 w-full z-40 flex items-center px-6 justify-between"
      data-testid="header"
    >
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.5 }}
          className="p-2 rounded-lg bg-primary/10"
        >
          <Cpu className="w-5 h-5 text-primary" />
        </motion.div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">NeuralFlow</h1>
          <p className="text-xs text-muted-foreground">Architect</p>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-mono">{nodeCount}</span>
          <span>layers</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleTheme}
                data-testid="theme-toggle-btn"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle {isDarkMode ? 'Light' : 'Dark'} Mode</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearCanvas}
                data-testid="clear-canvas-btn"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear Canvas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant="outline"
          onClick={onShowCode}
          className="hidden sm:flex"
          data-testid="show-code-btn"
        >
          <Code className="w-4 h-4 mr-2" />
          View Code
        </Button>

        <Button
          variant="outline"
          onClick={onOpenTraining}
          className="hidden sm:flex"
          data-testid="train-network-btn"
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          Train
        </Button>

        <Button
          onClick={onRun}
          disabled={isRunning || nodeCount === 0}
          className="glow-primary"
          data-testid="run-network-btn"
        >
          <Play className={`w-4 h-4 mr-2 ${isRunning ? 'animate-pulse' : ''}`} />
          {isRunning ? 'Running...' : 'Run'}
        </Button>
      </div>
    </header>
  );
};
