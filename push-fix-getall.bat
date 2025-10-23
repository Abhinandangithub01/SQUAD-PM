@echo off
git add -A
git commit -m "fix: Change taskService.getAll to taskService.list in TrelloBoardAllTasks"
git push codecommit main
git push origin main
echo Fix pushed!
pause
