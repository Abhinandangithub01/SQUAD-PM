import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

const client = generateClient();

// Projects API
export const projectsApi = {
  getAll: async () => {
    try {
      const result = await client.graphql({
        query: `
          query ListProjects {
            listProjects {
              items {
                id
                name
                description
                color
                status
                startDate
                endDate
                ownerId
                createdAt
                updatedAt
              }
            }
          }
        `
      });
      return result.data.listProjects.items;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const result = await client.graphql({
        query: `
          query GetProject($id: ID!) {
            getProject(id: $id) {
              id
              name
              description
              color
              status
              startDate
              endDate
              ownerId
              members {
                items {
                  id
                  userId
                  role
                  user {
                    id
                    firstName
                    lastName
                    email
                    avatarUrl
                  }
                }
              }
              tasks {
                items {
                  id
                  title
                  status
                  priority
                  dueDate
                }
              }
              createdAt
              updatedAt
            }
          }
        `,
        variables: { id }
      });
      return result.data.getProject;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  create: async (project) => {
    try {
      const result = await client.graphql({
        query: `
          mutation CreateProject($input: CreateProjectInput!) {
            createProject(input: $input) {
              id
              name
              description
              color
              status
              startDate
              endDate
              ownerId
              createdAt
              updatedAt
            }
          }
        `,
        variables: { input: project }
      });
      return result.data.createProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  update: async (id, updates) => {
    try {
      const result = await client.graphql({
        query: `
          mutation UpdateProject($input: UpdateProjectInput!) {
            updateProject(input: $input) {
              id
              name
              description
              color
              status
              startDate
              endDate
              updatedAt
            }
          }
        `,
        variables: { input: { id, ...updates } }
      });
      return result.data.updateProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await client.graphql({
        query: `
          mutation DeleteProject($input: DeleteProjectInput!) {
            deleteProject(input: $input) {
              id
            }
          }
        `,
        variables: { input: { id } }
      });
      return result.data.deleteProject;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },
};

// Tasks API
export const tasksApi = {
  getByProject: async (projectId) => {
    try {
      const result = await client.graphql({
        query: `
          query TasksByProject($projectId: ID!) {
            listTasks(filter: { projectId: { eq: $projectId } }) {
              items {
                id
                title
                description
                status
                priority
                dueDate
                projectId
                createdById
                assignedToId
                columnId
                position
                tags
                createdAt
                updatedAt
                assignedTo {
                  id
                  firstName
                  lastName
                  email
                  avatarUrl
                }
                comments {
                  items {
                    id
                    content
                    createdAt
                    user {
                      firstName
                      lastName
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { projectId }
      });
      return result.data.listTasks.items;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const result = await client.graphql({
        query: `
          query GetTask($id: ID!) {
            getTask(id: $id) {
              id
              title
              description
              status
              priority
              dueDate
              projectId
              createdById
              assignedToId
              columnId
              position
              tags
              createdAt
              updatedAt
              assignedTo {
                id
                firstName
                lastName
                email
                avatarUrl
              }
              createdBy {
                id
                firstName
                lastName
              }
              comments {
                items {
                  id
                  content
                  createdAt
                  user {
                    id
                    firstName
                    lastName
                    avatarUrl
                  }
                }
              }
              attachments {
                items {
                  id
                  fileName
                  fileUrl
                  fileSize
                  fileType
                  createdAt
                }
              }
              subtasks {
                items {
                  id
                  title
                  completed
                  position
                }
              }
            }
          }
        `,
        variables: { id }
      });
      return result.data.getTask;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  },

  create: async (task) => {
    try {
      const result = await client.graphql({
        query: `
          mutation CreateTask($input: CreateTaskInput!) {
            createTask(input: $input) {
              id
              title
              description
              status
              priority
              dueDate
              projectId
              createdById
              assignedToId
              columnId
              position
              tags
              createdAt
              updatedAt
            }
          }
        `,
        variables: { input: task }
      });
      return result.data.createTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  update: async (id, updates) => {
    try {
      const result = await client.graphql({
        query: `
          mutation UpdateTask($input: UpdateTaskInput!) {
            updateTask(input: $input) {
              id
              title
              description
              status
              priority
              dueDate
              assignedToId
              columnId
              position
              tags
              updatedAt
            }
          }
        `,
        variables: { input: { id, ...updates } }
      });
      return result.data.updateTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await client.graphql({
        query: `
          mutation DeleteTask($input: DeleteTaskInput!) {
            deleteTask(input: $input) {
              id
            }
          }
        `,
        variables: { input: { id } }
      });
      return result.data.deleteTask;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },
};

// Comments API
export const commentsApi = {
  create: async (comment) => {
    try {
      const result = await client.graphql({
        query: `
          mutation CreateComment($input: CreateCommentInput!) {
            createComment(input: $input) {
              id
              content
              taskId
              userId
              createdAt
              user {
                id
                firstName
                lastName
                avatarUrl
              }
            }
          }
        `,
        variables: { input: comment }
      });
      return result.data.createComment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const result = await client.graphql({
        query: `
          mutation DeleteComment($input: DeleteCommentInput!) {
            deleteComment(input: $input) {
              id
            }
          }
        `,
        variables: { input: { id } }
      });
      return result.data.deleteComment;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },
};

// File Upload API
export const fileApi = {
  upload: async (file, path) => {
    try {
      const result = await uploadData({
        key: path,
        data: file,
        options: {
          contentType: file.type,
        }
      }).result;
      
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  getUrl: async (key) => {
    try {
      const result = await getUrl({ key });
      return result.url.toString();
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  },

  delete: async (key) => {
    try {
      await remove({ key });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },
};

// Activity Log API
export const activityApi = {
  getByProject: async (projectId, limit = 20) => {
    try {
      const result = await client.graphql({
        query: `
          query ActivityByProject($projectId: ID!, $limit: Int) {
            listActivityLogs(
              filter: { projectId: { eq: $projectId } }
              limit: $limit
            ) {
              items {
                id
                action
                entityType
                entityName
                fromStatus
                toStatus
                createdAt
                user {
                  id
                  firstName
                  lastName
                  avatarUrl
                }
              }
            }
          }
        `,
        variables: { projectId, limit }
      });
      return result.data.listActivityLogs.items;
    } catch (error) {
      console.error('Error fetching activity:', error);
      throw error;
    }
  },

  create: async (activity) => {
    try {
      const result = await client.graphql({
        query: `
          mutation CreateActivityLog($input: CreateActivityLogInput!) {
            createActivityLog(input: $input) {
              id
              action
              entityType
              entityName
              createdAt
            }
          }
        `,
        variables: { input: activity }
      });
      return result.data.createActivityLog;
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (userId) => {
    try {
      const result = await client.graphql({
        query: `
          query GetDashboardStats($userId: ID!) {
            getDashboardStats(userId: $userId) {
              totalProjects
              activeProjects
              totalTasks
              completedTasks
              overdueTasks
              dueSoonTasks
              recentActivity {
                id
                action
                entityType
                entityName
                createdAt
                user {
                  firstName
                  lastName
                }
              }
            }
          }
        `,
        variables: { userId }
      });
      return result.data.getDashboardStats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },
};

export default {
  projects: projectsApi,
  tasks: tasksApi,
  comments: commentsApi,
  files: fileApi,
  activity: activityApi,
  dashboard: dashboardApi,
};
