/**
 * Send Notification Lambda Function
 * Sends notifications via multiple channels (email, in-app, push)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { randomUUID } from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});

// Notification templates
const TEMPLATES = {
  TASK_ASSIGNED: {
    subject: '📋 New Task Assigned',
    icon: '📋',
    color: '#3b82f6',
  },
  TASK_COMPLETED: {
    subject: '✅ Task Completed',
    icon: '✅',
    color: '#10b981',
  },
  COMMENT_ADDED: {
    subject: '💬 New Comment',
    icon: '💬',
    color: '#8b5cf6',
  },
  MENTION: {
    subject: '👋 You were mentioned',
    icon: '👋',
    color: '#f59e0b',
  },
  PROJECT_INVITE: {
    subject: '🎯 Project Invitation',
    icon: '🎯',
    color: '#06b6d4',
  },
  DUE_DATE_REMINDER: {
    subject: '⏰ Due Date Reminder',
    icon: '⏰',
    color: '#ef4444',
  },
};

export const handler = async (event) => {
  console.log('Send Notification:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const {
      userId,
      type,
      title,
      message,
      link,
      metadata = {},
      channels = ['in-app', 'email'],
    } = body;

    if (!userId || !type || !title || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId, type, title, and message are required' }),
      };
    }

    const tableName = process.env.DYNAMODB_TABLE_NAME;
    const template = TEMPLATES[type] || TEMPLATES.TASK_ASSIGNED;

    // Get user details
    const userResult = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { id: userId },
    }));

    const user = userResult.Item;
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const results = {
      'in-app': null,
      email: null,
      push: null,
    };

    // 1. Create in-app notification
    if (channels.includes('in-app')) {
      try {
        const notificationId = randomUUID();
        const now = new Date().toISOString();

        const notification = {
          id: notificationId,
          userId,
          type,
          title,
          message,
          link: link || null,
          metadata: JSON.stringify(metadata),
          read: false,
          createdAt: now,
          updatedAt: now,
          __typename: 'Notification',
        };

        await docClient.send(new PutCommand({
          TableName: tableName,
          Item: notification,
        }));

        results['in-app'] = { success: true, notificationId };
        console.log('In-app notification created:', notificationId);
      } catch (error) {
        console.error('Error creating in-app notification:', error);
        results['in-app'] = { success: false, error: error.message };
      }
    }

    // 2. Send email notification
    if (channels.includes('email') && user.email) {
      try {
        await sendEmailNotification(user, type, title, message, link, template);
        results.email = { success: true, recipient: user.email };
        console.log('Email notification sent to:', user.email);
      } catch (error) {
        console.error('Error sending email notification:', error);
        results.email = { success: false, error: error.message };
      }
    }

    // 3. Send push notification (placeholder for future implementation)
    if (channels.includes('push')) {
      // TODO: Implement push notifications (FCM, APNS, etc.)
      results.push = { success: false, error: 'Push notifications not implemented yet' };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'Notification sent',
        results,
      }),
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send notification', details: error.message }),
    };
  }
};

async function sendEmailNotification(user, type, title, message, link, template) {
  const emailParams = {
    Source: process.env.SES_FROM_EMAIL || 'noreply@projecthub.com',
    Destination: {
      ToAddresses: [user.email],
    },
    Message: {
      Subject: {
        Data: template.subject,
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
                .header { background: ${template.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px; }
                .notification-box { background: white; padding: 20px; border-left: 4px solid ${template.color}; border-radius: 4px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 24px; background: ${template.color}; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>${template.icon} ${template.subject}</h1>
                </div>
                <div class="content">
                  <p>Hi ${user.firstName || 'there'}!</p>
                  <div class="notification-box">
                    <h2 style="margin-top: 0; color: ${template.color};">${title}</h2>
                    <p>${message}</p>
                  </div>
                  ${link ? `
                    <p style="text-align: center;">
                      <a href="${process.env.APP_URL}${link}" class="button">View Details</a>
                    </p>
                  ` : ''}
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} ProjectHub. All rights reserved.</p>
                  <p><small>You're receiving this notification based on your activity.</small></p>
                </div>
              </div>
            </body>
            </html>
          `,
        },
        Text: {
          Data: `
${template.subject}

Hi ${user.firstName || 'there'}!

${title}

${message}

${link ? `View details: ${process.env.APP_URL}${link}` : ''}

© ${new Date().getFullYear()} ProjectHub
          `,
        },
      },
    },
  };

  await sesClient.send(new SendEmailCommand(emailParams));
}
