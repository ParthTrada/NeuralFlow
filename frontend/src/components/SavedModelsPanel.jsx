import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  X, 
  Plus,
  Clock,
  FileCode
} from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const SavedModelsPanel = ({ 
  isOpen, 
  onClose, 
  onLoadModel, 
  currentNodes, 
  currentEdges 
}) => {
  const { user } = useAuth();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [deleteModelId, setDeleteModelId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchModels();
    }
  }, [isOpen, user]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/auth/models`, {
        withCredentials: true
      });
      setModels(response.data);
    } catch (error) {
      console.error('Failed to fetch models:', error);
      toast.error('Failed to load saved models');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!saveName.trim()) {
      toast.error('Please enter a model name');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/auth/models`, {
        name: saveName,
        nodes: currentNodes,
        edges: currentEdges
      }, {
        withCredentials: true
      });
      toast.success('Model saved!');
      setSaveName('');
      setShowSaveDialog(false);
      fetchModels();
    } catch (error) {
      console.error('Failed to save model:', error);
      toast.error('Failed to save model');
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (model) => {
    onLoadModel(model.nodes, model.edges);
    onClose();
    toast.success(`Loaded "${model.name}"`);
  };

  const handleDelete = async () => {
    if (!deleteModelId) return;

    try {
      await axios.delete(`${API_URL}/auth/models/${deleteModelId}`, {
        withCredentials: true
      });
      toast.success('Model deleted');
      setDeleteModelId(null);
      fetchModels();
    } catch (error) {
      console.error('Failed to delete model:', error);
      toast.error('Failed to delete model');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute left-0 top-0 bottom-0 w-[400px] bg-card border-r border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="saved-models-panel"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-primary/10">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">My Models</h2>
                  <p className="text-xs text-muted-foreground">
                    {user?.name}'s saved networks
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Save Current Button */}
            <div className="p-4 border-b border-border">
              <Button 
                className="w-full glow-primary"
                onClick={() => setShowSaveDialog(true)}
                disabled={currentNodes.length === 0}
                data-testid="save-model-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Current Network
              </Button>
            </div>

            {/* Models List */}
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="p-4 space-y-2">
                {loading ? (
                  <div className="text-center text-muted-foreground py-8">
                    Loading...
                  </div>
                ) : models.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <FileCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No saved models yet</p>
                    <p className="text-xs mt-1">Create a network and save it!</p>
                  </div>
                ) : (
                  models.map((model) => (
                    <motion.div
                      key={model.model_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleLoad(model)}
                        >
                          <h3 className="font-semibold truncate">{model.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(model.updated_at)}</span>
                            <span>•</span>
                            <span>{model.nodes?.length || 0} layers</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setDeleteModelId(model.model_id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Network</DialogTitle>
            <DialogDescription>
              Give your neural network a name to save it.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="My Neural Network"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            data-testid="model-name-input"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteModelId} onOpenChange={() => setDeleteModelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The model will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
