#!/bin/bash

# Complete Multi-Tenancy Deployment Script
# This script commits all changes and triggers AWS Amplify deployment

echo "🚀 Starting Multi-Tenancy Deployment..."
echo ""

# Check if we're in the right directory
if [ ! -f "amplify.yml" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Show what will be committed
echo "📋 Files to be committed:"
git status --short
echo ""

# Confirm deployment
read -p "🤔 Ready to deploy? This will push to production. (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Add all files
echo "📦 Adding files..."
git add .

# Create comprehensive commit message
echo "💾 Creating commit..."
git commit -m "feat: implement complete multi-tenancy with Organization models and Lambda functions

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
Fixes #build-failure"

# Push to main
echo "🚀 Pushing to main branch..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to main!"
    echo ""
    echo "📊 Deployment Status:"
    echo "   - AWS Amplify will now build and deploy"
    echo "   - Expected time: 5-10 minutes"
    echo "   - Monitor at: https://console.aws.amazon.com/amplify/"
    echo ""
    echo "🔍 Next Steps:"
    echo "   1. Monitor build logs in Amplify Console"
    echo "   2. Verify SES email address: noreply@projecthub.com"
    echo "   3. Test organization setup flow"
    echo "   4. Check CloudWatch Logs for Lambda execution"
    echo ""
    echo "📖 See DEPLOYMENT_READY.md for detailed verification steps"
    echo ""
    echo "🎉 Deployment initiated successfully!"
else
    echo ""
    echo "❌ Push failed! Please check your git configuration and try again."
    exit 1
fi
