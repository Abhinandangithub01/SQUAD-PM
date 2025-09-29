import { 
  mockApiResponses, 
  mockProjects, 
  mockTasks, 
  mockChannels, 
  mockMessages, 
  mockKanbanData,
  mockFiles,
  mockUser 
} from './mockData';

// Mock API service that simulates backend responses
class MockApiService {
  constructor() {
    this.isAuthenticated = false;
    this.token = localStorage.getItem('mock_token');
    if (this.token) {
      this.isAuthenticated = true;
    }
  }

  // Simulate network delay
  delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get(url) {
    await this.delay(300);
    
    // Handle authentication check
    if (url === '/auth/me') {
      if (!this.isAuthenticated) {
        throw new Error('Unauthorized');
      }
      return { data: mockApiResponses[url] };
    }

    // Handle dashboard data
    if (url === '/users/me/dashboard') {
      return { data: mockApiResponses[url] };
    }

    // Handle projects
    if (url === '/projects') {
      return { data: mockApiResponses[url] };
    }

    // Handle project details
    if (url.startsWith('/projects/') && !url.includes('/kanban') && !url.includes('/tasks')) {
      const projectId = url.split('/')[2];
      const project = mockProjects.find(p => p.id === projectId);
      if (project) {
        return {
          data: {
            project: {
              ...project,
              members: [
                { id: '1', first_name: 'Demo', last_name: 'User', email: 'demo@projecthub.com', role: 'owner', joined_at: '2024-08-01T00:00:00Z' },
                { id: '2', first_name: 'John', last_name: 'Doe', email: 'john@example.com', role: 'member', joined_at: '2024-08-05T00:00:00Z' },
                { id: '3', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', role: 'member', joined_at: '2024-08-10T00:00:00Z' }
              ],
              columns: mockKanbanData.columns
            }
          }
        };
      }
    }

    // Handle tasks
    if (url.includes('/tasks/project/')) {
      return { data: { tasks: mockTasks } };
    }

    // Handle kanban data
    if (url.includes('/kanban')) {
      const projectId = url.split('/')[2];
      const projectTasks = mockTasks.filter(task => task.project_id === projectId);
      
      const columns = [
        {
          id: 'backlog',
          name: 'Backlog',
          color: '#6B7280',
          tasks: projectTasks.filter(task => task.status === 'Backlog')
        },
        {
          id: 'todo',
          name: 'To Do',
          color: '#EF4444',
          tasks: projectTasks.filter(task => task.status === 'To Do')
        },
        {
          id: 'in-progress',
          name: 'In Progress',
          color: '#F59E0B',
          tasks: projectTasks.filter(task => task.status === 'In Progress')
        },
        {
          id: 'review',
          name: 'Review',
          color: '#8B5CF6',
          tasks: projectTasks.filter(task => task.status === 'Review')
        },
        {
          id: 'done',
          name: 'Done',
          color: '#10B981',
          tasks: projectTasks.filter(task => task.status === 'Done')
        }
      ];
      
      return { data: { columns } };
    }

    // Handle chat channels
    if (url === '/chat/channels') {
      return { data: mockApiResponses[url] };
    }

    // Handle project-specific channel lookup
    if (url.startsWith('/chat/channels/project/')) {
      const projectId = url.split('/')[4];
      const projectChannel = mockChannels.find(
        channel => channel.project_id === projectId && channel.type === 'project'
      );
      return { data: { channel: projectChannel } };
    }

    // Handle chat messages
    if (url.includes('/chat/channels/') && url.includes('/messages')) {
      return { data: { messages: mockMessages } };
    }

    // Handle notifications
    if (url.startsWith('/notifications')) {
      return { data: mockApiResponses['/notifications'] };
    }

    // Handle analytics
    if (url.includes('/analytics')) {
      return { data: mockApiResponses['/analytics/dashboard'] };
    }

    // Handle files
    if (url.includes('/files/project/')) {
      return { data: { files: mockFiles } };
    }

    // Handle users search
    if (url.includes('/users/search')) {
      return { 
        data: { 
          users: [
            { id: '2', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
            { id: '3', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
            { id: '4', first_name: 'Mike', last_name: 'Johnson', email: 'mike@example.com' }
          ] 
        } 
      };
    }

    // Default response
    return { data: {} };
  }

  async post(url, data) {
    await this.delay(400);

    // Handle login
    if (url === '/auth/login') {
      if (data.email && data.password) {
        this.isAuthenticated = true;
        const token = 'mock_token_' + Date.now();
        localStorage.setItem('mock_token', token);
        return {
          data: {
            message: 'Login successful',
            token: token,
            user: mockUser
          }
        };
      } else {
        throw new Error('Invalid credentials');
      }
    }

    // Handle task creation
    if (url === '/tasks') {
      const newTask = {
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString(),
        assignee_names: ['Demo User'],
        comment_count: 0,
        attachment_count: 0,
        checklist_total: 0,
        checklist_completed: 0
      };
      return { data: { task: newTask } };
    }

    // Handle project creation
    if (url === '/projects') {
      const newProject = {
        id: Date.now().toString(),
        ...data,
        owner_name: 'Demo User',
        user_role: 'owner',
        task_count: 0,
        issue_count: 0,
        completed_tasks: 0,
        member_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return { data: { project: newProject } };
    }

    // Handle channel creation
    if (url === '/chat/channels') {
      const newChannel = {
        id: Date.now().toString(),
        ...data,
        member_count: 1,
        message_count: 0,
        created_at: new Date().toISOString()
      };
      return { data: { channel: newChannel } };
    }

    // Handle message sending
    if (url.includes('/messages')) {
      const newMessage = {
        id: Date.now().toString(),
        content: data.content,
        user_id: '1',
        first_name: 'Demo',
        last_name: 'User',
        created_at: new Date().toISOString(),
        reactions: []
      };
      return { data: { data: newMessage } };
    }

    return { data: { message: 'Success' } };
  }

  async put(url, data) {
    await this.delay(300);
    return { data: { message: 'Updated successfully' } };
  }

  async delete(url) {
    await this.delay(300);
    return { data: { message: 'Deleted successfully' } };
  }
}

export const mockApi = new MockApiService();
