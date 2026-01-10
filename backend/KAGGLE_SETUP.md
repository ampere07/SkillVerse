# Kaggle AI Service Setup

Your SkillVerse backend is now configured to use Kaggle's AI service via ngrok.

## Current Configuration

**Kaggle Ngrok URL:** `https://marry-fumeless-drusilla.ngrok-free.dev`

This URL is configured in your `.env` file as `KAGGLE_NGROK_URL`.

## Service Priority

The system checks AI services in this order:
1. **Kaggle (ngrok)** - if `KAGGLE_NGROK_URL` is set
2. **Tailscale Remote** - if `USE_OLLAMA_REMOTE=true` and `OLLAMA_TAILSCALE_IP` is set
3. **Local Ollama** - default fallback

## Testing the Setup

### 1. Start Your Backend
```bash
cd backend
npm start
```

### 2. Check AI Service Status
Open browser or use curl:
```bash
curl http://localhost:5000/api/health/ai-status
```

Expected response:
```json
{
  "status": "operational",
  "mode": "Kaggle",
  "model": "qwen2.5-coder:7b",
  "timestamp": "2025-01-10T..."
}
```

### 3. Monitor Kaggle Connection
In a separate terminal:
```bash
cd backend
node scripts/monitor-kaggle.js
```

This will check the AI service every minute and alert you if it goes down.

## When Kaggle Session Expires

### Signs of Expiration
- Monitor shows consecutive failures
- Frontend shows "AI service temporarily unavailable"
- Generation requests timeout

### Recovery Steps
1. Go to your Kaggle notebook
2. Restart from Cell 2 (Start Ollama service)
3. Run all cells through Cell 9 (Keep alive loop)
4. Copy the NEW ngrok URL from Cell 8 output
5. Update `.env` file with new URL:
   ```
   KAGGLE_NGROK_URL=https://your-new-url.ngrok-free.app
   ```
6. Restart your backend: `npm start`

## Response Time Expectations

- **Survey Analysis:** 15-30 seconds
- **Mini Project Generation:** 20-40 seconds
- **Health Check:** 1-2 seconds

These times are normal for Kaggle CPU inference.

## Kaggle Limitations

- **GPU Hours:** 30 hours per week
- **Session Duration:** Disconnects after prolonged inactivity
- **Concurrent Users:** One request at a time
- **Network:** Ngrok free tier limits (40 connections/minute)

## Monitoring Best Practices

1. Keep the Kaggle notebook tab open
2. Run the monitor script during testing
3. Check Kaggle GPU quota regularly (Settings → Quotas)
4. Have the ngrok cell ready to re-run

## Troubleshooting

### "AI service unavailable" error
- Check if Kaggle notebook is still running
- Verify ngrok URL is correct in `.env`
- Restart backend server

### Slow response times
- Normal for CPU inference on Kaggle
- Consider reducing token limits in prompts
- Check Kaggle notebook for resource usage

### Connection timeouts
- Kaggle session likely expired
- Follow recovery steps above
- Restart from Cell 2 onwards

## Configuration Files Updated

- `backend/config/ollamaConfig.js` - Kaggle priority logic
- `backend/services/ollamaService.js` - Retry logic and Kaggle mode
- `backend/.env` - Kaggle URL configuration
- `backend/routes/health.js` - Health check endpoint
- `backend/server.js` - Health route registration

## Next Steps

1. Start your backend
2. Check AI status endpoint
3. Generate a survey to test end-to-end
4. Monitor response times
5. Keep Kaggle notebook running

The system is now ready to use Kaggle as your AI service provider.
