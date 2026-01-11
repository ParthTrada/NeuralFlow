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

### Jan 11, 2025 - Text Classification & PDF Q&A Features
- ✅ **Text Classification Feature:**
  - Text Classifier template (Input → Embedding → LSTM → Dropout → Dense → Output)
  - Text input type support in Input layer config (vocabSize, seqLength)
  - Embedding layer support in TensorFlow.js model builder
  - Text sample data generation for NLP training
  - Data Requirements Guide updated for NLP/Text models
  - Text tokenization utilities (buildVocabulary, textToIndices)
  - processTextCSVData function for text CSV processing
- ✅ **PDF Q&A Chatbot Feature:** (Disabled for now, code preserved)

### Jan 11, 2025 - Advanced Transformer & Keras Code Generation
- ✅ **Advanced Transformer Support:**
  - New PositionalEncoding layer with max_len, d_model, dropout config
  - GlobalAvgPool1D layer for sequence pooling
  - Updated Transformer template to BERT-style architecture:
    - Input (text) → Embedding → Positional Encoding → Transformer Encoder (4 layers) → Global Avg Pool → Output
  - TransformerEncoder and TransformerDecoder now use composite blocks with internal skip connections
- ✅ **TensorFlow/Keras Code Generation:**
  - Framework toggle (PyTorch | TF/Keras) in code preview modal
  - Full Keras code generation with tf.keras.layers
  - Custom layer implementations for Keras:
    - PositionalEncoding class with learnable embeddings
    - TransformerEncoderBlock with Multi-Head Attention + FFN + LayerNorm + residual connections
    - TransformerDecoderBlock with masked self-attention + cross-attention
  - Proper input shape handling for all layer types
  - Download separate files for each framework


### Jan 6, 2025 - Input Layer Type System
- ✅ Added Input Type dropdown with 3 options: Flat (Vector), Image (C, H, W), Sequence (Len, Feat)
- ✅ Dynamic configuration fields based on input type:
  - Flat: Input Size (e.g., 784)
  - Image: Channels, Height, Width (e.g., 3, 224, 224)
  - Sequence: Sequence Length, Features (e.g., 32, 256)
- ✅ Node card displays formatted shape (e.g., [3, 224, 224] for images)
- ✅ PyTorch code generator uses input type for correct example inputs
- ✅ Updated all templates with proper inputType configurations

## Prioritized Backlog

### P0 (Critical)
- [x] Text Classification feature ✅ COMPLETED
- [x] PDF Q&A Chatbot ✅ COMPLETED
- [ ] Production Google Auth reliability (user verification pending)

### P1 (High Priority)
- [x] TensorFlow/Keras code generation option ✅ COMPLETED
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
- [ ] Sentiment analysis pre-training for Text Classifier
- [ ] More PDF document types support (scanned PDFs with OCR)

### Future Enhancements (Advanced)
- [x] **Advanced Transformer Support:** ✅ COMPLETED
  - PositionalEncoding layer with max_len, d_model, dropout config
  - TransformerEncoderBlock composite layer (stacks N encoder layers internally)
  - TransformerDecoderBlock composite layer
  - GlobalAvgPool1D for sequence pooling
  - Updated Transformer template to BERT-style (Embedding → PosEnc → Encoder → Pool → Output)
- [x] **Multi-Input Connections (Skip Connections):** ✅ COMPLETED
  - Add layer with multiple input handles for residual connections
  - Concatenate layer for feature fusion
  - Visual distinction (green handles for skip connections)
  - ResNet Block template demonstrating skip connections
  - PyTorch code generation with proper skip connection handling
  - Keras code generation with Add/Concatenate layers
- [ ] **Graph Architecture Enhancements (Future):**
  - Branching and merging paths (arbitrary graph topologies)
  - Parallel layer execution visualization

## Test Reports
- Latest test run: Jan 11, 2025 - 9 tests passed (pytest)
- Test file: /app/tests/test_pdf_qa_and_text_classifier.py
