import { defineFunction } from '@aws-amplify/backend';

export const bulkTaskImport = defineFunction({
  name: 'bulkTaskImport',
  entry: './handler.js',
  environment: {
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'AmplifyDataTable',
  },
  timeoutSeconds: 300, // 5 minutes for large imports
  bundling: {
    externalModules: ['@aws-sdk/*'],
  },
});
