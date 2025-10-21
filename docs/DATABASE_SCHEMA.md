# 📊 Database Schema Documentation

## Overview

SQUAD PM uses Amazon DynamoDB with AWS AppSync for a fully managed, serverless database solution. The schema is defined in TypeScript and automatically deployed.

---

## Schema Definition Location

**File**: `amplify/data/resource.ts`

This single file defines:
- All database tables (models)
- Field types and constraints
- Relationships between tables
- Authorization rules
- Indexes and queries

---

## Complete Schema

### 1. Organization (Tenant)

**Purpose**: Represents a company/team (multi-tenant isolation)

```typescript
Organization: a.model({
  name: a.string().required(),              // Company name
  slug: a.string().required(),              // URL-friendly identifier
  description: a.string(),                  // Company description
  logoUrl: a.url(),                         // Company logo
  website: a.url(),                         // Company website
  industry: a.string(),                     // Industry type
  size: a.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
  plan: a.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  ownerId: a.id().required(),               // Cognito user ID of owner
  members: a.hasMany('OrganizationMember', 'organizationId'),
  projects: a.hasMany('Project', 'organizationId'),
  invitations: a.hasMany('Invitation', 'organizationId'),
  settings: a.json(),                       // Custom settings object
  billingEmail: a.email(),                  // Billing contact
  maxUsers: a.integer(),                    // Plan limit
  maxProjects: a.integer(),                 // Plan limit
  isActive: a.boolean().default(true),      // Active/suspended
})
```

**DynamoDB Table Name**: `Organization-<stackId>-<env>`

**Indexes**:
- Primary Key: `id`
- GSI: `ownerId` (for owner queries)
- GSI: `slug` (for URL lookups)

**Authorization**:
- Owner can do everything
- Authenticated users can read

---

### 2. OrganizationMember

**Purpose**: Links users to organizations with roles

```typescript
OrganizationMember: a.model({
  organizationId: a.id().required(),        // FK to Organization
  organization: a.belongsTo('Organization', 'organizationId'),
  userId: a.id().required(),                // FK to User
  user: a.belongsTo('User', 'userId'),
  role: a.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
  invitedBy: a.id(),                        // Who invited this user
  joinedAt: a.datetime(),                   // When they joined
})
```

**Roles**:
- `OWNER`: Full control, billing access
- `ADMIN`: Manage members, projects
- `MEMBER`: Create/edit projects and tasks
- `VIEWER`: Read-only access

---

### 3. User

**Purpose**: User profile information

```typescript
User: a.model({
  email: a.email().required(),              // Unique email
  firstName: a.string().required(),
  lastName: a.string().required(),
  role: a.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']),
  avatarUrl: a.url(),                       // Profile picture
  phoneNumber: a.phone(),
  timezone: a.string(),                     // User timezone
  organizations: a.hasMany('OrganizationMember', 'userId'),
  projects: a.hasMany('ProjectMember', 'userId'),
  createdTasks: a.hasMany('Task', 'createdById'),
  assignedTasks: a.hasMany('Task', 'assignedToId'),
  comments: a.hasMany('Comment', 'userId'),
  messages: a.hasMany('Message', 'userId'),
  uploadedAttachments: a.hasMany('Attachment', 'uploadedById'),
  activityLogs: a.hasMany('ActivityLog', 'userId'),
  notifications: a.hasMany('Notification', 'userId'),
  lastLoginAt: a.datetime(),
  isActive: a.boolean().default(true),
})
```

**Note**: User ID comes from Cognito `sub` attribute

---

### 4. Project

**Purpose**: Project/workspace within an organization

```typescript
Project: a.model({
  organizationId: a.id().required(),        // Tenant isolation
  organization: a.belongsTo('Organization', 'organizationId'),
  name: a.string().required(),
  description: a.string(),
  color: a.string(),                        // Hex color for UI
  status: a.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED', 'ON_HOLD']),
  startDate: a.date(),
  endDate: a.date(),
  ownerId: a.id().required(),               // Project owner
  members: a.hasMany('ProjectMember', 'projectId'),
  tasks: a.hasMany('Task', 'projectId'),
  channels: a.hasMany('Channel', 'projectId'),
  activityLogs: a.hasMany('ActivityLog', 'projectId'),
})
```

---

### 5. ProjectMember

**Purpose**: Links users to projects with roles

```typescript
ProjectMember: a.model({
  projectId: a.id().required(),
  project: a.belongsTo('Project', 'projectId'),
  userId: a.id().required(),
  user: a.belongsTo('User', 'userId'),
  role: a.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
})
```

---

### 6. Task

**Purpose**: Individual work items

```typescript
Task: a.model({
  projectId: a.id().required(),
  project: a.belongsTo('Project', 'projectId'),
  title: a.string().required(),
  description: a.string(),
  status: a.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']),
  priority: a.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: a.datetime(),
  startDate: a.datetime(),
  createdById: a.id().required(),           // Who created it
  createdBy: a.belongsTo('User', 'createdById'),
  assignedToId: a.id(),                     // Who it's assigned to
  assignedTo: a.belongsTo('User', 'assignedToId'),
  columnId: a.string(),                     // Kanban column
  position: a.integer(),                    // Order in column
  tags: a.string().array(),                 // Labels
  estimatedHours: a.float(),
  actualHours: a.float(),
  progressPercentage: a.integer(),
  completedAt: a.datetime(),
  comments: a.hasMany('Comment', 'taskId'),
  attachments: a.hasMany('Attachment', 'taskId'),
  subtasks: a.hasMany('Subtask', 'taskId'),
})
```

---

### 7. Subtask

**Purpose**: Checklist items within a task

```typescript
Subtask: a.model({
  taskId: a.id().required(),
  task: a.belongsTo('Task', 'taskId'),
  title: a.string().required(),
  completed: a.boolean().required(),
  position: a.integer(),                    // Order in list
})
```

---

### 8. Comment

**Purpose**: Task comments/discussions

```typescript
Comment: a.model({
  taskId: a.id().required(),
  task: a.belongsTo('Task', 'taskId'),
  userId: a.id().required(),
  user: a.belongsTo('User', 'userId'),
  content: a.string().required(),           // Comment text
})
```

**Auto-timestamps**: `createdAt`, `updatedAt`

---

### 9. Attachment

**Purpose**: Files attached to tasks

```typescript
Attachment: a.model({
  taskId: a.id().required(),
  task: a.belongsTo('Task', 'taskId'),
  fileName: a.string().required(),
  fileUrl: a.url().required(),              // S3 URL
  fileSize: a.integer(),                    // Bytes
  fileType: a.string(),                     // MIME type
  uploadedById: a.id().required(),
  uploadedBy: a.belongsTo('User', 'uploadedById'),
})
```

---

### 10. Channel

**Purpose**: Communication channels (chat)

```typescript
Channel: a.model({
  name: a.string().required(),
  description: a.string(),
  projectId: a.id(),                        // Optional: project-specific
  project: a.belongsTo('Project', 'projectId'),
  type: a.enum(['PROJECT', 'DIRECT', 'GENERAL']),
  createdById: a.id().required(),
  messages: a.hasMany('Message', 'channelId'),
})
```

---

### 11. Message

**Purpose**: Chat messages

```typescript
Message: a.model({
  channelId: a.id().required(),
  channel: a.belongsTo('Channel', 'channelId'),
  userId: a.id().required(),
  user: a.belongsTo('User', 'userId'),
  content: a.string().required(),
})
```

---

### 12. ActivityLog

**Purpose**: Audit trail of actions

```typescript
ActivityLog: a.model({
  userId: a.id().required(),
  user: a.belongsTo('User', 'userId'),
  projectId: a.id(),
  project: a.belongsTo('Project', 'projectId'),
  taskId: a.id(),
  action: a.string().required(),            // "created", "updated", etc.
  entityType: a.string(),                   // "task", "project", etc.
  entityName: a.string(),                   // Name of entity
  fromStatus: a.string(),                   // Previous state
  toStatus: a.string(),                     // New state
})
```

---

### 13. Notification

**Purpose**: User notifications

```typescript
Notification: a.model({
  userId: a.id().required(),
  user: a.belongsTo('User', 'userId'),
  type: a.enum([
    'TASK_ASSIGNED',
    'TASK_COMPLETED',
    'COMMENT_ADDED',
    'MENTION',
    'PROJECT_INVITE',
    'DEADLINE_REMINDER',
  ]),
  title: a.string().required(),
  message: a.string().required(),
  read: a.boolean().required(),
  linkTo: a.string(),                       // Deep link URL
})
```

---

### 14. Invitation

**Purpose**: Pending organization invites

```typescript
Invitation: a.model({
  organizationId: a.id().required(),
  organization: a.belongsTo('Organization', 'organizationId'),
  email: a.email().required(),
  role: a.enum(['ADMIN', 'MEMBER', 'VIEWER']),
  invitedBy: a.id().required(),
  token: a.string().required(),             // Unique invite token
  status: a.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED']),
  expiresAt: a.datetime().required(),
})
```

---

## Relationships Explained

### One-to-Many

```typescript
// Parent
Organization: a.model({
  members: a.hasMany('OrganizationMember', 'organizationId'),
})

// Child
OrganizationMember: a.model({
  organizationId: a.id().required(),
  organization: a.belongsTo('Organization', 'organizationId'),
})
```

**What happens**:
1. DynamoDB creates GSI on `organizationId` in OrganizationMember table
2. Query: `organization.members()` → Returns all members
3. Query: `member.organization()` → Returns parent organization

---

## Authorization Rules

### Owner-Based

```typescript
.authorization((allow) => [allow.owner()])
```

- User can only access records where `owner` field = their Cognito user ID
- Automatically filters queries

### Authenticated

```typescript
.authorization((allow) => [allow.authenticated().to(['read'])])
```

- Any logged-in user can read
- Useful for shared data

### Custom

```typescript
.authorization((allow) => [
  allow.owner(),
  allow.authenticated().to(['read']),
])
```

- Combine multiple rules
- Owner can do everything, others can read

---

## How to Modify Schema

### Adding a New Field

```typescript
// Before
Organization: a.model({
  name: a.string().required(),
})

// After
Organization: a.model({
  name: a.string().required(),
  industry: a.string(), // NEW
})
```

**Steps**:
1. Edit `amplify/data/resource.ts`
2. Save file
3. Amplify sandbox auto-deploys (~30 seconds)
4. Field is now available in DynamoDB

### Adding a New Model

```typescript
// Add to schema
Department: a.model({
  name: a.string().required(),
  organizationId: a.id().required(),
  organization: a.belongsTo('Organization', 'organizationId'),
})

// Update parent
Organization: a.model({
  // ... existing fields
  departments: a.hasMany('Department', 'organizationId'),
})
```

**Steps**:
1. Define new model
2. Add relationships
3. Save file
4. New table is created automatically

---

## Querying Data

### List All

```typescript
const { data } = await client.models.Organization.list();
```

### Get By ID

```typescript
const { data } = await client.models.Organization.get({ id: 'org-123' });
```

### Filter

```typescript
const { data } = await client.models.Task.list({
  filter: {
    status: { eq: 'IN_PROGRESS' },
    priority: { eq: 'HIGH' },
  },
});
```

### With Relationships

```typescript
const { data } = await client.models.Organization.get(
  { id: 'org-123' },
  { selectionSet: ['id', 'name', 'members.*'] }
);
```

---

## Data Migration

### Changing Field Type

**Not supported directly**. Workaround:

1. Add new field with new type
2. Migrate data manually
3. Update code to use new field
4. Delete old field

### Renaming Field

**Not supported directly**. Workaround:

1. Add new field
2. Copy data
3. Update code
4. Delete old field

---

**Last Updated**: October 21, 2025
