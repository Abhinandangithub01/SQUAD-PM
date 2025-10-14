import { defineFunction } from '@aws-amplify/backend';

export const recurringTaskCreator = defineFunction({
  name: 'recurringTaskCreator',
  entry: './handler.js',
  environment: {
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'AmplifyDataTable',
  },
  timeoutSeconds: 300, // 5 minutes for processing many tasks
  // Schedule: Run daily at 1 AM UTC
  schedule: 'rate(1 day)',
});
