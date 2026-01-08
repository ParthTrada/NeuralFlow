import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Users, 
  FileBox, 
  Clock, 
  RefreshCw, 
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  HardDrive,
  Trash2,
  ArrowLeft,
  Server,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

// Smart API URL detection for production/development
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Production domains - use same origin
    if (hostname === 'neuralflows.ai' || hostname === 'www.neuralflows.ai') {
      return window.location.origin + '/api';
    }
  }
  // Development or preview - use env variable
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  if (envUrl) {
    return envUrl + '/api';
  }
  // Fallback to same origin
  return (typeof window !== 'undefined' ? window.location.origin : '') + '/api';
};

const API_URL = getApiUrl();

// Format bytes to readable
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

export default function Admin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [expandedCollection, setExpandedCollection] = useState(null);
  const [collectionData, setCollectionData] = useState({});
  const [users, setUsers] = useState(null);
  const [models, setModels] = useState(null);
  const [sessions, setSessions] = useState(null);

  // Check if password is stored
  useEffect(() => {
    const storedPassword = sessionStorage.getItem('admin_password');
    if (storedPassword) {
      setPassword(storedPassword);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch stats when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!password) {
      toast.error('Please enter the admin password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/stats?password=${encodeURIComponent(password)}`);
      
      if (response.ok) {
        sessionStorage.setItem('admin_password', password);
        setIsAuthenticated(true);
        const data = await response.json();
        setStats(data);
        toast.success('Welcome to Admin Dashboard');
      } else {
        toast.error('Invalid password');
      }
    } catch (error) {
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/stats?password=${encodeURIComponent(password)}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      toast.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionData = async (collectionName) => {
    try {
      const response = await fetch(
        `${API_URL}/admin/collection/${collectionName}?password=${encodeURIComponent(password)}&limit=50`
      );
      if (response.ok) {
        const data = await response.json();
        setCollectionData(prev => ({ ...prev, [collectionName]: data }));
      }
    } catch (error) {
      toast.error(`Failed to fetch ${collectionName} data`);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/users?password=${encodeURIComponent(password)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/models?password=${encodeURIComponent(password)}`);
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      }
    } catch (error) {
      toast.error('Failed to fetch models');
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/sessions?password=${encodeURIComponent(password)}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      toast.error('Failed to fetch sessions');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_password');
    setIsAuthenticated(false);
    setPassword('');
    setStats(null);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-zinc-400">NeuralFlows Database</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="bg-zinc-800 border-zinc-700 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? 'Verifying...' : 'Access Dashboard'}
              </Button>
            </div>

            <button
              onClick={() => navigate('/')}
              className="mt-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Dashboard</h1>
              <p className="text-xs text-zinc-400">NeuralFlows Database Monitor</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
              className="border-zinc-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Overview Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total Collections</p>
                  <p className="text-2xl font-bold mt-1">{stats.total_collections}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Server className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total Documents</p>
                  <p className="text-2xl font-bold mt-1">{stats.total_documents}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <FileBox className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Data Size</p>
                  <p className="text-2xl font-bold mt-1">{stats.total_size_readable}</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <HardDrive className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Storage Size</p>
                  <p className="text-2xl font-bold mt-1">{stats.storage_size_readable}</p>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <Activity className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Collections Table */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="font-semibold text-lg">Collections</h2>
            </div>

            <div className="divide-y divide-zinc-800">
              {stats.collections.map((collection) => (
                <div key={collection.collection} className="hover:bg-zinc-800/50 transition-colors">
                  <button
                    onClick={() => {
                      if (expandedCollection === collection.collection) {
                        setExpandedCollection(null);
                      } else {
                        setExpandedCollection(collection.collection);
                        if (!collectionData[collection.collection]) {
                          fetchCollectionData(collection.collection);
                        }
                      }
                    }}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4">
                      {expandedCollection === collection.collection ? (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      )}
                      <div>
                        <p className="font-medium">{collection.collection}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Fields: {collection.fields.slice(0, 5).join(', ')}
                          {collection.fields.length > 5 && '...'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-zinc-400">Documents</p>
                        <p className="font-semibold">{collection.document_count}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-400">Size</p>
                        <p className="font-semibold">{collection.size_readable}</p>
                      </div>
                    </div>
                  </button>

                  {/* Expanded View */}
                  {expandedCollection === collection.collection && (
                    <div className="px-6 pb-4">
                      <div className="bg-zinc-800 rounded-lg p-4 max-h-96 overflow-auto">
                        {collectionData[collection.collection] ? (
                          <pre className="text-xs text-zinc-300 whitespace-pre-wrap">
                            {JSON.stringify(collectionData[collection.collection].documents, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-zinc-400 text-sm">Loading...</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Stats Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl"
          >
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="font-medium">Users</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchUsers}
                className="text-xs"
              >
                Load
              </Button>
            </div>
            <div className="p-4 max-h-64 overflow-auto">
              {users ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-400">Total: {users.total_users}</p>
                  {users.users.map((user) => (
                    <div key={user.user_id} className="bg-zinc-800 rounded-lg p-3 text-sm">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-zinc-400 text-xs">{user.email}</p>
                      <p className="text-zinc-500 text-xs mt-1">{formatDate(user.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">Click Load to view users</p>
              )}
            </div>
          </motion.div>

          {/* Models */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl"
          >
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileBox className="w-4 h-4 text-green-400" />
                <h3 className="font-medium">Models</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchModels}
                className="text-xs"
              >
                Load
              </Button>
            </div>
            <div className="p-4 max-h-64 overflow-auto">
              {models ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-400">Total: {models.total_models}</p>
                  {models.models.map((model) => (
                    <div key={model.model_id} className="bg-zinc-800 rounded-lg p-3 text-sm">
                      <p className="font-medium">{model.name}</p>
                      <p className="text-zinc-400 text-xs">ID: {model.model_id}</p>
                      <p className="text-zinc-500 text-xs mt-1">{formatDate(model.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">Click Load to view models</p>
              )}
            </div>
          </motion.div>

          {/* Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl"
          >
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <h3 className="font-medium">Sessions</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSessions}
                className="text-xs"
              >
                Load
              </Button>
            </div>
            <div className="p-4 max-h-64 overflow-auto">
              {sessions ? (
                <div className="space-y-3">
                  <div className="flex gap-4 text-sm">
                    <p className="text-zinc-400">Total: {sessions.total_sessions}</p>
                    <p className="text-green-400">Active: {sessions.active_sessions}</p>
                  </div>
                  {sessions.recent_sessions.map((session, idx) => (
                    <div key={idx} className="bg-zinc-800 rounded-lg p-3 text-sm">
                      <p className="font-medium text-xs">{session.user_id}</p>
                      <p className="text-zinc-500 text-xs mt-1">
                        Expires: {formatDate(session.expires_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">Click Load to view sessions</p>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
