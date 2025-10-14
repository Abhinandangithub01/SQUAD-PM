import { defineFunction } from '@aws-amplify/backend';

export const preSignUp = defineFunction({
  name: 'preSignUp',
  entry: './handler.js',
  environment: {
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'AmplifyDataTable',
  },
  timeoutSeconds: 30,
  bundling: {
    externalModules: ['@aws-sdk/*'],
  },
});
