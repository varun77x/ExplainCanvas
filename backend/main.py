from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import tempfile
import uvicorn

# Load environment variables
load_dotenv()

app = FastAPI(title="ExplainCanvas Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

client = genai.Client(api_key=GEMINI_API_KEY)


@app.get("/")
async def root():
    return {"message": "ExplainCanvas Backend API", "status": "running"}


@app.post("/chat")
async def chat(
    video: UploadFile = File(...),
    previous_context: str = Form(""),
    user_query: str = Form(...)
):
    """
    Process a video + text query and return AI response with updated context.
    """
    try:
        # Validate video format
        if not video.content_type or not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="Invalid video format")

        # Read video data
        video_bytes = await video.read()
        
        if len(video_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty video file")

        # Construct prompt with context
        prompt = f"""PREVIOUS SYSTEM STATE SUMMARY:
{previous_context if previous_context else "This is the first interaction."}

INSTRUCTION:
1. Watch the attached video carefully. Listen to the user's voice explanation and observe their drawing on the canvas.
2. Answer the user's question or provide feedback: "{user_query}"
3. At the end of your response, provide a separate block labeled "STATE_SUMMARY:" containing a concise description of the full system architecture as it exists now (after this interaction).

Format your response as:
[Your main answer here]

STATE_SUMMARY:
[Updated architecture description]
"""

        # Call Gemini API
        print(f"Processing request - Video size: {len(video_bytes)} bytes")
        print(f"User query: {user_query}")
        
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=[
                types.Content(
                    parts=[
                        types.Part.from_text(text=prompt),
                        types.Part.from_bytes(
                            data=video_bytes,
                            mime_type=video.content_type
                        )
                    ]
                )
            ]
        )

        # Extract response text
        full_response = response.text
        
        # Parse response to extract main answer and state summary
        if "STATE_SUMMARY:" in full_response:
            parts = full_response.split("STATE_SUMMARY:")
            main_answer = parts[0].strip()
            new_context = parts[1].strip() if len(parts) > 1 else ""
        else:
            # If no STATE_SUMMARY found, use full response and try to extract context
            main_answer = full_response.strip()
            new_context = f"User asked: {user_query}. AI provided feedback on the architecture."

        print(f"Response generated successfully")
        print(f"Main answer length: {len(main_answer)} chars")
        print(f"New context length: {len(new_context)} chars")

        return JSONResponse(content={
            "reply": main_answer,
            "new_context_summary": new_context
        })

    except Exception as e:
        print(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


@app.get("/health")
async def health_check():
    """Check if the service is healthy"""
    try:
        # Test Gemini connection
        test_response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents="test"
        )
        return {
            "status": "healthy",
            "gemini_connection": "ok",
            "api_key_configured": bool(GEMINI_API_KEY)
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "api_key_configured": bool(GEMINI_API_KEY)
        }


if __name__ == "__main__":
    print("Starting ExplainCanvas Backend...")
    print(f"Gemini API Key configured: {bool(GEMINI_API_KEY)}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
