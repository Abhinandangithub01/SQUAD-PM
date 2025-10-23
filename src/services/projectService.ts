/**
 * Project Service
 * Handles all project-related API operations
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  startDate?: string;
  endDate?: string;
  ownerId: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED' | 'ON_HOLD';
  startDate?: string;
  endDate?: string;
}

export const projectService = {
  /**
   * Get all projects
   */
  async list() {
    try {
      const { data, errors } = await client.models.Project.list();
      if (errors) {
        throw new Error(errors[0].message);
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error listing projects:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to list projects' };
    }
  },

  /**
   * Get project by ID
   */
  async get(id: string) {
    try {
      const { data, errors } = await client.models.Project.get({ id });
      if (errors) {
        throw new Error(errors[0].message);
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error getting project:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get project' };
    }
  },

  /**
   * Create new project
   */
  async create(input: CreateProjectInput) {
    try {
      // Validate required fields
      if (!input.ownerId) {
        throw new Error('Owner ID is required');
      }

      // Use a default organization ID for now (single-tenant mode)
      // In production, this should come from the user's organization
      const defaultOrgId = 'default-org-' + input.ownerId;

      const projectData: any = {
        name: input.name,
        description: input.description || '',
        color: input.color || '#3B82F6',
        status: 'ACTIVE',
        ownerId: input.ownerId,
        organizationId: defaultOrgId, // Required field
      };

      // Only add optional dates if provided
      if (input.startDate) {
        projectData.startDate = input.startDate;
      }
      if (input.endDate) {
        projectData.endDate = input.endDate;
      }

      console.log('Creating project with data:', projectData);

      const { data, errors } = await client.models.Project.create(projectData);

      if (errors) {
        console.error('GraphQL errors:', errors);
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating project:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create project' };
    }
  },

  /**
   * Update existing project
   */
  async update(id: string, input: UpdateProjectInput) {
    try {
      const updateData: any = {
        id,
        ...input,
      };
      const { data, errors } = await client.models.Project.update(updateData);

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating project:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to update project' };
    }
  },

  /**
   * Delete project (soft delete by archiving)
   */
  async delete(id: string) {
    try {
      // Soft delete by archiving
      const deleteData: any = {
        id,
        status: 'ARCHIVED',
      };
      const { data, errors } = await client.models.Project.update(deleteData);

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to delete project' };
    }
  },

  /**
   * Hard delete project (permanent)
   */
  async hardDelete(id: string) {
    try {
      const { data, errors } = await client.models.Project.delete({ id });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error hard deleting project:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to delete project' };
    }
  },

  /**
   * Archive project
   */
  async archive(id: string) {
    return this.update(id, { status: 'ARCHIVED' });
  },

  /**
   * Restore archived project
   */
  async restore(id: string) {
    return this.update(id, { status: 'ACTIVE' });
  },

  /**
   * Get projects by owner
   */
  async getByOwner(ownerId: string) {
    try {
      const { data, errors } = await client.models.Project.list({
        filter: { ownerId: { eq: ownerId } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error getting projects by owner:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get projects' };
    }
  },

  /**
   * Get projects by status
   */
  async getByStatus(status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED' | 'ON_HOLD') {
    try {
      const { data, errors } = await client.models.Project.list({
        filter: { status: { eq: status } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error getting projects by status:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get projects' };
    }
  },
};
