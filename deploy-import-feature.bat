@echo off
echo ========================================
echo Deploying Import Feature to AWS Amplify
echo ========================================
echo.

echo This will:
echo 1. Update GraphQL schema with new fields
echo 2. Deploy Lambda function for import
echo 3. Update DynamoDB tables
echo 4. Configure S3 storage
echo 5. Build and deploy frontend
echo.

pause

echo.
echo Step 1: Checking Amplify status...
call amplify status

echo.
echo Step 2: Pushing changes to AWS...
call amplify push

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your import feature is now live at:
echo https://main.d1f6qp1tc8...amplifyapp.com
echo.
echo Test it by:
echo 1. Go to Kanban Board
echo 2. Click "Import Tasks"
echo 3. Upload your Excel file
echo 4. Review results
echo.

pause
