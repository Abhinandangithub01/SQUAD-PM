# AWS Backend Implementation Guide

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    AWS Amplify Hosting                   │
│            React Frontend (Already Deployed)             │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     AWS Cognito                          │
│         User Authentication & Authorization              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   API Gateway / AppSync                  │
│                  REST/GraphQL API Layer                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    AWS Lambda Functions                  │
│              Business Logic & Data Processing            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Amazon RDS (PostgreSQL) / DynamoDB          │
│                      Data Storage                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Step-by-Step Implementation

### Step 1: Initialize Amplify in Your Project

```bash
cd client
amplify init
```

**Configuration:**
- Project name: `projectmanagementsystem`
- Environment: `prod`
- Default editor: `Visual Studio Code`
- App type: `javascript`
- Framework: `react`
- Source directory: `src`
- Distribution directory: `build`
- Build command: `npm run build`
- Start command: `npm start`

### Step 2: Add Authentication (AWS Cognito)

```bash
amplify add auth
```

**Configuration:**
- Do you want to use the default authentication? `Default configuration with Social Provider`
- How do you want users to sign in? `Email`
- Do you want to configure advanced settings? `Yes`
- What attributes are required? `Email, Name`
- Do you want to enable social providers? `No`

### Step 3: Add API (GraphQL with AppSync)

```bash
amplify add api
```

**Configuration:**
- Please select from one of the below services: `GraphQL`
- Provide API name: `projectmanagementapi`
- Choose authorization type: `Amazon Cognito User Pool`
- Do you want to configure advanced settings? `Yes`
- Configure additional auth types? `Yes` (Add API Key for testing)
- Do you have an annotated GraphQL schema? `No`
- Do you want a guided schema creation? `Yes`
- What best describes your project: `Single object with fields`
- Do you want to edit the schema now? `Yes`

### Step 4: Add Storage (S3 for file uploads)

```bash
amplify add storage
```

**Configuration:**
- Please select from one of the below services: `Content (Images, audio, video, etc.)`
- Provide a friendly name: `projectfiles`
- Provide bucket name: `projectmanagementsystem`
- Who should have access: `Auth users only`
- What kind of access: `create/update, read, delete`

### Step 5: Push to AWS

```bash
amplify push
```

This will:
- Create all AWS resources
- Generate API code
- Update aws-exports.js

---

## 🗄️ Database Schema (for RDS PostgreSQL)

```sql
-- Users Table (Managed by Cognito, but we store additional info)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    owner_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(50) DEFAULT 'medium',
    due_date TIMESTAMP,
    created_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    column_id UUID,
    position INTEGER,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments Table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log Table
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    task_id UUID REFERENCES tasks(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_name VARCHAR(255),
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attachments Table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Members Table
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Channels Table (for chat)
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id),
    type VARCHAR(50) DEFAULT 'project',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_project_id ON activity_log(project_id);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
```

---

## 🔐 Environment Variables

Create `.env` file in client folder:

```env
# AWS Amplify
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=your-user-pool-id
REACT_APP_USER_POOL_CLIENT_ID=your-client-id
REACT_APP_API_ENDPOINT=your-api-endpoint

# API Gateway
REACT_APP_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod

# S3 Bucket
REACT_APP_S3_BUCKET=your-bucket-name
```

---

## 📦 Required NPM Packages

```bash
cd client
npm install aws-amplify @aws-amplify/ui-react amazon-cognito-identity-js
```

---

## 🔧 Amplify Configuration (client/src/aws-exports.js)

This file will be auto-generated after `amplify push`, but here's the structure:

```javascript
const awsmobile = {
    "aws_project_region": "us-east-1",
    "aws_cognito_identity_pool_id": "us-east-1:xxxxx",
    "aws_cognito_region": "us-east-1",
    "aws_user_pools_id": "us-east-1_xxxxx",
    "aws_user_pools_web_client_id": "xxxxx",
    "oauth": {},
    "aws_appsync_graphqlEndpoint": "https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql",
    "aws_appsync_region": "us-east-1",
    "aws_appsync_authenticationType": "AMAZON_COGNITO_USER_POOLS",
    "aws_user_files_s3_bucket": "projectmanagementsystem-xxxxx",
    "aws_user_files_s3_bucket_region": "us-east-1"
};

export default awsmobile;
```

---

## 🚀 Quick Start Commands

```bash
# 1. Install Amplify CLI globally
npm install -g @aws-amplify/cli

# 2. Configure Amplify with your AWS credentials
amplify configure

# 3. Pull existing Amplify project (if already created in console)
amplify pull --appId d1sl3pki9s1332 --envName main

# OR initialize new Amplify backend
cd client
amplify init

# 4. Add services
amplify add auth
amplify add api
amplify add storage

# 5. Deploy backend
amplify push

# 6. Install frontend dependencies
npm install aws-amplify @aws-amplify/ui-react

# 7. Start development
npm start
```

---

## 🔄 Alternative: Use Existing Server

If you want to use your existing Express server instead of Lambda:

### Option 1: Deploy Express to AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
cd server
eb init -p node.js project-management-system

# Create environment
eb create production

# Deploy
eb deploy
```

### Option 2: Deploy Express to AWS App Runner

```bash
# Build Docker image
cd server
docker build -t pm-system-api .

# Push to ECR
aws ecr create-repository --repository-name pm-system-api
docker tag pm-system-api:latest your-account.dkr.ecr.us-east-1.amazonaws.com/pm-system-api:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/pm-system-api:latest

# Create App Runner service in AWS Console
```

---

## 📊 Cost Estimation

### AWS Free Tier (First 12 months)
- Cognito: 50,000 MAUs free
- AppSync: 250,000 queries free
- Lambda: 1M requests free/month
- DynamoDB: 25 GB storage free
- S3: 5 GB storage free

### Beyond Free Tier (Estimated)
- **Light usage** (< 1000 users): ~$20-50/month
- **Medium usage** (< 10,000 users): ~$100-200/month
- **Heavy usage** (< 100,000 users): ~$500-1000/month

---

## 🎯 Next Steps

1. **Run `amplify configure`** to set up AWS credentials
2. **Run `amplify pull`** to connect to your existing Amplify app
3. **Add backend services** (auth, API, storage)
4. **Update frontend** to use AWS Amplify
5. **Test authentication flow**
6. **Deploy and monitor**

Would you like me to proceed with any specific implementation?
