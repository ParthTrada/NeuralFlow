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
  Info,
  ExternalLink
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { sampleDatasets, downloadDatasetCSV, datasetToCSV } from '../utils/sampleDatasets';
import { cn } from '../lib/utils';

const categoryIcons = {
  tabular: FileSpreadsheet,
  text: MessageSquare,
  sequence: LineChart,
  image: Image,
};

const categoryLabels = {
  tabular: 'Tabular',
  text: 'Text/NLP',
  sequence: 'Time Series',
  image: 'Image',
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
    setPreviewData(data.slice(0, 5)); // Show first 5 rows
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
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          data-testid="dataset-browser-modal"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Sample Datasets</h2>
                <p className="text-xs text-muted-foreground">
                  Ready-to-use datasets for training your models
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="dataset-search"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="text-xs"
              >
                All
              </Button>
              {Object.entries(categoryLabels).map(([key, label]) => {
                const Icon = categoryIcons[key];
                return (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(key)}
                    className="text-xs"
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Dataset List */}
            <div className="w-1/2 border-r border-border">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2">
                  {/* Recommended Section */}
                  {recommendedDatasets.length > 0 && selectedCategory === 'all' && !searchQuery && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                          Recommended for your template
                        </span>
                      </div>
                      {recommendedDatasets.map((dataset) => (
                        <DatasetCard
                          key={dataset.id}
                          dataset={dataset}
                          isSelected={selectedDataset?.id === dataset.id}
                          isRecommended
                          onClick={() => handlePreview(dataset)}
                        />
                      ))}
                      <div className="border-t border-border my-3" />
                    </div>
                  )}

                  {/* All Datasets */}
                  {filteredDatasets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No datasets found</p>
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

            {/* Preview Panel */}
            <div className="w-1/2 flex flex-col">
              {selectedDataset ? (
                <>
                  {/* Dataset Info */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <span>{selectedDataset.icon}</span>
                          {selectedDataset.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedDataset.longDescription}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {selectedDataset.samples} samples
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {typeof selectedDataset.features === 'number' 
                          ? `${selectedDataset.features} features` 
                          : selectedDataset.features}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {selectedDataset.classes} classes
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: selectedDataset.color, color: selectedDataset.color }}
                      >
                        {categoryLabels[selectedDataset.category]}
                      </Badge>
                    </div>
                  </div>

                  {/* Data Preview */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                      Data Preview (first 5 rows)
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-3">
                        {previewData && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border">
                                  {Object.keys(previewData[0] || {}).slice(0, 5).map((col) => (
                                    <th key={col} className="text-left p-2 font-medium text-muted-foreground">
                                      {col.length > 12 ? col.slice(0, 10) + '...' : col}
                                    </th>
                                  ))}
                                  {Object.keys(previewData[0] || {}).length > 5 && (
                                    <th className="text-left p-2 font-medium text-muted-foreground">...</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {previewData.map((row, idx) => (
                                  <tr key={idx} className="border-b border-border/50">
                                    {Object.values(row).slice(0, 5).map((val, i) => (
                                      <td key={i} className="p-2 truncate max-w-[100px]">
                                        {typeof val === 'string' && val.length > 20 
                                          ? val.slice(0, 18) + '...' 
                                          : String(val)}
                                      </td>
                                    ))}
                                    {Object.keys(row).length > 5 && (
                                      <td className="p-2 text-muted-foreground">...</td>
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
                  <div className="p-4 border-t border-border flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDownload(selectedDataset)}
                      data-testid="download-dataset-btn"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download CSV
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleUseDataset(selectedDataset)}
                      data-testid="use-dataset-btn"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Use for Training
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Database className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a dataset to preview</p>
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

// Dataset Card Component
const DatasetCard = ({ dataset, isSelected, isRecommended, onClick }) => {
  const Icon = categoryIcons[dataset.category];
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-all border",
        isSelected 
          ? "bg-primary/10 border-primary" 
          : "bg-secondary/30 border-transparent hover:bg-secondary/50 hover:border-border"
      )}
      data-testid={`dataset-card-${dataset.id}`}
    >
      <div className="flex items-start gap-3">
        <div 
          className="p-2 rounded-md flex-shrink-0"
          style={{ backgroundColor: `${dataset.color}20` }}
        >
          <span className="text-lg">{dataset.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{dataset.name}</span>
            {isRecommended && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                <Check className="w-2.5 h-2.5 mr-0.5" />
                Match
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {dataset.description}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <Icon className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {categoryLabels[dataset.category]}
            </span>
          </div>
        </div>
        {isSelected && (
          <Check className="w-4 h-4 text-primary flex-shrink-0" />
        )}
      </div>
    </motion.div>
  );
};

export default DatasetBrowserModal;
