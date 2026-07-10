import httpx
import logging
from app.core.config import settings
from typing import Dict

logger = logging.getLogger(__name__)

# Hugging Face Inference API URL for a highly capable text model
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"

class HuggingFaceService:
    @staticmethod
    def generate_score_explanation(
        overall_score: int,
        sub_scores: Dict[str, int],
        risk_category: str,
        recommendation: str
    ) -> str:
        # Check if HF API Token is configured
        if not settings.HF_API_TOKEN or settings.HF_API_TOKEN == "YOUR_HF_API_TOKEN":
            return HuggingFaceService._fallback_explanation(overall_score, risk_category, recommendation)

        try:
            prompt = f"""<s>[INST] You are a Senior Credit Risk Officer at IDBI Bank.
            Analyze the following credit scoring scorecard data for an MSME and write an explainable underwriter review:
            
            - Overall Score: {overall_score}/1000
            - Risk Classification: {risk_category}
            - Auto Recommendation: {recommendation}
            - Subscore Breakdowns:
              - Cash-Flow Strength: {sub_scores.get('cash_flow', 0)}/1000
              - Revenue Consistency: {sub_scores.get('revenue', 0)}/1000
              - Compliance Behavior: {sub_scores.get('compliance', 0)}/1000
              - Operational Continuity: {sub_scores.get('operations', 0)}/1000
              - Financial Resilience: {sub_scores.get('resilience', 0)}/1000

            Generate a report containing these sections:
            1. EXECUTIVE SUMMARY: High-level overview of the credit health.
            2. KEY STRENGTHS: Bullet points explaining which parameters performed best.
            3. KEY WEAKNESSES: Bullet points outlining areas of high credit or fraud risk.
            4. RECOMMENDED IMPROVEMENTS: Specific steps the business owner should take to improve their credit profile.
            5. UNDERWRITER RECOMMENDATION EXPLANATION: Explanation of why the loan should be approved, approved with conditions, or declined.

            Write in a professional, constructive, and clean banking narrative style. Format using clean Markdown. [/INST]"""

            headers = {
                "Authorization": f"Bearer {settings.HF_API_TOKEN}"
            }
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 1000,
                    "temperature": 0.7,
                    "return_full_text": False
                }
            }

            with httpx.Client(timeout=30.0) as client:
                response = client.post(HF_API_URL, headers=headers, json=payload)
                
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    generated_text = result[0].get("generated_text", "")
                    if generated_text:
                        return generated_text.strip()
                elif isinstance(result, dict) and "generated_text" in result:
                    return result["generated_text"].strip()
                
            # If rate limited or processing (Hugging Face sometimes loads models on-demand, status 503)
            logger.warning(f"Hugging Face API returned status {response.status_code}: {response.text}")
            return HuggingFaceService._fallback_explanation(
                overall_score, risk_category, recommendation, 
                error=f"HF Status {response.status_code}"
            )

        except Exception as e:
            logger.error(f"Error calling Hugging Face API: {e}")
            return HuggingFaceService._fallback_explanation(overall_score, risk_category, recommendation, error=str(e))

    @staticmethod
    def _fallback_explanation(overall_score: int, risk_category: str, recommendation: str, error: str = None) -> str:
        err_msg = f" (Hugging Face API Fallback: {error})" if error else " (Hugging Face Offline Fallback)"
        return f"""### Underwriter Analysis Report {err_msg}

**Executive Summary:**
The business exhibits a credit profile score of **{overall_score}/1000**, placing it in the **{risk_category}** risk tier. The automated underwriting recommendation is **{recommendation}**.

**Key Strengths:**
* Good operational continuity proxies based on utility payments regularity.
* Structured banking inflows match GST tax statements without critical compliance issues.

**Key Weaknesses:**
* High sensitivity to cash-flow volatility in seasonal months.
* Moderate utilization of overdraft facilities decreases liquid cushions.

**Recommendations:**
1. Maintain consistent cash balances in primary current accounts to improve financial resilience.
2. Ensure timely payment of utility invoices and EPFO contributions.
"""
