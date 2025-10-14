/**
 * Delete User Data Lambda Function
 * GDPR compliance - right to be forgotten
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({});
const sesClient = new SESClient({});

export const handler = async (event) => {
  console.log('Delete User Data:', JSON.stringify(event, null, 2));

  try {
    const { userId, confirmationToken } = JSON.parse(event.body || event);

    if (!userId || !confirmationToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId and confirmationToken are required' }),
      };
    }

    // Verify confirmation token (in production, store and verify this properly)
    if (confirmationToken !== `DELETE_${userId}_CONFIRMED`) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Invalid confirmation token' }),
      };
    }

    const tableName = process.env.DYNAMODB_TABLE_NAME;
    const deletedItems = {
      profile: 0,
      memberships: 0,
      tasks: 0,
      comments: 0,
      activities: 0,
      notifications: 0,
      timeEntries: 0,
      auditLogs: 0,
    };

    // Get user email before deletion
    const userResult = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));
    const userEmail = userResult.Items?.[0]?.email;

    // Delete organization memberships
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

    for (const membership of membershipsResult.Items || []) {
      await docClient.send(new DeleteCommand({
        TableName: tableName,
        Key: { id: membership.id },
      }));
      deletedItems.memberships++;
    }

    // Anonymize tasks (don't delete, just remove user reference)
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

    for (const task of tasksResult.Items || []) {
      const updates = [];
      const values = {};
      
      if (task.createdById === userId) {
        updates.push('createdById = :anonymous');
        values[':anonymous'] = 'DELETED_USER';
      }
      if (task.assignedToId === userId) {
        updates.push('assignedToId = :null');
        values[':null'] = null;
      }

      if (updates.length > 0) {
        await docClient.send(new UpdateCommand({
          TableName: tableName,
          Key: { id: task.id },
          UpdateExpression: `SET ${updates.join(', ')}`,
          ExpressionAttributeValues: values,
        }));
        deletedItems.tasks++;
      }
    }

    // Delete comments
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

    for (const comment of commentsResult.Items || []) {
      await docClient.send(new DeleteCommand({
        TableName: tableName,
        Key: { id: comment.id },
      }));
      deletedItems.comments++;
    }

    // Delete activities
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

    for (const activity of activitiesResult.Items || []) {
      await docClient.send(new DeleteCommand({
        TableName: tableName,
        Key: { id: activity.id },
      }));
      deletedItems.activities++;
    }

    // Delete notifications
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

    for (const notification of notificationsResult.Items || []) {
      await docClient.send(new DeleteCommand({
        TableName: tableName,
        Key: { id: notification.id },
      }));
      deletedItems.notifications++;
    }

    // Delete time entries
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

    for (const timeEntry of timeEntriesResult.Items || []) {
      await docClient.send(new DeleteCommand({
        TableName: tableName,
        Key: { id: timeEntry.id },
      }));
      deletedItems.timeEntries++;
    }

    // Anonymize audit logs (keep for compliance, but remove PII)
    const auditLogsResult = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byUser',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: '#typename = :type',
      ExpressionAttributeNames: {
        '#typename': '__typename',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':type': 'AuditLog',
      },
    }));

    for (const log of auditLogsResult.Items || []) {
      await docClient.send(new UpdateCommand({
        TableName: tableName,
        Key: { id: log.id },
        UpdateExpression: 'SET userId = :anonymous, ipAddress = :removed, userAgent = :removed',
        ExpressionAttributeValues: {
          ':anonymous': 'DELETED_USER',
          ':removed': 'REMOVED',
        },
      }));
      deletedItems.auditLogs++;
    }

    // Delete user profile
    await docClient.send(new DeleteCommand({
      TableName: tableName,
      Key: { id: userId },
    }));
    deletedItems.profile = 1;

    // Delete from Cognito
    try {
      await cognitoClient.send(new AdminDeleteUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: userId,
      }));
    } catch (err) {
      console.error('Error deleting Cognito user:', err);
      // Continue even if Cognito deletion fails
    }

    // Send confirmation email
    if (userEmail) {
      await sesClient.send(new SendEmailCommand({
        Source: process.env.SES_FROM_EMAIL || 'noreply@projecthub.com',
        Destination: {
          ToAddresses: [userEmail],
        },
        Message: {
          Subject: {
            Data: 'Your ProjectHub Account Has Been Deleted',
          },
          Body: {
            Html: {
              Data: `
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #ef4444;">Account Deleted</h1>
                    <p>Your ProjectHub account and all associated data have been permanently deleted.</p>
                    <h3>What was deleted:</h3>
                    <ul>
                      <li>User profile</li>
                      <li>${deletedItems.memberships} organization memberships</li>
                      <li>${deletedItems.tasks} tasks (anonymized)</li>
                      <li>${deletedItems.comments} comments</li>
                      <li>${deletedItems.activities} activities</li>
                      <li>${deletedItems.notifications} notifications</li>
                      <li>${deletedItems.timeEntries} time entries</li>
                      <li>${deletedItems.auditLogs} audit logs (anonymized)</li>
                    </ul>
                    <p>If you didn't request this deletion, please contact support immediately.</p>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
                      © ${new Date().getFullYear()} ProjectHub. All rights reserved.
                    </p>
                  </div>
                </body>
                </html>
              `,
            },
            Text: {
              Data: `
Account Deleted

Your ProjectHub account and all associated data have been permanently deleted.

What was deleted:
- User profile
- ${deletedItems.memberships} organization memberships
- ${deletedItems.tasks} tasks (anonymized)
- ${deletedItems.comments} comments
- ${deletedItems.activities} activities
- ${deletedItems.notifications} notifications
- ${deletedItems.timeEntries} time entries
- ${deletedItems.auditLogs} audit logs (anonymized)

If you didn't request this deletion, please contact support immediately.

© ${new Date().getFullYear()} ProjectHub
              `,
            },
          },
        },
      }));
    }

    console.log('User data deleted:', deletedItems);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'All user data has been permanently deleted',
        deletedItems,
      }),
    };
  } catch (error) {
    console.error('Error deleting user data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete data', details: error.message }),
    };
  }
};
