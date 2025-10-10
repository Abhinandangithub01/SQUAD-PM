# 🚀 SQUAD PM Deployment Guide

Complete guide to deploy SQUAD PM to AWS with all services configured.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ **Node.js** (v18 or higher)
- ✅ **npm** (v9 or higher)
- ✅ **AWS Account** with admin access
- ✅ **AWS CLI** installed and configured
- ✅ **Git** installed
- ✅ **PowerShell** (Windows) or Bash (Mac/Linux)

---

## 🔧 Quick Setup (First Time)

### Step 1: Configure AWS Credentials

```powershell
# Run this command and enter your AWS credentials
aws configure

# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: ap-south-1
# - Default output format: json
```

### Step 2: Verify AWS Connection

```powershell
# Check if AWS is configured correctly
aws sts get-caller-identity
```

You should see your AWS account details.

---

## 🚀 Deployment Options

### Option 1: Quick Deploy (Recommended)

**One command to deploy everything:**

```powershell
.\quick-deploy.ps1
```

This script will:
1. ✅ Install all dependencies
2. ✅ Build the frontend
3. ✅ Deploy Amplify backend to AWS
4. ✅ Generate GraphQL code
5. ✅ Commit and push changes
6. ✅ Trigger Amplify build

**Time**: ~5-10 minutes

---

### Option 2: Step-by-Step Deploy

#### Step 1: Setup AWS Resources

```powershell
.\setup-aws.ps1
```

This creates:
- Cognito User Pool
- DynamoDB Tables
- AppSync GraphQL API
- Lambda Functions
- S3 Storage Bucket

#### Step 2: Deploy Application

```powershell
.\deploy.ps1
```

This deploys your application to AWS Amplify.

---

### Option 3: Update Schema Only

If you only changed the database schema:

```powershell
.\update-schema.ps1
```

This updates:
- DynamoDB tables
- GraphQL schema
- AppSync resolvers

---

## 📊 What Gets Deployed

### 1. **AWS Cognito** 🔐
- User Pool for authentication
- Email verification (OTP)
- Password policies
- User attributes (email, firstName, lastName)

### 2. **AWS DynamoDB** 🗄️
- **Organization** - Company/workspace data
- **OrganizationMember** - User-org relationships
- **Invitation** - Team invitations
- **Department** - 10 default departments
- **DepartmentRole** - 80 roles (8 per dept)
- **UserProfile** - Extended user info
- **Project** - Projects (org-scoped)
- **Task** - Tasks (project-scoped)
- **Comment** - Task comments
- **Message** - Chat messages
- **Attachment** - File attachments
- **ActivityLog** - Activity tracking
- **Notification** - User notifications

### 3. **AWS AppSync** 📡
- GraphQL API endpoint
- Real-time subscriptions
- Authorization rules
- Multi-tenant data isolation

### 4. **AWS Lambda** ⚡
- `send-invitation` - Send email invitations
- `accept-invitation` - Process invitation acceptance

### 5. **AWS S3** 📦
- File storage bucket
- Avatar uploads
- Document storage
- Attachment storage

---

## 🌐 Deployment URLs

After deployment, your app will be available at:

**Production**: https://main.d16qyjbt1a9iyw.amplifyapp.com

**AWS Console**: https://console.aws.amazon.com/amplify

---

## 🔍 Verify Deployment

### Check Cognito

```powershell
aws cognito-idp list-user-pools --max-results 10
```

### Check DynamoDB Tables

```powershell
aws dynamodb list-tables
```

### Check AppSync API

```powershell
aws appsync list-graphql-apis
```

### Check Lambda Functions

```powershell
aws lambda list-functions
```

### Check S3 Buckets

```powershell
aws s3 ls
```

---

## 🧪 Test Deployment

### 1. Visit the Application

```
https://main.d16qyjbt1a9iyw.amplifyapp.com
```

### 2. Sign Up

- Enter first name, last name, email, password
- Verify email with OTP code
- Login

### 3. Check Auto-Created Resources

After first login, verify:
- ✅ Organization created
- ✅ 10 Departments created
- ✅ 80 Roles created
- ✅ User profile created

### 4. Test Features

- ✅ Create a project
- ✅ Add tasks
- ✅ View dashboard
- ✅ Check departments page (`/departments`)

---

## 🔄 Update Deployment

### Update Code and Redeploy

```powershell
# Make your code changes, then:
git add .
git commit -m "your changes"
git push origin main

# Amplify will auto-deploy
```

### Update Schema Only

```powershell
.\update-schema.ps1
```

### Full Redeploy

```powershell
.\quick-deploy.ps1
```

---

## 🐛 Troubleshooting

### Issue: AWS CLI not found

**Solution**:
```powershell
# Install AWS CLI
# Download from: https://aws.amazon.com/cli/
```

### Issue: Amplify CLI not found

**Solution**:
```powershell
npm install -g @aws-amplify/cli
```

### Issue: Permission denied

**Solution**:
```powershell
# Check AWS credentials
aws sts get-caller-identity

# Reconfigure if needed
aws configure
```

### Issue: Deployment failed

**Solution**:
```powershell
# Check logs
cd client
npx ampx sandbox --once

# Check Amplify console
# https://console.aws.amazon.com/amplify
```

### Issue: Schema update failed

**Solution**:
```powershell
# Delete and recreate
cd client
npx ampx sandbox delete
npx ampx sandbox
```

---

## 📝 Environment Variables

Create `.env` file in `client/` directory:

```env
# AWS Configuration
VITE_AWS_REGION=ap-south-1
VITE_AWS_USER_POOL_ID=ap-south-1_woC9GygUF
VITE_AWS_USER_POOL_CLIENT_ID=60qcl823scus2kqpelnv3i29op

# Application
VITE_APP_NAME=SQUAD PM
VITE_APP_URL=https://main.d16qyjbt1a9iyw.amplifyapp.com

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=true
```

---

## 🔐 Security Best Practices

### 1. IAM Permissions

Ensure your AWS user has these permissions:
- `AWSAmplifyFullAccess`
- `AmazonCognitoPowerUser`
- `AmazonDynamoDBFullAccess`
- `AWSAppSyncAdministrator`
- `AWSLambda_FullAccess`
- `AmazonS3FullAccess`

### 2. Cognito Settings

- ✅ Email verification enabled
- ✅ Strong password policy
- ✅ MFA available (optional)
- ✅ Account recovery via email

### 3. DynamoDB Security

- ✅ Row-level security
- ✅ Organization-scoped queries
- ✅ Owner-based permissions

### 4. API Security

- ✅ Cognito User Pools authentication
- ✅ IAM authorization
- ✅ Rate limiting
- ✅ Request validation

---

## 📊 Monitoring

### CloudWatch Logs

```powershell
# View Lambda logs
aws logs tail /aws/lambda/sendInvitation --follow

# View AppSync logs
aws logs tail /aws/appsync/apis/[API_ID] --follow
```

### Amplify Console

Visit: https://console.aws.amazon.com/amplify

Check:
- Build status
- Deployment history
- Error logs
- Performance metrics

---

## 💰 Cost Estimation

### Free Tier (First 12 months)

- **Cognito**: 50,000 MAUs free
- **DynamoDB**: 25 GB storage, 25 WCU, 25 RCU
- **AppSync**: 250,000 queries/month
- **Lambda**: 1M requests/month
- **S3**: 5 GB storage, 20,000 GET, 2,000 PUT

### After Free Tier

Estimated cost for 100 users:
- **Cognito**: ~$5/month
- **DynamoDB**: ~$10/month
- **AppSync**: ~$15/month
- **Lambda**: ~$5/month
- **S3**: ~$5/month

**Total**: ~$40/month for 100 active users

---

## 🚀 Production Checklist

Before going to production:

- [ ] Configure custom domain
- [ ] Enable MFA for admin users
- [ ] Set up CloudWatch alarms
- [ ] Configure backup for DynamoDB
- [ ] Enable S3 versioning
- [ ] Set up CI/CD pipeline
- [ ] Configure error tracking (Sentry)
- [ ] Set up monitoring (DataDog/New Relic)
- [ ] Enable WAF for AppSync
- [ ] Configure rate limiting
- [ ] Set up SSL certificate
- [ ] Enable CloudFront CDN
- [ ] Configure backup strategy
- [ ] Document API endpoints
- [ ] Set up staging environment

---

## 📚 Additional Resources

- **Amplify Docs**: https://docs.amplify.aws/
- **Cognito Docs**: https://docs.aws.amazon.com/cognito/
- **DynamoDB Docs**: https://docs.aws.amazon.com/dynamodb/
- **AppSync Docs**: https://docs.aws.amazon.com/appsync/
- **Lambda Docs**: https://docs.aws.amazon.com/lambda/

---

## 🆘 Support

If you encounter issues:

1. Check the logs in AWS Console
2. Review the troubleshooting section
3. Check GitHub issues
4. Contact AWS Support

---

## 🎉 Success!

Your SQUAD PM application is now deployed to AWS with:

- ✅ Multi-tenant architecture
- ✅ User authentication (Cognito)
- ✅ Database (DynamoDB)
- ✅ GraphQL API (AppSync)
- ✅ Serverless functions (Lambda)
- ✅ File storage (S3)
- ✅ 10 Default departments
- ✅ 80 Roles
- ✅ Real-time updates
- ✅ Secure and scalable

**Happy deploying!** 🚀
