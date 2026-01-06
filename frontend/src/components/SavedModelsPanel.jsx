import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  X, 
  Clock,
  FileCode,
  Share2,
  Link,
  Copy,
  Check,
  History,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const SavedModelsPanel = ({ 
  isOpen, 
  onClose, 
  onLoadModel, 
  currentNodes, 
  currentEdges,
  trainedWeights  // Base64 encoded weights from training
}) => {
  const { user } = useAuth();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveName, setSaveName] = useState('');
  const [versionNote, setVersionNote] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [deleteModelId, setDeleteModelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedModel, setExpandedModel] = useState(null);
  const [versions, setVersions] = useState({});
  const [shareDialog, setShareDialog] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [includeWeights, setIncludeWeights] = useState(false);

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
      // Group by name to show latest version first
      const grouped = {};
      response.data.forEach(model => {
        const name = model.name;
        if (!grouped[name] || model.version > grouped[name].version) {
          grouped[name] = model;
        }
      });
      setModels(Object.values(grouped).sort((a, b) => 
        new Date(b.updated_at) - new Date(a.updated_at)
      ));
    } catch (error) {
      console.error('Failed to fetch models:', error);
      toast.error('Failed to load saved models');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async (modelId) => {
    try {
      const response = await axios.get(`${API_URL}/auth/models/${modelId}/versions`, {
        withCredentials: true
      });
      setVersions(prev => ({ ...prev, [modelId]: response.data }));
    } catch (error) {
      console.error('Failed to fetch versions:', error);
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
        edges: currentEdges,
        trained_weights: includeWeights ? trainedWeights : null,
        version_note: versionNote || undefined
      }, {
        withCredentials: true
      });
      toast.success('Model saved!');
      setSaveName('');
      setVersionNote('');
      setIncludeWeights(false);
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
    onLoadModel(model.nodes, model.edges, model.trained_weights);
    onClose();
    toast.success(`Loaded "${model.name}" v${model.version || 1}`);
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

  const handleShare = async (model) => {
    setShareLoading(true);
    try {
      if (model.share_token) {
        // Already shared, just show dialog
        setShareDialog(model);
      } else {
        // Create share link
        const response = await axios.post(
          `${API_URL}/auth/models/${model.model_id}/share`,
          {},
          { withCredentials: true }
        );
        const updatedModel = { ...model, share_token: response.data.share_token, is_public: true };
        setShareDialog(updatedModel);
        fetchModels();
      }
    } catch (error) {
      toast.error('Failed to create share link');
    } finally {
      setShareLoading(false);
    }
  };

  const handleRevokeShare = async (modelId) => {
    try {
      await axios.delete(`${API_URL}/auth/models/${modelId}/share`, {
        withCredentials: true
      });
      toast.success('Share link revoked');
      setShareDialog(null);
      fetchModels();
    } catch (error) {
      toast.error('Failed to revoke share link');
    }
  };

  const copyShareLink = (shareToken) => {
    const link = `${window.location.origin}?shared=${shareToken}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success('Link copied to clipboard!');
  };

  const handleExportWithWeights = (model) => {
    // Export as JSON with all data including weights
    const exportData = {
      name: model.name,
      version: model.version,
      nodes: model.nodes,
      edges: model.edges,
      trained_weights: model.trained_weights,
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${model.name.replace(/\s+/g, '_')}_v${model.version || 1}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Model exported with weights!');
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

  const toggleExpand = async (model) => {
    if (expandedModel === model.model_id) {
      setExpandedModel(null);
    } else {
      setExpandedModel(model.model_id);
      if (!versions[model.model_id]) {
        await fetchVersions(model.model_id);
      }
    }
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
            className="absolute left-0 top-0 bottom-0 w-[420px] bg-card border-r border-border shadow-2xl"
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
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
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
                    <Collapsible 
                      key={model.model_id}
                      open={expandedModel === model.model_id}
                      onOpenChange={() => toggleExpand(model)}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors overflow-hidden"
                      >
                        <div className="p-3">
                          <div className="flex items-start justify-between">
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => handleLoad(model)}
                            >
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate">{model.name}</h3>
                                <Badge variant="outline" className="text-xs">
                                  v{model.version || 1}
                                </Badge>
                                {model.trained_weights && (
                                  <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                                    Trained
                                  </Badge>
                                )}
                                {model.is_public && (
                                  <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">
                                    Shared
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(model.updated_at)}</span>
                                <span>•</span>
                                <span>{model.nodes?.length || 0} layers</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  {expandedModel === model.model_id ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                          </div>
                        </div>
                        
                        <CollapsibleContent>
                          <div className="px-3 pb-3 pt-0 border-t border-border/50 mt-2 space-y-2">
                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleShare(model); }}
                                data-testid="share-model-btn"
                              >
                                <Share2 className="w-3 h-3 mr-1" />
                                Share
                              </Button>
                              {model.trained_weights && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleExportWithWeights(model); }}
                                  data-testid="export-weights-btn"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Export
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); setDeleteModelId(model.model_id); }}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                            
                            {/* Versions list */}
                            {versions[model.model_id] && versions[model.model_id].length > 1 && (
                              <div className="pt-2">
                                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                  <History className="w-3 h-3" />
                                  Version History
                                </p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {versions[model.model_id].map((v) => (
                                    <div
                                      key={v.model_id}
                                      className="flex items-center justify-between p-2 rounded bg-background/50 text-xs cursor-pointer hover:bg-background"
                                      onClick={() => handleLoad(v)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">v{v.version}</Badge>
                                        <span className="text-muted-foreground">{v.version_note}</span>
                                      </div>
                                      <span className="text-muted-foreground">{formatDate(v.created_at)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </motion.div>
                    </Collapsible>
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
              Save your neural network. Saving with the same name creates a new version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model-name">Model Name</Label>
              <Input
                id="model-name"
                placeholder="My Neural Network"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                data-testid="model-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version-note">Version Note (optional)</Label>
              <Textarea
                id="version-note"
                placeholder="What changed in this version..."
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                rows={2}
              />
            </div>
            {trainedWeights && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="include-weights"
                  checked={includeWeights}
                  onChange={(e) => setIncludeWeights(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="include-weights" className="text-sm cursor-pointer">
                  Include trained weights
                </Label>
              </div>
            )}
          </div>
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

      {/* Share Dialog */}
      <Dialog open={!!shareDialog} onOpenChange={() => setShareDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Model</DialogTitle>
            <DialogDescription>
              Anyone with this link can view and clone your model.
            </DialogDescription>
          </DialogHeader>
          {shareDialog && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={`${window.location.origin}?shared=${shareDialog.share_token}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyShareLink(shareDialog.share_token)}
                >
                  {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Shared model: {shareDialog.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleRevokeShare(shareDialog.model_id)}
                >
                  Revoke Link
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteModelId} onOpenChange={() => setDeleteModelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This version will be permanently deleted.
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
