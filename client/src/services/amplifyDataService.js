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
      const { data: project, errors } = await client.models.Project.create({
        name: projectData.name,
        description: projectData.description,
        status: projectData.status || 'PLANNING',
        priority: projectData.priority || 'MEDIUM',
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        budget: projectData.budget,
        color: projectData.color || '#3B82F6',
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
      const { data: task, errors } = await client.models.Task.create({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'TODO',
        priority: taskData.priority || 'MEDIUM',
        projectId: taskData.projectId,
        assignedToId: taskData.assignedToId,
        createdById: taskData.createdById,
        dueDate: taskData.dueDate,
        estimatedHours: taskData.estimatedHours,
        tags: taskData.tags || [],
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
      const stats = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'DONE').length,
        inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        todoTasks: tasks.filter(t => t.status === 'TODO').length,
        overdueTasks: tasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < new Date() && t.status !== 'DONE';
        }).length,
        completionRate: tasks.length > 0 
          ? Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100)
          : 0,
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

export default {
  projects: projectService,
  tasks: taskService,
  dashboard: dashboardService,
};
