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
        className="max-w-4xl max-h-[85vh] p-0 overflow-hidden"
        data-testid="code-preview-modal"
      >
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                Generated {framework === 'pytorch' ? 'PyTorch' : 'TensorFlow/Keras'} Code
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Ready to use neural network implementation
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Framework Toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <button
                  onClick={() => handleFrameworkChange('pytorch')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
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
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    framework === 'keras'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid="keras-tab"
                >
                  TF/Keras
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                data-testid="copy-code-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onDownload(framework)}
                className="glow-primary"
                data-testid="download-code-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Download .py
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="overflow-auto max-h-[calc(85vh-100px)]">
          <SyntaxHighlighter
            language="python"
            style={isDarkMode ? vscDarkPlus : vs}
            customStyle={{
              margin: 0,
              padding: '1.5rem',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              background: isDarkMode ? '#1e1e1e' : '#ffffff'
            }}
            showLineNumbers
            wrapLines
          >
            {currentCode || '# No code generated yet'}
          </SyntaxHighlighter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
