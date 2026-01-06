import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Play, Code, Trash2, Cpu, GraduationCap, FolderOpen, LogIn, LogOut, User } from 'lucide-react';
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

export const Header = ({ 
  isDarkMode, 
  onToggleTheme, 
  onRun, 
  onShowCode, 
  onClearCanvas,
  onOpenTraining,
  onOpenModels,
  isRunning,
  nodeCount 
}) => {
  const { user, login, logout, isAuthenticated } = useAuth();

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
        <a href="/" className="hover:opacity-80 transition-opacity">
          <h1 className="font-bold text-lg tracking-tight">NeuralFlows</h1>
          <p className="text-xs text-muted-foreground">Builder</p>
        </a>
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

        {/* My Models Button - Only show if authenticated */}
        {isAuthenticated && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenModels}
                  data-testid="my-models-btn"
                >
                  <FolderOpen className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>My Saved Models</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

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

        {/* User Menu */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="user-menu-btn">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.picture} alt={user?.name} />
                  <AvatarFallback>
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
          <Button variant="outline" onClick={login} data-testid="login-btn">
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};
