/**
 * Create Organization Lambda Function
 * Creates a new organization with default settings and makes the creator the owner
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Plan limits configuration
const PLAN_LIMITS = {
  FREE: {
    maxUsers: 5,
    maxProjects: 3,
    maxStorageGB: 1,
    maxApiCallsPerMonth: 10000,
  },
  STARTER: {
    maxUsers: 20,
    maxProjects: 999,
    maxStorageGB: 10,
    maxApiCallsPerMonth: 100000,
  },
  PROFESSIONAL: {
    maxUsers: 100,
    maxProjects: 999,
    maxStorageGB: 100,
    maxApiCallsPerMonth: 1000000,
  },
  ENTERPRISE: {
    maxUsers: 999,
    maxProjects: 999,
    maxStorageGB: 1000,
    maxApiCallsPerMonth: 10000000,
  },
};

export const handler = async (event) => {
  console.log('Create Organization:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const { name, slug, description, industry, size, plan = 'FREE' } = body;
    
    // Get user ID from Cognito claims
    const userId = event.requestContext?.authorizer?.claims?.sub;
    
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Validate required fields
    if (!name || !slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name and slug are required' }),
      };
    }

    // Check if slug is already taken
    const tableName = process.env.DYNAMODB_TABLE_NAME;
    const existingOrg = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { id: `ORG#${slug}` },
    }));

    if (existingOrg.Item) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'Organization slug already exists' }),
      };
    }

    const organizationId = randomUUID();
    const now = new Date().toISOString();
    
    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create organization
    const organization = {
      id: organizationId,
      name,
      slug,
      description: description || '',
      industry: industry || '',
      size: size || 'SMALL',
      plan,
      status: 'TRIAL',
      settings: {
        allowedDomains: [],
        ssoEnabled: false,
        customBranding: {},
        features: {
          taskAutomation: plan !== 'FREE',
          analytics: plan !== 'FREE',
          customFields: plan === 'PROFESSIONAL' || plan === 'ENTERPRISE',
          apiAccess: plan === 'PROFESSIONAL' || plan === 'ENTERPRISE',
        },
      },
      limits: PLAN_LIMITS[plan],
      usage: {
        currentUsers: 1,
        currentProjects: 0,
        storageUsedBytes: 0,
        apiCallsThisMonth: 0,
      },
      billing: {
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        nextBillingDate: null,
        paymentMethod: null,
      },
      ownerId: userId,
      logoUrl: null,
      website: null,
      trialEndsAt: trialEndsAt.toISOString(),
      createdAt: now,
      updatedAt: now,
      __typename: 'Organization',
    };

    // Create organization member (owner)
    const membershipId = randomUUID();
    const membership = {
      id: membershipId,
      organizationId,
      userId,
      role: 'OWNER',
      permissions: JSON.stringify(['*']), // Full permissions
      status: 'ACTIVE',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
      __typename: 'OrganizationMember',
    };

    // Save both to DynamoDB
    await Promise.all([
      docClient.send(new PutCommand({
        TableName: tableName,
        Item: organization,
      })),
      docClient.send(new PutCommand({
        TableName: tableName,
        Item: membership,
      })),
    ]);

    console.log('Organization created successfully:', organizationId);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        organization: {
          id: organizationId,
          name,
          slug,
          plan,
          status: 'TRIAL',
          trialEndsAt: trialEndsAt.toISOString(),
        },
      }),
    };
  } catch (error) {
    console.error('Error creating organization:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create organization', details: error.message }),
    };
  }
};
