@echo off
git add -A
git commit -m "fix: Add type cast for status in drag-and-drop"
git push codecommit main
git push origin main
echo Final TypeScript fix pushed!
pause
