import sys
import os
from groq import Groq
from dotenv import load_dotenv

# Try to load from various potential .env locations
load_dotenv(".env")
load_dotenv(".env.local")

# Load API key from environment variable
api_key = os.getenv("GROQ_API_KEY")

class AI_call:
    def __init__(self, prompt):
        if not api_key:
            print("Error: GROQ_API_KEY not found in environment or .env files.")
            return

        if not prompt or prompt.strip() == "":
            print("No significant posture differences detected. Great job!")
            return

        try:
            # Initialize Groq client
            client = Groq(api_key=api_key)
            
            # Generate completion
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert, professional motion analyst analyzing a normal person's motion data compared to a pro. Provide exactly 5 punchy and highly actionable bullet points on how to drastically improve the posture based on posture analysis.",
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama-3.1-8b-instant",
            )
            
            # Print the response
            print(chat_completion.choices[0].message.content, flush=True)
            
        except Exception as e:
            print(f"Error calling Groq API: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No prompt provided.")
        sys.exit(1)
        
    prompt = sys.argv[1]
    AI_call(prompt)
