import React, { useState, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';

export const ResizablePanel = ({ 
  children, 
  side = 'left', // 'left' or 'right'
  defaultWidth = 256,
  minWidth = 200,
  maxWidth = 500,
  className,
  ...props 
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    let newWidth;
    if (side === 'left') {
      newWidth = e.clientX;
    } else {
      newWidth = window.innerWidth - e.clientX;
    }
    
    // Clamp to min/max
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setWidth(newWidth);
  }, [isResizing, side, minWidth, maxWidth]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className={cn("relative", className)} 
      style={{ width: `${width}px` }}
      {...props}
    >
      {children}
      
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute top-0 bottom-0 w-4 cursor-col-resize z-50 group flex items-center justify-center",
          side === 'left' ? '-right-2' : '-left-2',
          isResizing && 'bg-primary/20'
        )}
        title="Drag to resize"
      >
        <div className={cn(
          "h-12 w-1.5 rounded-full bg-muted-foreground/30 transition-all duration-200",
          "group-hover:bg-primary group-hover:h-20 group-hover:w-2",
          isResizing && "bg-primary h-20 w-2"
        )} />
      </div>
    </div>
  );
};
