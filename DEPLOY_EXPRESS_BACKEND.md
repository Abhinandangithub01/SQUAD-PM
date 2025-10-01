# 🚀 Deploy Express Backend - Quick Guide

## Your Current Setup

✅ **Frontend:** Deployed on AWS Amplify
   - URL: https://main.d8tv3j2hk2i9r.amplifyapp.com

⏳ **Backend:** Express server (needs deployment)
   - Location: `server/` folder
   - Has all APIs ready

---

## 🎯 Deploy Backend to Render (Free & Easy)

### Step 1: Create Render Account

1. Go to: https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repos

### Step 2: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your repository: `SQUAD-PM`
3. Configure:
   - **Name:** `squad-pm-backend`
   - **Region:** Singapore (closest to you)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

4. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-secret-key-here-change-this
   CLIENT_URL=https://main.d8tv3j2hk2i9r.amplifyapp.com
   ```

5. Click **"Create Web Service"**

### Step 3: Get Backend URL

After deployment (5-10 minutes), you'll get a URL like:
`https://squad-pm-backend.onrender.com`

### Step 4: Update Frontend

Update `client/.env.production`:
```
REACT_APP_API_URL=https://squad-pm-backend.onrender.com/api
```

Push to GitHub - Amplify auto-deploys!

---

## ✅ Done!

Your full-stack app will be live:
- Frontend: AWS Amplify
- Backend: Render
- Database: You can add PostgreSQL on Render (free tier)

---

## Alternative: Railway, Fly.io, or Heroku

All work similarly - just connect GitHub and deploy!

**Would you like me to help you set this up?**
