"""
Collaboration Router - Comments and version history
"""
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/collaboration", tags=["collaboration"])


# Pydantic schemas
class CommentCreate(BaseModel):
    program_id: str
    user_id: str
    user_name: str
    content: str
    section: Optional[str] = None  # e.g., "problem", "stakeholders", "outcomes"


class CommentResponse(BaseModel):
    id: str
    program_id: str
    user_id: str
    user_name: str
    content: str
    section: Optional[str] = None
    created_at: str
    is_resolved: bool = False


class VersionCreate(BaseModel):
    program_id: str
    user_id: str
    user_name: str
    description: str
    changes: dict


class VersionResponse(BaseModel):
    id: str
    program_id: str
    user_id: str
    user_name: str
    description: str
    version_number: int
    created_at: str


# In-memory storage (would be database tables in production)
comments_store: dict = {}
versions_store: dict = {}
version_counters: dict = {}  # program_id -> latest version number


@router.post("/comments", response_model=CommentResponse)
async def add_comment(comment: CommentCreate):
    """Add a comment to a program."""
    comment_id = str(uuid4())
    
    new_comment = {
        "id": comment_id,
        "program_id": comment.program_id,
        "user_id": comment.user_id,
        "user_name": comment.user_name,
        "content": comment.content,
        "section": comment.section,
        "created_at": datetime.utcnow().isoformat(),
        "is_resolved": False,
    }
    
    comments_store[comment_id] = new_comment
    return new_comment


@router.get("/comments/{program_id}", response_model=List[CommentResponse])
async def get_comments(program_id: str, section: Optional[str] = None):
    """Get all comments for a program, optionally filtered by section."""
    comments = [c for c in comments_store.values() if c["program_id"] == program_id]
    
    if section:
        comments = [c for c in comments if c.get("section") == section]
    
    return sorted(comments, key=lambda x: x["created_at"], reverse=True)


@router.patch("/comments/{comment_id}/resolve")
async def resolve_comment(comment_id: str):
    """Mark a comment as resolved."""
    if comment_id not in comments_store:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comments_store[comment_id]["is_resolved"] = True
    return comments_store[comment_id]


@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str):
    """Delete a comment."""
    if comment_id not in comments_store:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    del comments_store[comment_id]
    return {"message": "Comment deleted"}


@router.post("/versions", response_model=VersionResponse)
async def create_version(version: VersionCreate):
    """Create a new version snapshot of a program."""
    version_id = str(uuid4())
    
    # Increment version counter for this program
    if version.program_id not in version_counters:
        version_counters[version.program_id] = 0
    version_counters[version.program_id] += 1
    
    new_version = {
        "id": version_id,
        "program_id": version.program_id,
        "user_id": version.user_id,
        "user_name": version.user_name,
        "description": version.description,
        "changes": version.changes,
        "version_number": version_counters[version.program_id],
        "created_at": datetime.utcnow().isoformat(),
    }
    
    versions_store[version_id] = new_version
    return new_version


@router.get("/versions/{program_id}", response_model=List[VersionResponse])
async def get_versions(program_id: str):
    """Get version history for a program."""
    versions = [v for v in versions_store.values() if v["program_id"] == program_id]
    return sorted(versions, key=lambda x: x["version_number"], reverse=True)


@router.get("/versions/{program_id}/{version_number}")
async def get_version(program_id: str, version_number: int):
    """Get a specific version of a program."""
    version = next(
        (v for v in versions_store.values() 
         if v["program_id"] == program_id and v["version_number"] == version_number),
        None
    )
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return version


@router.get("/activity/{program_id}")
async def get_activity(program_id: str, limit: int = 10):
    """Get recent activity (comments + versions) for a program."""
    comments = [
        {"type": "comment", "content": c["content"], "user": c["user_name"], 
         "created_at": c["created_at"], "section": c.get("section")}
        for c in comments_store.values() if c["program_id"] == program_id
    ]
    
    versions = [
        {"type": "version", "content": f"Version {v['version_number']}: {v['description']}", 
         "user": v["user_name"], "created_at": v["created_at"]}
        for v in versions_store.values() if v["program_id"] == program_id
    ]
    
    activity = comments + versions
    activity.sort(key=lambda x: x["created_at"], reverse=True)
    
    return activity[:limit]
