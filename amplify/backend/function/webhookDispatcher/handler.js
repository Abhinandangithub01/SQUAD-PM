/**
 * Webhook Dispatcher Lambda Function
 * Sends webhook notifications to configured endpoints
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import crypto from 'node:crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log('Webhook Dispatcher:', JSON.stringify(event, null, 2));

  try {
    const { organizationId, eventType, data } = JSON.parse(event.body || event);

    if (!organizationId || !eventType || !data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'organizationId, eventType, and data are required' }),
      };
    }

    const tableName = process.env.DYNAMODB_TABLE_NAME;

    // Get active webhooks for this organization and event type
    const webhooksResult = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'byOrganization',
      KeyConditionExpression: 'organizationId = :orgId',
      FilterExpression: 'active = :active AND contains(events, :eventType)',
      ExpressionAttributeValues: {
        ':orgId': organizationId,
        ':active': true,
        ':eventType': eventType,
      },
    }));

    const webhooks = webhooksResult.Items || [];
    console.log(`Found ${webhooks.length} webhooks for event: ${eventType}`);

    if (webhooks.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No webhooks configured for this event' }),
      };
    }

    // Send webhooks in parallel
    const results = await Promise.allSettled(
      webhooks.map(webhook => sendWebhook(webhook, eventType, data, tableName))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: `Dispatched ${webhooks.length} webhooks`,
        results: {
          success: successCount,
          failed: failureCount,
        },
      }),
    };
  } catch (error) {
    console.error('Error dispatching webhooks:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to dispatch webhooks', details: error.message }),
    };
  }
};

async function sendWebhook(webhook, eventType, data, tableName) {
  try {
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    // Generate HMAC signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Send webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventType,
        'User-Agent': 'ProjectHub-Webhooks/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    // Update webhook last triggered
    await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: { id: webhook.id },
      UpdateExpression: 'SET lastTriggered = :now, failureCount = :zero',
      ExpressionAttributeValues: {
        ':now': new Date().toISOString(),
        ':zero': 0,
      },
    }));

    console.log(`Webhook sent successfully to: ${webhook.url}`);
    return { success: true, webhookId: webhook.id };
  } catch (error) {
    console.error(`Webhook failed for ${webhook.url}:`, error);

    // Increment failure count
    await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: { id: webhook.id },
      UpdateExpression: 'SET failureCount = failureCount + :inc, lastTriggered = :now',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':now': new Date().toISOString(),
      },
    }));

    // Disable webhook after 10 failures
    if (webhook.failureCount >= 9) {
      await docClient.send(new UpdateCommand({
        TableName: tableName,
        Key: { id: webhook.id },
        UpdateExpression: 'SET active = :false',
        ExpressionAttributeValues: {
          ':false': false,
        },
      }));
      console.log(`Webhook disabled after 10 failures: ${webhook.id}`);
    }

    throw error;
  }
}
