# list_models.py  (replace previous)
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=API_KEY)

try:
    models = genai.list_models()  # this may be a generator/iterable
    print("Available models (sample):")
    count = 0
    # iterate safely and print up to 200 names
    for m in models:
        count += 1
        try:
            print(f"{count}.", getattr(m, "name", m))
        except Exception:
            print(f"{count}.", m)
        if count >= 200:
            break
except Exception as e:
    print("Error listing models:", repr(e))
