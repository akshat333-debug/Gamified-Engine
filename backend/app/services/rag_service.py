"""
RAG Service - Vector search for Proven Models
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ProvenModel
from app.services.ai_service import get_ai_service


class RAGService:
    """Service for semantic search over proven models using pgvector."""
    
    async def search_models(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 5,
        theme_filter: Optional[str] = None
    ) -> List[ProvenModel]:
        """
        Search for proven models using semantic similarity.
        Falls back to keyword search if embeddings are not available.
        """
        try:
            # Try to get embedding for semantic search
            ai_service = get_ai_service()
            embedding = await ai_service.get_embedding(query)
            
            # Build the vector similarity query
            sql = """
                SELECT *, embedding <=> :embedding AS distance
                FROM proven_models
                WHERE embedding IS NOT NULL
            """
            
            params = {"embedding": str(embedding), "limit": limit}
            
            if theme_filter:
                sql += " AND :theme = ANY(themes)"
                params["theme"] = theme_filter
            
            sql += " ORDER BY distance LIMIT :limit"
            
            result = await db.execute(text(sql), params)
            rows = result.fetchall()
            
            # Convert to ProvenModel objects
            models = []
            for row in rows:
                model = await db.get(ProvenModel, row.id)
                if model:
                    models.append(model)
            
            return models
            
        except Exception:
            # Fallback to keyword search
            return await self.keyword_search(db, query, limit, theme_filter)
    
    async def keyword_search(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 5,
        theme_filter: Optional[str] = None
    ) -> List[ProvenModel]:
        """Fallback keyword-based search."""
        query_lower = f"%{query.lower()}%"
        
        stmt = select(ProvenModel).where(
            (ProvenModel.name.ilike(query_lower)) |
            (ProvenModel.description.ilike(query_lower)) |
            (ProvenModel.target_outcomes.any(query_lower))
        )
        
        if theme_filter:
            stmt = stmt.where(ProvenModel.themes.any(theme_filter))
        
        stmt = stmt.limit(limit)
        
        result = await db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_all_models(
        self,
        db: AsyncSession,
        theme_filter: Optional[str] = None,
        limit: int = 20
    ) -> List[ProvenModel]:
        """Get all proven models, optionally filtered by theme."""
        stmt = select(ProvenModel)
        
        if theme_filter:
            stmt = stmt.where(ProvenModel.themes.any(theme_filter))
        
        stmt = stmt.limit(limit)
        
        result = await db.execute(stmt)
        return list(result.scalars().all())


# Singleton instance
rag_service = RAGService()


def get_rag_service() -> RAGService:
    return rag_service
