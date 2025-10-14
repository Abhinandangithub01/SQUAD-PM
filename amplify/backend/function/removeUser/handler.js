/**
 * Remove User Lambda Function
 * Removes a user from an organization
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log('Remove User:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const { organizationId, userIdToRemove } = body;
    
    // Get requesting user ID from Cognito claims
    const requestingUserId = event.requestContext?.authorizer?.claims?.sub;
    
    if (!requestingUserId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    if (!organizationId || !userIdToRemove) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Organization ID and user ID are required' }),
      };
    }

    // Prevent self-removal
    if (requestingUserId === userIdToRemove) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'You cannot remove yourself. Please transfer ownership first or leave the organization.' }),
      };
    }

    const tableName = process.env.DYNAMODB_TABLE_NAME;

    // Get requesting user's membership to check permissions
    const requestingMemberQuery = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byOrganizationAndUser',
      KeyConditionExpression: 'organizationId = :orgId AND userId = :userId',
      ExpressionAttributeValues: {
        ':orgId': organizationId,
        ':userId': requestingUserId,
      },
    }));

    const requestingMember = requestingMemberQuery.Items?.[0];
    if (!requestingMember) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'You are not a member of this organization' }),
      };
    }

    // Check if requesting user has permission to remove users
    if (!['OWNER', 'ADMIN'].includes(requestingMember.role)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only owners and admins can remove users' }),
      };
    }

    // Get the membership to remove
    const targetMemberQuery = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byOrganizationAndUser',
      KeyConditionExpression: 'organizationId = :orgId AND userId = :userId',
      ExpressionAttributeValues: {
        ':orgId': organizationId,
        ':userId': userIdToRemove,
      },
    }));

    const targetMember = targetMemberQuery.Items?.[0];
    if (!targetMember) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User is not a member of this organization' }),
      };
    }

    // Prevent non-owners from removing owners
    if (targetMember.role === 'OWNER' && requestingMember.role !== 'OWNER') {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only owners can remove other owners' }),
      };
    }

    // Prevent removing the last owner
    if (targetMember.role === 'OWNER') {
      const ownersQuery = await docClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: 'byOrganizationAndRole',
        KeyConditionExpression: 'organizationId = :orgId AND #role = :role',
        ExpressionAttributeNames: {
          '#role': 'role',
        },
        ExpressionAttributeValues: {
          ':orgId': organizationId,
          ':role': 'OWNER',
        },
      }));

      if (ownersQuery.Items && ownersQuery.Items.length <= 1) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Cannot remove the last owner. Please transfer ownership first.' }),
        };
      }
    }

    // Delete the membership
    await docClient.send(new DeleteCommand({
      TableName: tableName,
      Key: { id: targetMember.id },
    }));

    // Update organization user count
    const now = new Date().toISOString();
    await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: { id: organizationId },
      UpdateExpression: 'SET usage.currentUsers = usage.currentUsers - :dec, updatedAt = :now',
      ExpressionAttributeValues: {
        ':dec': 1,
        ':now': now,
      },
    }));

    console.log('User removed successfully:', userIdToRemove);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: 'User removed from organization successfully',
      }),
    };
  } catch (error) {
    console.error('Error removing user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to remove user', details: error.message }),
    };
  }
};
