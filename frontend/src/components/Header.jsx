import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Play, Code, Trash2, Cpu, GraduationCap, FolderOpen, LogIn, LogOut, Layers, Menu } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '../context/AuthContext';
// import { useProductTour } from './ProductTour'; // Commented out - Product Tour disabled

export const Header = ({ 
  isDarkMode, 
  onToggleTheme, 
  onRun, 
  onShowCode, 
  onClearCanvas,
  onOpenTraining,
  onOpenModels,
  isRunning,
  nodeCount,
  isMobile,
  onToggleLayers,
  showLayerPalette
}) => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { restartTour } = useProductTour();

  return (
    <header 
      className="h-14 border-b border-border bg-background/80 backdrop-blur-md fixed top-0 w-full z-40 flex items-center px-2 sm:px-6 justify-between"
      data-testid="header"
    >
      {/* Logo & Title */}
      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        {/* Mobile layers toggle */}
        {isMobile && (
          <Button
            variant={showLayerPalette ? "secondary" : "ghost"}
            size="icon"
            onClick={onToggleLayers}
            className="w-8 h-8"
            data-testid="mobile-layers-btn"
          >
            <Layers className="w-4 h-4" />
          </Button>
        )}
        
        <motion.div
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.5 }}
          className="p-1.5 sm:p-2 rounded-lg bg-primary/10 hidden sm:flex"
        >
          <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </motion.div>
        <a href="/" className="hover:opacity-80 transition-opacity">
          <h1 className="font-bold text-sm sm:text-lg tracking-tight">NeuralFlows</h1>
        </a>
      </div>

      {/* Stats - Desktop only */}
      <div className="hidden lg:flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-mono">{nodeCount}</span>
          <span>layers</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleTheme}
                className="w-8 h-8"
                data-testid="theme-toggle-btn"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
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
                className="w-8 h-8"
                data-testid="clear-canvas-btn"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear Canvas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* My Models Button - Only show if authenticated, desktop only */}
        {isAuthenticated && !isMobile && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenModels}
                  className="w-8 h-8"
                  data-testid="my-models-btn"
                  data-tour="save-btn"
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>My Saved Models</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Desktop action buttons */}
        <Button
          variant="outline"
          onClick={onShowCode}
          className="hidden lg:flex"
          data-testid="show-code-btn"
          data-tour="generate-code"
        >
          <Code className="w-4 h-4 mr-2" />
          View Code
        </Button>

        <Button
          variant="outline"
          onClick={onOpenTraining}
          className="hidden lg:flex"
          data-testid="train-network-btn"
          data-tour="train-btn"
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          Train
        </Button>

        {/* Mobile dropdown for extra actions */}
        {isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="w-8 h-8" data-testid="mobile-actions-btn">
                <Menu className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onShowCode}>
                <Code className="w-4 h-4 mr-2" />
                View Code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenTraining}>
                <GraduationCap className="w-4 h-4 mr-2" />
                Train Model
              </DropdownMenuItem>
              {isAuthenticated && (
                <DropdownMenuItem onClick={onOpenModels}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  My Models
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          onClick={onRun}
          disabled={isRunning || nodeCount === 0}
          size={isMobile ? "sm" : "default"}
          className="glow-primary px-2 sm:px-4"
          data-testid="run-network-btn"
        >
          <Play className={`w-3 h-3 sm:w-4 sm:h-4 ${!isMobile && 'mr-2'} ${isRunning ? 'animate-pulse' : ''}`} />
          {!isMobile && (isRunning ? 'Running...' : 'Run')}
        </Button>

        {/* Help Button - restart tour */}
        {!isMobile && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={restartTour}
                  className="w-8 h-8"
                  data-testid="help-btn"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show Tour</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* User Menu */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0" data-testid="user-menu-btn">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.picture} alt={user?.name} />
                  <AvatarFallback className="text-xs">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenModels}>
                <FolderOpen className="w-4 h-4 mr-2" />
                My Models
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive" data-testid="logout-btn">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            variant="outline" 
            onClick={login} 
            size="icon"
            className="w-8 h-8"
            data-testid="login-btn"
          >
            <LogIn className="w-4 h-4" />
          </Button>
        )}
      </div>
    </header>
  );
};
