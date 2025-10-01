# 🔐 AWS Credentials Setup - Step by Step

## Issue
`ampx sandbox` requires AWS credentials to deploy backend resources.

---

## ✅ Solution: Configure AWS Credentials

### Option 1: Use Amplify Studio (Easiest - No CLI needed)

1. **Go to AWS Amplify Console:**
   https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1sl3pki9s1332

2. **Click "Backend environments"**

3. **Click "Launch Studio"** or **"Create backend"**

4. **In Studio:**
   - Add Authentication (Cognito)
   - Add Data models (Projects, Tasks, etc.)
   - Add Storage (S3)
   - Click "Deploy"

5. **Download configuration:**
   - After deployment, download `amplify_outputs.json`
   - Place it in `client/src/`

**This is the EASIEST way - no command line needed!**

---

### Option 2: Configure AWS CLI (For Command Line)

#### Step 1: Get AWS Access Keys

1. **Go to AWS IAM Console:**
   https://console.aws.amazon.com/iam/home#/users

2. **Click "Create user"** or select existing user

3. **User name:** `amplify-admin`

4. **Attach policies:**
   - `AdministratorAccess-Amplify` (or AdministratorAccess for full access)

5. **Create access key:**
   - Go to "Security credentials" tab
   - Click "Create access key"
   - Choose "Command Line Interface (CLI)"
   - Download the `.csv` file or copy:
     - Access Key ID: `AKIA...`
     - Secret Access Key: `wJalrXUtn...`

#### Step 2: Configure Amplify

```bash
npx ampx configure profile
```

Follow the prompts:
- Profile name: `default`
- Access Key ID: [paste your key]
- Secret Access Key: [paste your secret]
- Region: `us-east-1`

#### Step 3: Deploy Sandbox

```bash
cd client
npx ampx sandbox
```

---

### Option 3: Use AWS Console Directly (Manual Setup)

If CLI is problematic, set up services manually:

#### 1. Create Cognito User Pool

1. Go to: https://console.aws.amazon.com/cognito/home?region=us-east-1
2. Click "Create user pool"
3. Configure:
   - Sign-in: Email
   - Password: Default settings
   - MFA: Optional
   - Email: Cognito email
4. Create app client
5. Note: User Pool ID and Client ID

#### 2. Create AppSync API

1. Go to: https://console.aws.amazon.com/appsync/home?region=us-east-1
2. Click "Create API"
3. Choose "Build from scratch"
4. API name: `project-management-api`
5. Authorization: Amazon Cognito User Pool
6. Select the user pool created above

#### 3. Create DynamoDB Tables

1. Go to: https://console.aws.amazon.com/dynamodb/home?region=us-east-1
2. Create tables:
   - `UserProfile`
   - `Project`
   - `Task`
   - `Comment`
   - `Message`
   - `Channel`
   - `ActivityLog`
   - `Notification`

#### 4. Create S3 Bucket

1. Go to: https://s3.console.aws.amazon.com/s3/home?region=us-east-1
2. Click "Create bucket"
3. Name: `project-management-files-prod`
4. Region: us-east-1
5. Block public access: Keep enabled
6. Create bucket

#### 5. Create Configuration File

Create `client/src/aws-config.js`:

```javascript
export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_XXXXXXXXX', // From Cognito
      userPoolClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // From Cognito
      region: 'us-east-1'
    }
  },
  API: {
    GraphQL: {
      endpoint: 'https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql', // From AppSync
      region: 'us-east-1',
      defaultAuthMode: 'userPool'
    }
  },
  Storage: {
    S3: {
      bucket: 'project-management-files-prod', // Your S3 bucket
      region: 'us-east-1'
    }
  }
};
```

---

## 🎯 Recommended Approach

**For Production: Use Option 1 (Amplify Studio)**

Why?
- ✅ No command line issues
- ✅ Visual interface
- ✅ Automatic configuration
- ✅ One-click deployment
- ✅ Integrated with your Amplify app

**Steps:**
1. Go to Amplify Console
2. Click your app (d1sl3pki9s1332)
3. Click "Backend environments"
4. Click "Launch Studio"
5. Add Auth, Data, Storage
6. Deploy
7. Download `amplify_outputs.json`
8. Place in `client/src/`
9. Done!

---

## 🚀 After Configuration

Once you have `amplify_outputs.json` or `aws-config.js`:

**Update `client/src/index.js`:**

```javascript
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';
// OR
// import { awsConfig } from './aws-config';

Amplify.configure(outputs);
// OR
// Amplify.configure(awsConfig);
```

**Update `client/src/App.js`:**

```javascript
import { CognitoAuthProvider } from './contexts/CognitoAuthContext';

// Replace AuthProvider with CognitoAuthProvider
```

**Test:**
```bash
cd client
npm start
```

Go to http://localhost:3001/register and create an account!

---

## ✅ Success Criteria

Your AWS backend is working when:
- ✅ You can register a new user
- ✅ You receive verification email
- ✅ You can login
- ✅ Dashboard loads
- ✅ You can create projects
- ✅ Data persists after refresh

---

**Choose Option 1 (Amplify Studio) for the easiest setup! 🎉**
