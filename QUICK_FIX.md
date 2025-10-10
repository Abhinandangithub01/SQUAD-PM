# ⚡ QUICK FIX - Import Error

## The Problem
Getting **404 error** when trying to import tasks.

## The Solution (30 seconds)

### Option 1: Run Batch File (Easiest)
```
Double-click: fix-import.bat
```

### Option 2: Manual Commands
```powershell
cd server
npm install xlsx
npm run dev
```

### Option 3: PowerShell Script
```powershell
.\fix-import-error.ps1
```

## Then...
1. **Restart your server** (Ctrl+C, then `npm run dev`)
2. **Refresh browser** (F5)
3. **Try import again** ✅

---

## Why This Happens
The `xlsx` package (needed to read Excel files) wasn't installed yet.

## After Fix
- ✅ Import button works
- ✅ Can upload Excel files
- ✅ Tasks get created
- ✅ No more 404 errors

---

**That's it!** Just install xlsx and restart server. 🚀
