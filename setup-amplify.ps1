# Amplify Setup Script for Windows PowerShell
# Run this script to set up AWS Amplify for your project

Write-Host "🚀 AWS Amplify Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Amplify CLI is installed
Write-Host "Checking for Amplify CLI..." -ForegroundColor Yellow
$amplifyVersion = amplify --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Amplify CLI not found. Installing..." -ForegroundColor Red
    npm install -g @aws-amplify/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Amplify CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Amplify CLI installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Amplify CLI found: $amplifyVersion" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📋 Setup Steps:" -ForegroundColor Cyan
Write-Host "1. Configure AWS credentials (if not done)" -ForegroundColor White
Write-Host "2. Initialize Amplify project" -ForegroundColor White
Write-Host "3. Add Authentication (Cognito)" -ForegroundColor White
Write-Host "4. Add API (GraphQL + DynamoDB)" -ForegroundColor White
Write-Host "5. Add Storage (S3)" -ForegroundColor White
Write-Host "6. Push to AWS" -ForegroundColor White
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Ask user if they want to continue
$continue = Read-Host "Do you want to continue? (y/n)"
if ($continue -ne "y") {
    Write-Host "Setup cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔧 Step 1: Configure AWS Credentials" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
$configureAWS = Read-Host "Have you configured AWS credentials? (y/n)"
if ($configureAWS -ne "y") {
    Write-Host "Running: amplify configure" -ForegroundColor Yellow
    Write-Host "Please follow the prompts to configure AWS..." -ForegroundColor Yellow
    amplify configure
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ AWS configuration failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ AWS credentials configured" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Step 2: Initialize Amplify Project" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if amplify is already initialized
if (Test-Path "amplify") {
    Write-Host "⚠️  Amplify already initialized" -ForegroundColor Yellow
    $reinit = Read-Host "Do you want to re-initialize? (y/n)"
    if ($reinit -eq "y") {
        Write-Host "Running: amplify init" -ForegroundColor Yellow
        amplify init
    }
} else {
    Write-Host "Running: amplify init" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Recommended settings:" -ForegroundColor Yellow
    Write-Host "  - Project name: ProjectManagement" -ForegroundColor Gray
    Write-Host "  - Environment: dev" -ForegroundColor Gray
    Write-Host "  - Editor: Visual Studio Code" -ForegroundColor Gray
    Write-Host "  - App type: javascript" -ForegroundColor Gray
    Write-Host "  - Framework: react" -ForegroundColor Gray
    Write-Host "  - Source: client/src" -ForegroundColor Gray
    Write-Host "  - Build: npm run build" -ForegroundColor Gray
    Write-Host "  - Start: npm start" -ForegroundColor Gray
    Write-Host ""
    amplify init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Amplify initialization failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Amplify initialized" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Step 3: Add Authentication" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
$addAuth = Read-Host "Add Authentication (Cognito)? (y/n)"
if ($addAuth -eq "y") {
    Write-Host "Running: amplify add auth" -ForegroundColor Yellow
    Write-Host "Choose: Default configuration, Email sign-in" -ForegroundColor Gray
    amplify add auth
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to add auth" -ForegroundColor Red
    } else {
        Write-Host "✅ Authentication added" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🔧 Step 4: Add API (GraphQL)" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
$addAPI = Read-Host "Add API (GraphQL + DynamoDB)? (y/n)"
if ($addAPI -eq "y") {
    Write-Host "Running: amplify add api" -ForegroundColor Yellow
    Write-Host "Choose: GraphQL, use existing schema" -ForegroundColor Gray
    amplify add api
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to add API" -ForegroundColor Red
    } else {
        Write-Host "✅ API added" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🔧 Step 5: Add Storage (S3)" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
$addStorage = Read-Host "Add Storage (S3)? (y/n)"
if ($addStorage -eq "y") {
    Write-Host "Running: amplify add storage" -ForegroundColor Yellow
    Write-Host "Choose: Content, Auth users only, CRUD access" -ForegroundColor Gray
    amplify add storage
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to add storage" -ForegroundColor Red
    } else {
        Write-Host "✅ Storage added" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🔧 Step 6: Push to AWS" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "This will deploy all resources to AWS (takes 5-10 minutes)" -ForegroundColor Yellow
$push = Read-Host "Push to AWS now? (y/n)"
if ($push -eq "y") {
    Write-Host "Running: amplify push" -ForegroundColor Yellow
    amplify push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Push failed" -ForegroundColor Red
        Write-Host "Try running: amplify push --force" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Successfully pushed to AWS!" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check for aws-exports.js or amplify_outputs.json in client/src" -ForegroundColor White
Write-Host "2. Start the app: cd client && npm start" -ForegroundColor White
Write-Host "3. Test authentication, projects, tasks, and chat" -ForegroundColor White
Write-Host "4. Deploy to production: amplify publish" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: COMPLETE_AWS_SETUP.md" -ForegroundColor Cyan
Write-Host ""
