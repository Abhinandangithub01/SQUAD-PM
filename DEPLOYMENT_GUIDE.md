# 🚀 SQUAD PM - Deployment Guide

Complete guide for deploying SQUAD PM to AWS with CodeCommit and Amplify.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- Git installed
- Node.js 18+ installed

## Step 1: Configure AWS CodeCommit Access

### Option A: HTTPS with Git Credentials

1. Go to AWS IAM Console
2. Navigate to your user → Security Credentials
3. Scroll to "HTTPS Git credentials for AWS CodeCommit"
4. Click "Generate credentials"
5. Save the username and password

### Option B: SSH Keys

1. Generate SSH key:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```

2. Upload public key to IAM:
   - Go to IAM → Users → Your User → Security Credentials
   - Upload SSH public key

3. Add to SSH config (`~/.ssh/config`):
   ```
   Host git-codecommit.*.amazonaws.com
     User YOUR_SSH_KEY_ID
     IdentityFile ~/.ssh/id_rsa
   ```

## Step 2: Initialize Git Repository

```bash
cd SQUAD-PM

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial Next.js migration with multi-tenant architecture"
```

## Step 3: Connect to AWS CodeCommit

### Using HTTPS:

```bash
git remote add origin https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/SQUAD-PM
```

### Using SSH:

```bash
git remote add origin ssh://git-codecommit.ap-south-1.amazonaws.com/v1/repos/SQUAD-PM
```

## Step 4: Push to CodeCommit

```bash
# Push to main branch
git push -u origin main

# Or if you're on master branch
git branch -M main
git push -u origin main
```

## Step 5: Set Up AWS Amplify Backend

### Local Development:

```bash
# Install dependencies
npm install

# Start Amplify sandbox (creates cloud resources)
npx ampx sandbox

# This will:
# - Create Cognito User Pool
# - Create AppSync GraphQL API
# - Create DynamoDB tables
# - Create S3 bucket
# - Generate amplify_outputs.json
```

### Production Deployment:

```bash
# Deploy backend to production
npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
```

## Step 6: Deploy Frontend to AWS Amplify Hosting

### Via AWS Console:

1. **Open AWS Amplify Console**
   - Go to https://console.aws.amazon.com/amplify/

2. **Create New App**
   - Click "New app" → "Host web app"
   - Select "AWS CodeCommit"
   - Choose your repository: `SQUAD-PM`
   - Select branch: `main`

3. **Configure Build Settings**
   
   Amplify will auto-detect Next.js. Verify the build settings:
   
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

4. **Environment Variables** (if needed)
   - Add any custom environment variables
   - Amplify auto-configures AWS resources

5. **Deploy**
   - Click "Save and deploy"
   - Wait for deployment to complete

## Step 7: Configure Custom Domain (Optional)

1. In Amplify Console, go to "Domain management"
2. Click "Add domain"
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning

## Step 8: Set Up Multi-Tenant Features

### Create First Organization:

After deployment, the first user to register will need to create an organization:

1. Register a new account
2. Verify email
3. Login
4. Create organization with company details

### Configure Organization Settings:

```typescript
// In your application, organizations can be configured with:
- Name and slug
- Logo and branding
- Plan tier (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
- Max users and projects
- Custom settings
```

## Step 9: Configure AWS Lambda Functions (Optional)

For advanced features like email notifications, scheduled tasks, etc.:

```bash
# Create Lambda function
cd amplify/functions
mkdir send-notification
cd send-notification

# Create handler
cat > handler.ts << 'EOF'
export const handler = async (event: any) => {
  // Your Lambda logic here
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success' })
  };
};
EOF

# Add to backend.ts
```

## Step 10: Monitor and Scale

### CloudWatch Monitoring:

- Monitor API requests in AppSync
- Track Cognito authentication metrics
- Monitor DynamoDB read/write capacity
- Set up CloudWatch alarms

### Scaling Considerations:

1. **DynamoDB**: Configure auto-scaling for tables
2. **Cognito**: Supports millions of users by default
3. **S3**: Automatically scales
4. **Lambda**: Configure concurrency limits if needed

## Troubleshooting

### Issue: Build fails in Amplify

**Solution**: Check build logs in Amplify Console. Common issues:
- Missing dependencies in package.json
- TypeScript errors
- Environment variables not set

### Issue: Authentication not working

**Solution**: 
- Verify amplify_outputs.json is generated
- Check Cognito User Pool settings
- Ensure email verification is configured

### Issue: GraphQL API errors

**Solution**:
- Check AppSync logs in CloudWatch
- Verify DynamoDB table permissions
- Check authorization rules in schema

## Cost Optimization

### Free Tier Resources:

- **Cognito**: 50,000 MAUs free
- **DynamoDB**: 25 GB storage, 25 RCU/WCU free
- **S3**: 5 GB storage, 20,000 GET requests free
- **Lambda**: 1M requests, 400,000 GB-seconds free
- **Amplify Hosting**: 1000 build minutes, 15 GB served free

### Cost Reduction Tips:

1. Use DynamoDB on-demand pricing for variable workloads
2. Enable S3 Intelligent-Tiering
3. Set up CloudWatch alarms for cost monitoring
4. Use Lambda reserved concurrency wisely

## Security Best Practices

1. **Enable MFA** for admin users
2. **Use IAM roles** with least privilege
3. **Enable CloudTrail** for audit logging
4. **Configure WAF** for AppSync API
5. **Regular security audits** with AWS Security Hub
6. **Encrypt data** at rest and in transit
7. **Implement rate limiting** on API endpoints

## Backup and Disaster Recovery

### DynamoDB Backups:

```bash
# Enable point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name YourTableName \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### S3 Versioning:

```bash
# Enable versioning on S3 bucket
aws s3api put-bucket-versioning \
  --bucket your-bucket-name \
  --versioning-configuration Status=Enabled
```

## CI/CD Pipeline

Amplify automatically sets up CI/CD:

1. **Commit** to CodeCommit
2. **Trigger** automatic build
3. **Test** (if configured)
4. **Deploy** to production
5. **Rollback** if needed (via Amplify Console)

## Support and Resources

- **AWS Amplify Docs**: https://docs.amplify.aws/
- **Next.js Docs**: https://nextjs.org/docs
- **AWS Support**: https://console.aws.amazon.com/support/

---

**Need Help?** Open an issue on GitHub or contact the development team.
