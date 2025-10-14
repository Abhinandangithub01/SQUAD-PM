/**
 * Accept Invitation Lambda Function
 * Allows users to accept organization invitations
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log('Accept Invite:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const { token } = body;
    
    // Get user ID from Cognito claims
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const userEmail = event.requestContext?.authorizer?.claims?.email;
    
    if (!userId || !userEmail) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invitation token is required' }),
      };
    }

    const tableName = process.env.DYNAMODB_TABLE_NAME;

    // Find invitation by token
    const inviteQuery = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byToken',
      KeyConditionExpression: 'token = :token',
      ExpressionAttributeValues: {
        ':token': token,
      },
    }));

    if (!inviteQuery.Items || inviteQuery.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Invitation not found' }),
      };
    }

    const invitation = inviteQuery.Items[0];

    // Verify invitation is for this email
    if (invitation.email !== userEmail) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'This invitation is for a different email address' }),
      };
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Invitation is ${invitation.status.toLowerCase()}` }),
      };
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expiresAt);
    if (now > expiresAt) {
      // Update invitation status to EXPIRED
      await docClient.send(new UpdateCommand({
        TableName: tableName,
        Key: { id: invitation.id },
        UpdateExpression: 'SET #status = :expired, updatedAt = :now',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':expired': 'EXPIRED',
          ':now': now.toISOString(),
        },
      }));

      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invitation has expired' }),
      };
    }

    // Get organization details
    const orgResult = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { id: invitation.organizationId },
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
          error: 'Organization has reached user limit',
          message: `The ${organization.plan} plan allows up to ${maxUsers} users.`
        }),
      };
    }

    // Check if user is already a member
    const existingMemberQuery = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byOrganizationAndUser',
      KeyConditionExpression: 'organizationId = :orgId AND userId = :userId',
      ExpressionAttributeValues: {
        ':orgId': invitation.organizationId,
        ':userId': userId,
      },
    }));

    if (existingMemberQuery.Items && existingMemberQuery.Items.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'You are already a member of this organization' }),
      };
    }

    // Create organization membership
    const membershipId = randomUUID();
    const nowISO = now.toISOString();
    
    const membership = {
      id: membershipId,
      organizationId: invitation.organizationId,
      userId,
      role: invitation.role,
      status: 'ACTIVE',
      permissions: JSON.stringify([]), // Default permissions based on role
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.createdAt,
      joinedAt: nowISO,
      createdAt: nowISO,
      updatedAt: nowISO,
      __typename: 'OrganizationMember',
    };

    // Update invitation status
    const updateInvitation = {
      TableName: tableName,
      Key: { id: invitation.id },
      UpdateExpression: 'SET #status = :accepted, acceptedAt = :now, updatedAt = :now',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':accepted': 'ACCEPTED',
        ':now': nowISO,
      },
    };

    // Update organization user count
    const updateOrganization = {
      TableName: tableName,
      Key: { id: invitation.organizationId },
      UpdateExpression: 'SET usage.currentUsers = usage.currentUsers + :inc, updatedAt = :now',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':now': nowISO,
      },
    };

    // Execute all updates
    await Promise.all([
      docClient.send(new PutCommand({
        TableName: tableName,
        Item: membership,
      })),
      docClient.send(new UpdateCommand(updateInvitation)),
      docClient.send(new UpdateCommand(updateOrganization)),
    ]);

    console.log('Invitation accepted successfully:', membershipId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: `Welcome to ${organization.name}!`,
        membership: {
          id: membershipId,
          organizationId: invitation.organizationId,
          organizationName: organization.name,
          role: invitation.role,
          joinedAt: nowISO,
        },
      }),
    };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to accept invitation', details: error.message }),
    };
  }
};
