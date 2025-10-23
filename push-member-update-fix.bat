@echo off
git add -A
git commit -m "fix: Resolve TypeScript type issue in projectMemberService updateRole"
git push codecommit main
git push origin main
echo Member update fix pushed!
pause
