# 🚀 Create New AWS Amplify Application

## Step-by-Step Guide

### Step 1: Create New Amplify App

1. **Click "Deploy an app"** button in AWS Amplify Console
   (You're already on the right page!)

2. **Choose deployment method:**
   - Select **"Deploy without Git provider"**
   - OR connect to your GitHub repository

### Step 2: If Using GitHub (Recommended)

1. **Select "GitHub"**
2. **Authorize AWS Amplify** to access your GitHub
3. **Select repository:** `Abhinandangithub01/project-management-system`
4. **Select branch:** `main`
5. **Click "Next"**

### Step 3: Configure Build Settings

Amplify will auto-detect your React app. Use these settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd client
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: client/build
    files:
      - '**/*'
  cache:
    paths:
      - client/node_modules/**/*
```

### Step 4: Add Backend

After app is created:

1. **Go to your new app** in Amplify Console
2. **Click "Backend environments"** tab
3. **Click "Get started"** or **"Create backend"**
4. **Choose "Amplify Studio"**
5. **Click "Launch Studio"**

### Step 5: In Amplify Studio

#### Add Authentication:
1. Click **"Authentication"**
2. Choose **"Email"** as sign-in method
3. Configure:
   - Required attributes: Email, First Name, Last Name
   - Password requirements: Default
   - Email verification: Enabled
4. Click **"Deploy"**

#### Add Data Models:
1. Click **"Data"**
2. Click **"Add model"**
3. Create models:

**UserProfile:**
```
- email (String, required)
- firstName (String, required)
- lastName (String, required)
- role (Enum: ADMIN, MANAGER, MEMBER, VIEWER)
- avatarUrl (String)
```

**Project:**
```
- name (String, required)
- description (String)
- color (String)
- status (Enum: ACTIVE, ARCHIVED, COMPLETED, ON_HOLD)
- startDate (AWSDate)
- endDate (AWSDate)
- ownerId (ID, required)
```

**Task:**
```
- projectId (ID, required)
- title (String, required)
- description (String)
- status (Enum: TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED)
- priority (Enum: LOW, MEDIUM, HIGH, URGENT)
- dueDate (AWSDateTime)
- assignedToId (ID)
- tags (String array)
```

4. **Add relationships:**
   - Project → Tasks (one-to-many)
   - Project → Members (one-to-many)
   - Task → Comments (one-to-many)

5. Click **"Deploy"**

#### Add Storage:
1. Click **"Storage"**
2. Configure:
   - Bucket name: Auto-generated
   - Access: Auth users only
   - Permissions: Read, Write, Delete
3. Click **"Deploy"**

### Step 6: Download Configuration

After deployment completes:

1. **Click "Local setup instructions"**
2. **Download `amplify_outputs.json`**
3. **Place it in:** `client/src/amplify_outputs.json`

### Step 7: Update Frontend Code

**Update `client/src/index.js`:**

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';

// Configure Amplify
Amplify.configure(outputs);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Update `client/src/App.js`:**

```javascript
import { CognitoAuthProvider } from './contexts/CognitoAuthContext';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CognitoAuthProvider>
            <TimeTrackingProvider>
              <DashboardProvider>
                <SocketProvider>
                  <Router>
                    {/* Your routes */}
                  </Router>
                </SocketProvider>
              </DashboardProvider>
            </TimeTrackingProvider>
          </CognitoAuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### Step 8: Test Locally

```bash
cd client
npm start
```

Go to http://localhost:3001/register and create an account!

### Step 9: Deploy to Production

```bash
git add .
git commit -m "Add Amplify backend configuration"
git push origin main
```

Amplify will automatically:
- Detect the changes
- Build your app
- Deploy frontend + backend
- Your app will be live!

---

## 🎯 Alternative: Quick Setup with Existing App

If you want to add backend to your EXISTING Amplify app (d1sl3pki9s1332):

1. **Go to:** https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1sl3pki9s1332
2. **Click "Backend environments"**
3. **Click "Create backend"**
4. **Follow steps 5-9 above**

---

## ✅ What You'll Get

After setup:
- ✅ AWS Cognito authentication
- ✅ GraphQL API with AppSync
- ✅ DynamoDB database
- ✅ S3 file storage
- ✅ Real-time subscriptions
- ✅ Automatic scaling
- ✅ Production-ready infrastructure

---

## 💰 Cost

**Free Tier (12 months):**
- Everything FREE for first year with reasonable usage

**After Free Tier:**
- $5-50/month depending on usage

---

## 🚀 Recommended: Use Existing App

Since you already have app `d1sl3pki9s1332` deployed, I recommend:

1. **Don't create new app**
2. **Add backend to existing app**
3. **Go to:** https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1sl3pki9s1332
4. **Click "Backend environments" → "Create backend"**
5. **Follow the Studio setup**

This keeps everything in one place!

---

**Ready to proceed? Let me know if you want to:**
- A) Add backend to existing app (d1sl3pki9s1332) ← RECOMMENDED
- B) Create completely new Amplify app
