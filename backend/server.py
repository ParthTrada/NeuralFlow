from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="NeuralFlow Architect API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class LayerConfig(BaseModel):
    layerType: str
    label: str
    config: Dict[str, Any] = {}
    position: Dict[str, float] = {"x": 0, "y": 0}

class NetworkCreate(BaseModel):
    name: str
    layers: List[LayerConfig]
    edges: List[Dict[str, str]]

class NetworkResponse(BaseModel):
    id: str
    name: str
    layers: List[LayerConfig]
    edges: List[Dict[str, str]]
    created_at: str

class CodeGenerationRequest(BaseModel):
    layers: List[Dict[str, Any]]
    edges: List[Dict[str, str]]

class ValidationRequest(BaseModel):
    layers: List[Dict[str, Any]]
    edges: List[Dict[str, str]]

class ValidationResponse(BaseModel):
    valid: bool
    errors: List[str] = []
    warnings: List[str] = []

# Routes
@api_router.get("/")
async def root():
    return {"message": "NeuralFlow Architect API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

@api_router.post("/validate", response_model=ValidationResponse)
async def validate_network(request: ValidationRequest):
    """Validate the neural network architecture"""
    errors = []
    warnings = []
    
    layers = request.layers
    edges = request.edges
    
    if len(layers) == 0:
        errors.append("Network must have at least one layer")
        return ValidationResponse(valid=False, errors=errors, warnings=warnings)
    
    # Check for input layer
    input_layers = [l for l in layers if l.get('data', {}).get('layerType') == 'Input']
    if len(input_layers) == 0:
        warnings.append("Network has no Input layer - consider adding one for clarity")
    
    # Check for output layer
    output_layers = [l for l in layers if l.get('data', {}).get('layerType') == 'Output']
    if len(output_layers) == 0:
        warnings.append("Network has no Output layer - consider adding one")
    
    # Check for disconnected nodes
    connected_nodes = set()
    for edge in edges:
        connected_nodes.add(edge.get('source'))
        connected_nodes.add(edge.get('target'))
    
    all_node_ids = {l.get('id') for l in layers}
    disconnected = all_node_ids - connected_nodes
    
    if len(disconnected) > 0 and len(layers) > 1:
        warnings.append(f"Found {len(disconnected)} disconnected layer(s)")
    
    # Check layer configurations
    for layer in layers:
        layer_type = layer.get('data', {}).get('layerType')
        config = layer.get('data', {}).get('config', {})
        
        if layer_type == 'Dense':
            if config.get('units', 0) <= 0:
                errors.append(f"Dense layer must have positive units")
        
        if layer_type == 'Dropout':
            rate = config.get('rate', 0)
            if rate < 0 or rate > 1:
                errors.append(f"Dropout rate must be between 0 and 1")
        
        if layer_type == 'Conv2D':
            if config.get('kernelSize', 0) <= 0:
                errors.append(f"Conv2D kernel size must be positive")
    
    return ValidationResponse(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )

@api_router.post("/generate-code")
async def generate_code(request: CodeGenerationRequest):
    """Generate PyTorch code from network definition"""
    layers = request.layers
    edges = request.edges
    
    # Simple validation
    if len(layers) == 0:
        return {"code": "# No layers defined", "success": False}
    
    # The actual code generation is done on frontend for immediate feedback
    # This endpoint can be used for server-side generation if needed
    return {
        "success": True,
        "message": "Code generation handled on client for instant preview",
        "layer_count": len(layers),
        "edge_count": len(edges)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
