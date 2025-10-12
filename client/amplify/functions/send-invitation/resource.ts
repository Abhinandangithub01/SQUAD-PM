import { defineFunction } from '@aws-amplify/backend';

export const sendInvitation = defineFunction({
  name: 'send-invitation',
  entry: './handler.ts',
  environment: {
    APP_URL: process.env.APP_URL || 'https://main.d16qyjbt1a9iyw.amplifyapp.com',
    FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@squadpm.com',
  },
  timeoutSeconds: 30,
});
