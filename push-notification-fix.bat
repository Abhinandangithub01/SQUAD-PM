@echo off
git add -A
git commit -m "fix: Resolve TypeScript type issues in notificationService"
git push codecommit main
git push origin main
echo Notification service fix pushed!
pause
