import { defineFunction } from '@aws-amplify/backend';

export const postConfirmation = defineFunction({
  name: 'postConfirmation',
  entry: './handler.js',
  runtime: 20,
  environment: {
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'AmplifyDataTable',
  },
  timeoutSeconds: 30,
  bundling: {
    nodeModules: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb'],
    externalModules: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb'],
  },
});
