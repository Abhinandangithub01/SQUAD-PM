/**
 * User Service
 * Handles all user-related API operations
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  role?: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  avatarUrl?: string;
}

export const userService = {
  /**
   * Get all users
   */
  async list() {
    try {
      const { data, errors } = await client.models.User.list();
      if (errors) {
        throw new Error(errors[0].message);
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error listing users:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to list users' };
    }
  },

  /**
   * Get user by ID
   */
  async get(id: string) {
    try {
      const { data, errors } = await client.models.User.get({ id });
      if (errors) {
        throw new Error(errors[0].message);
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error getting user:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get user' };
    }
  },

  /**
   * Update user
   */
  async update(id: string, input: UpdateUserInput) {
    try {
      const { data, errors } = await client.models.User.update({
        id,
        ...input,
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating user:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update user' };
    }
  },

  /**
   * Delete user
   */
  async delete(id: string) {
    try {
      const { data, errors } = await client.models.User.delete({ id });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to delete user' };
    }
  },

  /**
   * Get users by role
   */
  async getByRole(role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER') {
    try {
      const { data, errors } = await client.models.User.list({
        filter: { role: { eq: role } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error getting users by role:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get users' };
    }
  },
};
