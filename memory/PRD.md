# NeuralFlow Architect - Product Requirements Document

## Original Problem Statement
Build a website where users can create neural networks through drag and drop, similar to Azure Synapse pipelines. After constructing the graphical model of the NN, users can run the neural network and download generated PyTorch code.

## User Choices
- Both basic and advanced layers
- PyTorch code generation
- Simple build and download (no accounts)
- Dark/Light mode toggle

## Architecture
- **Frontend**: React 19 + React Flow + Framer Motion + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (for future features)
- **Code Generation**: Client-side PyTorch code generator

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

## What's Been Implemented (Jan 6, 2025)
- ✅ Full drag-and-drop neural network builder
- ✅ Basic Layers: Input, Dense, Conv2D, MaxPool2D, Dropout, Flatten, Output
- ✅ Advanced Layers: BatchNorm1D/2D, LSTM, GRU, Multi-Head Attention
- ✅ Real-time PyTorch code generation
- ✅ Code preview modal with syntax highlighting
- ✅ Copy to clipboard functionality
- ✅ Download as .py file
- ✅ Layer properties editing
- ✅ Dark/Light theme toggle
- ✅ Network validation on "Run"
- ✅ Responsive Control Room layout

## Prioritized Backlog

### P0 (Critical)
- None - MVP complete

### P1 (High Priority)
- [ ] Save/Load network designs to local storage
- [ ] TensorFlow/Keras code generation option
- [ ] Undo/Redo functionality

### P2 (Medium Priority)
- [ ] User accounts and cloud save
- [ ] Network templates (CNN, RNN, Transformer)
- [ ] Export as ONNX format
- [ ] Layer validation warnings

### P3 (Nice to Have)
- [ ] Share networks via URL
- [ ] Collaborative editing
- [ ] Training configuration (optimizer, loss, metrics)
- [ ] Dataset input specification

## Next Tasks
1. Add local storage for saving network designs
2. Implement undo/redo with Ctrl+Z/Y
3. Add network templates for common architectures
