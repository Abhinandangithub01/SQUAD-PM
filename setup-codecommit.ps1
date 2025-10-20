# SQUAD PM - AWS CodeCommit Setup Script
# This script helps you push your Next.js application to AWS CodeCommit

Write-Host "🚀 SQUAD PM - AWS CodeCommit Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    exit 1
}

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI is installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  AWS CLI is not installed. You'll need it for CodeCommit access." -ForegroundColor Yellow
    Write-Host "   Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Step 1: Configure Git Remote" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if origin already exists
$existingRemote = git remote get-url origin 2>$null

if ($existingRemote) {
    Write-Host "⚠️  Git remote 'origin' already exists: $existingRemote" -ForegroundColor Yellow
    $response = Read-Host "Do you want to update it? (y/n)"
    
    if ($response -eq 'y') {
        git remote remove origin
        Write-Host "✅ Removed existing remote" -ForegroundColor Green
    } else {
        Write-Host "❌ Keeping existing remote. Exiting..." -ForegroundColor Red
        exit 0
    }
}

# Add CodeCommit remote
$codecommitUrl = "https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/SQUAD-PM"
Write-Host "Adding remote: $codecommitUrl" -ForegroundColor White

try {
    git remote add origin $codecommitUrl
    Write-Host "✅ Git remote added successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to add remote: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Step 2: Prepare Repository" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Check current branch
$currentBranch = git branch --show-current

if ($currentBranch -ne "main") {
    Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow
    $response = Read-Host "Rename to 'main'? (y/n)"
    
    if ($response -eq 'y') {
        git branch -M main
        Write-Host "✅ Branch renamed to 'main'" -ForegroundColor Green
    }
}

# Check for uncommitted changes
$status = git status --porcelain

if ($status) {
    Write-Host "⚠️  You have uncommitted changes" -ForegroundColor Yellow
    Write-Host ""
    git status --short
    Write-Host ""
    $response = Read-Host "Commit all changes? (y/n)"
    
    if ($response -eq 'y') {
        git add .
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "Complete Next.js migration with multi-tenant architecture"
        }
        
        git commit -m $commitMessage
        Write-Host "✅ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "❌ Please commit your changes first" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📋 Step 3: Push to CodeCommit" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: You need AWS CodeCommit credentials" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: HTTPS Git Credentials" -ForegroundColor White
Write-Host "  1. Go to AWS IAM Console" -ForegroundColor Gray
Write-Host "  2. Navigate to your user → Security Credentials" -ForegroundColor Gray
Write-Host "  3. Scroll to 'HTTPS Git credentials for AWS CodeCommit'" -ForegroundColor Gray
Write-Host "  4. Click 'Generate credentials'" -ForegroundColor Gray
Write-Host "  5. Save the username and password" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: AWS CLI Credential Helper" -ForegroundColor White
Write-Host "  Run: git config --global credential.helper '!aws codecommit credential-helper $@'" -ForegroundColor Gray
Write-Host "  Run: git config --global credential.UseHttpPath true" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Ready to push? (y/n)"

if ($response -eq 'y') {
    Write-Host ""
    Write-Host "Pushing to CodeCommit..." -ForegroundColor White
    
    try {
        git push -u origin main
        Write-Host ""
        Write-Host "✅ Successfully pushed to AWS CodeCommit!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. Go to AWS Amplify Console" -ForegroundColor White
        Write-Host "  2. Create a new app and connect to CodeCommit" -ForegroundColor White
        Write-Host "  3. Select the SQUAD-PM repository" -ForegroundColor White
        Write-Host "  4. Deploy your application" -ForegroundColor White
        Write-Host ""
        Write-Host "📖 See DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor White
    } catch {
        Write-Host ""
        Write-Host "❌ Push failed: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  1. Invalid credentials - Generate Git credentials in IAM" -ForegroundColor Gray
        Write-Host "  2. No access to repository - Check IAM permissions" -ForegroundColor Gray
        Write-Host "  3. Repository doesn't exist - Create it in CodeCommit first" -ForegroundColor Gray
        Write-Host ""
        Write-Host "For help, see: DEPLOYMENT_GUIDE.md" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "ℹ️  Push cancelled. Run this script again when ready." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Script completed" -ForegroundColor Cyan
Write-Host ""
