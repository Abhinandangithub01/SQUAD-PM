@echo off
echo Installing @hello-pangea/dnd...
call npm install

echo.
echo Committing Trello board...
git add -A
git commit -m "feat: Add complete Trello-like Kanban board with drag-and-drop

- Created TrelloBoard component with full Trello functionality
- Drag-and-drop cards between columns
- Drag-and-drop columns to reorder
- Inline card creation
- Card menus (Edit/Delete)
- Priority labels with colors
- Due dates and assignees
- Modern Trello-style UI
- Added @hello-pangea/dnd library
- Fixed projectMemberService type issue"

git push codecommit main
git push origin main

echo.
echo Trello board deployed!
pause
