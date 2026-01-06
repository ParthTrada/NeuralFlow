import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { ScrollArea } from './ui/scroll-area';
import { layerCategories } from '../utils/layerConfigs';
import { cn } from '../lib/utils';

export const LayerPalette = () => {
  const onDragStart = (event, layer) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(layer));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className="w-64 border-r border-border bg-card/50 backdrop-blur-xl fixed left-0 top-14 bottom-0 z-30"
      data-testid="layer-palette"
    >
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-lg tracking-tight">Layers</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Drag layers to the canvas
        </p>
      </div>
      
      <ScrollArea className="h-[calc(100vh-120px)]">
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
                          className="p-2 rounded-md"
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
  );
};
