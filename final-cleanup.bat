@echo off
echo Removing cleanup scripts...
del /F /Q cleanup.bat 2>nul
del /F /Q commit-cleanup.bat 2>nul
git add -A
git commit -m "chore: Remove cleanup scripts"
git push origin main
echo.
echo All cleanup complete! Only essential files remain.
echo.
del /F /Q final-cleanup.bat
