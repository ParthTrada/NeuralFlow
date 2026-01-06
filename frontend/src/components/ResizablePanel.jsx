import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  const panelRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startXRef.current;
    let newWidth;
    
    if (side === 'left') {
      // For left panel, dragging right increases width
      newWidth = startWidthRef.current + deltaX;
    } else {
      // For right panel, dragging left increases width
      newWidth = startWidthRef.current - deltaX;
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
      ref={panelRef}
      className={cn("relative", className)} 
      style={{ width: `${width}px` }}
      {...props}
    >
      {children}
      
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute top-0 bottom-0 w-5 cursor-col-resize z-50 group flex items-center justify-center",
          side === 'left' ? '-right-2.5' : '-left-2.5',
          isResizing && 'bg-primary/10'
        )}
        title="Drag to resize"
      >
        <div className={cn(
          "h-16 w-1.5 rounded-full bg-muted-foreground/40 transition-all duration-200",
          "group-hover:bg-primary group-hover:h-24 group-hover:w-2",
          isResizing && "bg-primary h-24 w-2"
        )} />
      </div>
    </div>
  );
};
