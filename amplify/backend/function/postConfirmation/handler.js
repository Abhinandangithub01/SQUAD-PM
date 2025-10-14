/**
 * Post Confirmation Lambda Trigger
 * Automatically creates a User profile in DynamoDB after successful Cognito signup
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log('Post Confirmation Trigger:', JSON.stringify(event, null, 2));

  const { request, userPoolId, userName } = event;
  const { userAttributes } = request;

  try {
    // Extract user information from Cognito attributes
    const userId = userName; // Cognito username (sub)
    const email = userAttributes.email;
    const firstName = userAttributes.given_name || '';
    const lastName = userAttributes.family_name || '';
    
    // Get organization ID from custom attribute (if exists)
    const organizationId = userAttributes['custom:organizationId'] || null;

    // Create User profile in DynamoDB
    const userProfile = {
      id: userId,
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: 'MEMBER', // Default role
      online: false,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __typename: 'User',
    };

    // Save to DynamoDB
    const tableName = process.env.DYNAMODB_TABLE_NAME;
    
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: userProfile,
      ConditionExpression: 'attribute_not_exists(id)', // Prevent overwriting
    }));

    console.log('User profile created successfully:', userId);

    // If user has an organization ID, add them as a member
    if (organizationId) {
      const membershipId = randomUUID();
      const membership = {
        id: membershipId,
        organizationId: organizationId,
        userId: userId,
        role: 'MEMBER',
        status: 'ACTIVE',
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __typename: 'OrganizationMember',
      };

      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: membership,
      }));

      console.log('Organization membership created:', membershipId);
    }

    return event;
  } catch (error) {
    console.error('Error in post confirmation:', error);
    // Don't throw error - we don't want to block user signup
    // The user can be added to org later
    return event;
  }
};
