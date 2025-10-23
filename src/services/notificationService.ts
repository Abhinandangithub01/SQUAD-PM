/**
 * Notification Service
 * Handles all notification operations
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export type NotificationType = 
  | 'TASK_ASSIGNED' 
  | 'TASK_COMPLETED' 
  | 'COMMENT_ADDED' 
  | 'MENTION' 
  | 'PROJECT_INVITE' 
  | 'DEADLINE_REMINDER';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkTo?: string;
}

export const notificationService = {
  /**
   * Get notifications for user
   */
  async getByUser(userId: string) {
    try {
      const { data, errors } = await client.models.Notification.list({
        filter: { userId: { eq: userId } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      // Sort by creation date (newest first)
      const sortedData = (data || []).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return { data: sortedData, error: null };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to get notifications' 
      };
    }
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string) {
    try {
      const filter: any = { 
        userId: { eq: userId },
        read: { eq: false }
      };
      const { data, errors } = await client.models.Notification.list({
        filter,
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { count: data?.length || 0, error: null };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { 
        count: 0, 
        error: error instanceof Error ? error.message : 'Failed to get unread count' 
      };
    }
  },

  /**
   * Create notification
   */
  async create(input: CreateNotificationInput) {
    try {
      const notificationData: any = {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        linkTo: input.linkTo || '',
        read: false,
      };
      const { data, errors } = await client.models.Notification.create(notificationData);

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create notification' 
      };
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string) {
    try {
      const updateData: any = {
        id,
        read: true,
      };
      const { data, errors } = await client.models.Notification.update(updateData);

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to mark as read' 
      };
    }
  },

  /**
   * Mark all as read
   */
  async markAllAsRead(userId: string) {
    try {
      const { data: notifications } = await this.getByUser(userId);
      
      if (!notifications) {
        return { success: false, error: 'No notifications found' };
      }

      const unreadNotifications = notifications.filter(n => !n.read);
      
      await Promise.all(
        unreadNotifications.map(notification => 
          this.markAsRead(notification.id)
        )
      );

      return { success: true, error: null };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to mark all as read' 
      };
    }
  },

  /**
   * Delete notification
   */
  async delete(id: string) {
    try {
      const { data, errors } = await client.models.Notification.delete({ id });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to delete notification' 
      };
    }
  },

  /**
   * Helper: Create task assignment notification
   */
  async notifyTaskAssignment(userId: string, taskTitle: string, taskId: string) {
    return this.create({
      userId,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You have been assigned to: ${taskTitle}`,
      linkTo: `/dashboard/tasks/${taskId}`,
    });
  },

  /**
   * Helper: Create comment notification
   */
  async notifyComment(userId: string, taskTitle: string, taskId: string, commenterName: string) {
    return this.create({
      userId,
      type: 'COMMENT_ADDED',
      title: 'New Comment',
      message: `${commenterName} commented on: ${taskTitle}`,
      linkTo: `/dashboard/tasks/${taskId}`,
    });
  },

  /**
   * Helper: Create mention notification
   */
  async notifyMention(userId: string, taskTitle: string, taskId: string, mentionerName: string) {
    return this.create({
      userId,
      type: 'MENTION',
      title: 'You were mentioned',
      message: `${mentionerName} mentioned you in: ${taskTitle}`,
      linkTo: `/dashboard/tasks/${taskId}`,
    });
  },

  /**
   * Helper: Create project invite notification
   */
  async notifyProjectInvite(userId: string, projectName: string, projectId: string) {
    return this.create({
      userId,
      type: 'PROJECT_INVITE',
      title: 'Project Invitation',
      message: `You have been invited to: ${projectName}`,
      linkTo: `/dashboard/projects/${projectId}`,
    });
  },

  /**
   * Get notification icon
   */
  getNotificationIcon(type: NotificationType): string {
    const icons = {
      TASK_ASSIGNED: '📋',
      TASK_COMPLETED: '✅',
      COMMENT_ADDED: '💬',
      MENTION: '👤',
      PROJECT_INVITE: '📁',
      DEADLINE_REMINDER: '⏰',
    };
    return icons[type] || '🔔';
  },

  /**
   * Get notification color
   */
  getNotificationColor(type: NotificationType): string {
    const colors = {
      TASK_ASSIGNED: 'bg-blue-100 text-blue-800',
      TASK_COMPLETED: 'bg-green-100 text-green-800',
      COMMENT_ADDED: 'bg-purple-100 text-purple-800',
      MENTION: 'bg-yellow-100 text-yellow-800',
      PROJECT_INVITE: 'bg-indigo-100 text-indigo-800',
      DEADLINE_REMINDER: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  },
};
