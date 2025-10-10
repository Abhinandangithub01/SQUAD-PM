@echo off
git add client/package.json
git commit -m "fix: add xlsx package to client dependencies"
git push origin main
echo.
echo Done! Check Amplify build status.
pause
