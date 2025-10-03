# 🚀 SQUAD PM - Complete Developer Guide

## **For New Developers - Everything You Need to Know**

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [AWS Services & APIs](#aws-services--apis)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Storage Usage](#storage-usage)
7. [Authentication Flow](#authentication-flow)
8. [Real-time Features](#real-time-features)
9. [Code Structure](#code-structure)
10. [Environment Setup](#environment-setup)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 PROJECT OVERVIEW

**SQUAD PM** is a full-stack project management application built with:
- **Frontend:** React 18 + Tailwind CSS
- **Backend:** AWS Amplify (Serverless)
- **Database:** Amazon DynamoDB
- **Storage:** Amazon S3
- **Auth:** AWS Cognito
- **Real-time:** Socket.io + AWS Amplify Subscriptions

**Status:** 92% Complete, Production Ready  
**Deployment:** https://main.d8tv3j2hk2i9r.amplifyapp.com

---

## 🏗️ ARCHITECTURE

### **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  (Tailwind CSS, React Router, React Query)                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├─── AWS Amplify Data Client
                   │    (GraphQL API)
                   │
┌──────────────────┴──────────────────────────────────────────┐
│                   AWS Amplify Backend                        │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Cognito   │  │  DynamoDB   │  │     S3      │         │
│  │    (Auth)   │  │ (Database)  │  │  (Storage)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  AppSync    │  │   Lambda    │  │ CloudWatch  │         │
│  │  (GraphQL)  │  │ (Functions) │  │   (Logs)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

### **Data Flow**

```
User Action → React Component → Amplify Data Service → 
AWS AppSync → DynamoDB → Response → React Query Cache → UI Update
```

---

## ☁️ AWS SERVICES & APIs

### **1. AWS Cognito (Authentication)**

**Purpose:** User authentication and management

**API Endpoints:**
```javascript
// Sign Up
import { signUp } from 'aws-amplify/auth';
await signUp({
  username: email,
  password,
  options: {
    userAttributes: {
      email,
      given_name: firstName,
      family_name: lastName,
    }
  }
});

// Sign In
import { signIn } from 'aws-amplify/auth';
await signIn({ username: email, password });

// Sign Out
import { signOut } from 'aws-amplify/auth';
await signOut();

// Get Current User
import { getCurrentUser } from 'aws-amplify/auth';
const user = await getCurrentUser();

// Confirm Sign Up
import { confirmSignUp } from 'aws-amplify/auth';
await confirmSignUp({ username: email, confirmationCode: code });
```

**Configuration:**
- Region: `ap-south-1`
- User Pool: Auto-created by Amplify
- Password Policy: Min 8 chars, requires uppercase, lowercase, number

---

### **2. Amazon DynamoDB (Database)**

**Purpose:** NoSQL database for all application data

**Tables (Auto-created by Amplify):**
- `UserProfile`
- `Project`
- `Task`
- `ProjectMember`
- `Comment`
- `Attachment`
- `Message`
- `Channel`
- `Notification`
- `ActivityLog`
- `TimeEntry`

**API Usage:**
```javascript
import { generateClient } from 'aws-amplify/data';
const client = generateClient();

// Create
const { data, errors } = await client.models.Project.create({
  name: "New Project",
  description: "Project description",
  status: "PLANNING"
});

// List
const { data: projects } = await client.models.Project.list();

// Get by ID
const { data: project } = await client.models.Project.get({ id: projectId });

// Update
const { data: updated } = await client.models.Project.update({
  id: projectId,
  status: "IN_PROGRESS"
});

// Delete
await client.models.Project.delete({ id: projectId });

// Filter
const { data: tasks } = await client.models.Task.list({
  filter: { projectId: { eq: projectId } }
});
```

**Indexes:**
- Primary Key: `id` (auto-generated UUID)
- GSI: Project-based queries, User-based queries

---

### **3. Amazon S3 (File Storage)**

**Purpose:** Store user-uploaded files and attachments

**Bucket Structure:**
```
squad-pm-files/
├── files/
│   ├── {userId}/
│   │   ├── {fileName}
│   │   └── ...
├── avatars/
│   └── {userId}.jpg
└── attachments/
    └── {taskId}/
        └── {fileName}
```

**API Usage:**
```javascript
import { uploadData, getUrl, list, remove } from 'aws-amplify/storage';

// Upload File
const result = await uploadData({
  key: `files/${userId}/${file.name}`,
  data: file,
  options: {
    contentType: file.type
  }
}).result;

// Get File URL
const url = await getUrl({
  key: `files/${userId}/${fileName}`,
  options: {
    expiresIn: 3600 // 1 hour
  }
});

// List Files
const { items } = await list({
  prefix: `files/${userId}/`
});

// Delete File
await remove({ key: `files/${userId}/${fileName}` });
```

**Storage Limits:**
- Max file size: 100MB per file
- Allowed types: Images, PDFs, Documents, Archives
- Total storage: Unlimited (pay-as-you-go)

---

### **4. AWS AppSync (GraphQL API)**

**Purpose:** Auto-generated GraphQL API for DynamoDB

**Endpoint:** Auto-configured by Amplify

**Schema Example:**
```graphql
type Project @model @auth(rules: [{allow: public}]) {
  id: ID!
  name: String!
  description: String
  status: ProjectStatus!
  priority: Priority
  startDate: AWSDate
  endDate: AWSDate
  budget: Float
  color: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Task @model @auth(rules: [{allow: public}]) {
  id: ID!
  title: String!
  description: String
  status: TaskStatus!
  priority: Priority!
  projectId: ID!
  assignedToId: ID
  createdById: ID
  dueDate: AWSDate
  estimatedHours: Float
  tags: [String]
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

---

## 🗄️ DATABASE SCHEMA

### **UserProfile**
```typescript
{
  id: string;              // Auto-generated
  email: string;           // Unique
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MEMBER';
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

### **Project**
```typescript
{
  id: string;
  name: string;
  description?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: string;
  endDate?: string;
  budget?: number;
  color: string;           // Hex color
  createdAt: string;
  updatedAt: string;
}
```

### **Task**
```typescript
{
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;       // Foreign key
  assignedToId?: string;   // Foreign key to UserProfile
  createdById?: string;    // Foreign key to UserProfile
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### **Message**
```typescript
{
  id: string;
  content: string;
  userId: string;          // Foreign key
  channelId: string;       // Foreign key
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### **Notification**
```typescript
{
  id: string;
  userId: string;          // Foreign key
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 📡 API REFERENCE

### **Amplify Data Service**

**Location:** `client/src/services/amplifyDataService.js`

#### **Project Service**

```javascript
import amplifyDataService from '../services/amplifyDataService';

// Create Project
const result = await amplifyDataService.projects.create({
  name: "Project Name",
  description: "Description",
  status: "PLANNING",
  priority: "MEDIUM",
  color: "#3B82F6"
});

// List Projects
const result = await amplifyDataService.projects.list();

// Get Project
const result = await amplifyDataService.projects.get(projectId);

// Update Project
const result = await amplifyDataService.projects.update(projectId, {
  status: "IN_PROGRESS"
});

// Delete Project
const result = await amplifyDataService.projects.delete(projectId);
```

#### **Task Service**

```javascript
// Create Task
const result = await amplifyDataService.tasks.create({
  title: "Task Title",
  description: "Description",
  status: "TODO",
  priority: "HIGH",
  projectId: "project-id",
  dueDate: "2024-12-31"
});

// List Tasks (with filter)
const result = await amplifyDataService.tasks.list({
  projectId: "project-id"
});

// Update Task
const result = await amplifyDataService.tasks.update(taskId, {
  status: "DONE"
});
```

#### **Dashboard Service**

```javascript
// Get Statistics
const result = await amplifyDataService.dashboard.getStats();
// Returns: {
//   totalProjects, activeProjects, totalTasks,
//   completedTasks, completionRate, overdueTasks
// }

// Get Recent Activity
const result = await amplifyDataService.dashboard.getRecentActivity();
```

#### **Chat Service**

```javascript
// Send Message
const result = await amplifyDataService.chat.sendMessage({
  content: "Hello!",
  userId: "user-id",
  channelId: "channel-id"
});

// Get Messages
const result = await amplifyDataService.chat.getMessages(channelId);

// Subscribe to Messages (Real-time)
const subscription = amplifyDataService.chat.subscribeToMessages(
  channelId,
  (newMessage) => {
    console.log("New message:", newMessage);
  }
);
// Cleanup: subscription.unsubscribe();
```

#### **Notification Service**

```javascript
// List Notifications
const result = await amplifyDataService.notifications.list(userId);

// Mark as Read
const result = await amplifyDataService.notifications.markAsRead(notificationId);

// Mark All as Read
const result = await amplifyDataService.notifications.markAllAsRead(userId);
```

---

## 💾 STORAGE USAGE

### **DynamoDB Storage**

**Current Usage:** ~0.5 GB (estimated for 1000 users)

**Cost Estimation:**
- On-Demand Pricing
- Write: $1.25 per million writes
- Read: $0.25 per million reads
- Storage: $0.25 per GB/month

**Optimization:**
- Use pagination for large lists
- Implement caching with React Query
- Archive old data periodically

### **S3 Storage**

**Current Usage:** ~0 GB (no files uploaded yet)

**Cost Estimation:**
- Storage: $0.023 per GB/month
- GET requests: $0.0004 per 1000 requests
- PUT requests: $0.005 per 1000 requests

**Limits:**
- Max file size: 100MB
- Recommended: Compress images before upload
- Use CloudFront CDN for frequently accessed files

### **Cognito**

**Current Usage:** 0 active users

**Free Tier:**
- 50,000 MAUs (Monthly Active Users) free
- After: $0.0055 per MAU

---

## 🔐 AUTHENTICATION FLOW

```
1. User Registration
   ↓
2. Email Verification (6-digit code)
   ↓
3. Cognito User Created
   ↓
4. UserProfile Created in DynamoDB
   ↓
5. Login with Email/Password
   ↓
6. JWT Token Issued
   ↓
7. Token Stored in Session
   ↓
8. Authenticated Requests
```

**Token Expiration:** 1 hour  
**Refresh Token:** 30 days  
**Session Management:** Automatic refresh

---

## ⚡ REAL-TIME FEATURES

### **Socket.io (Chat & Presence)**

**Server:** Not deployed (optional)  
**Alternative:** AWS Amplify Subscriptions

### **Amplify Subscriptions**

```javascript
// Subscribe to new messages
const subscription = client.models.Message.onCreate().subscribe({
  next: (data) => {
    console.log("New message:", data);
  },
  error: (error) => console.error(error)
});

// Cleanup
subscription.unsubscribe();
```

### **WebRTC (Calls)**

**Technology:** Simple-peer + WebRTC  
**Signaling:** Socket.io  
**Features:** Audio, Video, Screen Sharing

---

## 📁 CODE STRUCTURE

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React contexts (Auth, Theme, etc.)
│   ├── pages/               # Page components
│   ├── services/
│   │   └── amplifyDataService.js  # ⭐ Main API service
│   ├── utils/               # Helper functions
│   ├── App.js               # Main app component
│   └── index.js             # Entry point
├── amplify/
│   └── data/
│       └── resource.ts      # ⭐ Database schema
└── amplify_outputs.json     # ⭐ AWS configuration

server/                      # ❌ Deprecated (not used)
```

**Key Files:**
- `amplifyDataService.js` - All AWS API calls
- `resource.ts` - Database schema definitions
- `amplify_outputs.json` - AWS credentials (auto-generated)

---

## 🛠️ ENVIRONMENT SETUP

### **Prerequisites**
```bash
Node.js >= 18
npm >= 9
AWS Account
Git
```

### **Installation**
```bash
# Clone repository
git clone https://github.com/Abhinandangithub01/SQUAD-PM.git
cd ProjectManagement

# Install dependencies
cd client
npm install

# Start development server
npm start
```

### **Environment Variables**
Not required! AWS configuration is in `amplify_outputs.json`

---

## 🚀 DEPLOYMENT

### **Amplify Hosting**

**Automatic Deployment:**
1. Push to `main` branch
2. AWS Amplify detects changes
3. Runs build: `npm run build`
4. Deploys to: https://main.d8tv3j2hk2i9r.amplifyapp.com

**Build Configuration:** `amplify.yml`

---

## 🐛 TROUBLESHOOTING

### **Common Issues**

**1. "Module not found" errors**
- Run: `npm install`
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

**2. Authentication errors**
- Check `amplify_outputs.json` exists
- Verify AWS region: `ap-south-1`

**3. Database errors**
- Check Amplify sandbox is running
- Verify internet connection

**4. Build failures**
- Check `amplify.yml` configuration
- Verify all dependencies in `package.json`

---

## 📊 MONITORING

**AWS CloudWatch:**
- Lambda function logs
- API Gateway logs
- Error tracking

**React Query DevTools:**
- Cache inspection
- Query status
- Network requests

---

## 🎯 NEXT STEPS FOR NEW DEVELOPERS

1. ✅ Read this guide
2. ✅ Set up local environment
3. ✅ Review `amplifyDataService.js`
4. ✅ Understand database schema in `resource.ts`
5. ✅ Test authentication flow
6. ✅ Create a test project and task
7. ✅ Review React components
8. ✅ Check AWS Console for resources

---

**Last Updated:** 2025-10-03  
**Version:** 1.0  
**Status:** Production Ready  
**Completion:** 92%
