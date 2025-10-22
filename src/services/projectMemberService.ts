/**
 * Project Member Service
 * Handles project member operations
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface AddMemberInput {
  projectId: string;
  userId: string;
  role: MemberRole;
}

export const projectMemberService = {
  /**
   * Get members by project
   */
  async getByProject(projectId: string) {
    try {
      const { data, errors } = await client.models.ProjectMember.list({
        filter: { projectId: { eq: projectId } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error getting project members:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to get members' 
      };
    }
  },

  /**
   * Add member to project
   */
  async addMember(input: AddMemberInput) {
    try {
      const { data, errors } = await client.models.ProjectMember.create({
        projectId: input.projectId,
        userId: input.userId,
        role: input.role,
        joinedAt: new Date().toISOString(),
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error adding member:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to add member' 
      };
    }
  },

  /**
   * Update member role
   */
  async updateRole(memberId: string, role: MemberRole) {
    try {
      const { data, errors } = await client.models.ProjectMember.update({
        id: memberId,
        role,
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating member role:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to update role' 
      };
    }
  },

  /**
   * Remove member from project
   */
  async removeMember(memberId: string) {
    try {
      const { data, errors } = await client.models.ProjectMember.delete({
        id: memberId,
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error removing member:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to remove member' 
      };
    }
  },

  /**
   * Check if user is member of project
   */
  async isMember(projectId: string, userId: string) {
    try {
      const { data } = await this.getByProject(projectId);
      
      if (!data) return false;
      
      return data.some(member => member.userId === userId);
    } catch (error) {
      console.error('Error checking membership:', error);
      return false;
    }
  },
};
