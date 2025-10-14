/**
 * PreSignUp Lambda Function
 * Validates email domain and enforces organization limits
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log('PreSignUp:', JSON.stringify(event, null, 2));

  try {
    const email = event.request.userAttributes.email;
    const domain = email.split('@')[1];

    // Block disposable email domains
    const disposableDomains = [
      'tempmail.com', 'throwaway.email', '10minutemail.com',
      'guerrillamail.com', 'mailinator.com', 'trashmail.com'
    ];

    if (disposableDomains.includes(domain.toLowerCase())) {
      throw new Error('Disposable email addresses are not allowed');
    }

    // Check if email is already invited to an organization
    const tableName = process.env.DYNAMODB_TABLE_NAME;
    
    const invitationsResult = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byEmail',
      KeyConditionExpression: 'email = :email',
      FilterExpression: '#typename = :type AND #status = :pending',
      ExpressionAttributeNames: {
        '#typename': '__typename',
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':email': email,
        ':type': 'Invitation',
        ':pending': 'PENDING',
      },
    }));

    // If user has pending invitation, auto-assign to organization
    if (invitationsResult.Items && invitationsResult.Items.length > 0) {
      const invitation = invitationsResult.Items[0];
      
      // Set custom attributes for auto-assignment
      event.response.autoConfirmUser = false;
      event.response.autoVerifyEmail = true;
      
      // Store invitation info for PostConfirmation
      if (!event.request.userAttributes['custom:organizationId']) {
        event.request.userAttributes['custom:organizationId'] = invitation.organizationId;
        event.request.userAttributes['custom:role'] = invitation.role;
      }
      
      console.log('User has pending invitation, will auto-assign to org:', invitation.organizationId);
    }

    // Check organization user limits (if organizationId is provided)
    const customOrgId = event.request.userAttributes['custom:organizationId'];
    if (customOrgId) {
      const orgResult = await docClient.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'id = :orgId',
        ExpressionAttributeValues: {
          ':orgId': customOrgId,
        },
      }));

      const organization = orgResult.Items?.[0];
      if (organization) {
        const currentUsers = organization.usage?.currentUsers || 0;
        const maxUsers = organization.limits?.maxUsers || 5;

        if (currentUsers >= maxUsers) {
          throw new Error(`Organization has reached the maximum user limit of ${maxUsers} users`);
        }
      }
    }

    // Allow signup to proceed
    return event;
  } catch (error) {
    console.error('PreSignUp error:', error);
    throw error; // This will prevent signup
  }
};
