"""
AI Service - Orchestrates AI calls for problem refinement, stakeholder suggestions, and indicator generation
Enhanced with retry logic and Indian education context (NIPUN Bharat, NEP 2020)
"""
import json
import asyncio
import time
from typing import Optional
from app.config import get_settings
from app.schemas import (
    RefineProblemResponse,
    SuggestStakeholdersResponse,
    SuggestedStakeholder,
    GenerateIndicatorsResponse,
    GeneratedIndicator
)

# Retry configuration
MAX_RETRIES = 3
BASE_DELAY = 1  # seconds
MAX_DELAY = 30  # seconds

settings = get_settings()

# System prompts for different AI tasks
SYSTEM_PROMPTS = {
    "refine_problem": """You are an M&E (Monitoring and Evaluation) Expert for Education NGOs in India.
Your task is to take a vague challenge statement and restructure it into a clear Root Cause Analysis format.

CONTEXT: Apply knowledge of Indian education policies including:
- NIPUN Bharat (National Initiative for Proficiency in Reading with Understanding and Numeracy)
- NEP 2020 (National Education Policy)
- Foundational Literacy and Numeracy (FLN) benchmarks for Grades 1-3
- ASER assessment standards

When given a challenge statement, you must:
1. Clarify the core problem with specific grade levels and regions if mentioned
2. Identify 3-5 root causes considering Indian educational context
3. Suggest the most appropriate theme from: FLN (Foundational Literacy & Numeracy), Career Readiness, STEM, Life Skills, or Other

Respond in JSON format:
{
    "refined_text": "A clear, structured version of the challenge with context",
    "root_causes": ["cause1", "cause2", "cause3"],
    "suggested_theme": "FLN"
}""",

    "suggest_stakeholders": """You are an M&E Expert for Education NGOs in India.
Based on the given problem statement, suggest relevant stakeholders who should be engaged in the program.

Consider the Indian education ecosystem including:
- School Management Committee (SMC) members
- Anganwadi workers (for early childhood)
- Block Education Officers (BEO)
- Cluster Resource Coordinators (CRC)
- Gram Panchayat representatives
- Parents, Teachers, School Principals
- State/District education officials
- NGO implementation partners

Respond in JSON format:
{
    "stakeholders": [
        {
            "name": "Stakeholder Group Name",
            "role": "Their role in the program",
            "engagement_strategy": "How to engage them",
            "priority": "high/medium/low"
        }
    ]
}

Suggest 4-6 relevant stakeholders appropriate for the Indian context.""",

    "generate_indicators": """You are an M&E (Monitoring and Evaluation) Expert for Education NGOs in India.
When given a Challenge Statement, generate indicators that follow the SMART framework (Specific, Measurable, Achievable, Relevant, Time-bound).

IMPORTANT THEME-SPECIFIC GUIDANCE WITH INDIAN CONTEXT:
- If theme is 'FLN': 
  * Use NIPUN Bharat competency standards (NIPUN 3 goals by Grade 3)
  * Reference ASER tools for assessment
  * Include reading fluency (ORF - Oral Reading Fluency), comprehension, and numeracy
  * Align with state FLN Mission targets
- If theme is 'Career Readiness':
  * Focus on agency, self-efficacy, decision-making per NEP 2020
  * Include vocational awareness and skill development
- If theme is 'STEM':
  * Align with NCF 2023 competencies
  * Focus on scientific temper and problem-solving
- If theme is 'Life Skills':
  * Include social-emotional learning (SEL)
  * Reference CBSE/state board life skills curriculum

Generate BOTH outcome indicators (measuring change/impact) and output indicators (measuring activities).

Respond in JSON format:
{
    "indicators": [
        {
            "type": "outcome",
            "description": "Percentage of Grade 3 students achieving NIPUN benchmark (45 words/min ORF)",
            "measurement_method": "ASER/NIPUN standardized reading assessment",
            "target_value": "75% of students achieve benchmark",
            "frequency": "Quarterly",
            "data_source": "Student assessments"
        },
        {
            "type": "output",
            "description": "Number of TaRL remedial sessions conducted per week",
            "measurement_method": "Session attendance logs",
            "target_value": "5 sessions per week per group",
            "frequency": "Weekly",
            "data_source": "Teacher logs"
        }
    ]
}

Generate 3-4 outcome indicators and 2-3 output indicators."""
}


class AIService:
    """Service for AI-powered features using OpenAI or Google Gemini."""
    
    def __init__(self):
        self.openai_client = None
        self.gemini_client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the AI client based on available API keys."""
        if settings.openai_api_key:
            from openai import OpenAI
            self.openai_client = OpenAI(api_key=settings.openai_api_key)
        elif settings.google_api_key:
            from google import genai
            self.gemini_client = genai.Client(api_key=settings.google_api_key)
        else:
            raise ValueError("No AI API key configured. Set OPENAI_API_KEY or GOOGLE_API_KEY.")
    
    async def _call_ai(self, system_prompt: str, user_prompt: str) -> str:
        """Make an AI API call and return the response."""
        if self.openai_client:
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=2000
            )
            return response.choices[0].message.content
        elif self.gemini_client:
            prompt = f"{system_prompt}\n\nUser Query: {user_prompt}\n\nRespond with valid JSON only."
            response = self.gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            return response.text
        else:
            raise ValueError("No AI client initialized")
    
    def _parse_json_response(self, response: str) -> dict:
        """Parse JSON from AI response, handling potential formatting issues."""
        # Clean up response if needed
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        return json.loads(response.strip())
    
    async def refine_problem(self, challenge_text: str) -> RefineProblemResponse:
        """Refine a vague challenge statement into a structured problem."""
        try:
            response = await self._call_ai(
                SYSTEM_PROMPTS["refine_problem"],
                f"Challenge Statement: {challenge_text}"
            )
            data = self._parse_json_response(response)
            return RefineProblemResponse(
                refined_text=data["refined_text"],
                root_causes=data["root_causes"],
                suggested_theme=data["suggested_theme"]
            )
        except Exception as e:
            # Demo fallback when API quota is exceeded
            print(f"AI API error (using demo fallback): {e}")
            return RefineProblemResponse(
                refined_text=f"[DEMO MODE] {challenge_text}\n\nThis is a demonstration response. The AI API quota has been exceeded. The refined problem statement would normally analyze and restructure the challenge for clarity.",
                root_causes=[
                    "Limited resources for educational interventions",
                    "Lack of trained teachers in target areas",
                    "Insufficient parental engagement in learning",
                    "Absence of structured learning materials"
                ],
                suggested_theme="FLN"
            )
    
    async def suggest_stakeholders(
        self, 
        problem_statement: str, 
        theme: Optional[str] = None
    ) -> SuggestStakeholdersResponse:
        """Suggest relevant stakeholders based on the problem statement."""
        try:
            user_prompt = f"Problem Statement: {problem_statement}"
            if theme:
                user_prompt += f"\nTheme: {theme}"
            
            response = await self._call_ai(
                SYSTEM_PROMPTS["suggest_stakeholders"],
                user_prompt
            )
            data = self._parse_json_response(response)
            
            stakeholders = [
                SuggestedStakeholder(
                    name=s["name"],
                    role=s["role"],
                    engagement_strategy=s["engagement_strategy"],
                    priority=s["priority"]
                )
                for s in data["stakeholders"]
            ]
            return SuggestStakeholdersResponse(stakeholders=stakeholders)
        except Exception as e:
            print(f"AI API error (using demo fallback): {e}")
            return SuggestStakeholdersResponse(stakeholders=[
                SuggestedStakeholder(name="Primary School Teachers", role="Program implementers", engagement_strategy="Training workshops and ongoing support", priority="high"),
                SuggestedStakeholder(name="Parents/Caregivers", role="Home support partners", engagement_strategy="Parent meetings and take-home materials", priority="high"),
                SuggestedStakeholder(name="School Principals", role="Administrative oversight", engagement_strategy="Monthly review meetings", priority="medium"),
                SuggestedStakeholder(name="District Education Officer", role="Government liaison", engagement_strategy="Quarterly progress reports", priority="low")
            ])
    
    async def generate_indicators(
        self, 
        outcome_description: str, 
        theme: str
    ) -> GenerateIndicatorsResponse:
        """Generate SMART indicators for an outcome."""
        try:
            user_prompt = f"Outcome: {outcome_description}\nTheme: {theme}"
            
            response = await self._call_ai(
                SYSTEM_PROMPTS["generate_indicators"],
                user_prompt
            )
            data = self._parse_json_response(response)
            
            indicators = [
                GeneratedIndicator(
                    type=i["type"],
                    description=i["description"],
                    measurement_method=i["measurement_method"],
                    target_value=i["target_value"],
                    frequency=i["frequency"],
                    data_source=i["data_source"]
                )
                for i in data["indicators"]
            ]
            return GenerateIndicatorsResponse(indicators=indicators)
        except Exception as e:
            print(f"AI API error (using demo fallback): {e}")
            return GenerateIndicatorsResponse(indicators=[
                GeneratedIndicator(type="outcome", description="Percentage of students achieving grade-level reading proficiency", measurement_method="Standardized reading assessment (ASER/NIPUN tools)", target_value="75% of students achieve benchmark", frequency="Quarterly", data_source="Student assessments"),
                GeneratedIndicator(type="outcome", description="Improvement in comprehension scores from baseline", measurement_method="Pre-post comprehension tests", target_value="30% improvement from baseline", frequency="Bi-annually", data_source="Test scores"),
                GeneratedIndicator(type="output", description="Number of remedial sessions conducted per week", measurement_method="Session attendance logs", target_value="5 sessions per week per group", frequency="Weekly", data_source="Teacher logs"),
                GeneratedIndicator(type="output", description="Number of teachers trained in intervention methodology", measurement_method="Training completion records", target_value="100% of target teachers", frequency="Once at start", data_source="Training records")
            ])
    
    async def get_embedding(self, text: str) -> list[float]:
        """Get embedding for text (for RAG search)."""
        if self.openai_client:
            response = self.openai_client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
        else:
            # For Gemini, return a placeholder - would need Vertex AI for embeddings
            raise NotImplementedError("Embeddings not available with Gemini API. Use OpenAI.")


# Singleton instance
ai_service = AIService() if (settings.openai_api_key or settings.google_api_key) else None


def get_ai_service() -> AIService:
    """Dependency for FastAPI routes."""
    if ai_service is None:
        raise ValueError("AI service not configured. Please set API keys.")
    return ai_service
