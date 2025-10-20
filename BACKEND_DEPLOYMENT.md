# 🚀 Backend Deployment Guide

## Current Status

✅ **Frontend**: Deployed successfully to Amplify Hosting
❌ **Backend**: Not deployed yet (missing `amplify_outputs.json`)

**Error**: `Amplify has not been configured. Auth UserPool not configured.`

## Why This Happens

The frontend is deployed, but it needs the backend configuration file (`amplify_outputs.json`) which is generated when you deploy the AWS backend resources (Cognito, AppSync, DynamoDB, S3).

## 🔧 Solution: Deploy Backend

You have **two options** to deploy the backend:

---

## Option 1: Local Sandbox Deployment (Recommended for Testing)

Deploy the backend from your local machine to your AWS account.

### Step 1: Install Dependencies

```bash
cd c:\Users\mail2\Downloads\SQUADPM\SQUAD-PM
npm install
```

### Step 2: Configure AWS Credentials

Make sure your AWS credentials are configured:

```bash
# Check if credentials are set
aws sts get-caller-identity

# If not configured, set them up
aws configure
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `ap-south-1`

### Step 3: Deploy Backend (One-Time)

```bash
# Deploy backend once and generate amplify_outputs.json
npx ampx sandbox --once
```

This will:
- ✅ Create Cognito User Pool
- ✅ Create AppSync GraphQL API
- ✅ Create DynamoDB Tables
- ✅ Create S3 Bucket
- ✅ Generate `amplify_outputs.json`

**Time**: ~5-10 minutes

### Step 4: Upload amplify_outputs.json to Amplify

After the backend is deployed, you'll have a file: `amplify_outputs.json`

**Upload it to your frontend:**

1. Go to AWS Amplify Console
2. Select your SQUAD-PM app
3. Go to **"App settings"** → **"Environment variables"**
4. Or manually add the file to your repository:

```bash
# Copy the generated file to src/
cp amplify_outputs.json src/amplify_outputs.json

# Commit and push
git add src/amplify_outputs.json
git commit -m "Add backend configuration"
git push codecommit main
```

---

## Option 2: Full CI/CD Pipeline (Production)

Set up Amplify to automatically deploy both frontend and backend.

### Step 1: Update amplify.yml

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - npm ci --cache .npm --prefer-offline
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --cache .npm --prefer-offline
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - .next/cache/**/*
      - node_modules/**/*
```

### Step 2: Configure Amplify Service Role

1. Go to **AWS IAM Console**
2. Create a new role: **"AmplifyBackendDeployRole"**
3. Attach policies:
   - `AdministratorAccess-Amplify`
   - Or create custom policy with permissions for:
     - Cognito
     - AppSync
     - DynamoDB
     - S3
     - CloudFormation
     - Lambda
     - IAM (limited)

### Step 3: Attach Role to Amplify App

1. Go to **AWS Amplify Console**
2. Select your SQUAD-PM app
3. Go to **"App settings"** → **"General"**
4. Under **"Service role"**, select the role you created
5. Save changes

### Step 4: Redeploy

```bash
git add amplify.yml
git commit -m "Enable backend deployment in CI/CD"
git push codecommit main
```

Amplify will now deploy both frontend and backend automatically.

---

## 🎯 Recommended Approach

**For now, use Option 1 (Local Sandbox):**

1. Deploy backend locally with `npx ampx sandbox --once`
2. Copy `amplify_outputs.json` to `src/`
3. Push to CodeCommit
4. Frontend will automatically pick up the configuration

**Later, set up Option 2 for production.**

---

## 📝 Quick Commands

```bash
# Navigate to project
cd c:\Users\mail2\Downloads\SQUADPM\SQUAD-PM

# Install dependencies
npm install

# Deploy backend (one-time)
npx ampx sandbox --once

# Copy config to src
cp amplify_outputs.json src/amplify_outputs.json

# Commit and push
git add src/amplify_outputs.json
git commit -m "Add backend configuration"
git push codecommit main
```

---

## ✅ Verification

After deploying the backend and pushing the config:

1. Wait for Amplify to rebuild (2-3 minutes)
2. Visit your app URL
3. Try to sign up / log in
4. Should work without errors!

---

## 🆘 Troubleshooting

### Error: "AWS credentials not configured"

```bash
aws configure
# Enter your AWS Access Key ID, Secret Key, and region (ap-south-1)
```

### Error: "Insufficient permissions"

Your AWS user needs permissions for:
- Cognito
- AppSync
- DynamoDB
- S3
- CloudFormation

### Backend takes too long

The first deployment takes 5-10 minutes. Subsequent deployments are faster.

---

**Last Updated**: October 20, 2025
