const bcrypt = require('bcryptjs');
const { query } = require('../server/config/database');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create users
    const users = [
      {
        email: 'admin@example.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      },
      {
        email: 'manager@example.com',
        password: hashedPassword,
        first_name: 'Project',
        last_name: 'Manager',
        role: 'project_manager'
      },
      {
        email: 'john@example.com',
        password: hashedPassword,
        first_name: 'John',
        last_name: 'Doe',
        role: 'member'
      },
      {
        email: 'jane@example.com',
        password: hashedPassword,
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'member'
      },
      {
        email: 'viewer@example.com',
        password: hashedPassword,
        first_name: 'View',
        last_name: 'Only',
        role: 'viewer'
      }
    ];

    const userIds = [];
    for (const user of users) {
      const result = await query(
        `INSERT INTO users (email, password, first_name, last_name, role) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [user.email, user.password, user.first_name, user.last_name, user.role]
      );
      userIds.push(result.rows[0].id);
    }

    console.log('Users created successfully');

    // Create projects
    const projects = [
      {
        name: 'Website Redesign',
        description: 'Complete redesign of the company website with modern UI/UX',
        color: '#3B82F6',
        owner_id: userIds[1] // Project Manager
      },
      {
        name: 'Mobile App Development',
        description: 'Native mobile application for iOS and Android platforms',
        color: '#10B981',
        owner_id: userIds[1] // Project Manager
      },
      {
        name: 'Marketing Campaign',
        description: 'Q4 marketing campaign for product launch',
        color: '#F59E0B',
        owner_id: userIds[0] // Admin
      }
    ];

    const projectIds = [];
    for (const project of projects) {
      const result = await query(
        `INSERT INTO projects (name, description, color, owner_id) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [project.name, project.description, project.color, project.owner_id]
      );
      projectIds.push(result.rows[0].id);
    }

    console.log('Projects created successfully');

    // Add project members
    const projectMembers = [
      // Website Redesign project
      { project_id: projectIds[0], user_id: userIds[0], role: 'admin' },
      { project_id: projectIds[0], user_id: userIds[1], role: 'owner' },
      { project_id: projectIds[0], user_id: userIds[2], role: 'member' },
      { project_id: projectIds[0], user_id: userIds[3], role: 'member' },
      
      // Mobile App project
      { project_id: projectIds[1], user_id: userIds[1], role: 'owner' },
      { project_id: projectIds[1], user_id: userIds[2], role: 'member' },
      { project_id: projectIds[1], user_id: userIds[4], role: 'viewer' },
      
      // Marketing Campaign
      { project_id: projectIds[2], user_id: userIds[0], role: 'owner' },
      { project_id: projectIds[2], user_id: userIds[3], role: 'member' }
    ];

    for (const member of projectMembers) {
      await query(
        `INSERT INTO project_members (project_id, user_id, role) 
         VALUES ($1, $2, $3)`,
        [member.project_id, member.user_id, member.role]
      );
    }

    console.log('Project members added successfully');

    // Create Kanban columns for each project
    const kanbanColumns = [
      // Website Redesign columns
      { project_id: projectIds[0], name: 'Backlog', position: 1, color: '#6B7280' },
      { project_id: projectIds[0], name: 'To Do', position: 2, color: '#EF4444' },
      { project_id: projectIds[0], name: 'In Progress', position: 3, color: '#F59E0B' },
      { project_id: projectIds[0], name: 'Review', position: 4, color: '#8B5CF6' },
      { project_id: projectIds[0], name: 'Done', position: 5, color: '#10B981' },
      
      // Mobile App columns
      { project_id: projectIds[1], name: 'Planning', position: 1, color: '#6B7280' },
      { project_id: projectIds[1], name: 'Development', position: 2, color: '#3B82F6' },
      { project_id: projectIds[1], name: 'Testing', position: 3, color: '#F59E0B' },
      { project_id: projectIds[1], name: 'Deployment', position: 4, color: '#10B981' },
      
      // Marketing Campaign columns
      { project_id: projectIds[2], name: 'Ideas', position: 1, color: '#6B7280' },
      { project_id: projectIds[2], name: 'In Progress', position: 2, color: '#F59E0B' },
      { project_id: projectIds[2], name: 'Review', position: 3, color: '#8B5CF6' },
      { project_id: projectIds[2], name: 'Published', position: 4, color: '#10B981' }
    ];

    const columnIds = [];
    for (const column of kanbanColumns) {
      const result = await query(
        `INSERT INTO kanban_columns (project_id, name, position, color) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [column.project_id, column.name, column.position, column.color]
      );
      columnIds.push(result.rows[0].id);
    }

    console.log('Kanban columns created successfully');

    // Create sample tasks
    const tasks = [
      // Website Redesign tasks
      {
        title: 'Design new homepage layout',
        description: 'Create wireframes and mockups for the new homepage design',
        status: 'To Do',
        priority: 'high',
        project_id: projectIds[0],
        column_id: columnIds[1],
        reporter_id: userIds[1],
        position: 1,
        tags: ['design', 'homepage']
      },
      {
        title: 'Implement responsive navigation',
        description: 'Build mobile-friendly navigation component',
        status: 'In Progress',
        priority: 'medium',
        project_id: projectIds[0],
        column_id: columnIds[2],
        reporter_id: userIds[2],
        position: 1,
        tags: ['frontend', 'responsive']
      },
      {
        title: 'Set up analytics tracking',
        description: 'Integrate Google Analytics and set up conversion tracking',
        status: 'Done',
        priority: 'low',
        project_id: projectIds[0],
        column_id: columnIds[4],
        reporter_id: userIds[3],
        position: 1,
        tags: ['analytics', 'tracking']
      },
      
      // Mobile App tasks
      {
        title: 'User authentication system',
        description: 'Implement login/signup functionality with social auth',
        status: 'Development',
        priority: 'high',
        project_id: projectIds[1],
        column_id: columnIds[6],
        reporter_id: userIds[1],
        position: 1,
        tags: ['auth', 'backend']
      },
      {
        title: 'Push notification setup',
        description: 'Configure push notifications for iOS and Android',
        status: 'Planning',
        priority: 'medium',
        project_id: projectIds[1],
        column_id: columnIds[5],
        reporter_id: userIds[2],
        position: 1,
        tags: ['notifications', 'mobile']
      }
    ];

    const taskIds = [];
    for (const task of tasks) {
      const result = await query(
        `INSERT INTO tasks (title, description, status, priority, project_id, column_id, reporter_id, position, tags) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [task.title, task.description, task.status, task.priority, task.project_id, 
         task.column_id, task.reporter_id, task.position, task.tags]
      );
      taskIds.push(result.rows[0].id);
    }

    console.log('Tasks created successfully');

    // Assign tasks to users
    const taskAssignments = [
      { task_id: taskIds[0], user_id: userIds[3] }, // Jane assigned to homepage design
      { task_id: taskIds[1], user_id: userIds[2] }, // John assigned to navigation
      { task_id: taskIds[2], user_id: userIds[3] }, // Jane assigned to analytics
      { task_id: taskIds[3], user_id: userIds[2] }, // John assigned to auth system
      { task_id: taskIds[4], user_id: userIds[2] }  // John assigned to push notifications
    ];

    for (const assignment of taskAssignments) {
      await query(
        `INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)`,
        [assignment.task_id, assignment.user_id]
      );
    }

    console.log('Task assignments created successfully');

    // Create chat channels
    const channels = [
      {
        name: 'general',
        description: 'General discussion for the team',
        type: 'public',
        project_id: null,
        created_by: userIds[0]
      },
      {
        name: 'website-redesign',
        description: 'Discussion about the website redesign project',
        type: 'public',
        project_id: projectIds[0],
        created_by: userIds[1]
      },
      {
        name: 'mobile-app-dev',
        description: 'Mobile app development discussions',
        type: 'public',
        project_id: projectIds[1],
        created_by: userIds[1]
      }
    ];

    const channelIds = [];
    for (const channel of channels) {
      const result = await query(
        `INSERT INTO chat_channels (name, description, type, project_id, created_by) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [channel.name, channel.description, channel.type, channel.project_id, channel.created_by]
      );
      channelIds.push(result.rows[0].id);
    }

    console.log('Chat channels created successfully');

    // Add channel members
    const channelMembers = [
      // General channel - all users
      { channel_id: channelIds[0], user_id: userIds[0], role: 'admin' },
      { channel_id: channelIds[0], user_id: userIds[1], role: 'member' },
      { channel_id: channelIds[0], user_id: userIds[2], role: 'member' },
      { channel_id: channelIds[0], user_id: userIds[3], role: 'member' },
      { channel_id: channelIds[0], user_id: userIds[4], role: 'member' },
      
      // Website redesign channel
      { channel_id: channelIds[1], user_id: userIds[0], role: 'member' },
      { channel_id: channelIds[1], user_id: userIds[1], role: 'admin' },
      { channel_id: channelIds[1], user_id: userIds[2], role: 'member' },
      { channel_id: channelIds[1], user_id: userIds[3], role: 'member' },
      
      // Mobile app channel
      { channel_id: channelIds[2], user_id: userIds[1], role: 'admin' },
      { channel_id: channelIds[2], user_id: userIds[2], role: 'member' },
      { channel_id: channelIds[2], user_id: userIds[4], role: 'member' }
    ];

    for (const member of channelMembers) {
      await query(
        `INSERT INTO channel_members (channel_id, user_id, role) 
         VALUES ($1, $2, $3)`,
        [member.channel_id, member.user_id, member.role]
      );
    }

    console.log('Channel members added successfully');

    // Create sample notifications
    const notifications = [
      {
        user_id: userIds[2],
        type: 'task_assigned',
        title: 'New task assigned',
        message: 'You have been assigned to "Implement responsive navigation"',
        data: JSON.stringify({ task_id: taskIds[1], project_id: projectIds[0] })
      },
      {
        user_id: userIds[3],
        type: 'task_assigned',
        title: 'New task assigned',
        message: 'You have been assigned to "Design new homepage layout"',
        data: JSON.stringify({ task_id: taskIds[0], project_id: projectIds[0] })
      },
      {
        user_id: userIds[1],
        type: 'project_update',
        title: 'Project milestone reached',
        message: 'Website Redesign project has reached 60% completion',
        data: JSON.stringify({ project_id: projectIds[0] })
      }
    ];

    for (const notification of notifications) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, data) 
         VALUES ($1, $2, $3, $4, $5)`,
        [notification.user_id, notification.type, notification.title, notification.message, notification.data]
      );
    }

    console.log('Notifications created successfully');

    console.log('Database seeding completed successfully!');
    console.log('\nDefault users created:');
    console.log('- admin@example.com (Admin)');
    console.log('- manager@example.com (Project Manager)');
    console.log('- john@example.com (Member)');
    console.log('- jane@example.com (Member)');
    console.log('- viewer@example.com (Viewer)');
    console.log('\nAll passwords: password123');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}

module.exports = seedDatabase;
