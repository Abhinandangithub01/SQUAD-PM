@echo off
git add -A
git commit -m "feat: Add Trello board view to Tasks page

- Created TrelloBoardAllTasks component for global tasks view
- Replaced grid layout with proper Trello-style columns
- Dark/light theme support with borders
- Separate scrollable columns
- Drag-and-drop between columns
- Works on main Tasks page (/dashboard/tasks)"

git push codecommit main
git push origin main

echo.
echo Tasks Trello board deployed!
pause
