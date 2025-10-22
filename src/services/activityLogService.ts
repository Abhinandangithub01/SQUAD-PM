/**
 * Activity Log Service
 * Handles activity logging and tracking
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface CreateActivityInput {
  userId: string;
  projectId?: string;
  taskId?: string;
  action: string;
  entityType?: string;
  entityName?: string;
  fromStatus?: string;
  toStatus?: string;
}

export const activityLogService = {
  /**
   * Create activity log
   */
  async create(input: CreateActivityInput) {
    try {
      const activityData: any = {
        userId: input.userId,
        action: input.action,
      };

      if (input.projectId) activityData.projectId = input.projectId;
      if (input.taskId) activityData.taskId = input.taskId;
      if (input.entityType) activityData.entityType = input.entityType;
      if (input.entityName) activityData.entityName = input.entityName;
      if (input.fromStatus) activityData.fromStatus = input.fromStatus;
      if (input.toStatus) activityData.toStatus = input.toStatus;

      const { data, errors } = await client.models.ActivityLog.create(activityData);

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating activity log:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to create activity log' 
      };
    }
  },

  /**
   * Get activities by project
   */
  async getByProject(projectId: string, limit: number = 50) {
    try {
      const { data, errors } = await client.models.ActivityLog.list({
        filter: { projectId: { eq: projectId } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      // Sort by creation date (newest first) and limit
      const sortedData = (data || [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      return { data: sortedData, error: null };
    } catch (error) {
      console.error('Error getting project activities:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to get activities' 
      };
    }
  },

  /**
   * Get activities by user
   */
  async getByUser(userId: string, limit: number = 50) {
    try {
      const { data, errors } = await client.models.ActivityLog.list({
        filter: { userId: { eq: userId } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      // Sort by creation date (newest first) and limit
      const sortedData = (data || [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      return { data: sortedData, error: null };
    } catch (error) {
      console.error('Error getting user activities:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to get activities' 
      };
    }
  },

  /**
   * Get recent activities (all)
   */
  async getRecent(limit: number = 20) {
    try {
      const { data, errors } = await client.models.ActivityLog.list();

      if (errors) {
        throw new Error(errors[0].message);
      }

      // Sort by creation date (newest first) and limit
      const sortedData = (data || [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      return { data: sortedData, error: null };
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to get activities' 
      };
    }
  },

  /**
   * Helper: Log project creation
   */
  async logProjectCreated(userId: string, projectId: string, projectName: string) {
    return this.create({
      userId,
      projectId,
      action: 'created',
      entityType: 'project',
      entityName: projectName,
    });
  },

  /**
   * Helper: Log task creation
   */
  async logTaskCreated(userId: string, projectId: string, taskId: string, taskTitle: string) {
    return this.create({
      userId,
      projectId,
      taskId,
      action: 'created',
      entityType: 'task',
      entityName: taskTitle,
    });
  },

  /**
   * Helper: Log task status change
   */
  async logTaskStatusChanged(
    userId: string, 
    projectId: string, 
    taskId: string, 
    taskTitle: string,
    fromStatus: string,
    toStatus: string
  ) {
    return this.create({
      userId,
      projectId,
      taskId,
      action: 'updated status',
      entityType: 'task',
      entityName: taskTitle,
      fromStatus,
      toStatus,
    });
  },

  /**
   * Helper: Log comment added
   */
  async logCommentAdded(userId: string, projectId: string, taskId: string, taskTitle: string) {
    return this.create({
      userId,
      projectId,
      taskId,
      action: 'commented on',
      entityType: 'task',
      entityName: taskTitle,
    });
  },

  /**
   * Get activity icon
   */
  getActivityIcon(action: string): string {
    const icons: Record<string, string> = {
      'created': '✨',
      'updated': '✏️',
      'deleted': '🗑️',
      'commented on': '💬',
      'updated status': '🔄',
      'assigned': '👤',
      'completed': '✅',
    };
    return icons[action] || '📝';
  },
};
