from typing import Tuple, Dict
import os
import json
import re
import google.genai as genai

# Try to configure the genai client in a backwards-compatible way.
# New `google.genai` may not expose `configure`, so handle gracefully.
client = None
model = None
API_KEY = os.getenv("GEMINI_API_KEY")
try:
    if hasattr(genai, "configure"):
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
    elif hasattr(genai, "Client"):
        try:
            client = genai.Client(api_key=API_KEY)
            # attempt to get a model object if client supports it
            if hasattr(client, "get_model"):
                model = client.get_model("gemini-2.5-flash")
            else:
                # leave model None; we'll fallback to heuristic
                model = None
        except Exception:
            client = None
            model = None
    else:
        model = None
except Exception:
    client = None
    model = None

def purpose_matches(mentioned_text: str, expected_keywords: str) -> Tuple[bool, Dict]:
    """
    Use Gemini LLM to semantically evaluate whether
    the mentioned company purpose matches expected keywords.
    """

    if not mentioned_text or not expected_keywords:
        return False, {"score": 0, "reason": "Missing input"}

    prompt = f"""
You are a CV fraud detection assistant.

Compare the following:

Company description from CV:
"{mentioned_text}"

Expected company purpose keywords:
"{expected_keywords}"

Determine whether the description aligns with the expected purpose.

Return JSON ONLY in this format:
{{
  "match": true or false,
  "score": 0-1,
  "reason": "short explanation"
}}
"""

    # If a usable model is available, try LLM path
    if model is not None and hasattr(model, "generate_content"):
        try:
            response = model.generate_content(prompt)
            text = response.text.strip()

            # Extract JSON safely
            start = text.find("{")
            end = text.rfind("}") + 1
            json_text = text[start:end]

            result = json.loads(json_text)

            return result.get("match", False), result
        except Exception as e:
            # fall through to heuristic
            pass

    # Fallback heuristic: simple keyword overlap scoring
    try:
        kws = [k.strip().lower() for k in re.split(r"[,;\n]", expected_keywords) if k.strip()]
        if not kws:
            kws = expected_keywords.lower().split()
        text_lower = mentioned_text.lower()
        matched = sum(1 for k in kws if k and k in text_lower)
        score = matched / max(len(kws), 1)
        match = score >= 0.6
        return match, {"score": round(score, 2), "matched_keywords": matched, "expected_count": len(kws), "reason": "heuristic fallback"}
    except Exception as e:
        return False, {"score": 0, "reason": f"heuristic error: {str(e)}"}
