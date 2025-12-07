# Create .env File

Since `.env.example` is gitignored, please create it manually:

## Steps

1. In the `ai-backend/` folder, create a file named `.env.example` with this content:

```
OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE
PORT=3000
```

2. Then create `.env` file (copy from `.env.example`) and replace `YOUR_OPENAI_KEY_HERE` with your actual API key:

```
OPENAI_API_KEY=your-actual-api-key-here
PORT=3000
```

**Important:** 
- `.env.example` should NOT contain real API keys (use placeholder)
- `.env` should contain your real API key (this file is gitignored)



