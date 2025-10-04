/**
 * Enhanced Amplify Data Service
 * Complete service for all AWS Amplify operations including new features
 */

import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

const client = generateClient();

/**
 * ENHANCED TASK OPERATIONS
 */
export const taskService = {
  // Create task with all new fields
  async create(taskData) {
    try {
      const { data: task, errors } = await client.models.Task.create({
        // Basic fields
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'TODO',
        priority: taskData.priority ? taskData.priority.toUpperCase() : 'MEDIUM',
        type: taskData.type || 'TASK',
        
        // Dates
        startDate: taskData.start_date || taskData.startDate,
        dueDate: taskData.due_date || taskData.dueDate,
        
        // People
        projectId: taskData.projectId || taskData.project_id,
        createdById: taskData.createdById,
        assignedToId: taskData.assignedToId || taskData.assignee_ids?.[0],
        
        // Estimation
        estimatedHours: taskData.estimated_hours || taskData.estimatedHours,
        storyPoints: taskData.story_points || taskData.storyPoints,
        riskLevel: taskData.risk_level || taskData.riskLevel || 'LOW',
        
        // Organization
        tags: JSON.stringify(taskData.tags || []),
        labels: JSON.stringify(taskData.labels || []),
        epicId: taskData.epic_id || taskData.epicId,
        
        // Structure
        subtasks: JSON.stringify(taskData.subtasks || []),
        checklists: JSON.stringify(taskData.checklists || []),
        dependencies: JSON.stringify(taskData.dependencies || []),
        
        // Media
        attachments: JSON.stringify(taskData.attachments || []),
        links: JSON.stringify(taskData.links || []),
        coverImage: taskData.cover_image || taskData.coverImage,
        
        // Recurring
        isRecurring: taskData.is_recurring || taskData.isRecurring || false,
        recurringPattern: taskData.recurring_pattern || taskData.recurringPattern,
        recurringInterval: taskData.recurring_interval || taskData.recurringInterval,
        
        // Additional
        assigneeIds: JSON.stringify(taskData.assignee_ids || []),
        watcherIds: JSON.stringify(taskData.watcher_ids || []),
        progressPercentage: 0,
        archived: false,
      });

      if (errors) {
        console.error('Error creating task:', errors);
        throw new Error(errors[0]?.message || 'Failed to create task');
      }

      // Parse JSON fields for return
      const parsedTask = this.parseTaskFields(task);
      
      // Log activity
      await this.logActivity(task.id, {
        type: 'created',
        userId: taskData.createdById,
        details: 'Task created',
      });

      return { success: true, data: parsedTask };
    } catch (error) {
      console.error('Task creation error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update task with all fields
  async update(taskId, updates) {
    try {
      // Prepare update data
      const updateData = {
        id: taskId,
      };

      // Map all possible fields
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority.toUpperCase();
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.start_date !== undefined) updateData.startDate = updates.start_date;
      if (updates.due_date !== undefined) updateData.dueDate = updates.due_date;
      if (updates.estimated_hours !== undefined) updateData.estimatedHours = updates.estimated_hours;
      if (updates.story_points !== undefined) updateData.storyPoints = updates.story_points;
      if (updates.risk_level !== undefined) updateData.riskLevel = updates.risk_level;
      if (updates.tags !== undefined) updateData.tags = JSON.stringify(updates.tags);
      if (updates.labels !== undefined) updateData.labels = JSON.stringify(updates.labels);
      if (updates.epic_id !== undefined) updateData.epicId = updates.epic_id;
      if (updates.subtasks !== undefined) updateData.subtasks = JSON.stringify(updates.subtasks);
      if (updates.checklists !== undefined) updateData.checklists = JSON.stringify(updates.checklists);
      if (updates.dependencies !== undefined) updateData.dependencies = JSON.stringify(updates.dependencies);
      if (updates.attachments !== undefined) updateData.attachments = JSON.stringify(updates.attachments);
      if (updates.links !== undefined) updateData.links = JSON.stringify(updates.links);
      if (updates.cover_image !== undefined) updateData.coverImage = updates.cover_image;
      if (updates.assignee_ids !== undefined) updateData.assigneeIds = JSON.stringify(updates.assignee_ids);
      if (updates.watcher_ids !== undefined) updateData.watcherIds = JSON.stringify(updates.watcher_ids);
      if (updates.is_recurring !== undefined) updateData.isRecurring = updates.is_recurring;
      if (updates.recurring_pattern !== undefined) updateData.recurringPattern = updates.recurring_pattern;
      if (updates.recurring_interval !== undefined) updateData.recurringInterval = updates.recurring_interval;

      // Calculate progress if subtasks/checklists changed
      if (updates.subtasks || updates.checklists) {
        updateData.progressPercentage = this.calculateProgress(updates);
      }

      const { data: task, errors } = await client.models.Task.update(updateData);

      if (errors) {
        console.error('Error updating task:', errors);
        throw new Error(errors[0]?.message || 'Failed to update task');
      }

      // Log activity
      await this.logActivity(taskId, {
        type: 'updated',
        userId: updates.userId,
        changes: updates,
      });

      const parsedTask = this.parseTaskFields(task);
      return { success: true, data: parsedTask };
    } catch (error) {
      console.error('Task update error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get task with parsed fields
  async get(taskId) {
    try {
      const { data: task, errors } = await client.models.Task.get({ id: taskId });

      if (errors) {
        console.error('Error fetching task:', errors);
        throw new Error('Failed to fetch task');
      }

      const parsedTask = this.parseTaskFields(task);
      return { success: true, data: parsedTask };
    } catch (error) {
      console.error('Task get error:', error);
      return { success: false, error: error.message };
    }
  },

  // List tasks with filters
  async list(filters = {}) {
    try {
      let query = client.models.Task.list();

      if (filters.projectId) {
        query = client.models.Task.list({
          filter: { projectId: { eq: filters.projectId } },
        });
      }

      const { data: tasks, errors } = await query;

      if (errors) {
        console.error('Error fetching tasks:', errors);
        throw new Error('Failed to fetch tasks');
      }

      const parsedTasks = tasks.map(task => this.parseTaskFields(task));
      return { success: true, data: parsedTasks };
    } catch (error) {
      console.error('Task list error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete task
  async delete(taskId) {
    try {
      const { data, errors } = await client.models.Task.delete({ id: taskId });

      if (errors) {
        console.error('Error deleting task:', errors);
        throw new Error('Failed to delete task');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Task delete error:', error);
      return { success: false, error: error.message };
    }
  },

  // Helper: Parse JSON fields
  parseTaskFields(task) {
    if (!task) return null;

    try {
      return {
        ...task,
        tags: task.tags ? JSON.parse(task.tags) : [],
        labels: task.labels ? JSON.parse(task.labels) : [],
        subtasks: task.subtasks ? JSON.parse(task.subtasks) : [],
        checklists: task.checklists ? JSON.parse(task.checklists) : [],
        dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
        attachments: task.attachments ? JSON.parse(task.attachments) : [],
        links: task.links ? JSON.parse(task.links) : [],
        assigneeIds: task.assigneeIds ? JSON.parse(task.assigneeIds) : [],
        watcherIds: task.watcherIds ? JSON.parse(task.watcherIds) : [],
      };
    } catch (error) {
      console.error('Error parsing task fields:', error);
      return task;
    }
  },

  // Helper: Calculate progress
  calculateProgress(taskData) {
    let total = 0;
    let completed = 0;

    // Count subtasks
    if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
      total += taskData.subtasks.length;
      completed += taskData.subtasks.filter(st => st.completed).length;
    }

    // Count checklist items
    if (taskData.checklists && Array.isArray(taskData.checklists)) {
      taskData.checklists.forEach(checklist => {
        if (checklist.items && Array.isArray(checklist.items)) {
          total += checklist.items.length;
          completed += checklist.items.filter(item => item.completed).length;
        }
      });
    }

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  },

  // Log activity
  async logActivity(taskId, activity) {
    try {
      await client.models.Activity.create({
        taskId,
        type: activity.type,
        userId: activity.userId,
        details: JSON.stringify(activity),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  },
};

/**
 * STORAGE OPERATIONS (S3)
 */
export const storageService = {
  // Upload file to S3
  async upload({ file, path, onProgress }) {
    try {
      const result = await uploadData({
        path: path || `uploads/${Date.now()}_${file.name}`,
        data: file,
        options: {
          contentType: file.type,
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (onProgress) {
              onProgress({ loaded: transferredBytes, total: totalBytes });
            }
          },
        },
      }).result;

      // Get public URL
      const urlResult = await getUrl({ path: result.path });

      return { 
        success: true, 
        url: urlResult.url.toString(),
        path: result.path,
        key: result.path,
      };
    } catch (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get file URL
  async getUrl(path) {
    try {
      const result = await getUrl({ path });
      return { success: true, url: result.url.toString() };
    } catch (error) {
      console.error('Storage getUrl error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete file from S3
  async delete(path) {
    try {
      await remove({ path });
      return { success: true };
    } catch (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }
  },

  // Upload multiple files
  async uploadMultiple(files, basePath = 'uploads') {
    const results = [];
    
    for (const file of files) {
      const path = `${basePath}/${Date.now()}_${file.name}`;
      const result = await this.upload({ file, path });
      results.push(result);
    }

    return results;
  },
};

/**
 * COMMENT OPERATIONS
 */
export const commentService = {
  async create(commentData) {
    try {
      const { data: comment, errors } = await client.models.Comment.create({
        taskId: commentData.taskId,
        content: commentData.content,
        userId: commentData.userId,
        mentions: JSON.stringify(commentData.mentions || []),
        createdAt: new Date().toISOString(),
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create comment');
      }

      // Log activity
      await taskService.logActivity(commentData.taskId, {
        type: 'commented',
        userId: commentData.userId,
        comment: commentData.content,
      });

      return { success: true, data: comment };
    } catch (error) {
      console.error('Comment creation error:', error);
      return { success: false, error: error.message };
    }
  },

  async list(taskId) {
    try {
      const { data: comments, errors } = await client.models.Comment.list({
        filter: { taskId: { eq: taskId } },
      });

      if (errors) {
        throw new Error('Failed to fetch comments');
      }

      return { success: true, data: comments };
    } catch (error) {
      console.error('Comment list error:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(commentId) {
    try {
      const { data, errors } = await client.models.Comment.delete({ id: commentId });

      if (errors) {
        throw new Error('Failed to delete comment');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Comment delete error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * CHANNEL OPERATIONS (Chat)
 */
export const channelService = {
  async create(channelData) {
    try {
      const { data: channel, errors } = await client.models.Channel.create({
        name: channelData.name,
        displayName: channelData.displayName || channelData.name,
        description: channelData.description,
        type: channelData.type || 'PUBLIC',
        projectId: channelData.projectId,
        createdById: channelData.createdById,
        memberIds: JSON.stringify(channelData.memberIds || []),
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create channel');
      }

      return { success: true, data: channel };
    } catch (error) {
      console.error('Channel creation error:', error);
      return { success: false, error: error.message };
    }
  },

  async list(filters = {}) {
    try {
      let query = client.models.Channel.list();

      if (filters.projectId) {
        query = client.models.Channel.list({
          filter: { projectId: { eq: filters.projectId } },
        });
      }

      const { data: channels, errors } = await query;

      if (errors) {
        throw new Error('Failed to fetch channels');
      }

      return { success: true, data: channels };
    } catch (error) {
      console.error('Channel list error:', error);
      return { success: false, error: error.message };
    }
  },

  async getMembers(channelId) {
    try {
      const { data: channel, errors } = await client.models.Channel.get({ id: channelId });

      if (errors) {
        throw new Error('Failed to fetch channel');
      }

      const memberIds = channel.memberIds ? JSON.parse(channel.memberIds) : [];
      
      // Fetch member details
      const members = await Promise.all(
        memberIds.map(id => userService.get(id))
      );

      return { 
        success: true, 
        data: members.filter(m => m.success).map(m => m.data) 
      };
    } catch (error) {
      console.error('Channel members error:', error);
      return { success: false, error: error.message };
    }
  },

  async sendTypingIndicator({ channelId, userId }) {
    // Implement with Amplify PubSub or real-time subscriptions
    console.log('Typing indicator:', channelId, userId);
    return { success: true };
  },
};

/**
 * MESSAGE OPERATIONS
 */
export const messageService = {
  async create(messageData) {
    try {
      const { data: message, errors } = await client.models.Message.create({
        channelId: messageData.channelId,
        content: messageData.content,
        userId: messageData.userId,
        attachments: JSON.stringify(messageData.attachments || []),
        mentions: JSON.stringify(messageData.mentions || []),
        reactions: JSON.stringify({}),
        createdAt: new Date().toISOString(),
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to send message');
      }

      return { success: true, data: message };
    } catch (error) {
      console.error('Message creation error:', error);
      return { success: false, error: error.message };
    }
  },

  async list(filters = {}) {
    try {
      const { data: messages, errors } = await client.models.Message.list({
        filter: { channelId: { eq: filters.channelId } },
      });

      if (errors) {
        throw new Error('Failed to fetch messages');
      }

      // Parse JSON fields
      const parsedMessages = messages.map(msg => ({
        ...msg,
        attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
        mentions: msg.mentions ? JSON.parse(msg.mentions) : [],
        reactions: msg.reactions ? JSON.parse(msg.reactions) : {},
      }));

      return { success: true, data: parsedMessages };
    } catch (error) {
      console.error('Message list error:', error);
      return { success: false, error: error.message };
    }
  },

  async addReaction({ messageId, emoji, userId }) {
    try {
      // Get current message
      const { data: message } = await client.models.Message.get({ id: messageId });
      const reactions = message.reactions ? JSON.parse(message.reactions) : {};

      // Add user to emoji reactions
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      if (!reactions[emoji].includes(userId)) {
        reactions[emoji].push(userId);
      } else {
        // Remove if already reacted
        reactions[emoji] = reactions[emoji].filter(id => id !== userId);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      }

      // Update message
      const { data: updated, errors } = await client.models.Message.update({
        id: messageId,
        reactions: JSON.stringify(reactions),
      });

      if (errors) {
        throw new Error('Failed to add reaction');
      }

      return { success: true, data: updated };
    } catch (error) {
      console.error('Reaction error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * NOTIFICATION OPERATIONS
 */
export const notificationService = {
  async create(notificationData) {
    try {
      const { data: notification, errors } = await client.models.Notification.create({
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        taskId: notificationData.taskId,
        projectId: notificationData.projectId,
        read: false,
        createdAt: new Date().toISOString(),
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create notification');
      }

      return { success: true, data: notification };
    } catch (error) {
      console.error('Notification creation error:', error);
      return { success: false, error: error.message };
    }
  },

  async list(userId) {
    try {
      const { data: notifications, errors } = await client.models.Notification.list({
        filter: { userId: { eq: userId } },
      });

      if (errors) {
        throw new Error('Failed to fetch notifications');
      }

      return { success: true, data: notifications };
    } catch (error) {
      console.error('Notification list error:', error);
      return { success: false, error: error.message };
    }
  },

  async getUnreadCount(userId) {
    try {
      const { data: notifications, errors } = await client.models.Notification.list({
        filter: { 
          userId: { eq: userId },
          read: { eq: false },
        },
      });

      if (errors) {
        throw new Error('Failed to fetch unread count');
      }

      return { success: true, data: notifications.length };
    } catch (error) {
      console.error('Unread count error:', error);
      return { success: false, error: error.message };
    }
  },

  async markAsRead(notificationId) {
    try {
      const { data, errors } = await client.models.Notification.update({
        id: notificationId,
        read: true,
      });

      if (errors) {
        throw new Error('Failed to mark as read');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Mark as read error:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(notificationId) {
    try {
      const { data, errors } = await client.models.Notification.delete({ id: notificationId });

      if (errors) {
        throw new Error('Failed to delete notification');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Notification delete error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * TEMPLATE OPERATIONS
 */
export const templateService = {
  async create(templateData) {
    try {
      const { data: template, errors } = await client.models.Template.create({
        name: templateData.name,
        description: templateData.description,
        type: templateData.type || 'TASK',
        data: JSON.stringify(templateData.data),
        projectId: templateData.projectId,
        createdById: templateData.createdById,
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create template');
      }

      return { success: true, data: template };
    } catch (error) {
      console.error('Template creation error:', error);
      return { success: false, error: error.message };
    }
  },

  async list(filters = {}) {
    try {
      let query = client.models.Template.list();

      if (filters.projectId) {
        query = client.models.Template.list({
          filter: { projectId: { eq: filters.projectId } },
        });
      }

      const { data: templates, errors } = await query;

      if (errors) {
        throw new Error('Failed to fetch templates');
      }

      // Parse data field
      const parsedTemplates = templates.map(t => ({
        ...t,
        data: t.data ? JSON.parse(t.data) : {},
      }));

      return { success: true, data: parsedTemplates };
    } catch (error) {
      console.error('Template list error:', error);
      return { success: false, error: error.message };
    }
  },

  async delete(templateId) {
    try {
      const { data, errors } = await client.models.Template.delete({ id: templateId });

      if (errors) {
        throw new Error('Failed to delete template');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Template delete error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * AUTOMATION OPERATIONS
 */
export const automationService = {
  async createRule(ruleData) {
    try {
      const { data: rule, errors } = await client.models.AutomationRule.create({
        name: ruleData.name,
        projectId: ruleData.projectId,
        trigger: JSON.stringify(ruleData.trigger),
        action: JSON.stringify(ruleData.action),
        enabled: ruleData.enabled !== false,
        executionCount: 0,
        createdById: ruleData.createdById,
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create rule');
      }

      return { success: true, data: rule };
    } catch (error) {
      console.error('Automation rule creation error:', error);
      return { success: false, error: error.message };
    }
  },

  async listRules(filters = {}) {
    try {
      let query = client.models.AutomationRule.list();

      if (filters.projectId) {
        query = client.models.AutomationRule.list({
          filter: { projectId: { eq: filters.projectId } },
        });
      }

      const { data: rules, errors } = await query;

      if (errors) {
        throw new Error('Failed to fetch rules');
      }

      // Parse JSON fields
      const parsedRules = rules.map(r => ({
        ...r,
        trigger: r.trigger ? JSON.parse(r.trigger) : {},
        action: r.action ? JSON.parse(r.action) : {},
      }));

      return { success: true, data: parsedRules };
    } catch (error) {
      console.error('Automation rules list error:', error);
      return { success: false, error: error.message };
    }
  },

  async updateRule(ruleId, updates) {
    try {
      const { data: rule, errors } = await client.models.AutomationRule.update({
        id: ruleId,
        ...updates,
      });

      if (errors) {
        throw new Error('Failed to update rule');
      }

      return { success: true, data: rule };
    } catch (error) {
      console.error('Automation rule update error:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteRule(ruleId) {
    try {
      const { data, errors } = await client.models.AutomationRule.delete({ id: ruleId });

      if (errors) {
        throw new Error('Failed to delete rule');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Automation rule delete error:', error);
      return { success: false, error: error.message };
    }
  },

  // Execute automation rule
  async executeRule(ruleId, taskId) {
    try {
      // Get rule
      const { data: rule } = await client.models.AutomationRule.get({ id: ruleId });
      if (!rule || !rule.enabled) return { success: false };

      const trigger = JSON.parse(rule.trigger);
      const action = JSON.parse(rule.action);

      // Execute action based on type
      switch (action.type) {
        case 'notify':
          await notificationService.create({
            userId: action.value,
            type: 'automation',
            title: 'Automation Rule Triggered',
            message: `Rule "${rule.name}" was triggered`,
            taskId,
          });
          break;

        case 'assign':
          await taskService.update(taskId, {
            assignedToId: action.value,
          });
          break;

        case 'change_status':
          await taskService.update(taskId, {
            status: action.value,
          });
          break;

        case 'change_priority':
          await taskService.update(taskId, {
            priority: action.value,
          });
          break;

        case 'add_comment':
          await commentService.create({
            taskId,
            content: action.value,
            userId: 'automation',
          });
          break;

        default:
          console.log('Unknown action type:', action.type);
      }

      // Update execution count
      await client.models.AutomationRule.update({
        id: ruleId,
        executionCount: (rule.executionCount || 0) + 1,
        lastExecuted: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Rule execution error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * SPRINT OPERATIONS
 */
export const sprintService = {
  async create(sprintData) {
    try {
      const { data: sprint, errors } = await client.models.Sprint.create({
        name: sprintData.name,
        projectId: sprintData.projectId,
        startDate: sprintData.startDate,
        endDate: sprintData.endDate,
        goal: sprintData.goal,
        totalStoryPoints: sprintData.totalStoryPoints || 0,
        status: 'ACTIVE',
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create sprint');
      }

      return { success: true, data: sprint };
    } catch (error) {
      console.error('Sprint creation error:', error);
      return { success: false, error: error.message };
    }
  },

  async get(sprintId) {
    try {
      const { data: sprint, errors } = await client.models.Sprint.get({ id: sprintId });

      if (errors) {
        throw new Error('Failed to fetch sprint');
      }

      return { success: true, data: sprint };
    } catch (error) {
      console.error('Sprint get error:', error);
      return { success: false, error: error.message };
    }
  },

  async list(projectId) {
    try {
      const { data: sprints, errors } = await client.models.Sprint.list({
        filter: { projectId: { eq: projectId } },
      });

      if (errors) {
        throw new Error('Failed to fetch sprints');
      }

      return { success: true, data: sprints };
    } catch (error) {
      console.error('Sprint list error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * ANALYTICS OPERATIONS
 */
export const analyticsService = {
  async getBurndown({ projectId, sprintId }) {
    try {
      // Fetch sprint
      const sprintResult = await sprintService.get(sprintId);
      if (!sprintResult.success) {
        throw new Error('Sprint not found');
      }

      const sprint = sprintResult.data;
      const startDate = new Date(sprint.startDate);
      const endDate = new Date(sprint.endDate);

      // Fetch tasks in sprint
      const tasksResult = await taskService.list({ projectId });
      const tasks = tasksResult.data.filter(t => t.sprintId === sprintId);

      // Calculate burndown data
      const burndownData = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const completedByDate = tasks.filter(t => 
          t.status === 'DONE' && 
          new Date(t.completedAt) <= currentDate
        );

        const remainingPoints = sprint.totalStoryPoints - 
          completedByDate.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        burndownData.push({
          date: currentDate.toLocaleDateString(),
          remaining: remainingPoints,
          completed: sprint.totalStoryPoints - remainingPoints,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return { success: true, data: burndownData };
    } catch (error) {
      console.error('Burndown calculation error:', error);
      return { success: false, error: error.message };
    }
  },

  async getVelocity({ projectId, sprintCount = 5 }) {
    try {
      const sprintsResult = await sprintService.list(projectId);
      const sprints = sprintsResult.data
        .filter(s => s.status === 'COMPLETED')
        .slice(-sprintCount);

      const velocities = sprints.map(sprint => ({
        sprint: sprint.name,
        velocity: sprint.completedStoryPoints || 0,
      }));

      const avgVelocity = velocities.reduce((sum, v) => sum + v.velocity, 0) / velocities.length;

      return { 
        success: true, 
        data: {
          velocities,
          average: avgVelocity,
        }
      };
    } catch (error) {
      console.error('Velocity calculation error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * USER OPERATIONS
 */
export const userService = {
  async list() {
    try {
      const { data: users, errors } = await client.models.User.list();

      if (errors) {
        throw new Error('Failed to fetch users');
      }

      return { success: true, data: users };
    } catch (error) {
      console.error('User list error:', error);
      return { success: false, error: error.message };
    }
  },

  async get(userId) {
    try {
      const { data: user, errors } = await client.models.User.get({ id: userId });

      if (errors) {
        throw new Error('Failed to fetch user');
      }

      return { success: true, data: user };
    } catch (error) {
      console.error('User get error:', error);
      return { success: false, error: error.message };
    }
  },

  async search(query) {
    try {
      const { data: users, errors } = await client.models.User.list();

      if (errors) {
        throw new Error('Failed to search users');
      }

      // Filter by query
      const filtered = users.filter(user => 
        user.first_name?.toLowerCase().includes(query.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase())
      );

      return { success: true, data: filtered };
    } catch (error) {
      console.error('User search error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Export all services
const amplifyDataService = {
  tasks: taskService,
  projects: {}, // Keep existing project service
  storage: storageService,
  comments: commentService,
  channels: channelService,
  messages: messageService,
  notifications: notificationService,
  templates: templateService,
  automation: automationService,
  sprints: sprintService,
  analytics: analyticsService,
  users: userService,
};

export default amplifyDataService;
