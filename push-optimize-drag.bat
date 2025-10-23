@echo off
git add -A
git commit -m "perf: Optimize drag-and-drop for instant UI response

- Made task updates non-blocking (background async)
- Removed success toast to eliminate delay
- UI updates instantly without waiting for server
- Only shows error toast if update fails
- Optimistic UI updates for better UX
- Applied to both TrelloBoardExact and TrelloBoardAllTasks"

git push codecommit main
git push origin main

echo.
echo Drag-and-drop optimizations deployed!
pause
