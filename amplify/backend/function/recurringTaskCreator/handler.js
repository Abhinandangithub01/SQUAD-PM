/**
 * Recurring Task Creator Lambda Function
 * Creates recurring tasks based on schedule
 * Runs daily via EventBridge
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log('Recurring Task Creator:', JSON.stringify(event, null, 2));

  try {
    const tableName = process.env.DYNAMODB_TABLE_NAME;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find tasks with recurrence rules
    const tasksResult = await docClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: 'attribute_exists(recurrence) AND #typename = :type',
      ExpressionAttributeNames: {
        '#typename': '__typename',
      },
      ExpressionAttributeValues: {
        ':type': 'Task',
      },
    }));

    const recurringTasks = tasksResult.Items || [];
    console.log(`Found ${recurringTasks.length} recurring tasks`);

    const createdTasks = [];

    for (const task of recurringTasks) {
      try {
        const recurrence = JSON.parse(task.recurrence || '{}');
        const { frequency, interval, nextOccurrence } = recurrence;

        if (!frequency || !nextOccurrence) continue;

        const nextDate = new Date(nextOccurrence);
        
        // Check if it's time to create the next occurrence
        if (nextDate <= today) {
          // Create new task instance
          const newTaskId = randomUUID();
          const now = new Date().toISOString();

          const newTask = {
            id: newTaskId,
            organizationId: task.organizationId,
            projectId: task.projectId,
            title: task.title,
            description: task.description,
            status: 'TODO',
            priority: task.priority,
            assignedToId: task.assignedToId,
            createdById: task.createdById,
            tags: task.tags,
            estimatedHours: task.estimatedHours,
            dueDate: calculateDueDate(nextDate, task.dueDate, nextOccurrence),
            parentTaskId: task.id, // Link to original recurring task
            createdAt: now,
            updatedAt: now,
            __typename: 'Task',
          };

          await docClient.send(new PutCommand({
            TableName: tableName,
            Item: newTask,
          }));

          // Calculate next occurrence
          const newNextOccurrence = calculateNextOccurrence(nextDate, frequency, interval || 1);

          // Update original task with new next occurrence
          await docClient.send(new UpdateCommand({
            TableName: tableName,
            Key: { id: task.id },
            UpdateExpression: 'SET recurrence = :recurrence, updatedAt = :now',
            ExpressionAttributeValues: {
              ':recurrence': JSON.stringify({
                ...recurrence,
                nextOccurrence: newNextOccurrence.toISOString(),
                lastCreated: now,
              }),
              ':now': now,
            },
          }));

          createdTasks.push({
            originalTaskId: task.id,
            newTaskId,
            title: task.title,
            nextOccurrence: newNextOccurrence.toISOString(),
          });

          console.log(`Created recurring task: ${task.title} (${newTaskId})`);
        }
      } catch (error) {
        console.error(`Error processing recurring task ${task.id}:`, error);
        // Continue with next task
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Created ${createdTasks.length} recurring tasks`,
        createdTasks,
      }),
    };
  } catch (error) {
    console.error('Error creating recurring tasks:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create recurring tasks', details: error.message }),
    };
  }
};

function calculateNextOccurrence(currentDate, frequency, interval) {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + interval);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + (7 * interval));
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + interval);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + interval);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
}

function calculateDueDate(occurrenceDate, originalDueDate, originalOccurrence) {
  if (!originalDueDate) return null;

  const original = new Date(originalOccurrence);
  const due = new Date(originalDueDate);
  const daysDiff = Math.floor((due - original) / (1000 * 60 * 60 * 24));

  const newDue = new Date(occurrenceDate);
  newDue.setDate(newDue.getDate() + daysDiff);

  return newDue.toISOString();
}
