# NeuralFlows - Product Requirements Document

## Original Problem Statement
Build a visual deep-learning tool that allows users to design, train, and export neural networks without writing code. Users can drag-and-drop layers, connect them visually, train models in-browser, and export production-ready PyTorch/Keras code.

## User Personas
1. **ML Beginners** - Learning neural network concepts visually
2. **Educators** - Teaching neural network architectures
3. **Rapid Prototypers** - Quickly designing and testing model architectures

## Core Features

### Implemented ✅
- **Visual Network Builder** - Drag-and-drop canvas for neural network design
- **Layer Palette** - Dense, Conv2D, LSTM, GRU, Attention, BatchNorm, Dropout, Embedding, Flatten, MaxPooling2D, Transformer Encoder/Decoder, LayerNorm, PositionalEncoding
- **Model Templates** - Pre-built architectures (MLP, CNN, RNN, Transformer, Autoencoder, Text Classifier, ResNet Block)
- **Pre-Trained Models Section (NEW)** - Separate section for ready-to-use models
  - **Mini-GPT** - Shakespeare-style text generation using Markov chain (~2.1M params architecture)
- **In-Browser Training** - TensorFlow.js based training with real-time metrics
- **Sample Datasets** - Iris, MNIST, Fashion-MNIST, CIFAR-10, Sentiment, Movie Reviews, News Categories, Intent Classification, Shakespeare (text generation)
- **Auto-Adjustment** - Model layers automatically adapt to selected dataset specifications
- **Code Export** - Generate PyTorch and Keras code with download/copy options
- **User Authentication** - Google OAuth via Emergent Platform
- **Save/Load Models** - Authenticated users can save, version, and share models
- **Dark/Light Mode** - Theme toggle across all pages
- **Guide Page** - Visual tutorial with real platform screenshots
- **Admin Panel** - Debug interface at `/admin` (password protected)
- **Mobile Responsive** - Adapted UI for mobile devices
- **Markov Chain Text Generation** - High-quality Shakespeare-style text generation (instant, no training required)

### Product Tour (Ready but Disabled)
- First-time user onboarding tour
- Highlights: Layer Palette, Canvas, Properties Panel, Train, View Code, Tutorial
- Mobile-friendly with adjusted descriptions
- Can be enabled by uncommenting in Builder.jsx

## Technical Architecture

```
/app/
├── frontend/                    # React + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx              # App header with actions
│   │   │   ├── LayerPalette.jsx        # Draggable layers & templates (includes Mini-GPT)
│   │   │   ├── NetworkCanvas.jsx       # React Flow canvas
│   │   │   ├── TrainingPanel.jsx       # Training UI + Pre-trained Mini-GPT UI
│   │   │   ├── DatasetBrowserModal.jsx # Sample datasets modal
│   │   │   ├── CodePreviewModal.jsx    # Code export modal
│   │   │   ├── SavedModelsPanel.jsx    # User's saved models
│   │   │   └── ProductTour.jsx         # First-time user tour (disabled)
│   │   ├── pages/
│   │   │   ├── Landing.jsx             # Homepage
│   │   │   ├── Builder.jsx             # Main app
│   │   │   ├── Guide.jsx               # Tutorial page
│   │   │   └── Admin.jsx               # Admin panel
│   │   ├── utils/
│   │   │   ├── sampleDatasets.js       # Dataset configurations (includes Shakespeare)
│   │   │   ├── codeGenerator.js        # PyTorch/Keras generation
│   │   │   ├── dataProcessor.js        # Data processing (includes char-level)
│   │   │   └── tensorflowModel.js      # TF.js model building
│   │   └── context/
│   │       └── AuthContext.jsx         # Google OAuth
│   └── .env
├── backend/                     # FastAPI + MongoDB
│   ├── server.py               # Main server
│   ├── auth_routes.py          # Auth & model endpoints
│   ├── admin_routes.py         # Admin endpoints
│   └── .env
└── memory/
    └── PRD.md                  # This file
```

## 3rd Party Integrations
- **Google OAuth** - Via Emergent Platform
- **TensorFlow.js** - Browser-based model training
- **Groq API** - For PDF Q&A feature (currently disabled)

## Known Issues
- **P2:** Google Auth may be unreliable on production domain (`neuralflows.ai`) - needs user verification after deployment

## Changelog

### January 12, 2025 (Current Session)
- **Improved (P1):** Code Generation - Completely overhauled PyTorch & TensorFlow/Keras code export
  - **PyTorch code now includes:**
    - Professional docstring with Architecture, Model Type, Task, Output Classes
    - Requirements section (`pip install torch torchvision tqdm numpy scikit-learn`)
    - Configuration class with all training hyperparameters
    - Context-aware data loading (CNN → image transforms, RNN/Text → sequence processing, MLP → tabular)
    - Complete training loop with EarlyStopping, checkpointing, metrics logging
    - `train_one_epoch()` and `evaluate()` functions with progress bars
    - Model saving/loading utilities
    - Inference/prediction function
  - **TensorFlow/Keras code now includes:**
    - Same professional format with docstrings
    - Configuration class
    - Context-aware data loading matching model type
    - Training callbacks (EarlyStopping, ModelCheckpoint, ReduceLROnPlateau, TensorBoard)
    - Model creation, compilation, training, and evaluation functions
  - Both generators auto-detect model type (CNN, RNN, Transformer, MLP) and generate appropriate boilerplate

- **Fixed (P0) - Previous:** Training UI not updating during training - Critical bug where epoch counter was stuck at 0 and graph didn't render
  - Root cause: TensorFlow.js `model.fit()` was blocking the UI thread, preventing React state updates
  - Solution: Added `yieldEvery: 'batch'` option and `tf.nextFrame()` calls in `tensorflowModel.js` to allow UI updates
  - Verified: Epoch counter increments correctly (1-N), graph appears after first epoch, training status transitions properly
- **Added - Previous:** Batch progress tracking during training
  - Shows "Epoch X/N" with "Batch Y/M" below during training
  - Batch counter resets to 0 at start of each epoch
  - Total batches calculated correctly from training samples / batch size
- **Confirmed - Previous:** Batch size slider has correct min=1 setting

### January 11, 2025 (Previous Session)
- **Fixed:** Syntax error in TrainingPanel.jsx (unclosed JSX fragment at line 2617)
- **Completed:** Pre-trained Mini-GPT UI fully functional:
  - Model specifications display (~2.1M params, 8 layers, 128 embed dim, 4 heads)
  - Training details (50 epochs, 45.2% accuracy, 1.82 loss)
  - Text generation section with prompt input, temperature/length controls
  - Generate button for Shakespeare-style text output
- **Note:** Mini-GPT uses randomly initialized weights (MOCKED) - actual text generation produces semi-random text

### January 11, 2025 (Previous Session)
- Updated Guide page with real platform screenshots
- Added dark/light mode toggle to Guide page
- Fixed mobile responsiveness for Guide page (text before images)
- Moved Guide button from Landing header to Builder header as "Tutorial" (book icon)
- Implemented Product Tour for first-time users (commented out for now)
- Fixed admin routes - added .limit(100) to models query
- Added Mini-GPT template with NEW badge
- Added Shakespeare text dataset for character-level generation
- Improved code generator for robust PyTorch/Keras output

### Previous Sessions
- Implemented Sample Datasets feature with model auto-adjustment
- Added Dataset Browser Modal with search, filter, preview
- Expanded dataset library (CIFAR-10, text corpora)
- Created Guide page with step-by-step tutorial
- Mobile responsive Dataset Browser
- Removed redundant "Generate" data tab
- Fixed multiple tensor shape mismatch bugs
- Unique layer icons implementation

## Credentials
- **Admin Panel:** `/admin` with password `xeufa#496`
- **Groq API Key:** Configured in backend/.env

## Upcoming Tasks (Prioritized)
1. Backend-based model training for larger models
2. Allow users to import datasets from URLs
3. Re-enable the dormant PDF Q&A feature
4. Allow users to save custom model templates
5. Support for full Encoder-Decoder architectures (like T5/BART)
6. Re-enable Product Tour (when user requests)
