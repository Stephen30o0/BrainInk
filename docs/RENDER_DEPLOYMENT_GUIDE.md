# 🚀 Render Deployment Configuration Guide

## Fixed Issues ✅

### 1. Server Binding Issue
- **Problem**: Server was binding to `localhost` which doesn't work on Render
- **Fix**: Changed to bind to `0.0.0.0:${PORT}` for proper external access

### 2. Port Conflict Handling  
- **Problem**: No error handling when port is already in use
- **Fix**: Added proper error handling and graceful shutdown

### 3. CORS Configuration
- **Problem**: Limited CORS origins
- **Fix**: Enhanced CORS with better logging and credential support

## Render Environment Variables to Set 🔧

In your Render dashboard, set these environment variables:

### Required:
```
NODE_ENV=production
GOOGLE_API_KEY=your_actual_google_api_key
CORE_API_KEY=your_actual_core_api_key
DATABASE_URL=your_database_connection_string
```

### Optional:
```
CORS_ORIGIN=https://brain-ink.vercel.app
OPENAI_API_KEY=your_openai_key_if_used
```

### Automatic (Render sets these):
```
PORT=automatically_set_by_render
RENDER_EXTERNAL_URL=your_app_url
```

## Frontend Environment Variables 🌐

### For Development (.env):
```
VITE_KANA_API_BASE_URL=http://localhost:10000/api/kana
```

### For Production (.env.production):
```
VITE_KANA_API_BASE_URL=https://kana-backend-app.onrender.com
```

## Troubleshooting 🔍

### If you still get "EADDRINUSE" errors:
1. Check Render logs for any zombie processes
2. Restart the service in Render dashboard
3. Ensure no other services are running on the same port

### If frontend can't connect:
1. Verify the production URL is correct
2. Check CORS origins include your frontend domain
3. Ensure environment variables are properly set in Vercel

### Debug Commands:
```bash
# Check what's running on port 10000 (locally)
netstat -tulpn | grep :10000

# Kill process on port (locally)
kill $(lsof -t -i:10000)
```

## Deploy Order 📋

1. **Backend First**: Deploy KANA backend to Render
2. **Get URL**: Note the assigned Render URL
3. **Update Frontend**: Set `VITE_KANA_API_BASE_URL` in Vercel
4. **Deploy Frontend**: Deploy to Vercel with correct backend URL

## Next Steps ⏭️

1. Wait for Render to redeploy with the fixes
2. Update your Vercel environment variables if needed
3. Test the connection between frontend and backend
4. Monitor the logs for any remaining issues
