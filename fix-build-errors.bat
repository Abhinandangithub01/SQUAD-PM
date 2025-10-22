@echo off
echo Fixing build errors...

REM Delete duplicate page files
del /F /Q "src\app\dashboard\projects\[id]\page-enhanced.tsx" 2>nul
del /F /Q "src\app\dashboard\projects\[id]\page-fixed.tsx" 2>nul
del /F /Q "src\app\dashboard\projects\[id]\page-trello.tsx" 2>nul

REM Delete duplicate Kanban files
del /F /Q "src\components\features\ModernKanban.tsx" 2>nul
del /F /Q "src\components\features\TrelloKanban.tsx" 2>nul

echo.
echo Duplicate files deleted!
echo Committing changes...

git add -A
git commit -m "fix: Remove duplicate files causing build errors"
git push codecommit main
git push origin main

echo.
echo Build errors fixed and pushed!
pause
