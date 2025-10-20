# 🚀 Push to AWS CodeCommit - Quick Guide

## ✅ Status: Ready to Push

Your repository is configured and ready to push to AWS CodeCommit!

## Current Configuration

```
Git Remotes:
- origin: https://github.com/Abhinandangithub01/SQUAD-PM.git
- codecommit: https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/SQUAD-PM

Current Branch: main
Latest Commit: Complete Next.js migration with multi-tenant architecture
```

## 🔐 Before You Push - Set Up AWS Credentials

You need AWS CodeCommit credentials to push. Choose one option:

### Option 1: HTTPS Git Credentials (Recommended for Windows)

1. **Go to AWS IAM Console**
   - https://console.aws.amazon.com/iam/

2. **Navigate to Your User**
   - IAM → Users → [Your Username] → Security Credentials

3. **Generate HTTPS Git Credentials**
   - Scroll to "HTTPS Git credentials for AWS CodeCommit"
   - Click "Generate credentials"
   - **IMPORTANT**: Save the username and password immediately (you can't view them again)

4. **Use When Pushing**
   - Git will prompt for username and password
   - Enter the credentials you just generated

### Option 2: AWS CLI Credential Helper

If you have AWS CLI configured:

```powershell
# Configure Git to use AWS credential helper
git config --global credential.helper "!aws codecommit credential-helper $@"
git config --global credential.UseHttpPath true
```

### Option 3: SSH Keys

1. Generate SSH key:
   ```powershell
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```

2. Upload public key to IAM Console

3. Update remote to use SSH:
   ```powershell
   git remote set-url codecommit ssh://git-codecommit.ap-south-1.amazonaws.com/v1/repos/SQUAD-PM
   ```

## 📤 Push to CodeCommit

### Method 1: Using PowerShell Script (Easiest)

```powershell
.\setup-codecommit.ps1
```

This script will guide you through the process.

### Method 2: Manual Push

```powershell
# Push to CodeCommit
git push codecommit main

# Or set CodeCommit as default upstream
git push -u codecommit main
```

### Method 3: Push to Both Remotes

```powershell
# Push to GitHub
git push origin main

# Push to CodeCommit
git push codecommit main
```

## 🔍 Verify Push

After pushing, verify in AWS Console:

1. Go to: https://console.aws.amazon.com/codesuite/codecommit/repositories
2. Select "SQUAD-PM" repository
3. Check that your files are there

## 🚀 Next Steps After Push

### 1. Deploy Backend with Amplify

```powershell
# Install dependencies
npm install

# Start Amplify sandbox (creates AWS resources)
npx ampx sandbox
```

This will create:
- ✅ Cognito User Pool
- ✅ AppSync GraphQL API
- ✅ DynamoDB Tables
- ✅ S3 Bucket
- ✅ Lambda Functions (if any)

### 2. Deploy Frontend to Amplify Hosting

**Option A: Via AWS Console**

1. Go to: https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"
3. Select "AWS CodeCommit"
4. Choose "SQUAD-PM" repository
5. Select "main" branch
6. Review build settings (auto-detected from `amplify.yml`)
7. Click "Save and deploy"

**Option B: Via AWS CLI**

```powershell
# Create Amplify app
aws amplify create-app --name SQUAD-PM --repository https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/SQUAD-PM

# Create branch
aws amplify create-branch --app-id <APP_ID> --branch-name main

# Start deployment
aws amplify start-job --app-id <APP_ID> --branch-name main --job-type RELEASE
```

### 3. Test Your Application

Once deployed, Amplify will provide a URL like:
```
https://main.d1234567890abc.amplifyapp.com
```

Test:
1. ✅ Registration flow
2. ✅ Email verification
3. ✅ Login
4. ✅ Dashboard access
5. ✅ Create organization

## 📊 Monitor Deployment

### Amplify Console
- View build logs
- Monitor deployments
- Configure custom domain
- Set environment variables

### CloudWatch
- API logs (AppSync)
- Lambda logs
- Authentication metrics (Cognito)

## 🐛 Troubleshooting

### Issue: Authentication Failed

**Error**: `fatal: Authentication failed`

**Solution**:
1. Verify you generated HTTPS Git credentials in IAM
2. Make sure you're using the correct username/password
3. Try AWS CLI credential helper method

### Issue: Repository Not Found

**Error**: `repository 'SQUAD-PM' not found`

**Solution**:
1. Verify repository exists in CodeCommit console
2. Check repository name is exactly "SQUAD-PM"
3. Verify you have permissions to access the repository

### Issue: Permission Denied

**Error**: `Permission denied (publickey)`

**Solution**:
1. If using SSH, verify your SSH key is uploaded to IAM
2. Check SSH config file
3. Try HTTPS method instead

### Issue: Push Rejected

**Error**: `Updates were rejected because the remote contains work`

**Solution**:
```powershell
# Pull first, then push
git pull codecommit main --rebase
git push codecommit main
```

## 💡 Tips

### Keep Both Remotes in Sync

```powershell
# Push to both remotes at once
git remote set-url --add --push origin https://github.com/Abhinandangithub01/SQUAD-PM.git
git remote set-url --add --push origin https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/SQUAD-PM

# Now "git push origin main" pushes to both
```

### Set CodeCommit as Default

```powershell
# Set codecommit as default upstream
git branch --set-upstream-to=codecommit/main main

# Now "git push" pushes to CodeCommit by default
```

### Create Alias for Easy Pushing

Add to your PowerShell profile:

```powershell
function Push-ToAWS {
    git push codecommit main
}
Set-Alias -Name pushaws -Value Push-ToAWS
```

Then just run: `pushaws`

## 📚 Additional Resources

- **AWS CodeCommit Docs**: https://docs.aws.amazon.com/codecommit/
- **Amplify Hosting Docs**: https://docs.amplify.aws/
- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **Migration Notes**: See `MIGRATION_NOTES.md`

## ✅ Checklist

Before pushing, ensure:

- [ ] AWS credentials configured (IAM Git credentials or AWS CLI)
- [ ] Repository exists in CodeCommit
- [ ] All changes committed locally
- [ ] You have push permissions to the repository

After pushing:

- [ ] Verify files in CodeCommit console
- [ ] Deploy backend with `npx ampx sandbox`
- [ ] Deploy frontend via Amplify Console
- [ ] Test application functionality
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring and alerts

## 🎉 Ready to Deploy!

Your Next.js application is ready for AWS deployment. Follow the steps above to push to CodeCommit and deploy to Amplify.

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.

---

**Last Updated**: October 2025
