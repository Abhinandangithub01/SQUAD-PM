# Diagnose Amplify deployment issues

Write-Host "`n=== AMPLIFY DEPLOYMENT DIAGNOSTICS ===" -ForegroundColor Cyan

# 1. Check if Milestone is in our local schema
Write-Host "`n1. Checking local schema file..." -ForegroundColor Yellow
$schemaContent = Get-Content "amplify\data\resource.js" -Raw
if ($schemaContent -match "Milestone") {
    Write-Host "   ✅ Milestone model EXISTS in amplify/data/resource.js" -ForegroundColor Green
} else {
    Write-Host "   ❌ Milestone model NOT FOUND in amplify/data/resource.js" -ForegroundColor Red
}

# 2. Check current amplify_outputs.json
Write-Host "`n2. Checking deployed outputs..." -ForegroundColor Yellow
$outputsContent = Get-Content "client\src\amplify_outputs.json" -Raw
if ($outputsContent -match "Milestone") {
    Write-Host "   ✅ Milestone model EXISTS in amplify_outputs.json" -ForegroundColor Green
} else {
    Write-Host "   ❌ Milestone model NOT FOUND in amplify_outputs.json" -ForegroundColor Red
    Write-Host "   This means the backend wasn't deployed with the current schema" -ForegroundColor Yellow
}

# 3. Check what models are in the outputs
Write-Host "`n3. Models found in amplify_outputs.json:" -ForegroundColor Yellow
$outputs = Get-Content "client\src\amplify_outputs.json" | ConvertFrom-Json
if ($outputs.data.model_introspection.models) {
    $models = $outputs.data.model_introspection.models | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name
    foreach ($model in $models) {
        Write-Host "   - $model" -ForegroundColor Cyan
    }
} else {
    Write-Host "   No models found or invalid format" -ForegroundColor Red
}

# 4. Check git status
Write-Host "`n4. Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "   ⚠️  Uncommitted changes:" -ForegroundColor Yellow
    Write-Host $gitStatus
} else {
    Write-Host "   ✅ Working directory clean" -ForegroundColor Green
}

# 5. Check latest commit
Write-Host "`n5. Latest commit:" -ForegroundColor Yellow
$latestCommit = git log -1 --oneline
Write-Host "   $latestCommit" -ForegroundColor Cyan

Write-Host "`n=== RECOMMENDATIONS ===" -ForegroundColor Cyan

if ($outputsContent -notmatch "Milestone") {
    Write-Host "`n⚠️  The Milestone model is NOT deployed yet." -ForegroundColor Yellow
    Write-Host "`nPossible solutions:" -ForegroundColor Cyan
    Write-Host "1. The build may have deployed an old cached schema" -ForegroundColor White
    Write-Host "2. Try deleting the CloudFormation stack and redeploying" -ForegroundColor White
    Write-Host "3. Check Amplify Console build logs for backend deployment errors" -ForegroundColor White
    Write-Host "`nTo force a fresh deployment:" -ForegroundColor Cyan
    Write-Host "   - Go to Amplify Console" -ForegroundColor White
    Write-Host "   - Delete the app and recreate it" -ForegroundColor White
    Write-Host "   - Or manually update the CloudFormation stack" -ForegroundColor White
}

Write-Host ""
