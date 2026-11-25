"""
IBM watsonx.ai / IBM Granite integration service.
In DEMO mode (no credentials), returns clearly labelled sample responses.
"""
from typing import Optional
from backend.config import settings
import logging

logger = logging.getLogger("intellistudy.granite")

DEMO_LABEL = "\n\n> ⚠️ **DEMO MODE** — This is a sample response. Configure IBM watsonx.ai credentials for real AI-generated content."


class GraniteService:
    def __init__(self):
        self._client = None
        self._initialized = False

    def _init_client(self):
        """Lazy initialise the IBM watsonx.ai client."""
        if self._initialized:
            return
        self._initialized = True
        if settings.demo_mode:
            logger.warning("IBM Granite: running in DEMO mode (no credentials)")
            return
        try:
            from ibm_watsonx_ai import APIClient, Credentials
            from ibm_watsonx_ai.foundation_models import ModelInference

            credentials = Credentials(
                url=settings.watsonx_url,
                api_key=settings.watsonx_api_key,
            )
            self._client = ModelInference(
                model_id=settings.granite_model_id,
                credentials=credentials,
                project_id=settings.watsonx_project_id,
                params={
                    "decoding_method": "greedy",
                    "max_new_tokens": 1024,
                    "stop_sequences": ["<|endoftext|>"],
                    "temperature": 0.7,
                },
            )
            logger.info(f"IBM Granite client initialised with model: {settings.granite_model_id}")
        except ImportError:
            logger.error("ibm-watsonx-ai package not installed. Install with: pip install ibm-watsonx-ai")
        except Exception as e:
            logger.error(f"Failed to initialise IBM Granite client: {e}")
            self._client = None

    def _build_prompt(self, instruction: str, context: str, task_type: str) -> str:
        return f"""<|system|>
You are IntelliStudy, an expert educational AI assistant powered by IBM Granite. 
You help students learn effectively by analysing study materials and generating structured learning content.
<|user|>
Task: {task_type}
Study Material:
{context[:3000]}

{instruction}
<|assistant|>"""

    def generate(self, instruction: str, context: str = "", task_type: str = "study_material") -> dict:
        """Generate text using IBM Granite or return demo response."""
        self._init_client()

        if settings.demo_mode or self._client is None:
            return {
                "text": self._demo_response(task_type),
                "demo_mode": True,
                "model": "DEMO",
            }

        try:
            prompt = self._build_prompt(instruction, context, task_type)
            response = self._client.generate_text(prompt=prompt)
            return {
                "text": response,
                "demo_mode": False,
                "model": settings.granite_model_id,
            }
        except Exception as e:
            logger.error(f"IBM Granite generation error: {e}")
            return {
                "text": self._demo_response(task_type),
                "demo_mode": True,
                "model": "DEMO (error fallback)",
                "error": str(e),
            }

    def _demo_response(self, task_type: str) -> str:
        demos = {
            "short_summary": f"## Short Summary\n\nThis document covers key academic concepts with structured explanations. Main topics include foundational theory, practical applications, and worked examples.\n\n**Key Points:**\n- Core concept definitions\n- Important theorems and principles\n- Practical applications\n- Common exam questions{DEMO_LABEL}",
            "detailed_summary": f"## Detailed Summary\n\n### Introduction\nThis study material provides comprehensive coverage of the subject matter...\n\n### Core Concepts\n1. **Fundamental Principles** — The foundational theory underlying the subject\n2. **Key Algorithms** — Step-by-step procedures and their complexity\n3. **Applications** — Real-world usage and case studies\n\n### Important Definitions\n- **Term A:** Definition and explanation\n- **Term B:** Definition and explanation{DEMO_LABEL}",
            "topic_notes": f"## Topic-wise Notes\n\n### Topic 1: Introduction\n- Definition and scope\n- Historical context\n- Modern relevance\n\n### Topic 2: Core Theory\n- Fundamental theorems\n- Mathematical foundations\n- Practical implications\n\n### Topic 3: Applications\n- Industry use cases\n- Problem-solving approaches{DEMO_LABEL}",
            "questions": f"## Important Questions\n\n1. Define and explain the main concept covered in this document.\n2. What are the key differences between the primary approaches discussed?\n3. Explain the step-by-step process of the main algorithm.\n4. What are the practical applications of the theories presented?\n5. Compare and contrast the main methods discussed.{DEMO_LABEL}",
            "flashcards": f"[DEMO FLASHCARD DATA]{DEMO_LABEL}",
            "quiz": f"[DEMO QUIZ DATA]{DEMO_LABEL}",
            "chat": f"I'm your AI Study Tutor. I can help explain concepts from your uploaded materials.\n\nIn **DEMO mode**, I provide sample responses. Connect IBM watsonx.ai credentials for real AI-powered tutoring.{DEMO_LABEL}",
            "study_plan": f"[DEMO STUDY PLAN]{DEMO_LABEL}",
        }
        return demos.get(task_type, f"[DEMO RESPONSE for task: {task_type}]{DEMO_LABEL}")


granite_service = GraniteService()
