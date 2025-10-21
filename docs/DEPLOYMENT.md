# 🚀 Deployment Guide

## Deployment Options

SQUAD PM supports three deployment strategies:

1. **Local Sandbox** - Development and testing
2. **Amplify Sandbox (Once)** - Quick backend deployment
3. **Full CI/CD Pipeline** - Production deployment

---

## Option 1: Local Sandbox (Development)

**Use Case**: Active development with hot-reload

### Setup

```bash
# Terminal 1: Start Amplify sandbox
npx ampx sandbox

# Terminal 2: Start Next.js dev server
npm run dev
```

### What Happens

1. **Amplify Sandbox**:
   - Watches `amplify/` folder for changes
   - Auto-deploys backend on file save
   - Generates `amplify_outputs.json`
   - Creates CloudFormation stack

2. **Next.js Dev Server**:
   - Hot-reload on file changes
   - Runs on `http://localhost:3000`
   - Uses `amplify_outputs.json` for backend config

### Making Changes

```typescript
// 1. Edit amplify/data/resource.ts
Organization: a.model({
  name: a.string().required(),
  industry: a.string(), // NEW FIELD
})

// 2. Save file
// 3. Amplify sandbox detects change
// 4. Deploys update (~30-60 seconds)
// 5. amplify_outputs.json is updated
// 6. Frontend can now use new field
```

### Stopping Sandbox

```bash
# Press Ctrl+C in sandbox terminal
# Resources remain in AWS
# Can restart anytime with: npx ampx sandbox
```

---

## Option 2: Amplify Sandbox (Once)

**Use Case**: Deploy backend once, no hot-reload

### Deploy Backend

```bash
# Deploy backend and exit
npx ampx sandbox --once

# Wait for deployment (~5-10 minutes)
# Output: amplify_outputs.json created
```

### What Gets Created

**AWS Resources**:
- Cognito User Pool (Authentication)
- AppSync GraphQL API
- DynamoDB Tables (all models)
- S3 Bucket (file storage)
- Lambda Functions (resolvers)
- CloudFormation Stack

**Local Files**:
- `amplify_outputs.json` (backend config)
- `.amplify/` folder (deployment artifacts)

### Copy Config to Frontend

```bash
# Copy to src for deployment
cp amplify_outputs.json src/amplify_outputs.json

# Commit to git
git add src/amplify_outputs.json amplify_outputs.json
git commit -m "Add backend configuration"
git push
```

### Stack Information

```bash
# View your stack
aws cloudformation describe-stacks \
  --stack-name amplify-squadpm-<identifier>-sandbox-<id> \
  --region ap-south-1

# Example:
# amplify-squadpm-mail2-sandbox-2badabd131
```

---

## Option 3: Full CI/CD Pipeline (Production)

**Use Case**: Automated production deployments

### Prerequisites

1. **AWS Account** with permissions for:
   - Amplify
   - Cognito
   - AppSync
   - DynamoDB
   - S3
   - CloudFormation
   - IAM

2. **Git Repository** (AWS CodeCommit, GitHub, GitLab, Bitbucket)

3. **IAM Role** for Amplify

### Step 1: Create IAM Role

**AWS Console** → IAM → Roles → Create Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "amplify.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Attach Policies**:
- `AdministratorAccess-Amplify`
- Or create custom policy with specific permissions

**Role Name**: `AmplifyBackendDeployRole`

### Step 2: Update amplify.yml

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
      - .npm/**/*
```

### Step 3: Configure Amplify App

**AWS Console** → Amplify → Create New App

1. **Connect Repository**:
   - Choose: CodeCommit / GitHub / GitLab / Bitbucket
   - Select repository: `SQUAD-PM`
   - Select branch: `main`

2. **Build Settings**:
   - Build spec: Use `amplify.yml` from repo
   - Service Role: Select `AmplifyBackendDeployRole`

3. **Environment Variables** (if needed):
   ```
   NEXT_PUBLIC_API_URL=<your-api-url>
   ```

4. **Advanced Settings**:
   - Enable: Auto-deploy on push
   - Enable: Pull request previews (optional)

### Step 4: Deploy

```bash
# Push to trigger deployment
git push origin main

# Or push to CodeCommit
git push codecommit main
```

### Deployment Process

```
1. Code Push
   ↓
2. Amplify Detects Change
   ↓
3. Backend Phase
   - Install dependencies
   - Deploy Amplify backend
   - Generate amplify_outputs.json
   ↓
4. Frontend Phase
   - Install dependencies
   - Build Next.js app
   - Generate static pages
   ↓
5. Deploy Phase
   - Upload to Amplify CDN
   - Update CloudFront
   ↓
6. Live! 🎉
```

### Monitoring Deployment

**Amplify Console** → Your App → Build History

- View real-time logs
- See each phase progress
- Debug build errors

---

## Environment Management

### Multiple Environments

**Development**:
```bash
npx ampx sandbox --identifier dev
```

**Staging**:
```bash
npx ampx sandbox --identifier staging
```

**Production**:
```bash
# Use CI/CD pipeline
# Separate Amplify app per environment
```

### Environment-Specific Config

```typescript
// src/config/environment.ts
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
  },
  production: {
    apiUrl: 'https://main.d197qrniqbiwrp.amplifyapp.com',
  },
};

export default config[process.env.NODE_ENV];
```

---

## Custom Domain Setup

### Step 1: Add Domain in Amplify

**Amplify Console** → App Settings → Domain Management

1. Click "Add domain"
2. Enter your domain: `squadpm.com`
3. Configure subdomains:
   - `www.squadpm.com` → main branch
   - `app.squadpm.com` → main branch

### Step 2: Update DNS

**Your DNS Provider** (Route 53, Cloudflare, etc.)

Add CNAME records provided by Amplify:
```
Type: CNAME
Name: www
Value: <amplify-provided-value>
```

### Step 3: SSL Certificate

- Amplify automatically provisions SSL certificate
- Uses AWS Certificate Manager
- Auto-renewal enabled

---

## Rollback Strategy

### Rollback Frontend

**Amplify Console** → Build History

1. Find previous successful build
2. Click "Redeploy this version"
3. Confirm

### Rollback Backend

```bash
# List CloudFormation stacks
aws cloudformation list-stacks --region ap-south-1

# Rollback to previous version
aws cloudformation rollback-stack \
  --stack-name amplify-squadpm-<identifier>-sandbox-<id> \
  --region ap-south-1
```

**Warning**: Backend rollback may cause data loss

---

## Monitoring & Logging

### CloudWatch Logs

**View Logs**:
```bash
# AppSync logs
aws logs tail /aws/appsync/apis/<api-id> --follow

# Lambda logs
aws logs tail /aws/lambda/<function-name> --follow
```

### Amplify Metrics

**Amplify Console** → Monitoring

- Request count
- Error rate
- Latency
- Build success rate

### Custom Monitoring

```typescript
// Add to your app
import { Logger } from 'aws-amplify/utils';

const logger = new Logger('MyApp');

logger.info('User logged in', { userId: user.id });
logger.error('API call failed', { error });
```

---

## Cost Optimization

### Development

```bash
# Stop sandbox when not in use
# Ctrl+C in sandbox terminal

# Delete sandbox stack
npx ampx sandbox delete
```

### Production

**Optimize**:
- Use CloudFront caching
- Enable DynamoDB auto-scaling
- Set S3 lifecycle policies
- Use Lambda reserved concurrency

**Monitor Costs**:
- AWS Cost Explorer
- Set up billing alerts
- Tag resources for tracking

---

## Troubleshooting Deployments

### Build Fails: "Amplify has not been configured"

**Cause**: Missing `amplify_outputs.json`

**Fix**:
```bash
npx ampx sandbox --once
cp amplify_outputs.json src/
git add src/amplify_outputs.json
git commit -m "Add backend config"
git push
```

### Build Fails: ESLint Errors

**Fix**: Run locally first
```bash
npm run lint
npm run build
```

### Build Fails: TypeScript Errors

**Fix**: Check `tsconfig.json`
```json
{
  "compilerOptions": {
    "strict": false,  // Temporarily disable for migration
  }
}
```

### Backend Deploy Fails: Insufficient Permissions

**Fix**: Update IAM role permissions
- Add `AdministratorAccess-Amplify`
- Or add specific service permissions

### Slow Build Times

**Optimize**:
```yaml
# amplify.yml
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --cache .npm --prefer-offline  # Use cache
  cache:
    paths:
      - node_modules/**/*
      - .npm/**/*
      - .next/cache/**/*
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run tests locally
- [ ] Check for TypeScript errors
- [ ] Run ESLint
- [ ] Test build locally
- [ ] Review environment variables
- [ ] Backup database (if needed)

### Deployment

- [ ] Create feature branch
- [ ] Test in development environment
- [ ] Create pull request
- [ ] Code review
- [ ] Merge to main
- [ ] Monitor deployment
- [ ] Verify in production

### Post-Deployment

- [ ] Test critical user flows
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Verify database migrations
- [ ] Update documentation

---

## Emergency Procedures

### Rollback

```bash
# 1. Identify last good build
# 2. Redeploy from Amplify Console
# 3. Verify functionality
# 4. Investigate issue
```

### Database Corruption

```bash
# 1. Stop all writes
# 2. Restore from backup (if available)
# 3. Or redeploy backend
npx ampx sandbox --once
```

### Service Outage

```bash
# Check AWS Service Health
# https://status.aws.amazon.com/

# Check your resources
aws cloudformation describe-stacks --region ap-south-1
```

---

**Last Updated**: October 21, 2025
