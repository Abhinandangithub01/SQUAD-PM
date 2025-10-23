@echo off
git add -A
git commit -m "fix: Resolve TypeScript type issue in projectMemberService"
git push codecommit main
git push origin main
echo Project member service fix pushed!
pause
