import { defineFunction } from '@aws-amplify/backend';

export const inviteUser = defineFunction({
  name: 'inviteUser',
  entry: './handler.js',
  environment: {
    DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'AmplifyDataTable',
    SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || 'noreply@projecthub.com',
    APP_URL: process.env.APP_URL || 'https://main.d8tv3j2hk2i9r.amplifyapp.com',
  },
  timeoutSeconds: 60,
  bundling: {
    externalModules: ['@aws-sdk/*'],
  },
});
