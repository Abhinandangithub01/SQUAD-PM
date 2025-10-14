/**
 * Email Digest Lambda Function
 * Sends daily/weekly email summaries
 * Runs daily via EventBridge
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});

export const handler = async (event) => {
  console.log('Email Digest:', JSON.stringify(event, null, 2));

  try {
    const tableName = process.env.DYNAMODB_TABLE_NAME;
    const digestType = event.digestType || 'daily'; // 'daily' or 'weekly'
    
    const now = new Date();
    const startDate = new Date(now);
    if (digestType === 'daily') {
      startDate.setDate(startDate.getDate() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    // Get all active users
    const usersResult = await docClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: '#typename = :type AND attribute_exists(email)',
      ExpressionAttributeNames: {
        '#typename': '__typename',
      },
      ExpressionAttributeValues: {
        ':type': 'User',
      },
    }));

    const users = usersResult.Items || [];
    console.log(`Sending ${digestType} digest to ${users.length} users`);

    const emailPromises = [];

    for (const user of users) {
      try {
        // Get user's tasks
        const tasksResult = await docClient.send(new ScanCommand({
          TableName: tableName,
          FilterExpression: 'assignedToId = :userId AND #typename = :type AND updatedAt >= :startDate',
          ExpressionAttributeNames: {
            '#typename': '__typename',
          },
          ExpressionAttributeValues: {
            ':userId': user.id,
            ':type': 'Task',
            ':startDate': startDate.toISOString(),
          },
        }));

        const tasks = tasksResult.Items || [];

        // Get user's notifications
        const notificationsResult = await docClient.send(new QueryCommand({
          TableName: tableName,
          IndexName: 'byUser',
          KeyConditionExpression: 'userId = :userId',
          FilterExpression: '#typename = :type AND createdAt >= :startDate AND #read = :false',
          ExpressionAttributeNames: {
            '#typename': '__typename',
            '#read': 'read',
          },
          ExpressionAttributeValues: {
            ':userId': user.id,
            ':type': 'Notification',
            ':startDate': startDate.toISOString(),
            ':false': false,
          },
        }));

        const notifications = notificationsResult.Items || [];

        // Only send if there's activity
        if (tasks.length > 0 || notifications.length > 0) {
          const emailPromise = sendDigestEmail(user, tasks, notifications, digestType);
          emailPromises.push(emailPromise);
        }
      } catch (error) {
        console.error(`Error processing digest for user ${user.id}:`, error);
      }
    }

    await Promise.allSettled(emailPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Sent ${emailPromises.length} ${digestType} digests`,
      }),
    };
  } catch (error) {
    console.error('Error sending email digests:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send digests', details: error.message }),
    };
  }
};

async function sendDigestEmail(user, tasks, notifications, digestType) {
  try {
    const tasksByStatus = {
      TODO: tasks.filter(t => t.status === 'TODO'),
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
      DONE: tasks.filter(t => t.status === 'DONE'),
    };

    const emailParams = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@projecthub.com',
      Destination: {
        ToAddresses: [user.email],
      },
      Message: {
        Subject: {
          Data: `📊 Your ${digestType === 'daily' ? 'Daily' : 'Weekly'} ProjectHub Digest`,
        },
        Body: {
          Html: {
            Data: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { padding: 30px; background: #f9fafb; }
                  .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                  .stat-box { display: inline-block; padding: 15px 25px; margin: 10px; background: #eff6ff; border-radius: 8px; text-align: center; }
                  .stat-number { font-size: 32px; font-weight: bold; color: #3b82f6; }
                  .stat-label { font-size: 14px; color: #6b7280; }
                  .task-list { list-style: none; padding: 0; }
                  .task-item { padding: 12px; margin: 8px 0; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px; }
                  .notification-item { padding: 12px; margin: 8px 0; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; }
                  .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📊 Your ${digestType === 'daily' ? 'Daily' : 'Weekly'} Digest</h1>
                    <p>Here's what happened ${digestType === 'daily' ? 'yesterday' : 'this week'}</p>
                  </div>
                  <div class="content">
                    <div class="section">
                      <h2>📈 Activity Summary</h2>
                      <div style="text-align: center;">
                        <div class="stat-box">
                          <div class="stat-number">${tasks.length}</div>
                          <div class="stat-label">Tasks Updated</div>
                        </div>
                        <div class="stat-box">
                          <div class="stat-number">${notifications.length}</div>
                          <div class="stat-label">Notifications</div>
                        </div>
                        <div class="stat-box">
                          <div class="stat-number">${tasksByStatus.DONE.length}</div>
                          <div class="stat-label">Completed</div>
                        </div>
                      </div>
                    </div>

                    ${tasksByStatus.TODO.length > 0 ? `
                    <div class="section">
                      <h3>📋 To Do (${tasksByStatus.TODO.length})</h3>
                      <ul class="task-list">
                        ${tasksByStatus.TODO.slice(0, 5).map(task => `
                          <li class="task-item">
                            <strong>${task.title}</strong>
                            ${task.dueDate ? `<br><small>Due: ${new Date(task.dueDate).toLocaleDateString()}</small>` : ''}
                          </li>
                        `).join('')}
                      </ul>
                      ${tasksByStatus.TODO.length > 5 ? `<p><small>...and ${tasksByStatus.TODO.length - 5} more</small></p>` : ''}
                    </div>
                    ` : ''}

                    ${tasksByStatus.IN_PROGRESS.length > 0 ? `
                    <div class="section">
                      <h3>🔄 In Progress (${tasksByStatus.IN_PROGRESS.length})</h3>
                      <ul class="task-list">
                        ${tasksByStatus.IN_PROGRESS.slice(0, 5).map(task => `
                          <li class="task-item">
                            <strong>${task.title}</strong>
                            ${task.completionPercentage ? `<br><small>${task.completionPercentage}% complete</small>` : ''}
                          </li>
                        `).join('')}
                      </ul>
                    </div>
                    ` : ''}

                    ${notifications.length > 0 ? `
                    <div class="section">
                      <h3>🔔 Unread Notifications (${notifications.length})</h3>
                      <ul class="task-list">
                        ${notifications.slice(0, 5).map(notif => `
                          <li class="notification-item">
                            <strong>${notif.title}</strong>
                            <br><small>${notif.message}</small>
                          </li>
                        `).join('')}
                      </ul>
                      ${notifications.length > 5 ? `<p><small>...and ${notifications.length - 5} more</small></p>` : ''}
                    </div>
                    ` : ''}

                    <div style="text-align: center;">
                      <a href="${process.env.APP_URL}/projects" class="button">View Dashboard</a>
                    </div>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} ProjectHub. All rights reserved.</p>
                    <p><small>You're receiving this ${digestType} digest. <a href="${process.env.APP_URL}/settings">Manage preferences</a></small></p>
                  </div>
                </div>
              </body>
              </html>
            `,
          },
          Text: {
            Data: `
Your ${digestType === 'daily' ? 'Daily' : 'Weekly'} ProjectHub Digest

Activity Summary:
- ${tasks.length} tasks updated
- ${notifications.length} notifications
- ${tasksByStatus.DONE.length} tasks completed

To Do (${tasksByStatus.TODO.length}):
${tasksByStatus.TODO.slice(0, 5).map(t => `- ${t.title}`).join('\n')}

In Progress (${tasksByStatus.IN_PROGRESS.length}):
${tasksByStatus.IN_PROGRESS.slice(0, 5).map(t => `- ${t.title}`).join('\n')}

Unread Notifications (${notifications.length}):
${notifications.slice(0, 5).map(n => `- ${n.title}: ${n.message}`).join('\n')}

View Dashboard: ${process.env.APP_URL}/projects

© ${new Date().getFullYear()} ProjectHub
            `,
          },
        },
      },
    };

    await sesClient.send(new SendEmailCommand(emailParams));
    console.log(`Digest sent to: ${user.email}`);
  } catch (error) {
    console.error(`Error sending digest to ${user.email}:`, error);
    throw error;
  }
}
