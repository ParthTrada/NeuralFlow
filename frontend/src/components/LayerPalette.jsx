import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Button } from './ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { ScrollArea } from './ui/scroll-area';
import { layerCategories } from '../utils/layerConfigs';
import { cn } from '../lib/utils';
import { ResizablePanel } from './ResizablePanel';

export const LayerPalette = ({ isMobile, isOpen, onClose, onAddLayer }) => {
  const onDragStart = (event, layer) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(layer));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Handle tap to add on mobile
  const handleLayerClick = (layer) => {
    if (isMobile && onAddLayer) {
      onAddLayer(layer);
      onClose();
    }
  };

  // Mobile slide-over panel
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={onClose}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-14 bottom-0 w-72 bg-card border-r border-border z-50 flex flex-col"
              data-testid="layer-palette-mobile"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg tracking-tight">Layers</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tap to add layer
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2">
                  <Accordion type="multiple" defaultValue={['basic', 'advanced']} className="w-full">
                    {Object.entries(layerCategories).map(([key, category]) => (
                      <AccordionItem key={key} value={key} className="border-border">
                        <AccordionTrigger 
                          className="text-sm font-semibold hover:no-underline px-2"
                        >
                          {category.label}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-1 px-1">
                          {category.layers.map((layer) => {
                            const Icon = layer.icon;
                            return (
                              <motion.div
                                key={layer.type}
                                onClick={() => handleLayerClick(layer)}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
                                  "bg-secondary/50 hover:bg-secondary border border-transparent",
                                  "hover:border-border active:border-primary transition-all duration-200"
                                )}
                              >
                                <div 
                                  className="p-2 rounded-md flex-shrink-0"
                                  style={{ backgroundColor: `${layer.color}20` }}
                                >
                                  <Icon 
                                    className="w-4 h-4" 
                                    style={{ color: layer.color }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">
                                    {layer.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {layer.description}
                                  </div>
                                </div>
                                <Plus className="w-4 h-4 text-muted-foreground" />
                              </motion.div>
                            );
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop resizable panel
  return (
    <ResizablePanel
      side="left"
      defaultWidth={256}
      minWidth={200}
      maxWidth={400}
      className="border-r border-border bg-card/50 backdrop-blur-xl fixed left-0 top-14 bottom-0 z-30 hidden md:block"
      data-testid="layer-palette"
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg tracking-tight">Layers</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Drag layers to the canvas
          </p>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            <Accordion type="multiple" defaultValue={['basic', 'advanced']} className="w-full">
              {Object.entries(layerCategories).map(([key, category]) => (
                <AccordionItem key={key} value={key} className="border-border">
                  <AccordionTrigger 
                    className="text-sm font-semibold hover:no-underline px-2"
                    data-testid={`accordion-${key}`}
                  >
                    {category.label}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-1 px-1">
                    {category.layers.map((layer) => {
                      const Icon = layer.icon;
                      return (
                        <motion.div
                          key={layer.type}
                          draggable
                          onDragStart={(e) => onDragStart(e, layer)}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-grab",
                            "bg-secondary/50 hover:bg-secondary border border-transparent",
                            "hover:border-border transition-all duration-200"
                          )}
                          data-testid={`palette-layer-${layer.type.toLowerCase()}`}
                        >
                          <div 
                            className="p-2 rounded-md flex-shrink-0"
                            style={{ backgroundColor: `${layer.color}20` }}
                          >
                            <Icon 
                              className="w-4 h-4" 
                              style={{ color: layer.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {layer.label}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {layer.description}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollArea>
      </div>
    </ResizablePanel>
  );
};
