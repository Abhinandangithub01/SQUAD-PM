@echo off
echo ========================================
echo Fixing Import Error
echo ========================================
echo.

echo Step 1: Installing xlsx package...
cd server
call npm install xlsx
if errorlevel 1 (
    echo ERROR: Failed to install xlsx
    pause
    exit /b 1
)
echo SUCCESS: xlsx package installed
echo.

echo Step 2: Verifying installation...
call npm list xlsx
echo.

echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo IMPORTANT: You must restart your server now!
echo.
echo Run this command in a new terminal:
echo   cd server
echo   npm run dev
echo.
echo Then refresh your browser and try importing again!
echo.
pause
