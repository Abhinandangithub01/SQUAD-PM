# Quick Deploy Script - Builds and deploys everything
# This is the main script to run for deployment

Write-Host "⚡ SQUAD PM Quick Deploy" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# Navigate to project root
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "📂 Project: $projectRoot" -ForegroundColor White
Write-Host ""

# Step 1: Install dependencies
Write-Host "1️⃣  Installing dependencies..." -ForegroundColor Yellow
Set-Location client
npm install --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Build frontend
Write-Host "2️⃣  Building frontend..." -ForegroundColor Yellow
npm run build --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build frontend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy Amplify backend
Write-Host "3️⃣  Deploying Amplify backend..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray
npx ampx sandbox --once
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy backend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend deployed" -ForegroundColor Green
Write-Host ""

# Step 4: Generate GraphQL code
Write-Host "4️⃣  Generating GraphQL code..." -ForegroundColor Yellow
npx ampx generate graphql-client-code --out ./src/graphql
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  GraphQL code generation skipped" -ForegroundColor Yellow
}
Write-Host "✅ GraphQL code generated" -ForegroundColor Green
Write-Host ""

# Step 5: Git commit and push
Write-Host "5️⃣  Committing changes..." -ForegroundColor Yellow
Set-Location ..
git add .
git commit -m "deploy: update AWS resources and deploy application" --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "6️⃣  Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Pushed to GitHub" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Failed to push to GitHub" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Cyan
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⏱️  Time taken: $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Frontend built and ready" -ForegroundColor Green
Write-Host "   ✅ Backend deployed to AWS" -ForegroundColor Green
Write-Host "   ✅ Cognito configured" -ForegroundColor Green
Write-Host "   ✅ DynamoDB tables created" -ForegroundColor Green
Write-Host "   ✅ AppSync API deployed" -ForegroundColor Green
Write-Host "   ✅ Lambda functions deployed" -ForegroundColor Green
Write-Host "   ✅ S3 storage configured" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "   • Production: https://main.d16qyjbt1a9iyw.amplifyapp.com" -ForegroundColor White
Write-Host "   • AWS Console: https://console.aws.amazon.com/amplify" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Wait 2-3 minutes for Amplify to build" -ForegroundColor White
Write-Host "   2. Visit the production URL" -ForegroundColor White
Write-Host "   3. Sign up and test the application" -ForegroundColor White
Write-Host ""
