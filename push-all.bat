@echo off
git add .
git commit -m "feat: add import task fields to schema and fix import functionality"
git push origin main
echo.
echo Done! Amplify will rebuild with new schema.
pause
