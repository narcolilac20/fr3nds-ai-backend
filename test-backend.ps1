# Test AI Backend Script
# Run this after starting the server with: npm start

Write-Host "=== Testing AI Backend ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing /health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -ErrorAction Stop
    Write-Host "   ✅ Health check passed!" -ForegroundColor Green
    Write-Host "   Response: $($health.message)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Health check failed!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "   Make sure the server is running: npm start" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Chat Endpoint
Write-Host "2. Testing /chat endpoint with Spot character..." -ForegroundColor Yellow

$chatBody = @{
    systemPrompt = "You are Spot from Spider-Man: Across the Spider-Verse. You are having a real conversation. You are NOT an AI assistant. Always use first person (I, me, my). Be expressive and show personality through actions with *asterisks*."
    messages = @(
        @{
            role = "user"
            content = "Hey Spot, how are you?"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Write-Host "   Sending request..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Method POST -Uri "http://localhost:3001/chat" -Body $chatBody -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "   ✅ Chat response received!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Response:" -ForegroundColor Cyan
    Write-Host "   $($response.reply)" -ForegroundColor White
    Write-Host ""
    
    # Check if response is generic
    if ($response.reply -match "I'm an AI|I'm a language model|I'm an assistant|I'm a chatbot") {
        Write-Host "   ⚠️  WARNING: Response seems generic/chatbot-like!" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ Response looks good (in character)!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Chat test failed!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response body: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan

