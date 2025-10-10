# Quick Fix for Import Error
Write-Host "Fixing Import Feature Error..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Install xlsx package
Write-Host "Step 1: Installing xlsx package..." -ForegroundColor Yellow
Set-Location server
npm install xlsx
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install xlsx package" -ForegroundColor Red
    Write-Host "Try running manually: cd server && npm install xlsx" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ xlsx package installed" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "Step 2: Checking import route..." -ForegroundColor Yellow
if (Test-Path ".\server\routes\import.js") {
    Write-Host "✓ Import route exists" -ForegroundColor Green
} else {
    Write-Host "ERROR: Import route file missing!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: You must restart your server now!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run these commands:" -ForegroundColor White
Write-Host "  cd server" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then try importing again!" -ForegroundColor Green
Write-Host ""
