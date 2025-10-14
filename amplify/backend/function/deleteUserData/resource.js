import { defineFunction } from '@aws-amplify/backend';

export const deleteUserData = defineFunction({
  name: 'deleteUserData',
  entry: './handler.js',
  environment: {
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'AmplifyDataTable',
    SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || 'noreply@projecthub.com',
    USER_POOL_ID: process.env.USER_POOL_ID || '',
  },
  timeoutSeconds: 300, // 5 minutes for complete deletion
});
