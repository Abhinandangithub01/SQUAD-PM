# 🚀 SQUAD PM - Complete Developer Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [AWS Services Configuration](#aws-services-configuration)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [Development Workflow](#development-workflow)
7. [Deployment Guide](#deployment-guide)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Tech Stack

**Frontend**:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- React Query (TanStack Query)
- Zustand (State Management)

**Backend (AWS Amplify Gen 2)**:
- Amazon Cognito (Authentication)
- AWS AppSync (GraphQL API)
- Amazon DynamoDB (Database)
- Amazon S3 (File Storage)
- AWS Lambda (Serverless Functions)

**Deployment**:
- AWS Amplify Hosting (Frontend)
- AWS CloudFormation (Infrastructure)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │   Contexts   │      │
│  │  /app/*      │  │  /components │  │  /contexts   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Amplify Client
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    AWS Amplify Gen 2                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              amplify_outputs.json                     │  │
│  │         (Generated Backend Configuration)             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼───────┐ ┌─────▼──────┐ ┌──────▼───────┐
│   Cognito     │ │  AppSync   │ │  DynamoDB    │
│ (Auth Users)  │ │ (GraphQL)  │ │  (Tables)    │
└───────────────┘ └────────────┘ └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                  ┌──────▼───────┐
                  │      S3      │
                  │ (File Store) │
                  └──────────────┘
```

---

## AWS Services Configuration

### 1. Amazon Cognito (Authentication)

**Location**: Automatically configured by Amplify
**Purpose**: User authentication and authorization

#### What Cognito Provides:
- User registration and login
- Email verification with OTP
- Password reset functionality
- JWT tokens for API authentication
- User pool management

#### How It's Configured:

**File**: `amplify/auth/resource.ts`
```typescript
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true, // Email-based authentication
  },
  userAttributes: {
    email: {
      required: true,
      mutable: false,
    },
    // Custom attributes can be added here
  },
});
```

#### Cognito User Pool Details:
- **Region**: ap-south-1 (Mumbai)
- **Email Verification**: Required
- **Password Policy**: 
  - Minimum 8 characters
  - Requires uppercase, lowercase, numbers
- **MFA**: Optional (can be enabled)

#### How Users Are Stored:
```
Cognito User Pool
├── User ID (sub): unique identifier
├── Email: user@example.com
├── Email Verified: true/false
├── Custom Attributes:
│   ├── given_name (firstName)
│   ├── family_name (lastName)
│   └── custom:companyName
└── Status: CONFIRMED | UNCONFIRMED | FORCE_CHANGE_PASSWORD
```

---

### 2. AWS AppSync (GraphQL API)

**Location**: Automatically created by Amplify
**Purpose**: GraphQL API for data operations

#### What AppSync Provides:
- Type-safe GraphQL API
- Real-time subscriptions
- Automatic CRUD operations
- Row-level security
- Conflict resolution

#### How It's Configured:

**File**: `amplify/data/resource.ts`
```typescript
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Organization: a.model({
    name: a.string().required(),
    // ... fields
  }).authorization((allow) => [
    allow.owner(),
    allow.authenticated().to(['read']),
  ]),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
```

#### AppSync Endpoint:
```
https://g6bhq2ftizeddkccanulkzwfecy.appsync-api.ap-south-1.amazonaws.com/graphql
```

#### Authorization Rules:
1. **Owner-based**: User can only access their own data
2. **Authenticated**: Any logged-in user can read
3. **Custom**: Define specific access patterns

---

### 3. Amazon DynamoDB (Database)

**Location**: Automatically created by Amplify
**Purpose**: NoSQL database for all application data

#### How Tables Are Created:

When you run `npx ampx sandbox`, Amplify:
1. Reads your schema from `amplify/data/resource.ts`
2. Generates DynamoDB table definitions
3. Creates tables via CloudFormation
4. Sets up indexes and relationships

#### Table Naming Convention:
```
<ModelName>-<StackId>-<Environment>

Example:
Organization-2badabd131-main
User-2badabd131-main
Project-2badabd131-main
```

#### Table Structure:

Each model becomes a DynamoDB table with:
- **Primary Key**: `id` (auto-generated UUID)
- **Sort Key**: None (single-table design)
- **GSI (Global Secondary Indexes)**: For relationships
- **Attributes**: All fields from your schema

**Example: Organization Table**
```
{
  "id": "uuid-123",
  "name": "Acme Corp",
  "slug": "acme-corp",
  "ownerId": "cognito-user-id",
  "plan": "PROFESSIONAL",
  "createdAt": "2025-10-21T00:00:00Z",
  "updatedAt": "2025-10-21T00:00:00Z",
  "__typename": "Organization"
}
```

#### How Data Is Stored:

**Single-Table Design**:
- Each model type has its own table
- Relationships via foreign keys (IDs)
- Automatic timestamps (createdAt, updatedAt)
- Owner field for authorization

---

### 4. Amazon S3 (File Storage)

**Location**: Automatically created by Amplify
**Purpose**: Store user-uploaded files (attachments, avatars, etc.)

#### Bucket Structure:
```
amplify-squadpm-<env>-<id>
├── public/          (publicly accessible)
├── protected/       (user-specific, readable by all)
└── private/         (user-specific, private)
```

#### How Files Are Stored:
```typescript
import { uploadData } from 'aws-amplify/storage';

const result = await uploadData({
  key: `attachments/${taskId}/${filename}`,
  data: file,
  options: {
    accessLevel: 'protected',
  }
});
```

---

## Project Structure

```
SQUAD-PM/
├── amplify/                    # AWS Amplify Backend
│   ├── auth/
│   │   └── resource.ts        # Cognito configuration
│   ├── data/
│   │   └── resource.ts        # AppSync + DynamoDB schema
│   ├── backend.ts             # Backend entry point
│   └── tsconfig.json
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page (redirects)
│   │   ├── globals.css        # Global styles
│   │   ├── auth/              # Authentication pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── verify-email/
│   │   │       └── page.tsx
│   │   └── dashboard/         # Main app pages
│   │       └── page.tsx
│   │
│   ├── components/            # React components
│   │   ├── ConfigureAmplify.tsx  # Amplify setup
│   │   ├── Providers.tsx      # Context providers
│   │   └── ui/                # UI components
│   │
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── ThemeContext.tsx   # Theme state
│   │
│   ├── lib/                   # Utilities
│   │   └── amplify.ts         # Amplify client config
│   │
│   └── types/                 # TypeScript types
│       └── index.ts
│
├── amplify_outputs.json       # Generated backend config
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
└── package.json               # Dependencies
```

### Key Files Explained

#### 1. `amplify/data/resource.ts`
**Purpose**: Define your database schema and API

```typescript
// This file defines:
// - DynamoDB tables
// - GraphQL schema
// - Authorization rules
// - Relationships between models

const schema = a.schema({
  Organization: a.model({
    name: a.string().required(),
    members: a.hasMany('OrganizationMember', 'organizationId'),
  }),
});
```

**When you change this file**:
1. Save the file
2. Amplify sandbox auto-deploys changes
3. New tables/fields are created
4. `amplify_outputs.json` is regenerated

#### 2. `amplify_outputs.json`
**Purpose**: Backend configuration for frontend

```json
{
  "auth": {
    "user_pool_id": "ap-south-1_xxxxx",
    "user_pool_client_id": "xxxxx",
    "identity_pool_id": "ap-south-1:xxxxx"
  },
  "data": {
    "url": "https://xxxxx.appsync-api.ap-south-1.amazonaws.com/graphql",
    "api_key": "xxxxx",
    "default_authorization_type": "AMAZON_COGNITO_USER_POOLS"
  }
}
```

**This file is**:
- Auto-generated by `npx ampx sandbox`
- Contains all AWS resource endpoints
- Required for frontend to connect to backend
- Should be committed to git (contains no secrets)

#### 3. `src/components/ConfigureAmplify.tsx`
**Purpose**: Initialize Amplify in the frontend

```typescript
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

// Configure Amplify with backend
Amplify.configure(outputs, { ssr: true });
```

#### 4. `src/contexts/AuthContext.tsx`
**Purpose**: Manage authentication state

**Provides**:
- `user`: Current logged-in user
- `loading`: Auth loading state
- `login()`: Login function
- `register()`: Signup function
- `logout()`: Logout function
- `confirmSignUp()`: Verify email

---

## Database Schema

### Multi-Tenant Data Model

```
Organization (Tenant)
├── id: string
├── name: string
├── slug: string
├── ownerId: string
├── plan: enum
└── members: OrganizationMember[]

OrganizationMember
├── id: string
├── organizationId: string (FK)
├── userId: string (FK)
└── role: enum

User
├── id: string
├── email: string
├── firstName: string
├── lastName: string
└── organizations: OrganizationMember[]

Project
├── id: string
├── organizationId: string (FK)
├── name: string
├── status: enum
└── tasks: Task[]

Task
├── id: string
├── projectId: string (FK)
├── title: string
├── status: enum
├── assignedToId: string (FK)
└── comments: Comment[]
```

### Relationships

**One-to-Many**:
```typescript
Organization: a.model({
  members: a.hasMany('OrganizationMember', 'organizationId'),
})

OrganizationMember: a.model({
  organization: a.belongsTo('Organization', 'organizationId'),
})
```

**How it works**:
- `hasMany` creates a GSI on the child table
- `belongsTo` stores the parent ID
- Amplify handles queries automatically

---

## Authentication Flow

### 1. User Registration

```typescript
// Frontend: src/app/auth/register/page.tsx
const result = await register({
  email: 'user@example.com',
  password: 'Password123!',
  firstName: 'John',
  lastName: 'Doe',
});

// Backend: Cognito
1. Create user in Cognito User Pool
2. Set status to UNCONFIRMED
3. Send verification email with 6-digit code
4. Return { success: true, requiresConfirmation: true }
```

### 2. Email Verification

```typescript
// Frontend: src/app/auth/verify-email/page.tsx
const result = await confirmSignUp(email, code);

// Backend: Cognito
1. Validate verification code
2. Update user status to CONFIRMED
3. User can now login
```

### 3. Login

```typescript
// Frontend: src/app/auth/login/page.tsx
const result = await login(email, password);

// Backend: Cognito
1. Validate credentials
2. Check if email is verified
3. Generate JWT tokens:
   - ID Token (user info)
   - Access Token (API access)
   - Refresh Token (renew session)
4. Return tokens to frontend
```

### 4. API Requests

```typescript
// Frontend makes API call
const client = generateClient();
const { data } = await client.models.Organization.list();

// Backend: AppSync
1. Extract JWT token from request
2. Validate token with Cognito
3. Get user ID from token
4. Apply authorization rules
5. Query DynamoDB
6. Return filtered results
```

---

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd SQUAD-PM

# 2. Install dependencies
npm install

# 3. Configure AWS credentials
aws configure
# Enter: Access Key, Secret Key, Region (ap-south-1)

# 4. Deploy backend (first time)
npx ampx sandbox --once

# This creates:
# - Cognito User Pool
# - AppSync API
# - DynamoDB Tables
# - S3 Bucket
# - Generates amplify_outputs.json

# 5. Start development server
npm run dev
```

### Daily Development

```bash
# Start Amplify sandbox (watches for backend changes)
npx ampx sandbox

# In another terminal, start Next.js
npm run dev

# Access app at http://localhost:3000
```

### Making Backend Changes

**Scenario**: Add a new field to Organization model

```typescript
// 1. Edit amplify/data/resource.ts
Organization: a.model({
  name: a.string().required(),
  industry: a.string(), // NEW FIELD
})

// 2. Save file
// 3. Amplify sandbox auto-deploys (30-60 seconds)
// 4. New field is available in DynamoDB
// 5. amplify_outputs.json is updated
// 6. Frontend can now use the new field
```

### Testing Locally

```bash
# Run type checking
npm run lint

# Build for production
npm run build

# Test production build
npm run start
```

---

## Deployment Guide

### Option 1: Amplify Sandbox (Development)

```bash
# Deploy backend once
npx ampx sandbox --once

# Copy config to src
cp amplify_outputs.json src/

# Commit and push
git add src/amplify_outputs.json
git commit -m "Add backend config"
git push
```

### Option 2: Full CI/CD (Production)

**1. Update amplify.yml**:
```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - npm ci
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
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
```

**2. Create IAM Role** (AWS Console):
- Service: Amplify
- Permissions: AdministratorAccess-Amplify

**3. Attach Role to Amplify App**:
- Amplify Console → App Settings → General
- Service Role → Select created role

**4. Push to trigger deployment**:
```bash
git push codecommit main
```

---

## Troubleshooting

### Common Issues

#### 1. "Amplify has not been configured"

**Cause**: Missing `amplify_outputs.json`

**Fix**:
```bash
npx ampx sandbox --once
cp amplify_outputs.json src/
```

#### 2. "User is not authenticated"

**Cause**: User hasn't verified email

**Fix**: Direct user to `/auth/verify-email`

#### 3. Build fails with "useSearchParams" error

**Cause**: Missing Suspense boundary

**Fix**: Wrap component in `<Suspense>`

#### 4. DynamoDB table not found

**Cause**: Backend not deployed

**Fix**:
```bash
npx ampx sandbox --once
```

### Useful Commands

```bash
# View CloudFormation stack
aws cloudformation describe-stacks \
  --stack-name amplify-squadpm-mail2-sandbox-2badabd131 \
  --region ap-south-1

# List Cognito User Pools
aws cognito-idp list-user-pools --max-results 10 --region ap-south-1

# List DynamoDB tables
aws dynamodb list-tables --region ap-south-1

# View AppSync APIs
aws appsync list-graphql-apis --region ap-south-1
```

---

## Additional Resources

- [AWS Amplify Gen 2 Docs](https://docs.amplify.aws/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)

---

**Last Updated**: October 21, 2025
**Version**: 2.0.0
