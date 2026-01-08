from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import httpx
import uuid
import secrets
import json
import base64

router = APIRouter(prefix="/auth", tags=["auth"])

# Pydantic models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: Optional[str] = None

class SessionRequest(BaseModel):
    session_id: str

class NetworkModel(BaseModel):
    model_id: str
    user_id: str
    name: str
    nodes: list
    edges: list
    created_at: str
    updated_at: str

class SaveNetworkRequest(BaseModel):
    name: str
    nodes: list
    edges: list
    trained_weights: Optional[str] = None  # Base64 encoded weights
    version_note: Optional[str] = None

class ShareModelRequest(BaseModel):
    model_id: str

# Helper to get user from session
async def get_current_user(request: Request, db) -> Optional[User]:
    # Check cookie first, then Authorization header
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

def create_auth_routes(db):
    @router.post("/session")
    async def create_session(request: SessionRequest, response: Response):
        """Exchange session_id for session_token"""
        import logging
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        try:
            # Call Emergent auth API
            session_preview = request.session_id[:30] if len(request.session_id) > 30 else request.session_id
            logger.info(f"Processing session_id: {session_preview}...")
            print(f"[AUTH] Processing session_id: {session_preview}...")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                auth_response = await client.get(
                    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                    headers={"X-Session-ID": request.session_id}
                )
                
                logger.info(f"Auth API response status: {auth_response.status_code}")
                print(f"[AUTH] Emergent API response: {auth_response.status_code}")
                
                if auth_response.status_code != 200:
                    error_text = auth_response.text[:200] if auth_response.text else "No error details"
                    logger.error(f"Auth API error: {error_text}")
                    print(f"[AUTH] Error from Emergent: {error_text}")
                    raise HTTPException(
                        status_code=401, 
                        detail=f"Session verification failed (code: {auth_response.status_code}). Please try signing in again."
                    )
                
                auth_data = auth_response.json()
                logger.info(f"Auth successful for email: {auth_data.get('email', 'unknown')}")
                print(f"[AUTH] Success for: {auth_data.get('email', 'unknown')}")
                
        except httpx.RequestError as e:
            logger.error(f"Auth service request error: {str(e)}")
            print(f"[AUTH] Request error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Auth service unavailable: {str(e)}")
        
        # Extract user data
        email = auth_data.get("email")
        name = auth_data.get("name")
        picture = auth_data.get("picture")
        session_token = auth_data.get("session_token")
        
        if not email or not session_token:
            raise HTTPException(status_code=401, detail="Invalid auth response")
        
        # Find or create user
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["user_id"]
            await db.users.update_one(
                {"email": email},
                {"$set": {"name": name, "picture": picture}}
            )
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        # Create session
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )
        
        return {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "session_token": session_token  # Return token for localStorage backup
        }
    
    @router.get("/me")
    async def get_me(request: Request):
        """Get current user from session"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        return user
    
    @router.post("/logout")
    async def logout(request: Request, response: Response):
        """Logout and clear session"""
        session_token = request.cookies.get("session_token")
        if session_token:
            await db.user_sessions.delete_one({"session_token": session_token})
        
        response.delete_cookie(key="session_token", path="/")
        return {"message": "Logged out"}
    
    # Network model routes
    @router.get("/models")
    async def get_user_models(request: Request):
        """Get all models for current user"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        models = await db.network_models.find(
            {"user_id": user.user_id},
            {"_id": 0}
        ).sort("updated_at", -1).to_list(100)
        
        return models
    
    @router.post("/models")
    async def save_model(request: Request, data: SaveNetworkRequest):
        """Save a network model (creates new version if model with same name exists)"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        model_id = f"model_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        
        # Check if model with same name exists to determine version
        existing_models = await db.network_models.find(
            {"user_id": user.user_id, "name": data.name},
            {"_id": 0, "version": 1}
        ).sort("version", -1).to_list(1)
        
        version = 1
        if existing_models:
            version = (existing_models[0].get("version", 1)) + 1
        
        model_doc = {
            "model_id": model_id,
            "user_id": user.user_id,
            "name": data.name,
            "nodes": data.nodes,
            "edges": data.edges,
            "trained_weights": data.trained_weights,
            "version": version,
            "version_note": data.version_note or f"Version {version}",
            "is_public": False,
            "share_token": None,
            "created_at": now,
            "updated_at": now
        }
        
        await db.network_models.insert_one(model_doc)
        
        # Return without _id
        model_doc.pop("_id", None)
        return model_doc
    
    @router.put("/models/{model_id}")
    async def update_model(model_id: str, request: Request, data: SaveNetworkRequest):
        """Update a network model"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        result = await db.network_models.update_one(
            {"model_id": model_id, "user_id": user.user_id},
            {"$set": {
                "name": data.name,
                "nodes": data.nodes,
                "edges": data.edges,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Model not found")
        
        return {"message": "Model updated"}
    
    @router.delete("/models/{model_id}")
    async def delete_model(model_id: str, request: Request):
        """Delete a network model"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        result = await db.network_models.delete_one(
            {"model_id": model_id, "user_id": user.user_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Model not found")
        
        return {"message": "Model deleted"}
    
    @router.get("/models/{model_id}")
    async def get_model(model_id: str, request: Request):
        """Get a specific model"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        model = await db.network_models.find_one(
            {"model_id": model_id, "user_id": user.user_id},
            {"_id": 0}
        )
        
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        return model
    
    # Sharing endpoints
    @router.post("/models/{model_id}/share")
    async def create_share_link(model_id: str, request: Request):
        """Generate a share link for a model"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Generate unique share token
        share_token = secrets.token_urlsafe(16)
        
        result = await db.network_models.update_one(
            {"model_id": model_id, "user_id": user.user_id},
            {"$set": {
                "is_public": True,
                "share_token": share_token,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Model not found")
        
        return {"share_token": share_token}
    
    @router.delete("/models/{model_id}/share")
    async def revoke_share_link(model_id: str, request: Request):
        """Revoke share link for a model"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        result = await db.network_models.update_one(
            {"model_id": model_id, "user_id": user.user_id},
            {"$set": {
                "is_public": False,
                "share_token": None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Model not found")
        
        return {"message": "Share link revoked"}
    
    @router.get("/shared/{share_token}")
    async def get_shared_model(share_token: str):
        """Get a shared model by share token (public, no auth required)"""
        model = await db.network_models.find_one(
            {"share_token": share_token, "is_public": True},
            {"_id": 0, "user_id": 0}  # Don't expose user_id
        )
        
        if not model:
            raise HTTPException(status_code=404, detail="Shared model not found or link expired")
        
        # Get owner name
        owner = await db.users.find_one(
            {"user_id": model.get("user_id")},
            {"_id": 0, "name": 1}
        )
        
        model["owner_name"] = owner.get("name", "Unknown") if owner else "Unknown"
        return model
    
    @router.post("/models/{model_id}/clone")
    async def clone_shared_model(model_id: str, request: Request):
        """Clone a shared model to your own account"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Find the original model (must be public)
        original = await db.network_models.find_one(
            {"model_id": model_id, "is_public": True},
            {"_id": 0}
        )
        
        if not original:
            raise HTTPException(status_code=404, detail="Model not found or not shared")
        
        # Create a clone
        new_model_id = f"model_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        
        clone_doc = {
            "model_id": new_model_id,
            "user_id": user.user_id,
            "name": f"{original['name']} (Clone)",
            "nodes": original["nodes"],
            "edges": original["edges"],
            "trained_weights": original.get("trained_weights"),
            "version": 1,
            "version_note": f"Cloned from shared model",
            "cloned_from": model_id,
            "is_public": False,
            "share_token": None,
            "created_at": now,
            "updated_at": now
        }
        
        await db.network_models.insert_one(clone_doc)
        clone_doc.pop("_id", None)
        
        return clone_doc
    
    # Get model versions
    @router.get("/models/{model_id}/versions")
    async def get_model_versions(model_id: str, request: Request):
        """Get all versions of a model by name"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # First get the model to find its name
        model = await db.network_models.find_one(
            {"model_id": model_id, "user_id": user.user_id},
            {"_id": 0, "name": 1}
        )
        
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        
        # Get all versions with same name
        versions = await db.network_models.find(
            {"user_id": user.user_id, "name": model["name"]},
            {"_id": 0}
        ).sort("version", -1).to_list(50)
        
        return versions
    
    # Save training data endpoint
    @router.patch("/models/{model_id}/training")
    async def save_training_data(model_id: str, request: Request):
        """Save training data (history, config) for a model"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        body = await request.json()
        training_data = body.get("training_data")
        
        if not training_data:
            raise HTTPException(status_code=400, detail="No training data provided")
        
        result = await db.network_models.update_one(
            {"model_id": model_id, "user_id": user.user_id},
            {"$set": {
                "training_data": training_data,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Model not found")
        
        return {"message": "Training data saved"}
    
    return router
