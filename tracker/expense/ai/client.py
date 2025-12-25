import json
import re
import google.generativeai as genai
from django.conf import settings
from .prompts import CATEGORY_PROMPT, INSIGHT_PROMPT

# Configure API key if available
try:
    if hasattr(settings, 'GOOGLE_API_KEY') and settings.GOOGLE_API_KEY:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
    else:
        print("Warning: GOOGLE_API_KEY not configured. AI features will be disabled.")
except Exception as e:
    print(f"Warning: Failed to configure Google AI: {e}")


def _safe_load_json(text: str):

    # Try to safely parse JSON from `text`

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # find a {...} substring (greedy inner match)
    m = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass

    m2 = re.search(r"\[.*\]", text, flags=re.DOTALL)
    if m2:
        try:
            return json.loads(m2.group(0))
        except json.JSONDecodeError:
            pass

    raise json.JSONDecodeError("Could not decode JSON", text, 0)


def suggest_category(description: str, amount: float, model_name: str = "models/gemini-2.5-flash"):
    # Ask Gemini to suggest a category. Returns {"category": "<name>"} or None.
    
    if not description:
        return None

    # Check if API key is configured
    if not hasattr(settings, 'GOOGLE_API_KEY') or not settings.GOOGLE_API_KEY:
        print("AI: GOOGLE_API_KEY not configured, skipping category suggestion.")
        return None

    prompt = CATEGORY_PROMPT.format(
        description=description.replace('"', '\\"'),
        amount=amount,
    )

    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)

        # Extract text from response safely
        text = getattr(response, "text", None)
        if text is None:
            text = str(response)
        text = text.strip()

        # Debug output (watch your terminal)
        print("=== Gemini raw response ===")
        print(text)
        print("=== end raw response ===")

        # Try to parse JSON (direct or embedded)
        try:
            data = _safe_load_json(text)
        except json.JSONDecodeError:
            print("AI: failed to parse JSON from model response.")
            return None

        # Defensive extraction of category
        category = None
        if isinstance(data, dict):
            # common key names to try
            for key in ("category", "Category", "result"):
                if key in data and isinstance(data[key], str) and data[key].strip():
                    category = data[key].strip()
                    break

            # nested case: {"result": {"category": "Food"}}
            if category is None and "result" in data and isinstance(data["result"], dict):
                nested = data["result"].get("category") or data["result"].get("Category")
                if isinstance(nested, str) and nested.strip():
                    category = nested.strip()

        if category:
            return {"category": category}

        print("AI: no valid 'category' key found in parsed JSON.")
        return None

    except Exception as e:
        print("Google AI error in suggest_category():", repr(e))
        return None

def generate_insights(summary: dict, previous_total: float | None = None, model_name: str = "models/gemini-2.5-flash"):
    """
    summary: dict with keys: period, start, end, total, by_category (list of {id,name,total})
    previous_total: numeric or None
    returns: {"text": "..."} or None
    Defensive: returns None if input is invalid or model output can't be parsed.
    """
    # Defensive input check
    if not isinstance(summary, dict):
        print("generate_insights: invalid 'summary' input (not a dict).")
        return None

    # Check if API key is configured
    if not hasattr(settings, 'GOOGLE_API_KEY') or not settings.GOOGLE_API_KEY:
        print("AI: GOOGLE_API_KEY not configured, skipping insights generation.")
        return None

    # ensure by_category is JSON serializable
    by_cat = summary.get("by_category", [])
    try:
        by_cat_json = json.dumps(by_cat)
    except Exception:
        by_cat_json = "[]"

    prompt = INSIGHT_PROMPT.format(
        period=str(summary.get("period", "monthly")),
        start=str(summary.get("start", "")),
        end=str(summary.get("end", "")),
        total=summary.get("total", 0),
        by_category_json=by_cat_json,
        previous_total=(previous_total if previous_total is not None else "null"),
    )

    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)

        text = getattr(response, "text", None)
        if text is None:
            text = str(response)
        text = text.strip()

        print("=== Gemini insight raw response ===")
        print(text)
        print("=== end insight raw response ===")

        # Try to parse JSON object from model output.
        try:
            data = _safe_load_json(text)
        except json.JSONDecodeError:
            # If model returned plain text instead of JSON, wrap it into {"text": "<text>"}
            # We accept that as a valid fallback.
            return {"text": text}

        # If data is a dict and contains "text" key, return it
        if isinstance(data, dict) and "text" in data and isinstance(data["text"], str):
            return {"text": data["text"].strip()}

        # If the model returned a plain string in the JSON or other keys
        if isinstance(data, dict):
            for candidate_key in ("insight", "summary", "text", "result"):
                v = data.get(candidate_key)
                if isinstance(v, str) and v.strip():
                    return {"text": v.strip()}

        # If we reach here and data is a string, return it
        if isinstance(data, str) and data.strip():
            return {"text": data.strip()}

        # nothing usable
        print("generate_insights: no usable 'text' in model output.")
        return None

    except Exception as e:
        print("Google AI error in generate_insights():", repr(e))
        return None
