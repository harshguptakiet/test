"""
LLM Service for CuraGenie Genomic Chatbot

Supports multiple LLM providers:
- OpenAI GPT models
- Anthropic Claude
- Local Ollama models

Provides genomics-specialized prompting and context management.
"""

import logging
import json
from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
import openai
import requests
from core.config import settings

logger = logging.getLogger(__name__)

class LLMProvider(ABC):
    """Abstract base class for LLM providers"""
    
    @abstractmethod
    async def generate_response(self, user_message: str, user_context: Dict[str, Any]) -> str:
        """Generate a response based on user message and genomic context"""
        pass

class OpenAIProvider(LLMProvider):
    """OpenAI GPT provider for genomic chatbot"""
    
    def __init__(self):
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        openai.api_key = settings.openai_api_key
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
    
    async def generate_response(self, user_message: str, user_context: Dict[str, Any]) -> str:
        """Generate response using OpenAI GPT"""
        try:
            # Build genomics-specific system prompt
            system_prompt = self._build_system_prompt(user_context)
            
            # Create conversation
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
            
            # Generate response
            response = self.client.chat.completions.create(
                model=settings.llm_model,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
                top_p=0.9
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again or contact support."
    
    def _build_system_prompt(self, user_context: Dict[str, Any]) -> str:
        """Build genomics-specialized system prompt"""
        base_prompt = """You are a specialized AI genomics assistant for CuraGenie, a precision medicine platform. Your role is to help users understand their genetic analysis results, polygenic risk scores, and personalized health recommendations.

Key guidelines:
1. Always provide scientifically accurate, evidence-based information
2. Explain complex genetic concepts in simple, accessible terms
3. Be empathetic and supportive when discussing health risks
4. Never provide specific medical advice - always recommend consulting healthcare providers
5. Focus on actionable lifestyle and prevention strategies
6. Explain the limitations of genetic testing and risk predictions

Available user data context:
"""
        
        # Add user-specific context if available
        if user_context.get("prs_scores"):
            base_prompt += f"\n- Polygenic Risk Scores: {json.dumps(user_context['prs_scores'], indent=2)}"
        
        if user_context.get("genomic_variants"):
            base_prompt += f"\n- Key Genetic Variants: {json.dumps(user_context['genomic_variants'], indent=2)}"
        
        if user_context.get("risk_conditions"):
            base_prompt += f"\n- High Risk Conditions: {user_context['risk_conditions']}"
        
        if user_context.get("recommendations"):
            base_prompt += f"\n- Active Recommendations: {user_context['recommendations']}"
        
        base_prompt += """

Always frame responses in terms of:
- Risk vs. absolute certainty (genetics is about probability, not destiny)
- Evidence-based recommendations
- The importance of lifestyle factors
- When to consult healthcare providers
- Next steps the user can take

Be conversational but professional, and always acknowledge the emotional impact of genetic information."""
        
        return base_prompt

class AnthropicProvider(LLMProvider):
    """Anthropic Claude provider for genomic chatbot"""
    
    def __init__(self):
        if not settings.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        self.api_key = settings.anthropic_api_key
        self.base_url = "https://api.anthropic.com/v1/messages"
    
    async def generate_response(self, user_message: str, user_context: Dict[str, Any]) -> str:
        """Generate response using Anthropic Claude"""
        try:
            # Build prompt
            system_prompt = self._build_system_prompt(user_context)
            
            headers = {
                "x-api-key": self.api_key,
                "content-type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            
            data = {
                "model": "claude-3-sonnet-20240229",
                "max_tokens": 500,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_message}]
            }
            
            response = requests.post(self.base_url, headers=headers, json=data)
            response.raise_for_status()
            
            result = response.json()
            return result["content"][0]["text"].strip()
            
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again or contact support."
    
    def _build_system_prompt(self, user_context: Dict[str, Any]) -> str:
        """Build genomics-specialized system prompt for Claude"""
        return OpenAIProvider()._build_system_prompt(user_context)  # Reuse the same prompt logic

class OllamaProvider(LLMProvider):
    """Local Ollama provider for genomic chatbot"""
    
    def __init__(self):
        self.base_url = settings.ollama_base_url
        # Default model for genomics (you can use llama2, codellama, etc.)
        self.model = settings.llm_model if settings.llm_model != "gpt-3.5-turbo" else "llama2"
    
    async def generate_response(self, user_message: str, user_context: Dict[str, Any]) -> str:
        """Generate response using local Ollama"""
        try:
            # Build prompt
            system_prompt = self._build_system_prompt(user_context)
            full_prompt = f"{system_prompt}\n\nHuman: {user_message}\n\nAssistant:"
            
            data = {
                "model": self.model,
                "prompt": full_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 500
                }
            }
            
            response = requests.post(f"{self.base_url}/api/generate", json=data)
            response.raise_for_status()
            
            result = response.json()
            return result["response"].strip()
            
        except Exception as e:
            logger.error(f"Ollama API error: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Please ensure Ollama is running locally."
    
    def _build_system_prompt(self, user_context: Dict[str, Any]) -> str:
        """Build genomics-specialized system prompt for Ollama"""
        return OpenAIProvider()._build_system_prompt(user_context)  # Reuse the same prompt logic

class GenomicLLMService:
    """Main service for genomic LLM interactions"""
    
    def __init__(self):
        self.provider = self._initialize_provider()
    
    def _initialize_provider(self) -> LLMProvider:
        """Initialize the configured LLM provider"""
        provider_name = settings.llm_provider.lower()
        
        try:
            if provider_name == "openai":
                return OpenAIProvider()
            elif provider_name == "anthropic":
                return AnthropicProvider()
            elif provider_name == "ollama":
                return OllamaProvider()
            else:
                logger.error(f"Unknown LLM provider: {provider_name}")
                raise ValueError(f"Unsupported LLM provider: {provider_name}")
                
        except Exception as e:
            logger.error(f"Failed to initialize LLM provider {provider_name}: {e}")
            # Fallback to mock responses if no provider works
            return MockProvider()
    
    async def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Fetch user's genomic context from database"""
        # This would integrate with your existing database models
        # For now, return mock context - you'll need to implement the real database queries
        
        try:
            from db.database import SessionLocal
            from db.models import GenomicData, PrsScore
            
            db = SessionLocal()
            
            # Get user's genomic data
            genomic_data = db.query(GenomicData).filter(GenomicData.user_id == user_id).all()
            prs_scores = db.query(PrsScore).join(GenomicData).filter(GenomicData.user_id == user_id).all()
            
            context = {
                "user_id": user_id,
                "prs_scores": {},
                "genomic_variants": [],
                "risk_conditions": [],
                "recommendations": []
            }
            
            # Process PRS scores
            for prs in prs_scores:
                context["prs_scores"][prs.disease_type] = {
                    "score": prs.score,
                    "interpretation": self._interpret_prs_score(prs.score),
                    "percentile": self._score_to_percentile(prs.score)
                }
                
                if prs.score > 0.6:  # High risk threshold
                    context["risk_conditions"].append(prs.disease_type)
            
            # Process genomic variants (from metadata)
            for gdata in genomic_data:
                if gdata.metadata_json and gdata.metadata_json.get("sample_variants"):
                    variants = gdata.metadata_json["sample_variants"]
                    for variant in variants[:5]:  # Top 5 variants
                        if variant.get("id"):
                            context["genomic_variants"].append({
                                "id": variant["id"],
                                "chromosome": variant.get("chromosome"),
                                "type": variant.get("variant_type"),
                                "quality": variant.get("quality")
                            })
            
            # Generate recommendations based on risk
            if "diabetes" in context["risk_conditions"]:
                context["recommendations"].extend([
                    "Regular HbA1c monitoring",
                    "Mediterranean diet pattern", 
                    "Regular exercise routine"
                ])
            
            db.close()
            return context
            
        except Exception as e:
            logger.error(f"Error fetching user context: {e}")
            return {"user_id": user_id, "error": "Could not fetch user data"}
    
    def _interpret_prs_score(self, score: float) -> str:
        """Interpret PRS score into risk category"""
        if score >= 0.8:
            return "Very High Risk"
        elif score >= 0.6:
            return "High Risk"
        elif score >= 0.4:
            return "Moderate Risk"
        elif score >= 0.2:
            return "Low Risk"
        else:
            return "Very Low Risk"
    
    def _score_to_percentile(self, score: float) -> int:
        """Convert PRS score to population percentile (simplified)"""
        return min(99, int(score * 100))
    
    async def generate_response(self, user_id: str, message: str) -> str:
        """Generate contextualized response for user"""
        try:
            # Get user context
            user_context = await self.get_user_context(user_id)
            
            # Generate response using configured provider
            response = await self.provider.generate_response(message, user_context)
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating LLM response: {e}")
            return "I apologize, but I'm experiencing technical difficulties. Please try again later."

class MockProvider(LLMProvider):
    """Fallback mock provider when no real LLM is available"""
    
    async def generate_response(self, user_message: str, user_context: Dict[str, Any]) -> str:
        """Generate mock response when LLM providers fail"""
        message_lower = user_message.lower()
        
        if any(word in message_lower for word in ['prs', 'risk', 'score']):
            if user_context.get("prs_scores"):
                high_risk = [disease for disease, data in user_context["prs_scores"].items() 
                           if data.get("score", 0) > 0.6]
                if high_risk:
                    return f"Based on your genomic analysis, you have elevated polygenic risk scores for {', '.join(high_risk)}. This indicates increased susceptibility, but remember that genetics is just one factor. I'd recommend discussing prevention strategies with your healthcare provider."
            
            return "Your polygenic risk scores provide insights into your genetic predisposition for various conditions. Would you like me to explain what these scores mean or discuss prevention strategies?"
        
        elif any(word in message_lower for word in ['recommendation', 'advice', 'prevent']):
            return "Based on your genetic profile, I can suggest evidence-based lifestyle modifications that may help reduce your risk. These typically include dietary changes, exercise routines, and monitoring strategies. What specific area would you like to focus on?"
        
        elif any(word in message_lower for word in ['genome', 'genetic', 'variant']):
            return "Your genomic analysis has identified several genetic variants that influence your health risks. Each variant contributes differently to your overall risk profile. Would you like me to explain how these variants work or their clinical significance?"
        
        else:
            return "I'm here to help you understand your genomic analysis results and personalized health recommendations. I can explain your polygenic risk scores, discuss your genetic variants, or provide evidence-based health recommendations. What would you like to know more about?"

# Global service instance
llm_service = GenomicLLMService()
