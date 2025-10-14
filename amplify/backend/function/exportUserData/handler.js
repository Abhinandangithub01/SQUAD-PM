/**
 * Export User Data Lambda Function
 * GDPR compliance - export all user data
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});

export const handler = async (event) => {
  console.log('Export User Data:', JSON.stringify(event, null, 2));

  try {
    const { userId } = JSON.parse(event.body || event);

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' }),
      };
    }

    const tableName = process.env.DYNAMODB_TABLE_NAME;
    const userData = {};

    // Get user profile
    const userResult = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));
    userData.profile = userResult.Items?.[0] || null;

    if (!userData.profile) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Get organization memberships
    const membershipsResult = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byUser',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: '#typename = :type',
      ExpressionAttributeNames: {
        '#typename': '__typename',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':type': 'OrganizationMember',
      },
    }));
    userData.organizations = membershipsResult.Items || [];

    // Get tasks (created or assigned)
    const tasksResult = await docClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: '(createdById = :userId OR assignedToId = :userId) AND #typename = :type',
      ExpressionAttributeNames: {
        '#typename': '__typename',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':type': 'Task',
      },
    }));
    userData.tasks = tasksResult.Items || [];

    // Get comments
    const commentsResult = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byUser',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: '#typename = :type',
      ExpressionAttributeNames: {
        '#typename': '__typename',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':type': 'Comment',
      },
    }));
    userData.comments = commentsResult.Items || [];

    // Get activities
    const activitiesResult = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byUser',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: '#typename = :type',
      ExpressionAttributeNames: {
        '#typename': '__typename',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':type': 'Activity',
      },
    }));
    userData.activities = activitiesResult.Items || [];

    // Get notifications
    const notificationsResult = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byUser',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: '#typename = :type',
      ExpressionAttributeNames: {
        '#typename': '__typename',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':type': 'Notification',
      },
    }));
    userData.notifications = notificationsResult.Items || [];

    // Get time entries
    const timeEntriesResult = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byUser',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: '#typename = :type',
      ExpressionAttributeNames: {
        '#typename': '__typename',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':type': 'TimeEntry',
      },
    }));
    userData.timeEntries = timeEntriesResult.Items || [];

    // Generate JSON export
    const exportData = JSON.stringify(userData, null, 2);
    const exportDate = new Date().toISOString().split('T')[0];

    // Send email with data
    await sesClient.send(new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL || 'noreply@projecthub.com',
      Destination: {
        ToAddresses: [userData.profile.email],
      },
      Message: {
        Subject: {
          Data: 'Your ProjectHub Data Export',
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
                  .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                  pre { background: #1f2937; color: #f3f4f6; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>📦 Your Data Export</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${userData.profile.firstName || 'there'}!</p>
                    <p>As requested, here is an export of all your data from ProjectHub:</p>
                    
                    <h3>Data Summary:</h3>
                    <ul>
                      <li>Organizations: ${userData.organizations.length}</li>
                      <li>Tasks: ${userData.tasks.length}</li>
                      <li>Comments: ${userData.comments.length}</li>
                      <li>Activities: ${userData.activities.length}</li>
                      <li>Notifications: ${userData.notifications.length}</li>
                      <li>Time Entries: ${userData.timeEntries.length}</li>
                    </ul>

                    <p>Your complete data export is attached below in JSON format:</p>
                    <pre>${exportData.substring(0, 500)}...</pre>
                    
                    <p><small>This is a truncated preview. The full export is ${(exportData.length / 1024).toFixed(2)} KB.</small></p>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} ProjectHub. All rights reserved.</p>
                    <p><small>Export generated on ${exportDate}</small></p>
                  </div>
                </div>
              </body>
              </html>
            `,
          },
          Text: {
            Data: `
Your ProjectHub Data Export

Hi ${userData.profile.firstName || 'there'}!

As requested, here is an export of all your data from ProjectHub.

Data Summary:
- Organizations: ${userData.organizations.length}
- Tasks: ${userData.tasks.length}
- Comments: ${userData.comments.length}
- Activities: ${userData.activities.length}
- Notifications: ${userData.notifications.length}
- Time Entries: ${userData.timeEntries.length}

Full data export:
${exportData}

Export generated on ${exportDate}
© ${new Date().getFullYear()} ProjectHub
            `,
          },
        },
      },
    }));

    console.log('Data export sent to:', userData.profile.email);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Data export sent to your email',
        summary: {
          organizations: userData.organizations.length,
          tasks: userData.tasks.length,
          comments: userData.comments.length,
          activities: userData.activities.length,
          notifications: userData.notifications.length,
          timeEntries: userData.timeEntries.length,
        },
      }),
    };
  } catch (error) {
    console.error('Error exporting user data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to export data', details: error.message }),
    };
  }
};
