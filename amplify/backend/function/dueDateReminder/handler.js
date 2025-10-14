/**
 * Due Date Reminder Lambda Function
 * Sends reminders for tasks with upcoming due dates
 * Scheduled to run daily via EventBridge
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});

export const handler = async (event) => {
  console.log('Due Date Reminder:', JSON.stringify(event, null, 2));

  try {
    const tableName = process.env.DYNAMODB_TABLE_NAME;
    const now = new Date();
    
    // Calculate reminder windows
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    
    const threeDays = new Date(now);
    threeDays.setDate(threeDays.getDate() + 3);
    threeDays.setHours(23, 59, 59, 999);
    
    const oneWeek = new Date(now);
    oneWeek.setDate(oneWeek.getDate() + 7);
    oneWeek.setHours(23, 59, 59, 999);

    // Scan for tasks with upcoming due dates
    // In production, use GSI for better performance
    const tasksResult = await docClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: '#typename = :task AND attribute_exists(dueDate) AND #status <> :done AND dueDate <= :oneWeek',
      ExpressionAttributeNames: {
        '#typename': '__typename',
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':task': 'Task',
        ':done': 'DONE',
        ':oneWeek': oneWeek.toISOString(),
      },
    }));

    const tasks = tasksResult.Items || [];
    console.log(`Found ${tasks.length} tasks with upcoming due dates`);

    // Group tasks by assignee and urgency
    const remindersByUser = {};

    for (const task of tasks) {
      if (!task.assignedToId || !task.dueDate) continue;

      const dueDate = new Date(task.dueDate);
      let urgency = 'week';
      
      if (dueDate <= tomorrow) {
        urgency = 'tomorrow';
      } else if (dueDate <= threeDays) {
        urgency = 'threeDays';
      }

      if (!remindersByUser[task.assignedToId]) {
        remindersByUser[task.assignedToId] = {
          tomorrow: [],
          threeDays: [],
          week: [],
        };
      }

      remindersByUser[task.assignedToId][urgency].push(task);
    }

    // Send reminders to each user
    const emailPromises = [];
    
    for (const [userId, taskGroups] of Object.entries(remindersByUser)) {
      // Get user details
      const userResult = await docClient.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'id = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      }));

      const user = userResult.Items?.[0];
      if (!user || !user.email) {
        console.log(`User ${userId} not found or has no email`);
        continue;
      }

      // Send email reminder
      const emailPromise = sendReminderEmail(user, taskGroups);
      emailPromises.push(emailPromise);
    }

    await Promise.allSettled(emailPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Processed ${tasks.length} tasks, sent ${emailPromises.length} reminders`,
        stats: {
          totalTasks: tasks.length,
          usersNotified: Object.keys(remindersByUser).length,
        },
      }),
    };
  } catch (error) {
    console.error('Error in due date reminder:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process reminders', details: error.message }),
    };
  }
};

async function sendReminderEmail(user, taskGroups) {
  try {
    const { tomorrow, threeDays, week } = taskGroups;
    const totalTasks = tomorrow.length + threeDays.length + week.length;

    if (totalTasks === 0) return;

    // Build email content
    let tasksHtml = '';
    
    if (tomorrow.length > 0) {
      tasksHtml += `
        <h3 style="color: #ef4444; margin-top: 20px;">⚠️ Due Tomorrow (${tomorrow.length})</h3>
        <ul style="list-style: none; padding: 0;">
          ${tomorrow.map(task => `
            <li style="padding: 10px; margin: 5px 0; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
              <strong>${task.title}</strong>
              ${task.projectId ? `<br><small style="color: #6b7280;">Project: ${task.projectId}</small>` : ''}
              <br><small style="color: #991b1b;">Due: ${new Date(task.dueDate).toLocaleDateString()}</small>
            </li>
          `).join('')}
        </ul>
      `;
    }

    if (threeDays.length > 0) {
      tasksHtml += `
        <h3 style="color: #f59e0b; margin-top: 20px;">📅 Due in 3 Days (${threeDays.length})</h3>
        <ul style="list-style: none; padding: 0;">
          ${threeDays.map(task => `
            <li style="padding: 10px; margin: 5px 0; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <strong>${task.title}</strong>
              ${task.projectId ? `<br><small style="color: #6b7280;">Project: ${task.projectId}</small>` : ''}
              <br><small style="color: #92400e;">Due: ${new Date(task.dueDate).toLocaleDateString()}</small>
            </li>
          `).join('')}
        </ul>
      `;
    }

    if (week.length > 0) {
      tasksHtml += `
        <h3 style="color: #3b82f6; margin-top: 20px;">📌 Due This Week (${week.length})</h3>
        <ul style="list-style: none; padding: 0;">
          ${week.map(task => `
            <li style="padding: 10px; margin: 5px 0; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <strong>${task.title}</strong>
              ${task.projectId ? `<br><small style="color: #6b7280;">Project: ${task.projectId}</small>` : ''}
              <br><small style="color: #1e40af;">Due: ${new Date(task.dueDate).toLocaleDateString()}</small>
            </li>
          `).join('')}
        </ul>
      `;
    }

    const emailParams = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@projecthub.com',
      Destination: {
        ToAddresses: [user.email],
      },
      Message: {
        Subject: {
          Data: `📋 Task Reminders: ${totalTasks} task${totalTasks > 1 ? 's' : ''} due soon`,
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
                  .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px; }
                  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                  .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📋 Task Reminders</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${user.firstName || 'there'}!</p>
                    <p>You have <strong>${totalTasks}</strong> task${totalTasks > 1 ? 's' : ''} with upcoming due dates:</p>
                    ${tasksHtml}
                    <p style="margin-top: 30px;">
                      <a href="${process.env.APP_URL}/projects" class="button">View All Tasks</a>
                    </p>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} ProjectHub. All rights reserved.</p>
                    <p><small>You're receiving this because you have tasks assigned to you.</small></p>
                  </div>
                </div>
              </body>
              </html>
            `,
          },
          Text: {
            Data: `
Task Reminders

Hi ${user.firstName || 'there'}!

You have ${totalTasks} task(s) with upcoming due dates:

${tomorrow.length > 0 ? `DUE TOMORROW (${tomorrow.length}):\n${tomorrow.map(t => `- ${t.title} (${new Date(t.dueDate).toLocaleDateString()})`).join('\n')}\n\n` : ''}
${threeDays.length > 0 ? `DUE IN 3 DAYS (${threeDays.length}):\n${threeDays.map(t => `- ${t.title} (${new Date(t.dueDate).toLocaleDateString()})`).join('\n')}\n\n` : ''}
${week.length > 0 ? `DUE THIS WEEK (${week.length}):\n${week.map(t => `- ${t.title} (${new Date(t.dueDate).toLocaleDateString()})`).join('\n')}\n\n` : ''}

View all tasks: ${process.env.APP_URL}/projects

© ${new Date().getFullYear()} ProjectHub
            `,
          },
        },
      },
    };

    await sesClient.send(new SendEmailCommand(emailParams));
    console.log(`Reminder email sent to: ${user.email}`);
  } catch (error) {
    console.error(`Error sending reminder to ${user.email}:`, error);
    throw error;
  }
}
