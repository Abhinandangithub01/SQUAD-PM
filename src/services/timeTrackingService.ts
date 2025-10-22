/**
 * Time Tracking Service
 * Handles time entry operations
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface CreateTimeEntryInput {
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  billable?: boolean;
}

export const timeTrackingService = {
  /**
   * Start timer for task
   */
  async startTimer(taskId: string, userId: string, description?: string) {
    try {
      // Check if there's already an active timer
      const { data: existingTimers } = await client.models.TimeEntry.list({
        filter: {
          userId: { eq: userId },
          endTime: { attributeExists: false },
        },
      });

      if (existingTimers && existingTimers.length > 0) {
        return {
          data: null,
          error: 'You already have an active timer. Please stop it first.',
        };
      }

      const { data, errors } = await client.models.TimeEntry.create({
        taskId,
        userId,
        startTime: new Date().toISOString(),
        description: description || '',
        billable: false,
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error starting timer:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to start timer',
      };
    }
  },

  /**
   * Stop timer
   */
  async stopTimer(timeEntryId: string) {
    try {
      const endTime = new Date().toISOString();

      // Get the time entry to calculate duration
      const { data: timeEntry } = await client.models.TimeEntry.get({
        id: timeEntryId,
      });

      if (!timeEntry) {
        throw new Error('Time entry not found');
      }

      // Calculate duration in minutes
      const start = new Date(timeEntry.startTime);
      const end = new Date(endTime);
      const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);

      const { data, errors } = await client.models.TimeEntry.update({
        id: timeEntryId,
        endTime,
        duration,
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error stopping timer:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to stop timer',
      };
    }
  },

  /**
   * Create manual time entry
   */
  async createManualEntry(input: CreateTimeEntryInput) {
    try {
      let duration = input.duration;

      // Calculate duration if not provided
      if (!duration && input.startTime && input.endTime) {
        const start = new Date(input.startTime);
        const end = new Date(input.endTime);
        duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
      }

      const { data, errors } = await client.models.TimeEntry.create({
        taskId: input.taskId,
        userId: input.userId,
        startTime: input.startTime,
        endTime: input.endTime || new Date().toISOString(),
        duration: duration || 0,
        description: input.description || '',
        billable: input.billable || false,
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating time entry:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create time entry',
      };
    }
  },

  /**
   * Get time entries by task
   */
  async getByTask(taskId: string) {
    try {
      const { data, errors } = await client.models.TimeEntry.list({
        filter: { taskId: { eq: taskId } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      // Sort by start time (newest first)
      const sortedData = (data || []).sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      return { data: sortedData, error: null };
    } catch (error) {
      console.error('Error getting time entries:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get time entries',
      };
    }
  },

  /**
   * Get time entries by user
   */
  async getByUser(userId: string) {
    try {
      const { data, errors } = await client.models.TimeEntry.list({
        filter: { userId: { eq: userId } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      // Sort by start time (newest first)
      const sortedData = (data || []).sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      return { data: sortedData, error: null };
    } catch (error) {
      console.error('Error getting time entries:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get time entries',
      };
    }
  },

  /**
   * Get active timer for user
   */
  async getActiveTimer(userId: string) {
    try {
      const { data, errors } = await client.models.TimeEntry.list({
        filter: {
          userId: { eq: userId },
          endTime: { attributeExists: false },
        },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data: data?.[0] || null, error: null };
    } catch (error) {
      console.error('Error getting active timer:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get active timer',
      };
    }
  },

  /**
   * Delete time entry
   */
  async delete(timeEntryId: string) {
    try {
      const { data, errors } = await client.models.TimeEntry.delete({
        id: timeEntryId,
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error deleting time entry:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete time entry',
      };
    }
  },

  /**
   * Calculate total time for task
   */
  async getTotalTimeForTask(taskId: string): Promise<number> {
    try {
      const { data } = await this.getByTask(taskId);
      
      if (!data) return 0;

      return data.reduce((total, entry) => total + (entry.duration || 0), 0);
    } catch (error) {
      console.error('Error calculating total time:', error);
      return 0;
    }
  },

  /**
   * Format duration (minutes to hours:minutes)
   */
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    }
    
    return `${hours}h ${mins}m`;
  },
};
