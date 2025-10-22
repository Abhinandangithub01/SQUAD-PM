/**
 * Comment Service
 * Handles all comment-related API operations
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface CreateCommentInput {
  taskId: string;
  userId: string;
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}

export const commentService = {
  /**
   * Get comments by task
   */
  async getByTask(taskId: string) {
    try {
      const { data, errors } = await client.models.Comment.list({
        filter: { taskId: { eq: taskId } },
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
      console.error('Error getting comments:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get comments' };
    }
  },

  /**
   * Create new comment
   */
  async create(input: CreateCommentInput) {
    try {
      const commentData: any = {
        taskId: input.taskId,
        userId: input.userId,
        content: input.content,
      };
      const { data, errors } = await client.models.Comment.create(commentData);

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating comment:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create comment' };
    }
  },

  /**
   * Update comment
   */
  async update(id: string, input: UpdateCommentInput) {
    try {
      const updateData: any = {
        id,
        content: input.content,
      };
      const { data, errors } = await client.models.Comment.update(updateData);

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating comment:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update comment' };
    }
  },

  /**
   * Delete comment
   */
  async delete(id: string) {
    try {
      const { data, errors } = await client.models.Comment.delete({ id });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to delete comment' };
    }
  },

  /**
   * Get comment by ID
   */
  async get(id: string) {
    try {
      const { data, errors } = await client.models.Comment.get({ id });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error getting comment:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get comment' };
    }
  },
};
