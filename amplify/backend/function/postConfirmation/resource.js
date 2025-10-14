import { defineFunction } from '@aws-amplify/backend';

export const postConfirmation = defineFunction({
  name: 'postConfirmation',
  entry: './handler.js',
  environment: {
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'AmplifyDataTable',
  },
  timeoutSeconds: 30,
});
