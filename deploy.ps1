# PowerShell Deployment Script for SQUAD PM
# This script deploys the Amplify backend to AWS

Write-Host "🚀 Starting SQUAD PM Deployment..." -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✅ AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    Write-Host "   Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm installed: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Set-Location client
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "🔨 Building Amplify backend..." -ForegroundColor Yellow
npx ampx sandbox --once
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Amplify backend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Amplify backend built" -ForegroundColor Green

Write-Host ""
Write-Host "☁️  Deploying to AWS..." -ForegroundColor Yellow
npx ampx pipeline-deploy --branch main --app-id d16qyjbt1a9iyw
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy to AWS" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Deployed to AWS" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   • Cognito: User authentication configured" -ForegroundColor White
Write-Host "   • DynamoDB: All tables created" -ForegroundColor White
Write-Host "   • AppSync: GraphQL API deployed" -ForegroundColor White
Write-Host "   • Lambda: Functions deployed" -ForegroundColor White
Write-Host "   • S3: Storage configured" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Application URL: https://main.d16qyjbt1a9iyw.amplifyapp.com" -ForegroundColor Cyan
Write-Host ""
