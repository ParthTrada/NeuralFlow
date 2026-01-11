import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Play,
  Database,
  FileSpreadsheet,
  MessageSquare,
  LineChart,
  Image,
  Search,
  Check,
  ChevronLeft,
  ArrowLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { sampleDatasets, downloadDatasetCSV, datasetToCSV } from '../utils/sampleDatasets';
import { cn } from '../lib/utils';

const categoryIcons = {
  tabular: FileSpreadsheet,
  text: MessageSquare,
  sequence: LineChart,
  image: Image,
  'text-generation': MessageSquare,
};

const categoryLabels = {
  tabular: 'Tabular',
  text: 'Text/NLP',
  sequence: 'Time Series',
  image: 'Image',
  'text-generation': 'Text Generation',
};

// Short labels for mobile
const categoryLabelsShort = {
  tabular: 'Table',
  text: 'Text',
  sequence: 'Series',
  image: 'Image',
  'text-generation': 'GenText',
};

export const DatasetBrowserModal = ({ 
  isOpen, 
  onClose, 
  onSelectDataset,
  currentTemplateId = null 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'preview'

  // Filter datasets based on search and category
  const filteredDatasets = useMemo(() => {
    return sampleDatasets.filter(ds => {
      const matchesSearch = ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ds.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || ds.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Get recommended datasets for current template
  const recommendedDatasets = useMemo(() => {
    if (!currentTemplateId) return [];
    return sampleDatasets.filter(ds => ds.compatibleTemplates.includes(currentTemplateId));
  }, [currentTemplateId]);

  // Handle dataset selection for preview
  const handlePreview = (dataset) => {
    setSelectedDataset(dataset);
    const data = dataset.getData();
    // Handle text-generation datasets that return an object with sequences array
    if (data && data.sequences && Array.isArray(data.sequences)) {
      setPreviewData(data.sequences.slice(0, 5));
    } else if (Array.isArray(data)) {
      setPreviewData(data.slice(0, 5)); // Show first 5 rows
    } else {
      setPreviewData([]); // Fallback for unexpected data format
    }
    setMobileView('preview'); // Switch to preview on mobile
  };

  // Handle back to list on mobile
  const handleBackToList = () => {
    setMobileView('list');
  };

  // Handle download
  const handleDownload = (dataset) => {
    downloadDatasetCSV(dataset);
  };

  // Handle use dataset
  const handleUseDataset = (dataset) => {
    if (onSelectDataset) {
      const csvContent = datasetToCSV(dataset);
      onSelectDataset({
        ...dataset,
        csvContent,
        rawData: dataset.getData()
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          data-testid="dataset-browser-modal"
        >
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Back button on mobile when in preview */}
              {mobileView === 'preview' && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBackToList}
                  className="sm:hidden h-8 w-8"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <Database className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-lg">
                  {mobileView === 'preview' && selectedDataset ? (
                    <span className="sm:hidden">{selectedDataset.name}</span>
                  ) : null}
                  <span className={mobileView === 'preview' ? 'hidden sm:inline' : ''}>
                    Sample Datasets
                  </span>
                </h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  Ready-to-use datasets for training your models
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Search and Filters - Hidden on mobile when viewing preview */}
          <div className={cn(
            "p-3 sm:p-4 border-b border-border space-y-2 sm:space-y-3",
            mobileView === 'preview' ? 'hidden sm:block' : ''
          )}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 sm:h-10 text-sm"
                data-testid="dataset-search"
              />
            </div>
            
            {/* Filter buttons - more compact on mobile */}
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
              >
                All
              </Button>
              {Object.entries(categoryLabels).map(([key, label]) => {
                const Icon = categoryIcons[key];
                const shortLabel = categoryLabelsShort[key];
                return (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(key)}
                    className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    <span className="sm:hidden">{shortLabel}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Content - Responsive layout */}
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
            {/* Dataset List - Full width on mobile, half on desktop */}
            <div className={cn(
              "sm:w-1/2 sm:border-r border-border flex-1 sm:flex-initial",
              mobileView === 'preview' ? 'hidden sm:block' : 'block'
            )}>
              <ScrollArea className="h-full">
                <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                  {/* Recommended Section */}
                  {recommendedDatasets.length > 0 && selectedCategory === 'all' && !searchQuery && (
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <span className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider">
                          Recommended
                        </span>
                      </div>
                      {recommendedDatasets.map((dataset) => (
                        <DatasetCard
                          key={`rec-${dataset.id}`}
                          dataset={dataset}
                          isSelected={selectedDataset?.id === dataset.id}
                          isRecommended
                          onClick={() => handlePreview(dataset)}
                        />
                      ))}
                      <div className="border-t border-border my-2 sm:my-3" />
                    </div>
                  )}

                  {/* All Datasets */}
                  {filteredDatasets.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground">
                      <Database className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No datasets found</p>
                    </div>
                  ) : (
                    filteredDatasets.map((dataset) => (
                      <DatasetCard
                        key={dataset.id}
                        dataset={dataset}
                        isSelected={selectedDataset?.id === dataset.id}
                        isRecommended={recommendedDatasets.some(d => d.id === dataset.id)}
                        onClick={() => handlePreview(dataset)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Preview Panel - Full width on mobile, half on desktop */}
            <div className={cn(
              "sm:w-1/2 flex flex-col flex-1",
              mobileView === 'list' ? 'hidden sm:flex' : 'flex'
            )}>
              {selectedDataset ? (
                <>
                  {/* Dataset Info */}
                  <div className="p-3 sm:p-4 border-b border-border">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                          <span>{selectedDataset.icon}</span>
                          <span className="hidden sm:inline">{selectedDataset.name}</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 sm:line-clamp-none">
                          {selectedDataset.longDescription}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {selectedDataset.samples} samples
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {typeof selectedDataset.features === 'number' 
                          ? `${selectedDataset.features} features` 
                          : selectedDataset.features}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {selectedDataset.classes} classes
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-[10px] sm:text-xs"
                        style={{ borderColor: selectedDataset.color, color: selectedDataset.color }}
                      >
                        {categoryLabels[selectedDataset.category]}
                      </Badge>
                    </div>
                  </div>

                  {/* Data Preview */}
                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <div className="px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                      Preview (5 rows)
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-2 sm:p-3">
                        {previewData && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-[10px] sm:text-xs">
                              <thead>
                                <tr className="border-b border-border">
                                  {Object.keys(previewData[0] || {}).slice(0, 4).map((col) => (
                                    <th key={col} className="text-left p-1.5 sm:p-2 font-medium text-muted-foreground whitespace-nowrap">
                                      {col.length > 10 ? col.slice(0, 8) + '..' : col}
                                    </th>
                                  ))}
                                  {Object.keys(previewData[0] || {}).length > 4 && (
                                    <th className="text-left p-1.5 sm:p-2 font-medium text-muted-foreground">...</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {previewData.map((row, idx) => (
                                  <tr key={idx} className="border-b border-border/50">
                                    {Object.values(row).slice(0, 4).map((val, i) => (
                                      <td key={i} className="p-1.5 sm:p-2 truncate max-w-[60px] sm:max-w-[100px]">
                                        {typeof val === 'string' && val.length > 15 
                                          ? val.slice(0, 12) + '...' 
                                          : String(val).slice(0, 15)}
                                      </td>
                                    ))}
                                    {Object.keys(row).length > 4 && (
                                      <td className="p-1.5 sm:p-2 text-muted-foreground">...</td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Actions */}
                  <div className="p-3 sm:p-4 border-t border-border flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                      onClick={() => handleDownload(selectedDataset)}
                      data-testid="download-dataset-btn"
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Download CSV</span>
                      <span className="sm:hidden">Download</span>
                    </Button>
                    <Button
                      className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                      onClick={() => handleUseDataset(selectedDataset)}
                      data-testid="use-dataset-btn"
                    >
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Use for Training</span>
                      <span className="sm:hidden">Use</span>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
                  <div className="text-center">
                    <Database className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 opacity-30" />
                    <p className="text-xs sm:text-sm">Select a dataset to preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Dataset Card Component - More compact on mobile
const DatasetCard = ({ dataset, isSelected, isRecommended, onClick }) => {
  const Icon = categoryIcons[dataset.category];
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all border",
        isSelected 
          ? "bg-primary/10 border-primary" 
          : "bg-secondary/30 border-transparent hover:bg-secondary/50 hover:border-border"
      )}
      data-testid={`dataset-card-${dataset.id}`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div 
          className="p-1.5 sm:p-2 rounded-md flex-shrink-0"
          style={{ backgroundColor: `${dataset.color}20` }}
        >
          <span className="text-base sm:text-lg">{dataset.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="font-medium text-xs sm:text-sm truncate">{dataset.name}</span>
            {isRecommended && (
              <Badge variant="default" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-4">
                <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" />
                Match
              </Badge>
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">
            {dataset.description}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">
              {categoryLabelsShort[dataset.category]}
            </span>
          </div>
        </div>
        {isSelected && (
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
        )}
      </div>
    </motion.div>
  );
};

export default DatasetBrowserModal;
