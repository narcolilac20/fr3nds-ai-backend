# Quick Start: Test AI Backend in PowerShell

## Step 1: Start the Server

Open PowerShell and run:

```powershell
cd C:\Users\Admin\AndroidStudioProjects\FR3NDS2\ai-backend
npm start
```

**Keep this window open** - the server runs here.

You should see:
```
🚀 AI Backend server running on port 3001
📡 Health check: http://localhost:3001/health
💬 Chat endpoint: http://localhost:3001/chat
✅ OpenAI API key loaded successfully
```

## Step 2: Test the Backend (New PowerShell Window)

Open a **NEW PowerShell window** and run:

### Option A: Use the Test Script

```powershell
cd C:\Users\Admin\AndroidStudioProjects\FR3NDS2\ai-backend
.\test-backend.ps1
```

### Option B: Manual Testing

#### Test Health Endpoint:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

#### Test Chat Endpoint:
```powershell
$body = @{
    systemPrompt = "You are Spot from Spider-Man: Across the Spider-Verse. You are having a real conversation. You are NOT an AI assistant. Always use first person (I, me, my)."
    messages = @(
        @{
            role = "user"
            content = "Hey Spot, how are you?"
        }
    )
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Method POST -Uri "http://localhost:3001/chat" -Body $body -ContentType "application/json"
$response.reply
```

## Expected Results

### Health Check:
```json
{
  "status": "ok",
  "message": "AI Backend is running"
}
```

### Chat Response:
Should be in first person, like:
```
Hey! *adjusts portals* I'm doing alright, all things considered. Still figuring out this whole multiverse thing, you know?
```

**NOT generic like:**
```
Hello! I'm an AI assistant. How can I help you today?
```

## Troubleshooting

### "Connection refused" or "Cannot connect"
- Make sure the server is running in the first PowerShell window
- Check that you see "🚀 AI Backend server running on port 3001"

### "OPENAI_API_KEY not found"
- Check that `.env` file exists in `ai-backend/` folder
- Verify it contains: `OPENAI_API_KEY=sk-proj-...`

### Port 3001 already in use
```powershell
# Find what's using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F
```

