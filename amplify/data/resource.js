import { a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // ============================================
  // TASK MODEL - Enhanced with all new fields
  // ============================================
  Task: a.model({
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
  .authorization(allow => [allow.publicApiKey()]),

  // ============================================
  // PROJECT MODEL
  // ============================================
  Project: a.model({
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
  .authorization(allow => [allow.publicApiKey()]),

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
  })
  .authorization(allow => [allow.publicApiKey()]),

  // ============================================
  // COMMENT MODEL
  // ============================================
  Comment: a.model({
    taskId: a.id().required(),
    task: a.belongsTo('Task', 'taskId'),
    userId: a.id().required(),
    user: a.belongsTo('User', 'userId'),
    content: a.string().required(),
    mentions: a.string(), // JSON array
    reactions: a.string(), // JSON object {emoji: [userIds]}
    createdAt: a.datetime(),
  })
  .authorization(allow => [allow.publicApiKey()]),

  // ============================================
  // ACTIVITY LOG MODEL
  // ============================================
  Activity: a.model({
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
  .authorization(allow => [allow.publicApiKey()]),

  // ============================================
  // CHANNEL MODEL (Chat)
  // ============================================
  Channel: a.model({
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
  .authorization(allow => [allow.publicApiKey()]),

  // ============================================
  // MESSAGE MODEL
  // ============================================
  Message: a.model({
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
  .authorization(allow => [allow.publicApiKey()]),

  // ============================================
  // NOTIFICATION MODEL
  // ============================================
  Notification: a.model({
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
  .authorization(allow => [allow.publicApiKey()]),

  // ============================================
  // TEMPLATE MODEL
  // ============================================
  Template: a.model({
    name: a.string().required(),
    description: a.string(),
    type: a.enum(['TASK', 'BUG', 'EPIC', 'STORY']),
    data: a.string(), // JSON object with template data
    projectId: a.id(),
    createdById: a.id(),
    isPublic: a.boolean(),
  })
  .authorization(allow => [allow.publicApiKey()]),

  // ============================================
  // AUTOMATION RULE MODEL
  // ============================================
  AutomationRule: a.model({
    name: a.string().required(),
    projectId: a.id().required(),
    trigger: a.string(), // JSON object {type, value}
    action: a.string(), // JSON object {type, value}
    enabled: a.boolean(),
    executionCount: a.integer(),
    lastExecuted: a.datetime(),
    createdById: a.id(),
  })
  .authorization(allow => [allow.publicApiKey()]),

  // ============================================
  // SPRINT MODEL
  // ============================================
  Sprint: a.model({
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
  .authorization(allow => [allow.publicApiKey()]),

  // ============================================
  // TIME ENTRY MODEL
  // ============================================
  TimeEntry: a.model({
    taskId: a.id().required(),
    task: a.belongsTo('Task', 'taskId'),
    userId: a.id().required(),
    startTime: a.datetime().required(),
    endTime: a.datetime(),
    duration: a.integer(), // in minutes
    description: a.string(),
    billable: a.boolean(),
  })
  .authorization(allow => [allow.publicApiKey()]),

  // ============================================
  // FILE METADATA MODEL
  // ============================================
  FileMetadata: a.model({
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
  .authorization(allow => [allow.publicApiKey()]),

  // ============================================
  // MILESTONE MODEL
  // ============================================
  Milestone: a.model({
    name: a.string().required(),
    description: a.string(),
    projectId: a.id().required(),
    ownerId: a.id(),
    dueDate: a.datetime(),
    status: a.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
    completionPercentage: a.integer(),
  })
  .authorization(allow => [allow.publicApiKey()]),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
