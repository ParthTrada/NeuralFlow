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
        try:
            # Call Emergent auth API
            async with httpx.AsyncClient() as client:
                auth_response = await client.get(
                    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                    headers={"X-Session-ID": request.session_id}
                )
                
                if auth_response.status_code != 200:
                    raise HTTPException(status_code=401, detail="Invalid session_id")
                
                auth_data = auth_response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Auth service unavailable")
        
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
            # Update user info
            await db.users.update_one(
                {"email": email},
                {"$set": {"name": name, "picture": picture}}
            )
        else:
            # Create new user
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
            "picture": picture
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
        """Save a network model"""
        user = await get_current_user(request, db)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        model_id = f"model_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        
        model_doc = {
            "model_id": model_id,
            "user_id": user.user_id,
            "name": data.name,
            "nodes": data.nodes,
            "edges": data.edges,
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
    
    return router
