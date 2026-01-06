# NeuralFlow Architect - Product Requirements Document

## Original Problem Statement
Build a website called "NeuralFlows" (domain neuralflows.ai) where users can create neural networks through drag and drop, similar to Azure Synapse pipelines. After constructing the graphical model of the NN, users can run the neural network and download generated PyTorch code. Features include:
- Graphical model building with drag-and-drop
- In-browser training with data upload
- PyTorch code generation & download
- User accounts with Google OAuth for model persistence
- Model versioning and sharing
- Landing page for product introduction

## User Choices
- Both basic and advanced layers
- PyTorch code generation
- Dark/Light mode toggle
- Google OAuth authentication
- Model versioning and sharing

## Architecture
- **Frontend**: React 19 + React Flow + Framer Motion + Tailwind CSS + Shadcn UI + TensorFlow.js
- **Backend**: FastAPI + MongoDB
- **Code Generation**: Client-side PyTorch code generator
- **Authentication**: Emergent-managed Google OAuth

## User Personas
1. **ML Students** - Learning neural network architectures
2. **Data Scientists** - Quick prototyping of network structures
3. **Developers** - Visual planning before implementation

## Core Requirements (Static)
- [x] Drag-and-drop layer palette
- [x] Visual canvas for network construction
- [x] Layer connections with animated edges
- [x] Properties panel for layer configuration
- [x] PyTorch code generation
- [x] Code preview with syntax highlighting
- [x] Download .py file
- [x] Dark/Light mode toggle
- [x] In-browser training with TensorFlow.js
- [x] CSV and image data upload
- [x] Real-time training progress charts
- [x] Model prediction testing
- [x] Google OAuth authentication
- [x] Save/Load models to account
- [x] Model versioning
- [x] Share models via link
- [x] Professional landing page

## What's Been Implemented

### Jan 6, 2025 - Landing Page
- ✅ Professional landing page at '/' route
- ✅ Animated neural network background (canvas-based)
- ✅ Hero section with "Build Neural Networks Visually" headline
- ✅ Feature cards (Drag & Drop, Train in Browser, Export Code, Layers, Share)
- ✅ How-it-works section (Design → Train → Export)
- ✅ Call-to-action section
- ✅ Navigation to builder at '/builder'
- ✅ Consistent NeuralFlows branding
- ✅ Dark/Light mode toggle on landing page
- ✅ Mobile-responsive design with hamburger menu
- ✅ Full-width CTAs on mobile

### Jan 6, 2025 - Training & Auth Features
- ✅ Browser-based Training with TensorFlow.js
- ✅ CSV data upload and processing
- ✅ Image folder upload for classification
- ✅ Sample data generation (classification/regression)
- ✅ Training config (epochs, batch size, learning rate, optimizer)
- ✅ Real-time loss/accuracy charts during training
- ✅ Google OAuth - Sign in with Google
- ✅ Save/Load models to account
- ✅ Model versioning (v1, v2, v3...)
- ✅ Export trained weights
- ✅ Share models via link

### Initial MVP
- ✅ Full drag-and-drop neural network builder
- ✅ Basic Layers: Input, Dense, Conv2D, MaxPool2D, Dropout, Flatten, Output
- ✅ Advanced Layers: BatchNorm1D/2D, LSTM, GRU, Multi-Head Attention
- ✅ Real-time PyTorch code generation
- ✅ Dark/Light theme toggle
- ✅ Resizable UI panels

### Jan 6, 2025 - Templates, Learning Panel & New Layers
- ✅ Network Templates: Simple MLP, CNN, RNN (LSTM), Transformer, Autoencoder
- ✅ Templates are draggable and can be added additively to the canvas
- ✅ Learning Panel in right sidebar with context-sensitive educational content
- ✅ Layer tips showing description, details, and best practices for each layer type
- ✅ New Advanced Layers: Embedding, LayerNorm, TransformerEncoder, TransformerDecoder
- ✅ Fixed PyTorch code generation for Transformer and Autoencoder templates
- ✅ Correct code generation for TransformerEncoder (nn.TransformerEncoderLayer + nn.TransformerEncoder)
- ✅ Correct code generation for TransformerDecoder (nn.TransformerDecoderLayer + nn.TransformerDecoder)
- ✅ Mobile-responsive builder interface
- ✅ Tap-to-add layers on mobile
- ✅ Fixed header overflow and input auto-zoom issues on mobile

## Prioritized Backlog

### P0 (Critical)
- None - All critical features complete

### P1 (High Priority)
- [ ] TensorFlow/Keras code generation option
- [ ] Undo/Redo functionality
- [ ] Backend-based training for larger models

### P2 (Medium Priority)
- [x] Network templates (CNN, RNN, Transformer) ✅ COMPLETED
- [ ] Export as ONNX format
- [ ] Layer validation warnings
- [ ] Collaborative real-time editing
- [ ] Allow users to save custom architectures as templates

### P3 (Nice to Have)
- [x] Pre-built architectures/templates ✅ COMPLETED
- [ ] Training history persistence
- [ ] Model comparison tools
