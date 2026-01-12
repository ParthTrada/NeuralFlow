import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Download, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from './ui/dialog';
import { toast } from 'sonner';

export const CodePreviewModal = ({ isOpen, onClose, code, kerasCode, onDownload, isDarkMode, onFrameworkChange }) => {
  const [copied, setCopied] = useState(false);
  const [framework, setFramework] = useState('pytorch');

  const currentCode = framework === 'pytorch' ? code : kerasCode;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  const handleFrameworkChange = (newFramework) => {
    setFramework(newFramework);
    if (onFrameworkChange) {
      onFrameworkChange(newFramework);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[95vw] max-w-4xl max-h-[90vh] sm:max-h-[85vh] p-0 overflow-hidden"
        data-testid="code-preview-modal"
      >
        <DialogHeader className="p-3 sm:p-4 border-b border-border">
          {/* Mobile: Stack vertically, Desktop: Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-xl font-bold truncate">
                {framework === 'pytorch' ? 'PyTorch' : 'TensorFlow/Keras'} Code
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                Ready to use neural network implementation
              </DialogDescription>
            </div>
            
            {/* Controls - Stack on mobile */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              {/* Framework Toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1 w-full sm:w-auto">
                <button
                  onClick={() => handleFrameworkChange('pytorch')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    framework === 'pytorch'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid="pytorch-tab"
                >
                  PyTorch
                </button>
                <button
                  onClick={() => handleFrameworkChange('keras')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    framework === 'keras'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid="keras-tab"
                >
                  TF/Keras
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                  data-testid="copy-code-btn"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500" />
                      <span className="hidden xs:inline">Copied!</span>
                      <span className="xs:hidden">✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onDownload(framework)}
                  className="flex-1 sm:flex-none text-xs sm:text-sm glow-primary"
                  data-testid="download-code-btn"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Download .py</span>
                  <span className="xs:hidden">Download</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="overflow-auto max-h-[calc(90vh-140px)] sm:max-h-[calc(85vh-100px)]">
          <SyntaxHighlighter
            language="python"
            style={isDarkMode ? vscDarkPlus : vs}
            customStyle={{
              margin: 0,
              padding: '0.75rem',
              fontSize: '0.7rem',
              lineHeight: '1.5',
              background: isDarkMode ? '#1e1e1e' : '#ffffff'
            }}
            showLineNumbers
            wrapLines
            wrapLongLines
            className="text-[10px] sm:text-sm"
          >
            {currentCode || '# No code generated yet'}
          </SyntaxHighlighter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
