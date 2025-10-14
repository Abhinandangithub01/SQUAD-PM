# Complete Multi-Tenancy Deployment Script (PowerShell)
# This script commits all changes and triggers AWS Amplify deployment

Write-Host "🚀 Starting Multi-Tenancy Deployment..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "amplify.yml")) {
    Write-Host "❌ Error: Not in project root directory" -ForegroundColor Red
    exit 1
}

# Show what will be committed
Write-Host "📋 Files to be committed:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Confirm deployment
$confirmation = Read-Host "🤔 Ready to deploy? This will push to production. (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 1
}

# Add all files
Write-Host "📦 Adding files..." -ForegroundColor Cyan
git add .

# Create comprehensive commit message
Write-Host "💾 Creating commit..." -ForegroundColor Cyan
$commitMessage = @"
feat: implement complete multi-tenancy with Organization models and Lambda functions

🏢 Backend Changes:
- Add Organization, OrganizationMember, and Invitation models
- Update all 13 data models with organizationId for data isolation
- Change authorization from publicApiKey to userPool
- Create Lambda functions: PostConfirmation, CreateOrganization, InviteUser
- Add Cognito custom attributes: custom:organizationId, custom:role
- Configure PostConfirmation Lambda trigger
- Grant proper IAM permissions to all Lambda functions
- Fix amplify_outputs.json encoding issue in amplify.yml

⚛️ Frontend Changes:
- Create OrganizationContext for state management
- Implement OrganizationSetupFlow component (3-step wizard)
- Update App.js to include OrganizationProvider
- Update ProtectedRoute to handle organization requirements
- Add error handling and backward compatibility in CognitoAuthContext
- Support both old and new schema gracefully

🔐 Security & Authorization:
- User pool authentication with JWT tokens
- Owner-based and role-based access control
- Organization-scoped data isolation
- Custom permissions support

✨ Features:
- Multi-tenant architecture
- Subscription plans (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
- Email invitations via SES
- Usage tracking and limits
- 14-day trial period
- Role management (OWNER, ADMIN, MANAGER, MEMBER, VIEWER)

📚 Documentation:
- IMPLEMENTATION_PLAN.md - Complete 7-phase roadmap
- PHASE1_IMPLEMENTATION_SUMMARY.md - Phase 1 details
- DEPLOYMENT_GUIDE_PHASE1.md - Deployment instructions
- DEPLOYMENT_READY.md - Deployment checklist
- BUILD_FIX.md - Build issue resolution

🔄 Backward Compatibility:
- App works with or without Organization models
- Graceful fallback to Cognito attributes
- No breaking changes for existing users
- Gradual migration path available

Closes #multi-tenancy
Implements #organization-management
Fixes #build-failure
"@

git commit -m $commitMessage

# Push to main
Write-Host "🚀 Pushing to main branch..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to main!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Deployment Status:" -ForegroundColor Yellow
    Write-Host "   - AWS Amplify will now build and deploy"
    Write-Host "   - Expected time: 5-10 minutes"
    Write-Host "   - Monitor at: https://console.aws.amazon.com/amplify/"
    Write-Host ""
    Write-Host "🔍 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Monitor build logs in Amplify Console"
    Write-Host "   2. Verify SES email address: noreply@projecthub.com"
    Write-Host "   3. Test organization setup flow"
    Write-Host "   4. Check CloudWatch Logs for Lambda execution"
    Write-Host ""
    Write-Host "📖 See DEPLOYMENT_READY.md for detailed verification steps" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 Deployment initiated successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Push failed! Please check your git configuration and try again." -ForegroundColor Red
    exit 1
}
