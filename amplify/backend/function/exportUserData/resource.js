import { defineFunction } from '@aws-amplify/backend';

export const exportUserData = defineFunction({
  name: 'exportUserData',
  entry: './handler.js',
  environment: {
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'AmplifyDataTable',
    SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || 'noreply@projecthub.com',
  },
  timeoutSeconds: 300, // 5 minutes for large exports
});
