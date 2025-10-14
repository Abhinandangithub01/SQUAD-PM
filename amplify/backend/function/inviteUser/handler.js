/**
 * Invite User Lambda Function
 * Sends invitation email and creates pending invitation record
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { randomUUID } from 'node:crypto';
import crypto from 'node:crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});

// Generate secure invitation token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export const handler = async (event) => {
  console.log('Invite User:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const { organizationId, email, role = 'MEMBER' } = body;
    
    // Get user ID from Cognito claims
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const inviterEmail = event.requestContext?.authorizer?.claims?.email;
    
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Validate required fields
    if (!organizationId || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Organization ID and email are required' }),
      };
    }

    const tableName = process.env.DYNAMODB_TABLE_NAME;

    // Check if user is authorized to invite (must be OWNER, ADMIN, or MANAGER)
    const membershipQuery = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byOrganizationAndUser',
      KeyConditionExpression: 'organizationId = :orgId AND userId = :userId',
      ExpressionAttributeValues: {
        ':orgId': organizationId,
        ':userId': userId,
      },
    }));

    const membership = membershipQuery.Items?.[0];
    if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Insufficient permissions to invite users' }),
      };
    }

    // Get organization details
    const orgResult = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { id: organizationId },
    }));

    const organization = orgResult.Item;
    if (!organization) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Organization not found' }),
      };
    }

    // Check if organization has reached user limit
    const currentUsers = organization.usage?.currentUsers || 0;
    const maxUsers = organization.limits?.maxUsers || 5;
    
    if (currentUsers >= maxUsers) {
      return {
        statusCode: 403,
        body: JSON.stringify({ 
          error: 'User limit reached',
          message: `Your ${organization.plan} plan allows up to ${maxUsers} users. Please upgrade to add more users.`
        }),
      };
    }

    // Check if user is already a member or invited
    const existingInviteQuery = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byOrganizationAndEmail',
      KeyConditionExpression: 'organizationId = :orgId AND email = :email',
      ExpressionAttributeValues: {
        ':orgId': organizationId,
        ':email': email,
      },
    }));

    if (existingInviteQuery.Items && existingInviteQuery.Items.length > 0) {
      const existingInvite = existingInviteQuery.Items[0];
      if (existingInvite.status === 'PENDING') {
        return {
          statusCode: 409,
          body: JSON.stringify({ error: 'User already invited' }),
        };
      }
    }

    // Create invitation
    const invitationId = randomUUID();
    const token = generateToken();
    const now = new Date().toISOString();
    
    // Invitation expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = {
      id: invitationId,
      organizationId,
      email,
      role,
      invitedBy: userId,
      token,
      status: 'PENDING',
      expiresAt: expiresAt.toISOString(),
      createdAt: now,
      updatedAt: now,
      __typename: 'Invitation',
    };

    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: invitation,
    }));

    // Send invitation email
    const inviteUrl = `${process.env.APP_URL}/accept-invite?token=${token}`;
    
    const emailParams = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@projecthub.com',
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: `You've been invited to join ${organization.name} on ProjectHub`,
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
                  .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
                  .content { padding: 30px; background: #f9fafb; }
                  .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>ProjectHub Invitation</h1>
                  </div>
                  <div class="content">
                    <h2>You've been invited!</h2>
                    <p>${inviterEmail} has invited you to join <strong>${organization.name}</strong> on ProjectHub.</p>
                    <p>Role: <strong>${role}</strong></p>
                    <p>Click the button below to accept the invitation:</p>
                    <a href="${inviteUrl}" class="button">Accept Invitation</a>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #6b7280;">${inviteUrl}</p>
                    <p><small>This invitation will expire on ${expiresAt.toLocaleDateString()}.</small></p>
                  </div>
                  <div class="footer">
                    <p>© ${new Date().getFullYear()} ProjectHub. All rights reserved.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          },
          Text: {
            Data: `
You've been invited to join ${organization.name} on ProjectHub!

${inviterEmail} has invited you as a ${role}.

Accept your invitation by visiting: ${inviteUrl}

This invitation will expire on ${expiresAt.toLocaleDateString()}.

© ${new Date().getFullYear()} ProjectHub
            `,
          },
        },
      },
    };

    try {
      await sesClient.send(new SendEmailCommand(emailParams));
      console.log('Invitation email sent to:', email);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails
    }

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        invitation: {
          id: invitationId,
          email,
          role,
          expiresAt: expiresAt.toISOString(),
        },
      }),
    };
  } catch (error) {
    console.error('Error inviting user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to invite user', details: error.message }),
    };
  }
};
