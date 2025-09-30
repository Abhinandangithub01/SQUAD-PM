@echo off
echo 🔧 Starting Vercel deployment troubleshooting...

REM Step 1: Clean local build
echo 📦 Cleaning local build...
cd client
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache
npm run build:clean

REM Step 2: Force push latest changes
echo 📤 Force pushing latest changes...
cd ..
git add .
git commit -m "🔧 Force deployment update - %date% %time%"
git push origin main --force

REM Step 3: Clear Vercel cache and redeploy
echo 🚀 Deploying to Vercel with cache clear...
vercel --prod --force

REM Step 4: Check deployment status
echo ✅ Deployment complete! Check your Vercel dashboard for status.
echo 🌐 Your site should update within 2-3 minutes.

REM Step 5: Cache busting tips
echo.
echo 💡 If changes still don't appear:
echo 1. Hard refresh browser (Ctrl+Shift+R)
echo 2. Clear browser cache
echo 3. Try incognito/private mode
echo 4. Check Vercel deployment logs
echo.
echo 🔍 Vercel Dashboard: https://vercel.com/dashboard

pause
