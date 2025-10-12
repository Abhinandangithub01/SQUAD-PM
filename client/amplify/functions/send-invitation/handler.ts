import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomBytes } from 'crypto';

const ses = new SESClient({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface InvitationEvent {
  organizationId: string;
  organizationName: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  invitedBy: string;
  invitedByName: string;
}

export const handler = async (event: any) => {
  console.log('Send Invitation Event:', JSON.stringify(event, null, 2));

  try {
    const body: InvitationEvent = typeof event.body === 'string' 
      ? JSON.parse(event.body) 
      : event.body;

    const { organizationId, organizationName, email, role, invitedBy, invitedByName } = body;

    // Validate input
    if (!organizationId || !email || !role || !invitedBy) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation record in DynamoDB
    const invitationId = `inv_${Date.now()}_${randomBytes(8).toString('hex')}`;
    
    await docClient.send(new PutCommand({
      TableName: process.env.INVITATION_TABLE_NAME,
      Item: {
        id: invitationId,
        organizationId,
        email,
        role,
        invitedBy,
        token,
        status: 'PENDING',
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
      },
    }));

    // Send invitation email
    const inviteUrl = `${process.env.APP_URL}/accept-invitation?token=${token}`;
    
    const emailParams = {
      Source: process.env.FROM_EMAIL || 'noreply@squadpm.com',
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: `You're invited to join ${organizationName} on SQUAD PM`,
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
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🎉 You're Invited!</h1>
                    </div>
                    <div class="content">
                      <p>Hi there,</p>
                      <p><strong>${invitedByName}</strong> has invited you to join <strong>${organizationName}</strong> on SQUAD PM.</p>
                      <p>Your role will be: <strong>${role}</strong></p>
                      <p>Click the button below to accept the invitation and get started:</p>
                      <center>
                        <a href="${inviteUrl}" class="button">Accept Invitation</a>
                      </center>
                      <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                      <p style="word-break: break-all; color: #667eea;">${inviteUrl}</p>
                      <p style="color: #999; font-size: 12px; margin-top: 30px;">This invitation will expire in 7 days.</p>
                    </div>
                    <div class="footer">
                      <p>© 2024 SQUAD PM. All rights reserved.</p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          },
          Text: {
            Data: `
You're invited to join ${organizationName} on SQUAD PM!

${invitedByName} has invited you to join their team with the role of ${role}.

Accept your invitation by visiting:
${inviteUrl}

This invitation will expire in 7 days.

© 2024 SQUAD PM
            `,
          },
        },
      },
    };

    await ses.send(new SendEmailCommand(emailParams));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({
        success: true,
        invitationId,
        message: 'Invitation sent successfully',
      }),
    };
  } catch (error) {
    console.error('Error sending invitation:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({
        error: 'Failed to send invitation',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
