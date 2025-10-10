# PowerShell Script to Setup Excel Import Feature
# Run this script to install dependencies and setup the import feature

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SQUAD PM - Excel Import Feature Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".\server\package.json")) {
    Write-Host "ERROR: Please run this script from the ProjectManagement root directory" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install xlsx
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install server dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Server dependencies installed" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "Step 2: Checking database migration..." -ForegroundColor Yellow
if (Test-Path ".\database\migrations\add_import_fields.sql") {
    Write-Host "✓ Database migration file found" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: You need to run the database migration manually:" -ForegroundColor Yellow
    Write-Host "  1. Connect to your PostgreSQL database" -ForegroundColor White
    Write-Host "  2. Run: \i database/migrations/add_import_fields.sql" -ForegroundColor White
    Write-Host "  OR use: psql -U your_username -d your_database -f database/migrations/add_import_fields.sql" -ForegroundColor White
} else {
    Write-Host "WARNING: Database migration file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 3: Verifying frontend components..." -ForegroundColor Yellow
if (Test-Path ".\client\src\components\ImportTasksModal.js") {
    Write-Host "✓ ImportTasksModal component found" -ForegroundColor Green
} else {
    Write-Host "ERROR: ImportTasksModal component not found" -ForegroundColor Red
    exit 1
}

if (Test-Path ".\server\routes\import.js") {
    Write-Host "✓ Import route found" -ForegroundColor Green
} else {
    Write-Host "ERROR: Import route not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run the database migration (see instructions above)" -ForegroundColor White
Write-Host "2. Restart your server: cd server && npm run dev" -ForegroundColor White
Write-Host "3. The import feature is now available in the Kanban board!" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: See EXCEL_IMPORT_FEATURE.md for complete guide" -ForegroundColor Cyan
Write-Host ""
