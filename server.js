import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

// Load environment variables from .env file
// Make sure to copy .env.example to .env and add your OpenAI API key
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase body size limit for large requests
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.disable('x-powered-by'); // Security: hide Express version

// Initialize OpenAI client with robust connection settings
// API key is loaded from process.env.OPENAI_API_KEY (set in .env file)
// Never hardcode API keys in source code!
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 120 seconds timeout for long AI responses
  maxRetries: 3, // Retry up to 3 times on transient failures
});

// ============================================================================
// PREMIUM AI MODE: User Usage Tracking & Plan Configuration
// ============================================================================

// In-memory usage tracker (per user)
// In production, consider using Redis or a database for persistence
const userUsage = {};
// Structure: userUsage[userId] = { count: number, resetTime: timestamp (ms) }

// Plan configuration
const planConfig = {
  free: {
    dailyLimit: 100,  // Free users: 100 messages per 24 hours
    model: 'gpt-4o-mini'  // Cheaper model for free users
  },
  premium: {
    dailyLimit: 1000,  // Premium users: 1000 messages per 24 hours (effectively unlimited)
    model: 'gpt-4o-mini'  // Same model for now, can upgrade later to gpt-4o
  }
};

/**
 * Get user plan based on premium status
 */
function getUserPlan(isPremium) {
  return isPremium ? 'premium' : 'free';
}

/**
 * Select model based on plan
 * For now, both use gpt-4o-mini to control costs
 * Later, premium can use gpt-4o for better quality
 */
function selectModel(plan) {
  return planConfig[plan]?.model || 'gpt-4o-mini';
}

/**
 * Check and reset daily usage if needed
 */
function checkAndResetUsage(userId) {
  if (!userUsage[userId]) {
    userUsage[userId] = {
      count: 0,
      resetTime: Date.now() + 24 * 60 * 60 * 1000  // 24 hours from now
    };
  }

  const usage = userUsage[userId];

  // Reset if 24 hours have passed
  if (Date.now() > usage.resetTime) {
    usage.count = 0;
    usage.resetTime = Date.now() + 24 * 60 * 60 * 1000;
    console.log(`[Usage] Reset daily limit for user ${userId}`);
  }

  return usage;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { userId, isPremium, systemPrompt, messages, replyLength, advancedCreativity } = req.body;

    // Validate request
    if (!userId) {
      return res.status(400).json({
        error: 'MISSING_USER_ID',
        message: 'User ID is required.'
      });
    }

    if (!systemPrompt || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'systemPrompt and messages array are required.'
      });
    }

    // Determine user plan and check daily limits
    const plan = getUserPlan(isPremium === true);
    const config = planConfig[plan];
    const usage = checkAndResetUsage(userId);

    // Check if user has exceeded daily limit
    console.log(`[Limit Check] User ${userId} (${plan}): count=${usage.count}, limit=${config.dailyLimit}, resetTime=${new Date(usage.resetTime).toISOString()}`);
    if (usage.count >= config.dailyLimit) {
      console.log(`[Limit] User ${userId} (${plan}) exceeded daily limit: ${usage.count}/${config.dailyLimit}`);
      return res.json({
        error: 'LIMIT_REACHED',
        message: plan === 'free' 
          ? "You've reached your daily free AI limit. Try again later or upgrade to FR3NDS Premium for unlimited messages."
          : "You've reached your daily AI limit. Please try again later."
      });
    }

    // Log request for debugging (without sensitive data)
    console.log(`[AI] userId: ${userId}, plan: ${plan}, count: ${usage.count}/${config.dailyLimit}`);
    console.log(`📨 Chat request: ${messages.length} messages, systemPrompt length: ${systemPrompt.length}`);
    console.log(`   Last user message: ${messages.filter(m => m.role === 'user').slice(-1)[0]?.content?.substring(0, 50)}...`);

    // Build messages array for OpenAI
    // IMPORTANT: Only use the systemPrompt from the request - no default prompts
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    // Select model based on plan
    const model = selectModel(plan);

    // Determine max_tokens based on reply length setting
    let maxTokens = 500; // Default
    if (replyLength === 'SHORT') {
      maxTokens = 180;
    } else if (replyLength === 'NORMAL') {
      maxTokens = 350;
    } else if (replyLength === 'STORY') {
      maxTokens = 700;
    }

    // Adjust temperature and top_p based on advanced creativity (premium only)
    let temperature = 0.95; // Default
    let topP = 0.95; // Default
    
    if (isPremium && advancedCreativity != null && typeof advancedCreativity === 'number') {
      // advancedCreativity: 0.0 = focused (lower temp), 1.0 = creative (higher temp)
      // Range: 0.7 (focused) to 1.0 (creative)
      temperature = 0.7 + (advancedCreativity * 0.3);
      topP = 0.85 + (advancedCreativity * 0.15);
      console.log(`[Premium] Advanced creativity: ${advancedCreativity.toFixed(2)} → temp=${temperature.toFixed(2)}, top_p=${topP.toFixed(2)}`);
    }

    console.log(`[AI] Reply length: ${replyLength || 'default'} → max_tokens=${maxTokens}`);

    // Call OpenAI API with Character AI / Polybuzz-like parameters
    // Wrapped in retry logic for connection stability
    let completion;
    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second base delay
    
    while (retryCount < maxRetries) {
      try {
        completion = await openai.chat.completions.create({
          model: model,
          temperature: temperature,
          top_p: topP,
          max_tokens: maxTokens,
          presence_penalty: 0.3, // Light penalty to avoid repetition
          frequency_penalty: 0.3, // Light penalty to avoid repeating phrases
          messages: openaiMessages,
          timeout: 120000, // 120 seconds timeout (2 minutes)
        });
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        
        // Don't retry on certain errors (authentication, quota, etc.)
        if (error.status === 401 || error.status === 402 || error.status === 429) {
          throw error; // Throw immediately for non-retryable errors
        }
        
        // Check if it's a connection/network error that we should retry
        const isRetryableError = 
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ENOTFOUND' ||
          error.message?.includes('timeout') ||
          error.message?.includes('ECONNRESET') ||
          error.message?.includes('socket hang up') ||
          (error.status >= 500 && error.status < 600); // Server errors
        
        if (!isRetryableError || retryCount >= maxRetries) {
          throw error; // Not retryable or max retries reached
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, retryCount - 1);
        console.log(`[Retry] Attempt ${retryCount}/${maxRetries} failed. Retrying in ${delay}ms... (${error.message})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (!completion) {
      throw new Error('Failed to get OpenAI response after all retries');
    }

    // Extract reply safely
    const reply = completion.choices?.[0]?.message?.content ?? null;

    if (!reply) {
      console.error('❌ No reply from OpenAI API');
      return res.json({
        error: 'NO_REPLY',
        message: 'AI did not return a response. Please try again.'
      });
    }

    // Only count successful responses
    usage.count += 1;
    console.log(`✅ AI response received: ${reply.substring(0, 100)}...`);
    console.log(`[Usage] User ${userId} (${plan}) count updated: ${usage.count}/${config.dailyLimit}`);

    // Return success response
    res.json({ reply });

  } catch (error) {
    // Log error with more details for debugging
    console.error('❌ Error in /chat endpoint:', error.message);
    console.error('Error type:', error.constructor.name);
    
    let statusCode = 500;
    let errorMessage = 'Something went wrong, please try again.';
    
    // Handle specific OpenAI API errors
    if (error.status === 429) {
      statusCode = 429;
      errorMessage = 'OpenAI API quota exceeded. Please check your billing and plan details.';
      console.error('⚠️  Quota exceeded - user needs to add payment method or wait for quota reset');
    } else if (error.status === 401) {
      statusCode = 401;
      errorMessage = 'Invalid OpenAI API key. Please check your API key in the .env file.';
      console.error('⚠️  Invalid API key');
    } else if (error.status === 402) {
      statusCode = 402;
      errorMessage = 'OpenAI API payment required. Please add a payment method to your OpenAI account.';
      console.error('⚠️  Payment required');
    } else if (error.response) {
      console.error('OpenAI API error:', error.response.status, error.response.data);
      statusCode = error.response.status || 500;
      errorMessage = error.response.data?.error?.message || error.message;
    }
    
    // Return error response
    res.status(statusCode).json({
      error: statusCode === 429 ? 'QUOTA_EXCEEDED' : statusCode === 401 ? 'INVALID_API_KEY' : statusCode === 402 ? 'PAYMENT_REQUIRED' : 'SERVER_ERROR',
      message: errorMessage
    });
  }
});

// Start server with persistent connection settings
// Bind to 0.0.0.0 to allow connections from Android emulator (10.0.2.2)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Backend server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/chat`);
  console.log(`📱 Emulator access: http://10.0.2.2:${PORT}/chat`);
  
  // Check if API key is set (without logging it)
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables!');
  } else {
    console.log('✅ OpenAI API key loaded successfully');
  }
});

// Configure server for persistent connections to prevent disconnections
server.keepAliveTimeout = 65000; // Keep connections alive for 65 seconds
server.headersTimeout = 66000; // Headers timeout slightly longer than keepAlive
server.setTimeout(120000); // Overall server timeout: 2 minutes (for long AI responses)

// Handle server errors gracefully
server.on('error', (error) => {
  console.error('❌ Server error:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.error(`⚠️  Port ${PORT} is already in use. Please stop the other process or use a different port.`);
  }
});

// Handle client connection errors
server.on('clientError', (error, socket) => {
  console.error('❌ Client connection error:', error.message);
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

console.log('🔒 Connection stability settings:');
console.log(`   Keep-alive timeout: ${server.keepAliveTimeout}ms`);
console.log(`   Headers timeout: ${server.headersTimeout}ms`);
console.log(`   Server timeout: ${server.timeout}ms`);

