"""
Chatbot API for CuraGenie with real LLM integration

Provides endpoints for genomics-specialized conversational AI.
"""

import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
from core.llm_service import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

class ChatRequest(BaseModel):
    user_id: str
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    success: bool
    conversation_id: Optional[str] = None
    context_used: bool = False

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    """
    Send a message to the genomics AI assistant
    
    The assistant will:
    1. Fetch the user's genomic context (PRS scores, variants, etc.)
    2. Generate a contextualized response using the configured LLM
    3. Provide genomics-specific advice and explanations
    """
    try:
        logger.info(f"Chat request from user {request.user_id}: {request.message[:50]}...")
        
        # Generate response using LLM service
        response = await llm_service.generate_response(
            user_id=request.user_id,
            message=request.message
        )
        
        # Get user context to determine if real data was used
        user_context = await llm_service.get_user_context(request.user_id)
        context_used = bool(user_context.get("prs_scores") or user_context.get("genomic_variants"))
        
        logger.info(f"Generated response for user {request.user_id} (context_used: {context_used})")
        
        return ChatResponse(
            response=response,
            success=True,
            conversation_id=request.conversation_id,
            context_used=context_used
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate response. Please try again."
        )

@router.get("/context/{user_id}")
async def get_user_context(user_id: str):
    """
    Get the user's genomic context data used for chatbot responses
    
    This endpoint shows what data the chatbot has access to for this user.
    """
    try:
        context = await llm_service.get_user_context(user_id)
        return {
            "user_id": user_id,
            "context": context,
            "has_genomic_data": bool(context.get("genomic_variants")),
            "has_prs_scores": bool(context.get("prs_scores")),
            "high_risk_conditions": context.get("risk_conditions", [])
        }
    except Exception as e:
        logger.error(f"Error fetching user context: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch user context"
        )

@router.get("/health")
async def chatbot_health():
    """
    Health check endpoint for the chatbot service
    
    Returns information about:
    - LLM provider being used
    - Whether the provider is configured correctly
    - Available features
    """
    try:
        provider_name = llm_service.provider.__class__.__name__
        
        # Test if provider is working by generating a simple response
        test_context = {"user_id": "test", "prs_scores": {}}
        test_response = await llm_service.provider.generate_response(
            "Hello, this is a test message", 
            test_context
        )
        
        provider_working = bool(test_response and len(test_response) > 10)
        
        return {
            "status": "healthy",
            "llm_provider": provider_name,
            "provider_working": provider_working,
            "features": {
                "genomic_context": True,
                "prs_integration": True,
                "variant_explanation": True,
                "personalized_recommendations": True
            }
        }
        
    except Exception as e:
        logger.error(f"Chatbot health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "llm_provider": "unknown",
            "provider_working": False
        }
