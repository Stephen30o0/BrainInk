# Deployment Guide for BrainInk

## 📋 Prerequisites
- GitHub account
- Render account (for backend)
- Vercel account (for frontend)
- Google API Key for Gemini
- MetaMask wallet with Base Sepolia testnet ETH

## 🚀 Backend Deployment (Render)

### Step 1: Deploy to Render
1. Push your `kana-backend` folder to a GitHub repository
2. Connect the repository to Render
3. Use these settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18.x or higher

### Step 2: Set Environment Variables in Render
Add these environment variables in Render dashboard:
```
GOOGLE_API_KEY=your_google_gemini_api_key
NODE_ENV=production
PORT=10000
```

### Step 3: Note Your Render URL
Your backend will be deployed at: `https://kana-backend-app.onrender.com`

## 🌐 Frontend Deployment (Vercel)

### Step 1: Update vercel.json
Replace `https://kana-backend-app.onrender.com` in `vercel.json` with your actual Render URL.

### Step 2: Set Environment Variables in Vercel
Add these in Vercel dashboard:
```
VITE_KANA_API_BASE_URL=https://kana-backend-app.onrender.com/api/kana
BASE_PRIVATE_KEY=your_base_sepolia_private_key
```

### Step 3: Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Vercel will automatically deploy on each push to main branch

## 🔗 Smart Contracts (Already Deployed)

Your smart contracts are already deployed on Base Sepolia:
- **INK Token**: `0x3400d455aC4d50dF70E581b96f980516Af63Fa1c`
- **Tournament Manager**: `0x31C3D3de371e155b7dacEd91Cf1C2C675964Af30`

## ✅ Verification Steps

After deployment:
1. Visit your Vercel URL
2. Connect MetaMask to Base Sepolia
3. Test tournament creation/joining
4. Test quiz generation
5. Verify INK token transactions

## 🔧 Troubleshooting

### Common Issues:
1. **CORS errors**: Ensure backend allows your Vercel domain
2. **API timeouts**: Render free tier may have cold starts
3. **Environment variables**: Double-check all keys are set correctly

### Health Check URLs:
- Backend: `https://kana-backend-app.onrender.com/`
- Study Materials API: `https://kana-backend-app.onrender.com/api/study-materials`
- Quiz Generation: `https://kana-backend-app.onrender.com/api/kana/generate-quiz`

## 📱 Mobile Compatibility
The app is fully responsive and works on mobile browsers with MetaMask mobile app.

## 🎯 Production Considerations

For production use, consider:
1. **Database**: Replace JSON files with MongoDB/PostgreSQL
2. **File Storage**: Use AWS S3 or similar for uploaded files
3. **CDN**: Use Cloudflare for better performance
4. **Monitoring**: Add error tracking (Sentry) and analytics
5. **Rate Limiting**: Implement API rate limits
6. **Security**: Add input validation and sanitization
