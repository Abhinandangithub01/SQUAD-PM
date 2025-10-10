@echo off
echo ========================================
echo Starting SQUAD PM Backend Server
echo ========================================
echo.

cd server

echo Installing dependencies (if needed)...
call npm install
echo.

echo Starting server on port 5000...
echo.
echo Keep this window open while using the app!
echo Press Ctrl+C to stop the server.
echo.

call npm run dev

pause
