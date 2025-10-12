import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface AcceptInvitationEvent {
  token: string;
  userId: string;
  userEmail: string;
}

export const handler = async (event: any) => {
  console.log('Accept Invitation Event:', JSON.stringify(event, null, 2));

  try {
    const body: AcceptInvitationEvent = typeof event.body === 'string' 
      ? JSON.parse(event.body) 
      : event.body;

    const { token, userId, userEmail } = body;

    if (!token || !userId || !userEmail) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Find invitation by token
    // Note: In production, you'd want to add a GSI on token field
    const invitation = await findInvitationByToken(token);

    if (!invitation) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({ error: 'Invitation not found' }),
      };
    }

    // Validate invitation
    if (invitation.status !== 'PENDING') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({ error: 'Invitation already used or expired' }),
      };
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({ error: 'Invitation has expired' }),
      };
    }

    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({ error: 'Email does not match invitation' }),
      };
    }

    // Create organization member record
    const membershipId = `mem_${Date.now()}_${userId}`;
    
    await docClient.send(new PutCommand({
      TableName: process.env.ORG_MEMBER_TABLE_NAME,
      Item: {
        id: membershipId,
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    }));

    // Update invitation status
    await docClient.send(new UpdateCommand({
      TableName: process.env.INVITATION_TABLE_NAME,
      Key: { id: invitation.id },
      UpdateExpression: 'SET #status = :status, acceptedAt = :acceptedAt, acceptedBy = :acceptedBy',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'ACCEPTED',
        ':acceptedAt': new Date().toISOString(),
        ':acceptedBy': userId,
      },
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({
        success: true,
        organizationId: invitation.organizationId,
        membershipId,
        message: 'Invitation accepted successfully',
      }),
    };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({
        error: 'Failed to accept invitation',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Helper function to find invitation by token
// In production, use a GSI on token field for better performance
async function findInvitationByToken(token: string) {
  // This is a simplified version - in production, use Query with GSI
  // For now, we'll assume the invitation ID is passed or use a scan (not recommended for production)
  // You should add a GSI on the token field in your DynamoDB table
  
  // Placeholder - implement proper GSI query
  return null;
}
