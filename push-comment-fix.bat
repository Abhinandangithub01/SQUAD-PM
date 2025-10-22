@echo off
git add -A
git commit -m "fix: Resolve TypeScript type issues in commentService"
git push codecommit main
git push origin main
echo Comment service fix pushed!
pause
