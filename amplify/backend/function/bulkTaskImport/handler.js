/**
 * Bulk Task Import Lambda Function
 * Import tasks from CSV/JSON
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log('Bulk Task Import:', JSON.stringify(event, null, 2));

  try {
    const { tasks, organizationId, projectId, createdById, format = 'json' } = JSON.parse(event.body || event);

    if (!tasks || !Array.isArray(tasks)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'tasks array is required' }),
      };
    }

    if (!organizationId || !projectId || !createdById) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'organizationId, projectId, and createdById are required' }),
      };
    }

    const tableName = process.env.DYNAMODB_TABLE_NAME;
    const now = new Date().toISOString();
    const results = {
      success: [],
      failed: [],
    };

    // Process tasks in batches of 25 (DynamoDB limit)
    const batchSize = 25;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const writeRequests = [];

      for (const taskData of batch) {
        try {
          // Validate required fields
          if (!taskData.title) {
            results.failed.push({
              data: taskData,
              error: 'Title is required',
            });
            continue;
          }

          const taskId = randomUUID();
          const task = {
            id: taskId,
            organizationId,
            projectId,
            title: taskData.title,
            description: taskData.description || '',
            status: taskData.status || 'TODO',
            priority: taskData.priority || 'MEDIUM',
            assignedToId: taskData.assignedToId || null,
            createdById,
            tags: taskData.tags || [],
            dueDate: taskData.dueDate || null,
            estimatedHours: taskData.estimatedHours || null,
            actualHours: 0,
            completionPercentage: 0,
            archived: false,
            createdAt: now,
            updatedAt: now,
            __typename: 'Task',
          };

          writeRequests.push({
            PutRequest: {
              Item: task,
            },
          });

          results.success.push({
            id: taskId,
            title: task.title,
          });
        } catch (error) {
          results.failed.push({
            data: taskData,
            error: error.message,
          });
        }
      }

      // Batch write to DynamoDB
      if (writeRequests.length > 0) {
        try {
          await docClient.send(new BatchWriteCommand({
            RequestItems: {
              [tableName]: writeRequests,
            },
          }));
        } catch (error) {
          console.error('Batch write error:', error);
          // Mark all items in this batch as failed
          writeRequests.forEach(req => {
            results.failed.push({
              data: req.PutRequest.Item,
              error: 'Batch write failed',
            });
          });
        }
      }
    }

    console.log(`Import complete: ${results.success.length} success, ${results.failed.length} failed`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        message: `Imported ${results.success.length} tasks`,
        summary: {
          total: tasks.length,
          success: results.success.length,
          failed: results.failed.length,
        },
        results,
      }),
    };
  } catch (error) {
    console.error('Error importing tasks:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to import tasks', details: error.message }),
    };
  }
};

/**
 * Parse CSV data to JSON
 */
export function parseCSV(csvData) {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const tasks = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const task = {};
    
    headers.forEach((header, index) => {
      task[header] = values[index] || '';
    });

    tasks.push(task);
  }

  return tasks;
}
