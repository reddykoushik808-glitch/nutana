import httpx
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging import logger

class GroqClient:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    def is_available(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def generate_recommendation_insights(self, context_summary: Dict[str, Any]) -> Optional[str]:
        if not self.is_available():
            logger.info("Groq API key not set; using deterministic rule-based fallback reasoning.")
            return None

        prompt = f"""You are Nutana Zero-Waste Grocery Intelligence Assistant. Provide a 2-sentence actionable Kirana advice based on this store snapshot:
{context_summary}
Keep advice crisp, practical, and focused on inventory rotation and waste prevention."""

        try:
            with httpx.Client(timeout=6.0) as client:
                resp = client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "You are an Indian grocery retail and zero-waste logistics expert."},
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 150,
                        "temperature": 0.2
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"].strip()
                else:
                    logger.warning(f"Groq API returned error status {resp.status_code}: {resp.text}")
                    return None
        except Exception as e:
            logger.warning(f"Groq API call failed gracefully: {e}")
            return None

groq_client = GroqClient()
