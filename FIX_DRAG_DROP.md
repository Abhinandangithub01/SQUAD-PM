# Fix Drag-and-Drop Not Working

## Issue
Drag-and-drop is not working on the Tasks board.

## Solution

### Step 1: Install Dependencies
The `@hello-pangea/dnd` library needs to be installed.

**Run this command:**
```bash
npm install
```

Or double-click: `install-deps.bat`

### Step 2: Restart Dev Server

**Stop your current dev server** (Ctrl+C in terminal)

**Start it again:**
```bash
npm run dev
```

### Step 3: Clear Browser Cache

1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

Or simply:
- Press `Ctrl + Shift + R` (Windows/Linux)
- Press `Cmd + Shift + R` (Mac)

### Step 4: Verify

After restarting, you should be able to:
- ✅ Click and hold on a card
- ✅ Drag it to another column
- ✅ See visual feedback (shadow, rotation)
- ✅ Drop it in the new column
- ✅ See the card move

## If Still Not Working

### Check Console for Errors

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for any errors related to:
   - `@hello-pangea/dnd`
   - `DragDropContext`
   - `Draggable`
   - `Droppable`

### Verify Installation

Run this command to check if the package is installed:
```bash
npm list @hello-pangea/dnd
```

Should show:
```
@hello-pangea/dnd@16.6.0
```

### Manual Installation

If the package is not installed:
```bash
npm install @hello-pangea/dnd@16.6.0
```

## Common Issues

### Issue 1: Module Not Found
**Error:** `Cannot find module '@hello-pangea/dnd'`

**Solution:** Run `npm install`

### Issue 2: Dev Server Not Restarted
**Symptom:** Changes not reflected

**Solution:** Stop and restart `npm run dev`

### Issue 3: Browser Cache
**Symptom:** Old code still running

**Solution:** Hard refresh (Ctrl+Shift+R)

### Issue 4: Multiple Dev Servers
**Symptom:** Drag works sometimes

**Solution:** 
1. Close all terminal windows
2. Kill any node processes
3. Start fresh: `npm run dev`

## Expected Behavior

### When Dragging Cards:
1. **Hover** - Card shows hover effect
2. **Click and Hold** - Cursor changes to grabbing
3. **Drag** - Card lifts with shadow and rotation
4. **Over Column** - Column highlights
5. **Drop** - Card moves to new column
6. **Success** - Toast notification appears

### Visual Feedback:
- ✅ Shadow increases when dragging
- ✅ Card rotates 3 degrees
- ✅ Blue ring appears around card
- ✅ Destination column highlights
- ✅ Smooth animation on drop

## Troubleshooting Commands

```bash
# Check if package is installed
npm list @hello-pangea/dnd

# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run dev

# Check for port conflicts
netstat -ano | findstr :3000
```

## Still Having Issues?

1. Check the browser console for errors
2. Verify the package is in `node_modules/@hello-pangea/dnd`
3. Make sure you're on the correct page (`/dashboard/tasks`)
4. Try in a different browser
5. Check if JavaScript is enabled

---

**After following these steps, drag-and-drop should work perfectly!** 🎉
