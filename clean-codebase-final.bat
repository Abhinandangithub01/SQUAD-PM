@echo off
echo ========================================
echo Cleaning Codebase - Removing All Deployment Files
echo ========================================
echo.

echo This will remove ALL temporary documentation and deployment files.
echo.
pause

echo.
echo Removing documentation files...

del /Q "AWS_AMPLIFY_IMPORT_SETUP.md" 2>nul
del /Q "COLUMN_MAPPING_GUIDE.md" 2>nul
del /Q "COMPLETE_IMPORT_SETUP.md" 2>nul
del /Q "DEPLOYMENT_READY.md" 2>nul
del /Q "DEPLOY_IMPORT_TO_AMPLIFY.md" 2>nul
del /Q "DEPLOY_VIA_GITHUB.md" 2>nul
del /Q "EXCEL_IMPORT_COMPLETE.md" 2>nul
del /Q "EXCEL_IMPORT_FEATURE.md" 2>nul
del /Q "FINAL_DEPLOYMENT_GUIDE.md" 2>nul
del /Q "FIX_IMPORT_ERROR.md" 2>nul
del /Q "IMPORT_FEATURE_SUMMARY.md" 2>nul
del /Q "IMPORT_QUICK_START.md" 2>nul
del /Q "IMPORT_README.md" 2>nul
del /Q "QUICK_FIX.md" 2>nul
del /Q "UI_REDESIGN_GUIDE.md" 2>nul
del /Q "ALL_FIXES_IMPLEMENTATION.md" 2>nul
del /Q "FIXES_DEPLOYED.md" 2>nul
del /Q "READY_TO_PUSH.md" 2>nul
del /Q "QUICK_UPDATE_GUIDE.md" 2>nul
del /Q "UPDATE_LIVE_AMPLIFY.md" 2>nul
del /Q "CLEAN_DEPLOYMENT_FIX.md" 2>nul
del /Q "MODERN_DASHBOARD_IMPLEMENTED.md" 2>nul

echo.
echo Removing deployment scripts...

del /Q "deploy-import-feature.bat" 2>nul
del /Q "fix-import-error.ps1" 2>nul
del /Q "fix-import.bat" 2>nul
del /Q "setup-import-feature.ps1" 2>nul
del /Q "start-server.bat" 2>nul
del /Q "deploy-to-github.bat" 2>nul
del /Q "push-to-github.bat" 2>nul
del /Q "deploy-import-fix.bat" 2>nul
del /Q "update-live-app.ps1" 2>nul
del /Q "fix-and-deploy.ps1" 2>nul
del /Q "deploy-fix.bat" 2>nul
del /Q "remove-secrets.ps1" 2>nul
del /Q "setup-amplify.ps1" 2>nul

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Removed all temporary files.
echo Your codebase is now clean.
echo.
pause

echo.
echo Deleting this cleanup script...
del "%~f0"
