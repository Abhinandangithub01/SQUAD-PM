/**
 * Slack Notifier Lambda Function
 * Sends notifications to Slack channels
 */

export const handler = async (event) => {
  console.log('Slack Notifier:', JSON.stringify(event, null, 2));

  try {
    const { webhookUrl, message, attachments } = JSON.parse(event.body || event);

    if (!webhookUrl || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'webhookUrl and message are required' }),
      };
    }

    // Build Slack message
    const slackMessage = {
      text: message,
      attachments: attachments || [],
    };

    // Send to Slack
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    console.log('Slack notification sent successfully');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Slack notification sent',
      }),
    };
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send Slack notification', details: error.message }),
    };
  }
};

/**
 * Helper function to format task notification for Slack
 */
export const formatTaskNotification = (task, action) => {
  const colors = {
    created: '#10b981',
    updated: '#3b82f6',
    completed: '#8b5cf6',
    deleted: '#ef4444',
  };

  return {
    color: colors[action] || '#6b7280',
    title: `Task ${action}: ${task.title}`,
    fields: [
      {
        title: 'Status',
        value: task.status || 'N/A',
        short: true,
      },
      {
        title: 'Priority',
        value: task.priority || 'N/A',
        short: true,
      },
      {
        title: 'Assignee',
        value: task.assignedToName || 'Unassigned',
        short: true,
      },
      {
        title: 'Due Date',
        value: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date',
        short: true,
      },
    ],
    footer: 'ProjectHub',
    footer_icon: 'https://projecthub.com/icon.png',
    ts: Math.floor(Date.now() / 1000),
  };
};

/**
 * Helper function to format project notification for Slack
 */
export const formatProjectNotification = (project, action) => {
  return {
    color: '#3b82f6',
    title: `Project ${action}: ${project.name}`,
    text: project.description || '',
    fields: [
      {
        title: 'Status',
        value: project.status || 'Active',
        short: true,
      },
      {
        title: 'Team Size',
        value: `${project.teamSize || 0} members`,
        short: true,
      },
    ],
    footer: 'ProjectHub',
    ts: Math.floor(Date.now() / 1000),
  };
};
