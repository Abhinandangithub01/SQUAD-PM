# PowerShell Script to Fix Git Issues and Deploy

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Git Issues and Deploying" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any stuck git processes
Write-Host "Step 1: Checking for stuck processes..." -ForegroundColor Yellow
$gitProcesses = Get-Process | Where-Object { $_.ProcessName -like "*git*" }
if ($gitProcesses) {
    Write-Host "Found stuck git processes, terminating..." -ForegroundColor Yellow
    $gitProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Step 2: Abort any rebase
Write-Host "Step 2: Aborting any stuck rebase..." -ForegroundColor Yellow
git rebase --abort 2>$null

# Step 3: Check status
Write-Host "Step 3: Checking git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Options:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Reset to remote and start fresh (RECOMMENDED)" -ForegroundColor White
Write-Host "2. Try to continue with current changes" -ForegroundColor White
Write-Host "3. Exit and fix manually" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "Resetting to remote..." -ForegroundColor Yellow
    
    # Fetch latest
    git fetch origin main
    
    # Reset to remote
    git reset --hard origin/main
    
    Write-Host "✓ Reset complete" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now you can make your changes and commit fresh." -ForegroundColor Yellow
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "Attempting to commit current changes..." -ForegroundColor Yellow
    
    git add .
    git commit -m "fix: resolve deployment issues and add all features"
    
    Write-Host ""
    Write-Host "Ready to push. Run:" -ForegroundColor Yellow
    Write-Host "  git push origin main --force-with-lease" -ForegroundColor White
    
} else {
    Write-Host ""
    Write-Host "Exiting. Please fix manually." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
