from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import os

router = APIRouter(prefix="/admin", tags=["admin"])

# Simple admin password protection (set this in .env for production)
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "neuralflows2025")

def verify_admin(password: str = Query(..., description="Admin password")):
    """Simple password verification for admin routes"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")
    return True

def create_admin_routes(db):
    
    @router.get("/stats")
    async def get_database_stats(authorized: bool = Depends(verify_admin)):
        """Get overview of all collections and their document counts"""
        try:
            collections = await db.list_collection_names()
            stats = []
            total_documents = 0
            
            for collection_name in collections:
                collection = db[collection_name]
                count = await collection.count_documents({})
                total_documents += count
                
                # Get sample document to show structure
                sample = await collection.find_one({})
                fields = list(sample.keys()) if sample else []
                
                # Get collection size estimate
                stats_info = await db.command("collStats", collection_name)
                size_bytes = stats_info.get("size", 0)
                
                stats.append({
                    "collection": collection_name,
                    "document_count": count,
                    "size_bytes": size_bytes,
                    "size_readable": format_bytes(size_bytes),
                    "fields": fields
                })
            
            # Get database stats
            db_stats = await db.command("dbStats")
            
            return {
                "database_name": db.name,
                "total_collections": len(collections),
                "total_documents": total_documents,
                "total_size_bytes": db_stats.get("dataSize", 0),
                "total_size_readable": format_bytes(db_stats.get("dataSize", 0)),
                "storage_size_readable": format_bytes(db_stats.get("storageSize", 0)),
                "collections": stats
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.get("/collection/{collection_name}")
    async def get_collection_data(
        collection_name: str,
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=100),
        authorized: bool = Depends(verify_admin)
    ):
        """Get paginated data from a specific collection"""
        try:
            collections = await db.list_collection_names()
            if collection_name not in collections:
                raise HTTPException(status_code=404, detail="Collection not found")
            
            collection = db[collection_name]
            total = await collection.count_documents({})
            
            # Get documents with pagination
            cursor = collection.find({}).skip(skip).limit(limit).sort("_id", -1)
            documents = []
            
            async for doc in cursor:
                # Convert ObjectId to string for JSON serialization
                doc["_id"] = str(doc["_id"])
                documents.append(doc)
            
            return {
                "collection": collection_name,
                "total_documents": total,
                "skip": skip,
                "limit": limit,
                "returned": len(documents),
                "documents": documents
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.get("/users")
    async def get_users_summary(authorized: bool = Depends(verify_admin)):
        """Get summary of all users"""
        try:
            collection = db["users"]
            total = await collection.count_documents({})
            
            cursor = collection.find({}, {
                "user_id": 1,
                "email": 1,
                "name": 1,
                "created_at": 1
            }).sort("created_at", -1)
            
            users = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                users.append(doc)
            
            return {
                "total_users": total,
                "users": users
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.get("/models")
    async def get_models_summary(authorized: bool = Depends(verify_admin)):
        """Get summary of all saved models"""
        try:
            collection = db["network_models"]
            total = await collection.count_documents({})
            
            # Get models with basic info only (not full node data)
            cursor = collection.find({}, {
                "model_id": 1,
                "user_id": 1,
                "name": 1,
                "created_at": 1,
                "updated_at": 1,
                "is_public": 1,
                "share_token": 1
            }).sort("created_at", -1)
            
            models = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                # Count nodes if available
                models.append(doc)
            
            # Get models per user
            pipeline = [
                {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            models_per_user = []
            async for doc in collection.aggregate(pipeline):
                models_per_user.append({"user_id": doc["_id"], "model_count": doc["count"]})
            
            return {
                "total_models": total,
                "models_per_user": models_per_user,
                "models": models
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.get("/sessions")
    async def get_sessions_summary(authorized: bool = Depends(verify_admin)):
        """Get summary of user sessions"""
        try:
            collection = db["user_sessions"]
            total = await collection.count_documents({})
            
            # Count active sessions (not expired)
            from datetime import datetime
            active = await collection.count_documents({
                "expires_at": {"$gt": datetime.utcnow().isoformat()}
            })
            
            cursor = collection.find({}, {
                "session_token": 0  # Don't expose tokens
            }).sort("created_at", -1).limit(20)
            
            sessions = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                sessions.append(doc)
            
            return {
                "total_sessions": total,
                "active_sessions": active,
                "recent_sessions": sessions
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.delete("/collection/{collection_name}/clear")
    async def clear_collection(
        collection_name: str,
        confirm: str = Query(..., description="Type 'DELETE' to confirm"),
        authorized: bool = Depends(verify_admin)
    ):
        """Clear all documents from a collection (dangerous!)"""
        if confirm != "DELETE":
            raise HTTPException(status_code=400, detail="Must confirm with 'DELETE'")
        
        try:
            # Protect users collection
            if collection_name == "users":
                raise HTTPException(status_code=403, detail="Cannot clear users collection")
            
            collections = await db.list_collection_names()
            if collection_name not in collections:
                raise HTTPException(status_code=404, detail="Collection not found")
            
            result = await db[collection_name].delete_many({})
            
            return {
                "message": f"Cleared {result.deleted_count} documents from {collection_name}",
                "deleted_count": result.deleted_count
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    return router


def format_bytes(size_bytes):
    """Convert bytes to human readable format"""
    if size_bytes == 0:
        return "0 B"
    
    units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    size = float(size_bytes)
    
    while size >= 1024 and i < len(units) - 1:
        size /= 1024
        i += 1
    
    return f"{size:.2f} {units[i]}"
