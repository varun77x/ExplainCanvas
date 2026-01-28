# ExplainCanvas Backend

FastAPI backend service for ExplainCanvas multimodal AI canvas.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

5. Run the server:
```bash
python main.py
```

Server will start on http://localhost:8000

## API Endpoints

### POST /chat
Process video + query and return AI response

**Request:**
- `video` (file): WebM video recording
- `previous_context` (string): Context from previous interactions
- `user_query` (string): User's question or comment

**Response:**
```json
{
  "reply": "AI response text",
  "new_context_summary": "Updated context summary"
}
```

### GET /health
Check service health and Gemini connection

### GET /
API root information

## Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (required)

## Getting a Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file
