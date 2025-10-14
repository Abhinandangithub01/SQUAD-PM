import { a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // ============================================
  // ORGANIZATION MODEL - Multi-Tenancy Foundation
  // ============================================
  Organization: a.model({
    name: a.string().required(),
    slug: a.string().required(),
    description: a.string(),
    industry: a.string(),
    size: a.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
    plan: a.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
    status: a.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED', 'TRIAL']),
    
    // Settings stored as JSON string
    settings: a.json(),
    // {
    //   allowedDomains: [String],
    //   ssoEnabled: Boolean,
    //   customBranding: { logo, colors },
    //   features: { taskAutomation, analytics, etc }
    // }
    
    // Limits based on plan
    limits: a.json(),
    // {
    //   maxUsers: Number,
    //   maxProjects: Number,
    //   maxStorageGB: Number,
    //   maxApiCallsPerMonth: Number
    // }
    
    // Current usage tracking
    usage: a.json(),
    // {
    //   currentUsers: Number,
    //   currentProjects: Number,
    //   storageUsedBytes: Number,
    //   apiCallsThisMonth: Number
    // }
    
    // Billing information
    billing: a.json(),
    // {
    //   stripeCustomerId: String,
    //   stripeSubscriptionId: String,
    //   nextBillingDate: DateTime,
    //   paymentMethod: Object
    // }
    
    ownerId: a.id().required(),
    logoUrl: a.string(),
    website: a.string(),
    
    // Trial information
    trialEndsAt: a.datetime(),
    
    // Relations
    members: a.hasMany('OrganizationMember', 'organizationId'),
    projects: a.hasMany('Project', 'organizationId'),
    
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  })
  .authorization(allow => [
    allow.owner('ownerId'),
    allow.authenticated().to(['read']),
  ]),

  // ============================================
  // ORGANIZATION MEMBER MODEL - User-Org Junction
  // ============================================
  OrganizationMember: a.model({
    organizationId: a.id().required(),
    organization: a.belongsTo('Organization', 'organizationId'),
    
    userId: a.id().required(),
    user: a.belongsTo('User', 'userId'),
    
    role: a.enum(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']).required(),
    
    // Custom permissions array
    permissions: a.string(), // JSON array of permission strings
    
    // Invitation tracking
    invitedBy: a.id(),
    invitedAt: a.datetime(),
    joinedAt: a.datetime(),
    
    status: a.enum(['ACTIVE', 'INVITED', 'SUSPENDED']),
    
    // Department/team assignment
    department: a.string(),
    title: a.string(),
  })
  .authorization(allow => [
    allow.owner('userId'),
    allow.authenticated().to(['read']),
  ]),

  // ============================================
  // INVITATION MODEL - Pending org invites
  // ============================================
  Invitation: a.model({
    organizationId: a.id().required(),
    email: a.email().required(),
    role: a.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']).required(),
    invitedBy: a.id().required(),
    token: a.string().required(),
    status: a.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED']),
    expiresAt: a.datetime().required(),
    acceptedAt: a.datetime(),
  })
  .authorization(allow => [
    allow.authenticated().to(['read', 'update']),
  ]),

  // ============================================
  // TASK MODEL - Enhanced with all new fields
  // ============================================
  Task: a.model({
    // Multi-tenancy
    organizationId: a.id().required(),
    // Basic fields
    title: a.string().required(),
    description: a.string(),
    status: a.enum(['TODO', 'IN_PROGRESS', 'DONE']),
    priority: a.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    type: a.enum(['TASK', 'BUG', 'EPIC', 'STORY']),
    
    // Dates
    startDate: a.datetime(),
    dueDate: a.datetime(),
    completedAt: a.datetime(),
    
    // People
    projectId: a.id().required(),
    project: a.belongsTo('Project', 'projectId'),
    createdById: a.id(),
    createdBy: a.belongsTo('User', 'createdById'),
    assignedToId: a.id(),
    assignedTo: a.belongsTo('User', 'assignedToId'),
    assigneeIds: a.string(), // JSON array
    watcherIds: a.string(), // JSON array
    
    // Estimation
    estimatedHours: a.float(),
    actualHours: a.float(),
    storyPoints: a.integer(),
    riskLevel: a.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    
    // Organization
    tags: a.string(), // JSON array
    labels: a.string(), // JSON array of {name, color}
    epicId: a.id(),
    
    // Structure
    subtasks: a.string(), // JSON array
    checklists: a.string(), // JSON array
    dependencies: a.string(), // JSON array of task IDs
    blocks: a.string(), // JSON array of task IDs
    
    // Media
    attachments: a.string(), // JSON array
    links: a.string(), // JSON array
    coverImage: a.string(),
    
    // Recurring
    isRecurring: a.boolean(),
    recurringPattern: a.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    recurringInterval: a.integer(),
    
    // Progress
    progressPercentage: a.integer(),
    completionCriteria: a.string(),
    
    // Metadata
    archived: a.boolean(),
    templateId: a.id(),
    sprintId: a.id(),
    
    // Relations
    comments: a.hasMany('Comment', 'taskId'),
    activities: a.hasMany('Activity', 'taskId'),
    timeEntries: a.hasMany('TimeEntry', 'taskId'),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner('createdById'),
    allow.owner('assignedToId'),
  ]),

  // ============================================
  // PROJECT MODEL
  // ============================================
  Project: a.model({
    // Multi-tenancy
    organizationId: a.id().required(),
    organization: a.belongsTo('Organization', 'organizationId'),
    
    name: a.string().required(),
    description: a.string(),
    status: a.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED']),
    startDate: a.datetime(),
    endDate: a.datetime(),
    color: a.string(),
    ownerId: a.id(),
    
    // Relations
    tasks: a.hasMany('Task', 'projectId'),
    sprints: a.hasMany('Sprint', 'projectId'),
    channels: a.hasMany('Channel', 'projectId'),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner('ownerId'),
  ]),

  // ============================================
  // USER MODEL
  // ============================================
  User: a.model({
    email: a.string().required(),
    firstName: a.string(),
    lastName: a.string(),
    avatar: a.string(),
    role: a.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']),
    online: a.boolean(),
    lastSeen: a.datetime(),
    
    // Relations
    createdTasks: a.hasMany('Task', 'createdById'),
    assignedTasks: a.hasMany('Task', 'assignedToId'),
    comments: a.hasMany('Comment', 'userId'),
    notifications: a.hasMany('Notification', 'userId'),
    organizationMemberships: a.hasMany('OrganizationMember', 'userId'),
  })
  .authorization(allow => [
    allow.owner(),
    allow.authenticated().to(['read']),
  ]),

  // ============================================
  // COMMENT MODEL
  // ============================================
  Comment: a.model({
    organizationId: a.id().required(),
    taskId: a.id().required(),
    task: a.belongsTo('Task', 'taskId'),
    userId: a.id().required(),
    user: a.belongsTo('User', 'userId'),
    content: a.string().required(),
    mentions: a.string(), // JSON array
    reactions: a.string(), // JSON object {emoji: [userIds]}
    createdAt: a.datetime(),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner('userId'),
  ]),

  // ============================================
  // ACTIVITY LOG MODEL
  // ============================================
  Activity: a.model({
    organizationId: a.id().required(),
    taskId: a.id().required(),
    task: a.belongsTo('Task', 'taskId'),
    userId: a.id(),
    type: a.enum([
      'created', 'updated', 'deleted', 'commented',
      'assigned', 'status_changed', 'priority_changed',
      'due_date_changed', 'attachment_added', 'tag_added'
    ]),
    details: a.string(), // JSON object with change details
    timestamp: a.datetime(),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
  ]),

  // ============================================
  // CHANNEL MODEL (Chat)
  // ============================================
  Channel: a.model({
    organizationId: a.id().required(),
    name: a.string().required(),
    displayName: a.string(),
    description: a.string(),
    type: a.enum(['PUBLIC', 'PRIVATE', 'DIRECT']),
    projectId: a.id(),
    project: a.belongsTo('Project', 'projectId'),
    createdById: a.id(),
    memberIds: a.string(), // JSON array
    
    // Relations
    messages: a.hasMany('Message', 'channelId'),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner('createdById'),
  ]),

  // ============================================
  // MESSAGE MODEL
  // ============================================
  Message: a.model({
    organizationId: a.id().required(),
    channelId: a.id().required(),
    channel: a.belongsTo('Channel', 'channelId'),
    userId: a.id().required(),
    content: a.string().required(),
    attachments: a.string(), // JSON array
    mentions: a.string(), // JSON array
    reactions: a.string(), // JSON object
    createdAt: a.datetime(),
    editedAt: a.datetime(),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner('userId'),
  ]),

  // ============================================
  // NOTIFICATION MODEL
  // ============================================
  Notification: a.model({
    organizationId: a.id().required(),
    userId: a.id().required(),
    user: a.belongsTo('User', 'userId'),
    type: a.enum([
      'task_assigned', 'task_updated', 'task_completed',
      'comment_added', 'mention', 'due_date_reminder',
      'automation', 'system'
    ]),
    title: a.string().required(),
    message: a.string(),
    taskId: a.id(),
    projectId: a.id(),
    read: a.boolean(),
    createdAt: a.datetime(),
  })
  .authorization(allow => [
    allow.owner('userId'),
  ]),

  // ============================================
  // TEMPLATE MODEL
  // ============================================
  Template: a.model({
    organizationId: a.id().required(),
    name: a.string().required(),
    description: a.string(),
    type: a.enum(['TASK', 'BUG', 'EPIC', 'STORY']),
    data: a.string(), // JSON object with template data
    projectId: a.id(),
    createdById: a.id(),
    isPublic: a.boolean(),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner('createdById'),
  ]),

  // ============================================
  // AUTOMATION RULE MODEL
  // ============================================
  AutomationRule: a.model({
    organizationId: a.id().required(),
    name: a.string().required(),
    projectId: a.id().required(),
    trigger: a.string(), // JSON object {type, value}
    action: a.string(), // JSON object {type, value}
    enabled: a.boolean(),
    executionCount: a.integer(),
    lastExecuted: a.datetime(),
    createdById: a.id(),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner('createdById'),
  ]),

  // ============================================
  // SPRINT MODEL
  // ============================================
  Sprint: a.model({
    organizationId: a.id().required(),
    name: a.string().required(),
    projectId: a.id().required(),
    project: a.belongsTo('Project', 'projectId'),
    startDate: a.datetime().required(),
    endDate: a.datetime().required(),
    goal: a.string(),
    status: a.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
    totalStoryPoints: a.integer(),
    completedStoryPoints: a.integer(),
    velocity: a.float(),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
  ]),

  // ============================================
  // TIME ENTRY MODEL
  // ============================================
  TimeEntry: a.model({
    organizationId: a.id().required(),
    taskId: a.id().required(),
    task: a.belongsTo('Task', 'taskId'),
    userId: a.id().required(),
    startTime: a.datetime().required(),
    endTime: a.datetime(),
    duration: a.integer(), // in minutes
    description: a.string(),
    billable: a.boolean(),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner('userId'),
  ]),

  // ============================================
  // FILE METADATA MODEL
  // ============================================
  FileMetadata: a.model({
    organizationId: a.id().required(),
    taskId: a.id(),
    projectId: a.id(),
    fileName: a.string().required(),
    fileSize: a.integer(),
    fileType: a.string(),
    s3Key: a.string().required(),
    s3Url: a.string(),
    uploadedById: a.id(),
    uploadedAt: a.datetime(),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner('uploadedById'),
  ]),

  // ============================================
  // MILESTONE MODEL
  // ============================================
  Milestone: a.model({
    organizationId: a.id().required(),
    name: a.string().required(),
    description: a.string(),
    projectId: a.id().required(),
    ownerId: a.id(),
    dueDate: a.datetime(),
    status: a.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
    completionPercentage: a.integer(),
  })
  .authorization(allow => [
    allow.authenticated().to(['read']),
    allow.owner('ownerId'),
  ]),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    // Keep API key for public access if needed
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
