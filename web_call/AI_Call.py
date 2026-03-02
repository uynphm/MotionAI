import sys
import os
from groq import Groq
from dotenv import load_dotenv

# Try to load from various potential .env locations
load_dotenv(".env")
load_dotenv(".env.local")

# Load API key from environment variable
api_key = os.getenv("GROQ_API_KEY")

def generate_feedback_api(prompt):
    if not api_key:
        return "Error: GROQ_API_KEY not found in environment or .env files."

    if not prompt or prompt.strip() == "":
        return "No significant posture differences detected. Great job!"

    try:
        # Initialize Groq client
        client = Groq(api_key=api_key)
        
        # Generate completion
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert, professional motion analyst and world-class athletic coach. Analyze the user's posture data compared to a pro reference. Provide exactly 6 punchy and highly actionable bullet points: 2 'Postural Strengths' (what they did well) and 4 'Form Corrections' (what to improve). Avoid generic feedback; be specific about the skeletal alignment of the joint.",
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",
        )
        
        return chat_completion.choices[0].message.content.strip()
        
    except Exception as e:
        return f"Error calling Groq API: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No prompt provided.")
        sys.exit(1)
        
    prompt = sys.argv[1]
    print(generate_feedback_api(prompt))
