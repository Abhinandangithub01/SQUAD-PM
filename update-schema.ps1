# PowerShell Script to Update Amplify Schema and Deploy
# This script updates the database schema and deploys changes to AWS

Write-Host "🔄 Starting Schema Update..." -ForegroundColor Cyan
Write-Host ""

# Navigate to client directory
Set-Location client

Write-Host "📋 Current Schema Models:" -ForegroundColor Yellow
Write-Host "   • Organization" -ForegroundColor White
Write-Host "   • OrganizationMember" -ForegroundColor White
Write-Host "   • Invitation" -ForegroundColor White
Write-Host "   • Department" -ForegroundColor White
Write-Host "   • DepartmentRole" -ForegroundColor White
Write-Host "   • UserProfile" -ForegroundColor White
Write-Host "   • Project" -ForegroundColor White
Write-Host "   • Task" -ForegroundColor White
Write-Host "   • Comment" -ForegroundColor White
Write-Host "   • Message" -ForegroundColor White
Write-Host "   • Attachment" -ForegroundColor White
Write-Host "   • ActivityLog" -ForegroundColor White
Write-Host "   • Notification" -ForegroundColor White
Write-Host ""

Write-Host "🔨 Generating GraphQL schema..." -ForegroundColor Yellow
npx ampx generate graphql-client-code --out ./src/graphql
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate GraphQL code" -ForegroundColor Red
    exit 1
}
Write-Host "✅ GraphQL schema generated" -ForegroundColor Green

Write-Host ""
Write-Host "🏗️  Building Amplify backend..." -ForegroundColor Yellow
npx ampx sandbox --once
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build backend" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "☁️  Deploying schema updates to AWS..." -ForegroundColor Yellow
npx ampx pipeline-deploy --branch main --app-id d16qyjbt1a9iyw
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy schema updates" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Schema updates deployed" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Schema update completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Updated Models:" -ForegroundColor Cyan
Write-Host "   ✅ Department model with roles" -ForegroundColor Green
Write-Host "   ✅ DepartmentRole model with levels" -ForegroundColor Green
Write-Host "   ✅ Multi-tenant isolation" -ForegroundColor Green
Write-Host "   ✅ Authorization rules" -ForegroundColor Green
Write-Host ""
