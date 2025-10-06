/**
 * Amplify Data Service
 * Centralized service for all AWS Amplify Data operations
 * Replaces the old Express API calls
 */

import { generateClient } from 'aws-amplify/data';

const client = generateClient();

/**
 * PROJECT OPERATIONS
 */

export const projectService = {
  // Create a new project
  async create(projectData) {
    try {
      // Map status to match schema enum values
      const statusMap = {
        'PLANNING': 'ACTIVE',
        'IN_PROGRESS': 'ACTIVE',
        'COMPLETED': 'COMPLETED',
        'ON_HOLD': 'ON_HOLD',
        'ARCHIVED': 'ARCHIVED',
      };
      
      const { data: project, errors } = await client.models.Project.create({
        name: projectData.name,
        description: projectData.description,
        status: statusMap[projectData.status] || 'ACTIVE',
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        color: projectData.color || '#3B82F6',
        ownerId: projectData.ownerId || 'anonymous',
      });

      if (errors) {
        console.error('Error creating project:', errors);
        throw new Error(errors[0]?.message || 'Failed to create project');
      }

      return { success: true, data: project };
    } catch (error) {
      console.error('Project creation error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all projects
  async list() {
    try {
      const { data: projects, errors } = await client.models.Project.list();

      if (errors) {
        console.error('Error fetching projects:', errors);
        throw new Error('Failed to fetch projects');
      }

      return { success: true, data: projects };
    } catch (error) {
      console.error('Project list error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get a single project by ID
  async get(id) {
    try {
      const { data: project, errors } = await client.models.Project.get({ id });

      if (errors) {
        console.error('Error fetching project:', errors);
        throw new Error('Failed to fetch project');
      }

      return { success: true, data: project };
    } catch (error) {
      console.error('Project get error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update a project
  async update(id, updates) {
    try {
      const { data: project, errors } = await client.models.Project.update({
        id,
        ...updates,
      });

      if (errors) {
        console.error('Error updating project:', errors);
        throw new Error('Failed to update project');
      }

      return { success: true, data: project };
    } catch (error) {
      console.error('Project update error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete a project
  async delete(id) {
    try {
      const { data, errors } = await client.models.Project.delete({ id });

      if (errors) {
        console.error('Error deleting project:', errors);
        throw new Error('Failed to delete project');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Project delete error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * TASK OPERATIONS
 */

export const taskService = {
  // Create a new task
  async create(taskData) {
    try {
      // Validate required fields
      if (!taskData.title || !taskData.title.trim()) {
        throw new Error('Task title is required');
      }
      if (!taskData.projectId) {
        throw new Error('Project ID is required');
      }
      if (!taskData.createdById) {
        throw new Error('Created By ID is required');
      }
      if (!taskData.status) {
        throw new Error('Task status is required');
      }

      const { data: task, errors } = await client.models.Task.create({
        title: taskData.title.trim(),
        description: taskData.description?.trim() || '',
        status: taskData.status.toUpperCase(),
        priority: taskData.priority ? taskData.priority.toUpperCase() : 'MEDIUM',
        projectId: taskData.projectId,
        assignedToId: taskData.assignedToId || null,
        dueDate: taskData.dueDate || null,
        tags: Array.isArray(taskData.tags) ? taskData.tags : [],
        createdById: taskData.createdById,
      });

      if (errors) {
        console.error('Error creating task:', errors);
        throw new Error(errors[0]?.message || 'Failed to create task');
      }

      return { success: true, data: task };
    } catch (error) {
      console.error('Task creation error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all tasks
  async list(filters = {}) {
    try {
      let query = client.models.Task.list();

      // Apply filters if provided
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

      return { success: true, data: tasks };
    } catch (error) {
      console.error('Task list error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get a single task by ID
  async get(id) {
    try {
      const { data: task, errors } = await client.models.Task.get({ id });

      if (errors) {
        console.error('Error fetching task:', errors);
        throw new Error('Failed to fetch task');
      }

      return { success: true, data: task };
    } catch (error) {
      console.error('Task get error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update a task
  async update(id, updates) {
    try {
      const { data: task, errors } = await client.models.Task.update({
        id,
        ...updates,
      });

      if (errors) {
        console.error('Error updating task:', errors);
        throw new Error('Failed to update task');
      }

      return { success: true, data: task };
    } catch (error) {
      console.error('Task update error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete a task
  async delete(id) {
    try {
      const { data, errors } = await client.models.Task.delete({ id });

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
};

/**
 * DASHBOARD STATISTICS
 */

export const dashboardService = {
  // Get dashboard statistics
  async getStats() {
    try {
      // Fetch projects and tasks in parallel
      const [projectsResult, tasksResult] = await Promise.all([
        client.models.Project.list(),
        client.models.Task.list(),
      ]);

      const projects = projectsResult.data || [];
      const tasks = tasksResult.data || [];

      // Calculate statistics
      const completedTasks = tasks.filter(t => t.status === 'DONE').length;
      const completionRate = tasks.length > 0 
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;

      const stats = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
        totalTasks: tasks.length,
        completedTasks,
        inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        todoTasks: tasks.filter(t => t.status === 'TODO').length,
        overdueTasks: tasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < new Date() && t.status !== 'DONE';
        }).length,
        completionRate,
        // Analytics-compatible format
        overview: {
          total_projects: projects.length,
          total_tasks: tasks.length,
          completed_tasks: completedTasks,
          total_issues: tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length,
          completion_rate: completionRate,
          team_members: 0, // Will be populated when we have team data
        },
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get recent activity
  async getRecentActivity() {
    try {
      const { data: tasks } = await client.models.Task.list();
      
      // Sort by creation date and get the 10 most recent
      const recentTasks = (tasks || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      return { success: true, data: recentTasks };
    } catch (error) {
      console.error('Recent activity error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * NOTIFICATION OPERATIONS
 */

export const notificationService = {
  // Get all notifications for current user
  async list(userId) {
    try {
      const { data: notifications, errors } = await client.models.Notification.list({
        filter: { userId: { eq: userId } },
      });

      if (errors) {
        console.error('Error fetching notifications:', errors);
        throw new Error('Failed to fetch notifications');
      }

      return { success: true, data: notifications };
    } catch (error) {
      console.error('Notification list error:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark notification as read
  async markAsRead(id) {
    try {
      const { data, errors } = await client.models.Notification.update({
        id,
        read: true,
      });

      if (errors) {
        console.error('Error updating notification:', errors);
        throw new Error('Failed to update notification');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Notification update error:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark all as read
  async markAllAsRead(userId) {
    try {
      const { data: notifications } = await client.models.Notification.list({
        filter: { userId: { eq: userId }, read: { eq: false } },
      });

      const updates = (notifications || []).map(notification =>
        client.models.Notification.update({
          id: notification.id,
          read: true,
        })
      );

      await Promise.all(updates);
      return { success: true };
    } catch (error) {
      console.error('Mark all read error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * MESSAGE/CHAT OPERATIONS
 */

export const chatService = {
  // Send a message
  async sendMessage(messageData) {
    try {
      const { data: message, errors } = await client.models.Message.create({
        content: messageData.content,
        userId: messageData.userId,
        projectId: messageData.projectId,
        channelId: messageData.channelId,
      });

      if (errors) {
        console.error('Error sending message:', errors);
        throw new Error('Failed to send message');
      }

      return { success: true, data: message };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get messages for a channel
  async getMessages(channelId) {
    try {
      const { data: messages, errors } = await client.models.Message.list({
        filter: { channelId: { eq: channelId } },
      });

      if (errors) {
        console.error('Error fetching messages:', errors);
        throw new Error('Failed to fetch messages');
      }

      // Sort by creation date
      const sortedMessages = (messages || []).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      return { success: true, data: sortedMessages };
    } catch (error) {
      console.error('Get messages error:', error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to new messages (real-time)
  subscribeToMessages(channelId, callback) {
    const subscription = client.models.Message.onCreate({
      filter: { channelId: { eq: channelId } },
    }).subscribe({
      next: (data) => callback(data),
      error: (error) => console.error('Subscription error:', error),
    });

    return subscription;
  },
};

export default {
  projects: projectService,
  tasks: taskService,
  dashboard: dashboardService,
  notifications: notificationService,
  chat: chatService,
};
