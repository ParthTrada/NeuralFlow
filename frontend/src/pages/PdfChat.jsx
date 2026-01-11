import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Send, 
  FileText, 
  MessageSquare, 
  Loader2, 
  X, 
  ChevronLeft,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

// API URL configuration
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'neuralflows.ai' || hostname === 'www.neuralflows.ai') {
      return window.location.origin + '/api';
    }
  }
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  if (envUrl) return envUrl + '/api';
  return (typeof window !== 'undefined' ? window.location.origin : '') + '/api';
};

const API_URL = getApiUrl();

export default function PdfChat() {
  const navigate = useNavigate();
  const [sessionId] = useState(() => uuidv4());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfInfo, setPdfInfo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle dark mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      toast.error('Please select a PDF file');
      return;
    }

    setPdfFile(file);
    setIsUploading(true);
    setMessages([]);
    setPdfInfo(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('session_id', sessionId);

      const response = await fetch(`${API_URL}/pdf-qa/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to upload PDF');
      }

      const data = await response.json();
      setPdfInfo(data);
      toast.success(`PDF processed: ${data.num_chunks} sections found`);
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: `I've processed "${data.filename}" and found ${data.num_chunks} sections. Ask me anything about this document!`,
        timestamp: new Date()
      }]);
      
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
      
    } catch (error) {
      toast.error(error.message);
      setPdfFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !pdfInfo) return;

    const question = inputValue.trim();
    setInputValue('');
    
    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: question,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/pdf-qa/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question: question
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get answer');
      }

      const data = await response.json();
      
      // Add assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
        timestamp: new Date()
      }]);

    } catch (error) {
      toast.error(error.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        isError: true,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    try {
      await fetch(`${API_URL}/pdf-qa/session/${sessionId}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.log('Session cleanup:', e);
    }
    
    setPdfFile(null);
    setPdfInfo(null);
    setMessages([]);
    toast.success('Chat cleared');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#0a0a0b]' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto flex flex-col h-screen">
        {/* Header */}
        <header className={`px-4 py-3 border-b ${isDarkMode ? 'border-zinc-800 bg-[#0a0a0b]/80' : 'border-gray-200 bg-white/80'} backdrop-blur-sm sticky top-0 z-10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
                className="rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    PDF Chat
                  </h1>
                  <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    Powered by Llama 3.3
                  </p>
                </div>
              </div>
            </div>
            
            {pdfInfo && (
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs ${isDarkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600'}`}>
                  <FileText className="w-3 h-3 inline mr-1" />
                  {pdfInfo.filename}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleClearChat}
                  className="text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!pdfInfo ? (
            /* Upload Section */
            <div className="flex-1 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`w-full max-w-md p-8 rounded-2xl ${isDarkMode ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-white border border-gray-200'}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    Upload a PDF
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Upload any PDF document and ask questions about its content
                  </p>
                </div>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-12 text-base"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing PDF...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Select PDF File
                    </>
                  )}
                </Button>

                <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'} mb-2`}>
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    What you can do:
                  </p>
                  <ul className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'} space-y-1`}>
                    <li>• Ask questions about the document</li>
                    <li>• Get summaries of sections</li>
                    <li>• Extract specific information</li>
                    <li>• Have a conversation about the content</li>
                  </ul>
                </div>
              </motion.div>
            </div>
          ) : (
            /* Chat Section */
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                  <AnimatePresence>
                    {messages.map((message, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-primary/10' : 'bg-primary/10'}`}>
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : message.isError
                              ? isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-600'
                              : isDarkMode ? 'bg-zinc-800' : 'bg-white border border-gray-200'
                        }`}>
                          <p className={`text-sm whitespace-pre-wrap ${
                            message.role === 'user' 
                              ? '' 
                              : isDarkMode ? 'text-zinc-100' : 'text-zinc-800'
                          }`}>
                            {message.content}
                          </p>
                          
                          {message.sources && message.sources.length > 0 && (
                            <div className={`mt-2 pt-2 border-t ${isDarkMode ? 'border-zinc-700' : 'border-gray-200'}`}>
                              <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                Sources: {message.sources.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {message.role === 'user' && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-zinc-700' : 'bg-gray-200'}`}>
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-primary/10' : 'bg-primary/10'}`}>
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className={`rounded-2xl px-4 py-3 ${isDarkMode ? 'bg-zinc-800' : 'bg-white border border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            Thinking...
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Section */}
              <div className={`p-4 border-t ${isDarkMode ? 'border-zinc-800 bg-[#0a0a0b]' : 'border-gray-200 bg-white'}`}>
                <div className="max-w-3xl mx-auto">
                  <div className={`flex gap-2 p-2 rounded-2xl ${isDarkMode ? 'bg-zinc-800/50' : 'bg-gray-100'}`}>
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask a question about the PDF..."
                      disabled={isLoading}
                      className={`flex-1 border-0 bg-transparent focus-visible:ring-0 ${isDarkMode ? 'text-white placeholder:text-zinc-500' : ''}`}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      size="icon"
                      className="rounded-xl"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className={`text-xs text-center mt-2 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Powered by Groq + Llama 3.3 • Free & Open Source
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
