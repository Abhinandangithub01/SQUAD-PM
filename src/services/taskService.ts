/**
 * Task Service
 * Handles all task-related API operations
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdById: string;
  assignedToId?: string;
  dueDate?: string;
  startDate?: string;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedToId?: string;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  tags?: string[];
  position?: number;
  columnId?: string;
}

export const taskService = {
  /**
   * Get all tasks
   */
  async list() {
    try {
      const { data, errors } = await client.models.Task.list();
      if (errors) {
        throw new Error(errors[0].message);
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error listing tasks:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to list tasks' };
    }
  },

  /**
   * Get task by ID
   */
  async get(id: string) {
    try {
      const { data, errors } = await client.models.Task.get({ id });
      if (errors) {
        throw new Error(errors[0].message);
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error getting task:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get task' };
    }
  },

  /**
   * Create new task
   */
  async create(input: CreateTaskInput) {
    try {
      const taskData: any = {
        title: input.title,
        description: input.description || '',
        projectId: input.projectId,
        status: input.status || 'TODO',
        priority: input.priority || 'MEDIUM',
        createdById: input.createdById,
        tags: input.tags || [],
      };

      // Only add optional fields if provided
      if (input.assignedToId) taskData.assignedToId = input.assignedToId;
      if (input.dueDate) taskData.dueDate = input.dueDate;
      if (input.startDate) taskData.startDate = input.startDate;

      console.log('Creating task with data:', taskData);

      const { data, errors } = await client.models.Task.create(taskData);

      if (errors) {
        console.error('Task creation errors:', errors);
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating task:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create task' };
    }
  },

  /**
   * Update existing task
   */
  async update(id: string, input: UpdateTaskInput) {
    try {
      const updateData: any = { id, ...input };

      // If status is DONE, set completedAt
      if (input.status === 'DONE' && !input.completedAt) {
        updateData.completedAt = new Date().toISOString();
      }

      const { data, errors } = await client.models.Task.update(updateData);

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating task:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update task' };
    }
  },

  /**
   * Delete task
   */
  async delete(id: string) {
    try {
      const { data, errors } = await client.models.Task.delete({ id });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to delete task' };
    }
  },

  /**
   * Assign task to user
   */
  async assign(taskId: string, userId: string) {
    return this.update(taskId, { assignedToId: userId });
  },

  /**
   * Update task status
   */
  async updateStatus(taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED') {
    return this.update(taskId, { status });
  },

  /**
   * Update task priority
   */
  async updatePriority(taskId: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') {
    return this.update(taskId, { priority });
  },

  /**
   * Get tasks by project
   */
  async getByProject(projectId: string) {
    try {
      const { data, errors } = await client.models.Task.list({
        filter: { projectId: { eq: projectId } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error getting tasks by project:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get tasks' };
    }
  },

  /**
   * Get tasks by assignee
   */
  async getByAssignee(userId: string) {
    try {
      const { data, errors } = await client.models.Task.list({
        filter: { assignedToId: { eq: userId } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error getting tasks by assignee:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get tasks' };
    }
  },

  /**
   * Get tasks by status
   */
  async getByStatus(status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED') {
    try {
      const { data, errors } = await client.models.Task.list({
        filter: { status: { eq: status } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error getting tasks by status:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get tasks' };
    }
  },

  /**
   * Get overdue tasks
   */
  async getOverdue() {
    try {
      const now = new Date().toISOString();
      const { data, errors } = await client.models.Task.list({
        filter: {
          dueDate: { lt: now },
          status: { ne: 'DONE' },
        },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error getting overdue tasks:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get overdue tasks' };
    }
  },

  /**
   * Bulk update tasks
   */
  async bulkUpdate(taskIds: string[], input: UpdateTaskInput) {
    try {
      const promises = taskIds.map((id) => this.update(id, input));
      const results = await Promise.all(promises);
      
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} tasks`);
      }

      return { data: results.map((r) => r.data), error: null };
    } catch (error) {
      console.error('Error bulk updating tasks:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to bulk update tasks' };
    }
  },

  /**
   * Bulk delete tasks
   */
  async bulkDelete(taskIds: string[]) {
    try {
      const promises = taskIds.map((id) => this.delete(id));
      const results = await Promise.all(promises);
      
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to delete ${errors.length} tasks`);
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('Error bulk deleting tasks:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to bulk delete tasks' };
    }
  },
};
