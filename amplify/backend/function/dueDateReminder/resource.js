import { defineFunction } from '@aws-amplify/backend';

export const dueDateReminder = defineFunction({
  name: 'dueDateReminder',
  entry: './handler.js',
  environment: {
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'AmplifyDataTable',
    SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || 'noreply@projecthub.com',
    APP_URL: process.env.APP_URL || 'https://main.d8tv3j2hk2i9r.amplifyapp.com',
  },
  timeoutSeconds: 300, // 5 minutes for processing many tasks
  // Schedule: Run daily at 9 AM UTC
  schedule: 'rate(1 day)',
});
