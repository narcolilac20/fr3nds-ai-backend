# FR3NDS AI Backend

Backend API server for handling AI chat requests using OpenAI.

## Quick Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your OpenAI API key:**
   - Open `.env` file
   - Replace `YOUR_OPENAI_KEY_HERE` with your actual OpenAI API key
   - Example: `OPENAI_API_KEY=sk-proj-abc123...`

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   
   The server will start on port 3001. You should see:
   ```
   🚀 AI Backend server running on port 3001
   ✅ OpenAI API key loaded successfully
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### POST /chat

Send a chat message to the AI.

**Request Body:**
```json
{
  "systemPrompt": "You are Spot from Spider-Man: Across the Spider-Verse...",
  "messages": [
    { "role": "user", "content": "Hello!" },
    { "role": "assistant", "content": "Hey there!" }
  ]
}
```

**Response:**
```json
{
  "reply": "AI response text here"
}
```

**Error Response:**
```json
{
  "error": "Something went wrong, please try again."
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "AI Backend is running"
}
```

## Security Notes

- ✅ API key is stored in `.env` file (not in source code)
- ✅ `.env` is in `.gitignore` (never commit it)
- ✅ API key is never logged
- ✅ CORS enabled for Android app

## Deployment

You can deploy this to:
- **Heroku**: Add `OPENAI_API_KEY` in Heroku config vars
- **Railway**: Add environment variable in Railway dashboard
- **Render**: Add environment variable in Render dashboard
- **Firebase Cloud Functions**: See Firebase Functions documentation
- **Vercel**: Add environment variable in Vercel dashboard

## Local Development

For local development, make sure your Android app points to:
- `http://10.0.2.2:3001` (Android Emulator)
- `http://YOUR_LOCAL_IP:3001` (Physical device on same network)

