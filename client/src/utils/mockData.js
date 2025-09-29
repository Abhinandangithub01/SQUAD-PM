// Mock data for demo purposes
export const mockUser = {
  id: '1',
  email: 'demo@projecthub.com',
  first_name: 'Demo',
  last_name: 'User',
  role: 'admin',
  avatar_url: null,
  created_at: '2024-01-01T00:00:00Z',
  last_login: '2024-09-29T12:00:00Z'
};

export const mockProjects = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete redesign of the company website with modern UI/UX',
    color: '#3B82F6',
    status: 'active',
    owner_name: 'Project Manager',
    user_role: 'admin',
    task_count: 12,
    issue_count: 3,
    completed_tasks: 8,
    member_count: 5,
    created_at: '2024-08-01T00:00:00Z',
    updated_at: '2024-09-29T10:00:00Z'
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android platforms',
    color: '#10B981',
    status: 'active',
    owner_name: 'Tech Lead',
    user_role: 'member',
    task_count: 18,
    issue_count: 5,
    completed_tasks: 10,
    member_count: 8,
    created_at: '2024-07-15T00:00:00Z',
    updated_at: '2024-09-29T09:30:00Z'
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    description: 'Q4 marketing campaign for product launch',
    color: '#F59E0B',
    status: 'active',
    owner_name: 'Marketing Director',
    user_role: 'viewer',
    task_count: 8,
    issue_count: 1,
    completed_tasks: 6,
    member_count: 4,
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-29T08:00:00Z'
  }
];

export const mockTasks = [
  {
    id: '1',
    title: 'Design new homepage layout',
    description: 'Create wireframes and mockups for the new homepage design',
    status: 'In Progress',
    priority: 'high',
    type: 'task',
    project_id: '1',
    milestone_id: '1', // Linked to Design Phase Complete
    assignee_ids: ['2'],
    assignee_names: ['John Doe'],
    due_date: '2024-10-05T00:00:00Z',
    created_at: '2024-09-20T00:00:00Z',
    updated_at: '2024-09-25T00:00:00Z',
    comment_count: 3,
    attachment_count: 2,
    checklist_completed: 2,
    checklist_total: 5,
    column_id: 'in-progress',
    position: 0,
    completed: false
  },
  {
    id: '2',
    title: 'Fix login authentication bug',
    description: 'Users are unable to login with social media accounts',
    status: 'To Do',
    priority: 'urgent',
    type: 'issue',
    project_id: '1',
    milestone_id: '2', // Linked to Development Setup
    assignee_ids: ['3'],
    assignee_names: ['Jane Smith'],
    due_date: '2024-09-30T00:00:00Z',
    created_at: '2024-09-22T00:00:00Z',
    updated_at: '2024-09-22T00:00:00Z',
    comment_count: 1,
    attachment_count: 0,
    checklist_completed: 0,
    checklist_total: 3,
    column_id: 'todo',
    position: 0,
    completed: false
  },
  {
    id: '3',
    title: 'Research competitor analysis',
    description: 'Analyze top 5 competitors in our market',
    status: 'Backlog',
    priority: 'low',
    type: 'task',
    project_id: '1',
    milestone_id: '1', // Linked to Design Phase Complete
    assignee_ids: ['4'],
    assignee_names: ['Sarah Wilson'],
    due_date: '2024-10-10T00:00:00Z',
    created_at: '2024-09-18T00:00:00Z',
    updated_at: '2024-09-18T00:00:00Z',
    comment_count: 0,
    attachment_count: 1,
    checklist_completed: 0,
    checklist_total: 0,
    column_id: 'backlog',
    position: 0,
    completed: false
  },
  {
    id: '4',
    title: 'Create social media content',
    description: 'Design posts for Instagram, Twitter, and LinkedIn',
    status: 'Done',
    priority: 'medium',
    type: 'task',
    project_id: '3',
    milestone_id: '7', // Linked to Content Creation Complete
    assignee_ids: ['2', '3'],
    assignee_names: ['John Doe', 'Jane Smith'],
    due_date: '2024-09-25T00:00:00Z',
    created_at: '2024-09-15T00:00:00Z',
    updated_at: '2024-09-24T00:00:00Z',
    comment_count: 5,
    attachment_count: 8,
    checklist_completed: 4,
    checklist_total: 4,
    column_id: 'done',
    position: 0,
    completed: true
  },
  {
    id: '5',
    title: 'Mobile app authentication',
    description: 'Implement OAuth login for mobile application',
    status: 'Review',
    priority: 'high',
    type: 'task',
    project_id: '2',
    milestone_id: '5', // Linked to MVP Development
    assignee_ids: ['3'],
    assignee_names: ['Jane Smith'],
    due_date: '2024-10-01T00:00:00Z',
    created_at: '2024-09-20T00:00:00Z',
    updated_at: '2024-09-28T00:00:00Z',
    comment_count: 2,
    attachment_count: 1,
    checklist_completed: 3,
    checklist_total: 3,
    column_id: 'review',
    position: 0,
    completed: false
  },
  // Additional tasks for Website Redesign project
  {
    id: '6',
    title: 'Create wireframes',
    description: 'Create detailed wireframes for all pages',
    status: 'Done',
    priority: 'high',
    type: 'task',
    project_id: '1',
    milestone_id: '1', // Linked to Design Phase Complete
    assignee_ids: ['2'],
    assignee_names: ['John Doe'],
    due_date: '2024-10-01T00:00:00Z',
    created_at: '2024-09-15T00:00:00Z',
    updated_at: '2024-09-30T00:00:00Z',
    comment_count: 2,
    attachment_count: 3,
    checklist_completed: 5,
    checklist_total: 5,
    column_id: 'done',
    position: 0,
    completed: true
  },
  {
    id: '7',
    title: 'Setup development environment',
    description: 'Configure development tools and dependencies',
    status: 'Done',
    priority: 'high',
    type: 'task',
    project_id: '1',
    milestone_id: '2', // Linked to Development Setup
    assignee_ids: ['3'],
    assignee_names: ['Jane Smith'],
    due_date: '2024-09-20T00:00:00Z',
    created_at: '2024-09-10T00:00:00Z',
    updated_at: '2024-09-20T00:00:00Z',
    comment_count: 1,
    attachment_count: 0,
    checklist_completed: 3,
    checklist_total: 3,
    column_id: 'done',
    position: 0,
    completed: true
  },
  {
    id: '8',
    title: 'Write unit tests',
    description: 'Create comprehensive unit tests for core functionality',
    status: 'In Progress',
    priority: 'medium',
    type: 'task',
    project_id: '1',
    milestone_id: '10', // Linked to Testing Phase
    assignee_ids: ['4'],
    assignee_names: ['Sarah Wilson'],
    due_date: '2024-10-20T00:00:00Z',
    created_at: '2024-09-25T00:00:00Z',
    updated_at: '2024-09-28T00:00:00Z',
    comment_count: 0,
    attachment_count: 0,
    checklist_completed: 2,
    checklist_total: 6,
    column_id: 'in-progress',
    position: 0,
    completed: false
  }
];

export const mockChannels = [
  {
    id: '1',
    name: 'general',
    description: 'General discussion for the team',
    type: 'public',
    project_id: null,
    project_name: null,
    parent_channel_id: null,
    member_count: 12,
    message_count: 156,
    last_message: 'Great work on the homepage design!',
    last_message_at: '2024-09-29T11:30:00Z'
  },
  // Website Redesign Project Channels
  {
    id: '2',
    name: 'website-redesign',
    description: 'Main discussion for website redesign project',
    type: 'project',
    project_id: '1',
    project_name: 'Website Redesign',
    parent_channel_id: null,
    member_count: 5,
    message_count: 89,
    last_message: 'The wireframes look good, let\'s proceed',
    last_message_at: '2024-09-29T10:15:00Z'
  },
  {
    id: '5',
    name: 'ui-design',
    description: 'UI/UX design discussions and feedback',
    type: 'project-sub',
    project_id: '1',
    project_name: 'Website Redesign',
    parent_channel_id: '2',
    member_count: 3,
    message_count: 45,
    last_message: 'Updated the color palette based on feedback',
    last_message_at: '2024-09-29T09:30:00Z'
  },
  {
    id: '6',
    name: 'testing',
    description: 'Testing discussions and bug reports',
    type: 'project-sub',
    project_id: '1',
    project_name: 'Website Redesign',
    parent_channel_id: '2',
    member_count: 4,
    message_count: 32,
    last_message: 'Cross-browser testing completed',
    last_message_at: '2024-09-29T08:45:00Z'
  },
  {
    id: '7',
    name: 'requirements',
    description: 'Product requirements and specifications',
    type: 'project-sub',
    project_id: '1',
    project_name: 'Website Redesign',
    parent_channel_id: '2',
    member_count: 5,
    message_count: 28,
    last_message: 'Requirements document updated',
    last_message_at: '2024-09-29T07:20:00Z'
  },
  {
    id: '8',
    name: 'issues',
    description: 'Bug reports and issue tracking',
    type: 'project-sub',
    project_id: '1',
    project_name: 'Website Redesign',
    parent_channel_id: '2',
    member_count: 4,
    message_count: 15,
    last_message: 'Fixed the mobile responsive issue',
    last_message_at: '2024-09-29T06:10:00Z'
  },
  // Mobile App Development Project Channels
  {
    id: '3',
    name: 'mobile-app-dev',
    description: 'Main discussion for mobile app development',
    type: 'project',
    project_id: '2',
    project_name: 'Mobile App Development',
    parent_channel_id: null,
    member_count: 8,
    message_count: 234,
    last_message: 'Authentication bug has been fixed',
    last_message_at: '2024-09-29T09:45:00Z'
  },
  {
    id: '9',
    name: 'ui-design',
    description: 'Mobile UI/UX design discussions',
    type: 'project-sub',
    project_id: '2',
    project_name: 'Mobile App Development',
    parent_channel_id: '3',
    member_count: 4,
    message_count: 67,
    last_message: 'New navigation design approved',
    last_message_at: '2024-09-29T08:15:00Z'
  },
  {
    id: '10',
    name: 'testing',
    description: 'Mobile app testing and QA',
    type: 'project-sub',
    project_id: '2',
    project_name: 'Mobile App Development',
    parent_channel_id: '3',
    member_count: 3,
    message_count: 89,
    last_message: 'iOS testing completed successfully',
    last_message_at: '2024-09-29T07:45:00Z'
  },
  // Marketing Campaign Project Channels
  {
    id: '4',
    name: 'marketing-campaign',
    description: 'Main marketing campaign coordination',
    type: 'project',
    project_id: '3',
    project_name: 'Marketing Campaign',
    parent_channel_id: null,
    member_count: 4,
    message_count: 67,
    last_message: 'Social media content is ready for review',
    last_message_at: '2024-09-29T08:30:00Z'
  },
  {
    id: '11',
    name: 'content-creation',
    description: 'Content creation and copywriting',
    type: 'project-sub',
    project_id: '3',
    project_name: 'Marketing Campaign',
    parent_channel_id: '4',
    member_count: 3,
    message_count: 34,
    last_message: 'Blog post drafts are ready',
    last_message_at: '2024-09-29T07:00:00Z'
  },
  {
    id: '12',
    name: 'analytics',
    description: 'Campaign analytics and reporting',
    type: 'project-sub',
    project_id: '3',
    project_name: 'Marketing Campaign',
    parent_channel_id: '4',
    member_count: 2,
    message_count: 18,
    last_message: 'Weekly metrics report attached',
    last_message_at: '2024-09-29T06:30:00Z'
  }
];

export const mockMessages = [
  {
    id: '1',
    channel_id: '1',
    user_id: '2',
    first_name: 'John',
    last_name: 'Doe',
    avatar_url: null,
    content: 'Good morning everyone! Ready for another productive day?',
    type: 'text',
    created_at: '2024-09-29T09:00:00Z',
    reactions: []
  },
  {
    id: '2',
    channel_id: '1',
    user_id: '3',
    first_name: 'Jane',
    last_name: 'Smith',
    avatar_url: null,
    content: 'Absolutely! I\'ve finished the homepage mockups. Will share them in the design channel.',
    type: 'text',
    created_at: '2024-09-29T09:15:00Z',
    reactions: [
      { emoji: '👍', user_name: 'John Doe' },
      { emoji: '🎉', user_name: 'Mike Johnson' }
    ]
  },
  {
    id: '3',
    channel_id: '1',
    user_id: '1',
    first_name: 'Demo',
    last_name: 'User',
    avatar_url: null,
    content: 'Great work team! The project is moving along nicely.',
    type: 'text',
    created_at: '2024-09-29T11:30:00Z',
    reactions: []
  }
];

export const mockNotifications = [
  {
    id: '1',
    type: 'task_assigned',
    title: 'New task assigned',
    message: 'You have been assigned to "Design new homepage layout"',
    is_read: false,
    created_at: '2024-09-29T10:00:00Z'
  },
  {
    id: '2',
    type: 'chat_mention',
    title: 'You were mentioned',
    message: 'John Doe mentioned you in #general',
    is_read: false,
    created_at: '2024-09-29T09:30:00Z'
  },
  {
    id: '3',
    type: 'due_soon',
    title: 'Task due soon',
    message: 'Fix login authentication bug is due tomorrow',
    is_read: true,
    created_at: '2024-09-29T08:00:00Z'
  }
];

export const mockAnalytics = {
  overview: {
    total_projects: 3,
    total_tasks: 38,
    total_issues: 9,
    completion_rate: 63
  },
  task_completion: [
    { date: '2024-09-23', completed_tasks: 2 },
    { date: '2024-09-24', completed_tasks: 4 },
    { date: '2024-09-25', completed_tasks: 1 },
    { date: '2024-09-26', completed_tasks: 3 },
    { date: '2024-09-27', completed_tasks: 5 },
    { date: '2024-09-28', completed_tasks: 2 },
    { date: '2024-09-29', completed_tasks: 3 }
  ],
  project_progress: mockProjects,
  status_distribution: [
    { status: 'To Do', count: 8, type: 'task' },
    { status: 'In Progress', count: 12, type: 'task' },
    { status: 'Review', count: 6, type: 'task' },
    { status: 'Done', count: 12, type: 'task' }
  ],
  priority_distribution: [
    { priority: 'urgent', count: 3 },
    { priority: 'high', count: 8 },
    { priority: 'medium', count: 18 },
    { priority: 'low', count: 9 }
  ]
};

export const mockActivity = [
  {
    id: '1',
    user_id: '2',
    first_name: 'John',
    last_name: 'Doe',
    action: 'completed',
    entity_type: 'task',
    entity_name: 'Design new homepage layout',
    project_id: '1',
    project_name: 'Website Redesign',
    created_at: '2024-09-29T11:00:00Z'
  },
  {
    id: '2',
    user_id: '3',
    first_name: 'Jane',
    last_name: 'Smith',
    action: 'created',
    entity_type: 'task',
    entity_name: 'Implement responsive navigation',
    project_id: '1',
    project_name: 'Website Redesign',
    created_at: '2024-09-29T10:30:00Z'
  },
  {
    id: '3',
    user_id: '1',
    first_name: 'Demo',
    last_name: 'User',
    action: 'commented',
    entity_type: 'task',
    entity_name: 'Fix login authentication bug',
    project_id: '1',
    project_name: 'Website Redesign',
    created_at: '2024-09-29T10:15:00Z'
  },
  {
    id: '4',
    user_id: '4',
    first_name: 'Sarah',
    last_name: 'Wilson',
    action: 'updated',
    entity_type: 'task',
    entity_name: 'Research competitor analysis',
    project_id: '1',
    project_name: 'Website Redesign',
    created_at: '2024-09-29T09:45:00Z'
  },
  {
    id: '5',
    user_id: '2',
    first_name: 'John',
    last_name: 'Doe',
    action: 'assigned',
    entity_type: 'task',
    entity_name: 'Create wireframes for mobile view',
    project_id: '1',
    project_name: 'Website Redesign',
    created_at: '2024-09-29T09:20:00Z'
  },
  {
    id: '6',
    user_id: '3',
    first_name: 'Jane',
    last_name: 'Smith',
    action: 'uploaded',
    entity_type: 'file',
    entity_name: 'homepage-mockup.png',
    project_id: '1',
    project_name: 'Website Redesign',
    created_at: '2024-09-29T08:30:00Z'
  },
  {
    id: '7',
    user_id: '1',
    first_name: 'Demo',
    last_name: 'User',
    action: 'moved',
    entity_type: 'task',
    entity_name: 'Design new homepage layout',
    project_id: '1',
    project_name: 'Website Redesign',
    from_status: 'To Do',
    to_status: 'In Progress',
    created_at: '2024-09-29T08:00:00Z'
  },
  {
    id: '8',
    user_id: '4',
    first_name: 'Sarah',
    last_name: 'Wilson',
    action: 'created',
    entity_type: 'issue',
    entity_name: 'Mobile responsive issues on Safari',
    project_id: '1',
    project_name: 'Website Redesign',
    created_at: '2024-09-28T16:45:00Z'
  },
  {
    id: '9',
    user_id: '2',
    first_name: 'John',
    last_name: 'Doe',
    action: 'completed',
    entity_type: 'task',
    entity_name: 'Set up development environment',
    project_id: '1',
    project_name: 'Website Redesign',
    created_at: '2024-09-28T14:20:00Z'
  },
  {
    id: '10',
    user_id: '3',
    first_name: 'Jane',
    last_name: 'Smith',
    action: 'reviewed',
    entity_type: 'task',
    entity_name: 'Color scheme selection',
    project_id: '1',
    project_name: 'Website Redesign',
    created_at: '2024-09-28T11:30:00Z'
  },
  // Mobile App Development Activities
  {
    id: '11',
    user_id: '3',
    first_name: 'Jane',
    last_name: 'Smith',
    action: 'created',
    entity_type: 'task',
    entity_name: 'Implement push notifications',
    project_id: '2',
    project_name: 'Mobile App Development',
    created_at: '2024-09-29T10:30:00Z'
  },
  {
    id: '12',
    user_id: '4',
    first_name: 'Mike',
    last_name: 'Johnson',
    action: 'updated',
    entity_type: 'issue',
    entity_name: 'App crashes on Android 12',
    project_id: '2',
    project_name: 'Mobile App Development',
    created_at: '2024-09-29T09:45:00Z'
  },
  // Marketing Campaign Activities
  {
    id: '13',
    user_id: '2',
    first_name: 'John',
    last_name: 'Doe',
    action: 'completed',
    entity_type: 'task',
    entity_name: 'Create social media content',
    project_id: '3',
    project_name: 'Marketing Campaign',
    created_at: '2024-09-29T08:30:00Z'
  }
];

export const mockKanbanData = {
  columns: [
    {
      id: '1',
      name: 'Backlog',
      position: 1,
      color: '#6B7280',
      tasks: [
        {
          id: '4',
          title: 'Research competitor analysis',
          description: 'Analyze top 5 competitors in our market',
          status: 'Backlog',
          priority: 'low',
          type: 'task',
          assignee_names: ['Sarah Wilson'],
          comment_count: 1,
          attachment_count: 0,
          checklist_total: 3,
          checklist_completed: 0,
          due_date: '2024-10-10T00:00:00Z'
        }
      ]
    },
    {
      id: '2',
      name: 'To Do',
      position: 2,
      color: '#EF4444',
      tasks: [
        {
          id: '2',
          title: 'Fix login authentication bug',
          description: 'Users are unable to login with social media accounts',
          status: 'To Do',
          priority: 'urgent',
          type: 'issue',
          assignee_names: ['Mike Johnson'],
          comment_count: 5,
          attachment_count: 1,
          checklist_total: 3,
          checklist_completed: 1,
          due_date: '2024-09-30T00:00:00Z'
        }
      ]
    },
    {
      id: '3',
      name: 'In Progress',
      position: 3,
      color: '#F59E0B',
      tasks: [
        {
          id: '1',
          title: 'Design new homepage layout',
          description: 'Create wireframes and mockups for the new homepage design',
          status: 'In Progress',
          priority: 'high',
          type: 'task',
          assignee_names: ['John Doe', 'Jane Smith'],
          comment_count: 3,
          attachment_count: 2,
          checklist_total: 5,
          checklist_completed: 2,
          due_date: '2024-10-05T00:00:00Z'
        }
      ]
    },
    {
      id: '4',
      name: 'Review',
      position: 4,
      color: '#8B5CF6',
      tasks: []
    },
    {
      id: '5',
      name: 'Done',
      position: 5,
      color: '#10B981',
      tasks: [
        {
          id: '3',
          title: 'Create social media content',
          description: 'Design posts for Instagram, Twitter, and LinkedIn',
          status: 'Done',
          priority: 'medium',
          type: 'task',
          assignee_names: ['Sarah Wilson'],
          comment_count: 2,
          attachment_count: 4,
          checklist_total: 8,
          checklist_completed: 8,
          due_date: null
        }
      ]
    }
  ]
};

export const mockFiles = [
  {
    id: '1',
    name: 'homepage-wireframe.pdf',
    original_name: 'Homepage Wireframe v2.pdf',
    mime_type: 'application/pdf',
    size: 2048576,
    uploaded_by_name: 'Jane Smith',
    linked_tasks: 2,
    created_at: '2024-09-28T14:30:00Z'
  },
  {
    id: '2',
    name: 'logo-design.png',
    original_name: 'New Logo Design.png',
    mime_type: 'image/png',
    size: 512000,
    uploaded_by_name: 'John Doe',
    linked_tasks: 1,
    created_at: '2024-09-27T10:15:00Z'
  },
  {
    id: '3',
    name: 'requirements.docx',
    original_name: 'Project Requirements.docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1024000,
    uploaded_by_name: 'Mike Johnson',
    linked_tasks: 0,
    created_at: '2024-09-25T16:45:00Z'
  }
];

export const mockMilestones = [
  {
    id: '1',
    title: 'Design Phase Complete',
    description: 'Complete all wireframes, mockups, and design assets',
    project_id: '1',
    due_date: '2024-10-15T00:00:00Z',
    status: 'in_progress',
    progress: 75,
    created_by: 'Demo User',
    created_at: '2024-08-01T00:00:00Z',
    linked_tasks: ['1', '3'],
    color: '#3B82F6'
  },
  {
    id: '2',
    title: 'Development Setup',
    description: 'Set up development environment and initial project structure',
    project_id: '1',
    due_date: '2024-09-25T00:00:00Z',
    status: 'completed',
    progress: 100,
    created_by: 'John Doe',
    created_at: '2024-08-05T00:00:00Z',
    linked_tasks: [],
    color: '#10B981'
  },
  {
    id: '3',
    title: 'Beta Launch',
    description: 'Launch beta version for internal testing and feedback',
    project_id: '1',
    due_date: '2024-11-01T00:00:00Z',
    status: 'upcoming',
    progress: 0,
    created_by: 'Demo User',
    created_at: '2024-08-10T00:00:00Z',
    linked_tasks: [],
    color: '#F59E0B'
  },
  {
    id: '4',
    title: 'Production Release',
    description: 'Final production release with all features complete',
    project_id: '1',
    due_date: '2024-12-01T00:00:00Z',
    status: 'upcoming',
    progress: 0,
    created_by: 'Demo User',
    created_at: '2024-08-15T00:00:00Z',
    linked_tasks: [],
    color: '#8B5CF6'
  },
  {
    id: '9',
    title: 'UI Review',
    description: 'Complete UI/UX review and finalize design system',
    project_id: '1',
    due_date: '2024-10-05T00:00:00Z',
    status: 'upcoming',
    progress: 0,
    created_by: 'Jane Smith',
    created_at: '2024-09-01T00:00:00Z',
    linked_tasks: [],
    color: '#EC4899'
  },
  {
    id: '10',
    title: 'Testing Phase',
    description: 'Complete comprehensive testing and bug fixes',
    project_id: '1',
    due_date: '2024-10-25T00:00:00Z',
    status: 'upcoming',
    progress: 0,
    created_by: 'Demo User',
    created_at: '2024-09-10T00:00:00Z',
    linked_tasks: [],
    color: '#06B6D4'
  },
  {
    id: '11',
    title: 'Code Review',
    description: 'Complete code review and quality assurance',
    project_id: '1',
    due_date: '2024-10-12T00:00:00Z',
    status: 'upcoming',
    progress: 0,
    created_by: 'John Doe',
    created_at: '2024-09-15T00:00:00Z',
    linked_tasks: [],
    color: '#8B5CF6'
  },
  {
    id: '12',
    title: 'Documentation',
    description: 'Complete project documentation and user guides',
    project_id: '1',
    due_date: '2024-10-18T00:00:00Z',
    status: 'upcoming',
    progress: 0,
    created_by: 'Jane Smith',
    created_at: '2024-09-20T00:00:00Z',
    linked_tasks: [],
    color: '#F59E0B'
  },
  // Mobile App Development Milestones
  {
    id: '5',
    title: 'MVP Development',
    description: 'Complete minimum viable product features',
    project_id: '2',
    due_date: '2024-10-20T00:00:00Z',
    status: 'in_progress',
    progress: 60,
    created_by: 'Jane Smith',
    created_at: '2024-07-20T00:00:00Z',
    linked_tasks: ['5'],
    color: '#3B82F6'
  },
  {
    id: '6',
    title: 'App Store Submission',
    description: 'Submit app to iOS App Store and Google Play Store',
    project_id: '2',
    due_date: '2024-11-15T00:00:00Z',
    status: 'upcoming',
    progress: 0,
    created_by: 'Jane Smith',
    created_at: '2024-07-25T00:00:00Z',
    linked_tasks: [],
    color: '#F59E0B'
  },
  // Marketing Campaign Milestones
  {
    id: '7',
    title: 'Content Creation Complete',
    description: 'All marketing content and assets ready',
    project_id: '3',
    due_date: '2024-10-05T00:00:00Z',
    status: 'completed',
    progress: 100,
    created_by: 'John Doe',
    created_at: '2024-09-01T00:00:00Z',
    linked_tasks: ['4'],
    color: '#10B981'
  },
  {
    id: '8',
    title: 'Campaign Launch',
    description: 'Launch Q4 marketing campaign across all channels',
    project_id: '3',
    due_date: '2024-10-10T00:00:00Z',
    status: 'in_progress',
    progress: 30,
    created_by: 'John Doe',
    created_at: '2024-09-05T00:00:00Z',
    linked_tasks: [],
    color: '#3B82F6'
  }
];

// Mock API responses
export const mockApiResponses = {
  '/auth/me': { user: mockUser },
  '/users/me/dashboard': {
    tasks: mockTasks.slice(0, 2),
    activity: mockActivity,
    projects: mockProjects,
    unread_notifications: 2
  },
  '/projects': { projects: mockProjects },
  '/chat/channels': { channels: mockChannels },
  '/notifications': { 
    notifications: mockNotifications, 
    unread_count: 2 
  },
  '/analytics/dashboard': mockAnalytics
};
