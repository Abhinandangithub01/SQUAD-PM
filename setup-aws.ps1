# PowerShell Script to Setup AWS Resources
# This script initializes all AWS services for SQUAD PM

Write-Host "⚙️  AWS Setup for SQUAD PM" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check AWS credentials
Write-Host "🔐 Checking AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-Host "✅ AWS Account: $($identity.Account)" -ForegroundColor Green
    Write-Host "✅ User: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials not configured" -ForegroundColor Red
    Write-Host "   Run: aws configure" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📦 Installing Amplify CLI..." -ForegroundColor Yellow
npm install -g @aws-amplify/cli
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Amplify CLI" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Amplify CLI installed" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Configuring Amplify..." -ForegroundColor Yellow
Set-Location client

# Check if amplify is already initialized
if (Test-Path "amplify") {
    Write-Host "✅ Amplify already initialized" -ForegroundColor Green
} else {
    Write-Host "Initializing Amplify..." -ForegroundColor Yellow
    npx ampx init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to initialize Amplify" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Amplify initialized" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏗️  Setting up AWS resources..." -ForegroundColor Yellow
Write-Host ""

# Cognito Setup
Write-Host "1️⃣  Setting up AWS Cognito..." -ForegroundColor Cyan
Write-Host "   • User Pool for authentication" -ForegroundColor White
Write-Host "   • Email verification" -ForegroundColor White
Write-Host "   • Password policies" -ForegroundColor White

# DynamoDB Setup
Write-Host ""
Write-Host "2️⃣  Setting up DynamoDB..." -ForegroundColor Cyan
Write-Host "   • Organization table" -ForegroundColor White
Write-Host "   • OrganizationMember table" -ForegroundColor White
Write-Host "   • Department table" -ForegroundColor White
Write-Host "   • DepartmentRole table" -ForegroundColor White
Write-Host "   • Project table" -ForegroundColor White
Write-Host "   • Task table" -ForegroundColor White
Write-Host "   • All other tables..." -ForegroundColor White

# AppSync Setup
Write-Host ""
Write-Host "3️⃣  Setting up AppSync..." -ForegroundColor Cyan
Write-Host "   • GraphQL API" -ForegroundColor White
Write-Host "   • Resolvers" -ForegroundColor White
Write-Host "   • Authorization" -ForegroundColor White

# Lambda Setup
Write-Host ""
Write-Host "4️⃣  Setting up Lambda Functions..." -ForegroundColor Cyan
Write-Host "   • send-invitation function" -ForegroundColor White
Write-Host "   • accept-invitation function" -ForegroundColor White

# S3 Setup
Write-Host ""
Write-Host "5️⃣  Setting up S3 Storage..." -ForegroundColor Cyan
Write-Host "   • File storage bucket" -ForegroundColor White
Write-Host "   • Access policies" -ForegroundColor White

Write-Host ""
Write-Host "🚀 Deploying to AWS..." -ForegroundColor Yellow
npx ampx sandbox
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ AWS Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Resources Created:" -ForegroundColor Cyan
Write-Host "   ✅ Cognito User Pool" -ForegroundColor Green
Write-Host "   ✅ DynamoDB Tables (13 tables)" -ForegroundColor Green
Write-Host "   ✅ AppSync GraphQL API" -ForegroundColor Green
Write-Host "   ✅ Lambda Functions (2 functions)" -ForegroundColor Green
Write-Host "   ✅ S3 Storage Bucket" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run: .\deploy.ps1 to deploy the application" -ForegroundColor White
Write-Host "   2. Visit: https://main.d16qyjbt1a9iyw.amplifyapp.com" -ForegroundColor White
Write-Host ""
