import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Project database table with fields for:
- name, description, color, status, dates
- Relationships to tasks and members
=========================================================================*/
const schema = a.schema({
  // Organization/Company (Multi-tenant)
  Organization: a
    .model({
      name: a.string().required(),
      slug: a.string().required(),
      description: a.string(),
      logoUrl: a.url(),
      website: a.url(),
      industry: a.string(),
      size: a.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
      plan: a.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
      ownerId: a.id().required(),
      members: a.hasMany('OrganizationMember', 'organizationId'),
      projects: a.hasMany('Project', 'organizationId'),
      invitations: a.hasMany('Invitation', 'organizationId'),
      settings: a.json(),
      billingEmail: a.email(),
      maxUsers: a.integer(),
      maxProjects: a.integer(),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Organization Members (Multi-tenant user access)
  OrganizationMember: a
    .model({
      organizationId: a.id().required(),
      organization: a.belongsTo('Organization', 'organizationId'),
      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),
      role: a.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
      invitedBy: a.id(),
      joinedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Invitations (for inviting users to organization)
  Invitation: a
    .model({
      organizationId: a.id().required(),
      organization: a.belongsTo('Organization', 'organizationId'),
      email: a.email().required(),
      role: a.enum(['ADMIN', 'MEMBER', 'VIEWER']),
      invitedBy: a.id().required(),
      token: a.string().required(),
      status: a.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED']),
      expiresAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Department (organizational departments)
  Department: a
    .model({
      organizationId: a.id().required(),
      organization: a.belongsTo('Organization', 'organizationId'),
      name: a.string().required(),
      description: a.string(),
      code: a.string(),
      headId: a.id(),
      parentDepartmentId: a.id(),
      isActive: a.boolean().default(true),
      roles: a.hasMany('DepartmentRole', 'departmentId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Department Role (roles within departments)
  DepartmentRole: a
    .model({
      departmentId: a.id().required(),
      department: a.belongsTo('Department', 'departmentId'),
      name: a.string().required(),
      description: a.string(),
      level: a.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL']),
      responsibilities: a.string().array(),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // User Profile (extends Cognito user)
  UserProfile: a
    .model({
      email: a.email().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      role: a.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']),
      avatarUrl: a.url(),
      phoneNumber: a.phone(),
      timezone: a.string(),
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
    .authorization((allow) => [allow.owner()]),

  // Projects
  Project: a
    .model({
      organizationId: a.id().required(),
      organization: a.belongsTo('Organization', 'organizationId'),
      name: a.string().required(),
      description: a.string(),
      color: a.string(),
      status: a.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED', 'ON_HOLD']),
      startDate: a.date(),
      endDate: a.date(),
      ownerId: a.id().required(),
      members: a.hasMany('ProjectMember', 'projectId'),
      tasks: a.hasMany('Task', 'projectId'),
      channels: a.hasMany('Channel', 'projectId'),
      activityLogs: a.hasMany('ActivityLog', 'projectId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Project Members
  ProjectMember: a
    .model({
      projectId: a.id().required(),
      project: a.belongsTo('Project', 'projectId'),
      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),
      role: a.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
    })
    .authorization((allow) => [allow.owner()]),

  // Tasks
  Task: a
    .model({
      projectId: a.id().required(),
      project: a.belongsTo('Project', 'projectId'),
      title: a.string().required(),
      description: a.string(),
      status: a.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']),
      priority: a.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
      dueDate: a.datetime(),
      startDate: a.datetime(),
      createdById: a.id().required(),
      createdBy: a.belongsTo('UserProfile', 'createdById'),
      assignedToId: a.id(),
      assignedTo: a.belongsTo('UserProfile', 'assignedToId'),
      columnId: a.string(),
      position: a.integer(),
      tags: a.string().array(),
      estimatedHours: a.float(),
      actualHours: a.float(),
      progressPercentage: a.integer(),
      completedAt: a.datetime(),
      comments: a.hasMany('Comment', 'taskId'),
      attachments: a.hasMany('Attachment', 'taskId'),
      subtasks: a.hasMany('Subtask', 'taskId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Subtasks
  Subtask: a
    .model({
      taskId: a.id().required(),
      task: a.belongsTo('Task', 'taskId'),
      title: a.string().required(),
      completed: a.boolean().required(),
      position: a.integer(),
    })
    .authorization((allow) => [allow.owner()]),

  // Comments
  Comment: a
    .model({
      taskId: a.id().required(),
      task: a.belongsTo('Task', 'taskId'),
      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),
      content: a.string().required(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Attachments
  Attachment: a
    .model({
      taskId: a.id().required(),
      task: a.belongsTo('Task', 'taskId'),
      fileName: a.string().required(),
      fileUrl: a.url().required(),
      fileSize: a.integer(),
      fileType: a.string(),
      uploadedById: a.id().required(),
      uploadedBy: a.belongsTo('UserProfile', 'uploadedById'),
    })
    .authorization((allow) => [allow.owner()]),

  // Channels (for chat)
  Channel: a
    .model({
      name: a.string().required(),
      description: a.string(),
      projectId: a.id(),
      project: a.belongsTo('Project', 'projectId'),
      type: a.enum(['PROJECT', 'DIRECT', 'GENERAL']),
      createdById: a.id().required(),
      messages: a.hasMany('Message', 'channelId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Messages
  Message: a
    .model({
      channelId: a.id().required(),
      channel: a.belongsTo('Channel', 'channelId'),
      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),
      content: a.string().required(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read']),
    ]),

  // Activity Log
  ActivityLog: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),
      projectId: a.id(),
      project: a.belongsTo('Project', 'projectId'),
      taskId: a.id(),
      action: a.string().required(),
      entityType: a.string(),
      entityName: a.string(),
      fromStatus: a.string(),
      toStatus: a.string(),
    })
    .authorization((allow) => [allow.authenticated()]),

  // Notifications
  Notification: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('UserProfile', 'userId'),
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
      linkTo: a.string(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: tasks } = await client.models.Task.list()

// return <ul>{tasks.map(task => <li key={task.id}>{task.title}</li>)}</ul>
