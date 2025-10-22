@echo off
echo Deleting unnecessary documentation files...

del /F /Q "100_PERCENT_COMPLETE.md" 2>nul
del /F /Q "ALL_ISSUES_FIXED.md" 2>nul
del /F /Q "CLEANUP_INSTRUCTIONS.md" 2>nul
del /F /Q "CLEANUP_SCRIPT.md" 2>nul
del /F /Q "COMPACT_SIDEBAR_UPDATE.md" 2>nul
del /F /Q "COMPLETE_FEATURES_LIST.md" 2>nul
del /F /Q "COMPLETE_IMPLEMENTATION_FINAL.md" 2>nul
del /F /Q "ENHANCED_PROJECT_WORKFLOW.md" 2>nul
del /F /Q "FINAL_FIX_INSTRUCTIONS.md" 2>nul
del /F /Q "FINAL_IMPLEMENTATION_SUMMARY.md" 2>nul
del /F /Q "IMPLEMENTATION_COMPLETE.md" 2>nul
del /F /Q "IMPLEMENTATION_PROGRESS.md" 2>nul
del /F /Q "IMPLEMENTATION_STATUS.md" 2>nul
del /F /Q "MODERN_UI_DARK_MODE_COMPLETE.md" 2>nul
del /F /Q "PRODUCTION_IMPLEMENTATION_PLAN.md" 2>nul
del /F /Q "PROJECT_CREATION_FIX.md" 2>nul
del /F /Q "TASK_CREATION_FIXED.md" 2>nul
del /F /Q "TRELLO_LIKE_IMPLEMENTATION.md" 2>nul
del /F /Q "COMMIT_INSTRUCTIONS.md" 2>nul
del /F /Q "commit-and-push.ps1" 2>nul
del /F /Q "DEPLOYMENT_GUIDE.md" 2>nul
del /F /Q "AMPLIFY_DEPLOYMENT_FIX.md" 2>nul
del /F /Q "BACKEND_DEPLOYMENT.md" 2>nul
del /F /Q "MIGRATION_NOTES.md" 2>nul
del /F /Q "NEXTJS_MIGRATION_COMPLETE.md" 2>nul
del /F /Q "PUSH_TO_AWS.md" 2>nul

echo.
echo Cleanup complete!
echo Only README.md remains.
echo.
pause
