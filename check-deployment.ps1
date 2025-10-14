# Deployment Status Checker
# Checks if multi-tenancy deployment is complete and working

Write-Host "🔍 Checking Multi-Tenancy Deployment Status..." -ForegroundColor Cyan
Write-Host ""

# Check Git Status
Write-Host "📦 Git Status:" -ForegroundColor Yellow
Write-Host "  Current Branch: " -NoNewline
git branch --show-current
Write-Host "  Latest Commit: " -NoNewline
git log --oneline -1
Write-Host "  Remote Status: " -NoNewline
$behind = git rev-list HEAD..origin/main --count
$ahead = git rev-list origin/main..HEAD --count
if ($behind -eq 0 -and $ahead -eq 0) {
    Write-Host "✅ Up to date with origin/main" -ForegroundColor Green
} else {
    Write-Host "⚠️ $ahead ahead, $behind behind origin/main" -ForegroundColor Yellow
}
Write-Host ""

# Check if Lambda function files exist
Write-Host "🔧 Lambda Functions:" -ForegroundColor Yellow
$lambdaFunctions = @(
    "amplify/backend/function/postConfirmation/handler.js",
    "amplify/backend/function/postConfirmation/resource.js",
    "amplify/backend/function/createOrganization/handler.js",
    "amplify/backend/function/createOrganization/resource.js",
    "amplify/backend/function/inviteUser/handler.js",
    "amplify/backend/function/inviteUser/resource.js"
)

foreach ($func in $lambdaFunctions) {
    if (Test-Path $func) {
        Write-Host "  ✅ $func" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $func (Missing!)" -ForegroundColor Red
    }
}
Write-Host ""

# Check if frontend files exist
Write-Host "⚛️ Frontend Files:" -ForegroundColor Yellow
$frontendFiles = @(
    "client/src/contexts/OrganizationContext.js",
    "client/src/components/OrganizationSetupFlow.js"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (Missing!)" -ForegroundColor Red
    }
}
Write-Host ""

# Check AWS CLI availability
Write-Host "☁️ AWS CLI:" -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "  ✅ AWS CLI installed: $awsVersion" -ForegroundColor Green
    
    # Try to list Lambda functions
    Write-Host ""
    Write-Host "🔍 Checking AWS Lambda Functions..." -ForegroundColor Yellow
    try {
        $lambdas = aws lambda list-functions --query 'Functions[?contains(FunctionName, `postConfirmation`) || contains(FunctionName, `createOrganization`) || contains(FunctionName, `inviteUser`)].FunctionName' --output json 2>&1 | ConvertFrom-Json
        
        if ($lambdas -and $lambdas.Count -gt 0) {
            Write-Host "  ✅ Found $($lambdas.Count) Lambda function(s):" -ForegroundColor Green
            foreach ($lambda in $lambdas) {
                Write-Host "    - $lambda" -ForegroundColor Cyan
            }
        } else {
            Write-Host "  ⚠️ No Lambda functions found yet (may still be deploying)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "  ⚠️ Could not list Lambda functions (check AWS credentials)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  ⚠️ AWS CLI not installed or not in PATH" -ForegroundColor Yellow
    Write-Host "  Install from: https://aws.amazon.com/cli/" -ForegroundColor Cyan
}
Write-Host ""

# Check application URL
Write-Host "🌐 Application Status:" -ForegroundColor Yellow
$appUrl = "https://main.d8tv3j2hk2i9r.amplifyapp.com"
Write-Host "  URL: $appUrl" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $appUrl -Method Head -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  ✅ Application is online (Status: $($response.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "  ⚠️ Could not reach application (may be deploying)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "  - Code Status: " -NoNewline
if ($behind -eq 0 -and $ahead -eq 0) {
    Write-Host "✅ Deployed" -ForegroundColor Green
} else {
    Write-Host "⚠️ Pending" -ForegroundColor Yellow
}

Write-Host "  - Lambda Files: " -NoNewline
$lambdaExists = $true
foreach ($func in $lambdaFunctions) {
    if (-not (Test-Path $func)) {
        $lambdaExists = $false
        break
    }
}
if ($lambdaExists) {
    Write-Host "✅ Present" -ForegroundColor Green
} else {
    Write-Host "❌ Missing" -ForegroundColor Red
}

Write-Host "  - Frontend Files: " -NoNewline
$frontendExists = $true
foreach ($file in $frontendFiles) {
    if (-not (Test-Path $file)) {
        $frontendExists = $false
        break
    }
}
if ($frontendExists) {
    Write-Host "✅ Present" -ForegroundColor Green
} else {
    Write-Host "❌ Missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Visit AWS Amplify Console: https://console.aws.amazon.com/amplify/" -ForegroundColor Cyan
Write-Host "  2. Check build status for your app" -ForegroundColor Cyan
Write-Host "  3. Verify SES email: aws ses verify-email-identity --email-address noreply@projecthub.com" -ForegroundColor Cyan
Write-Host "  4. Test the application at: $appUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 For detailed verification steps, see: DEPLOYMENT_STATUS.md" -ForegroundColor Cyan
Write-Host ""
