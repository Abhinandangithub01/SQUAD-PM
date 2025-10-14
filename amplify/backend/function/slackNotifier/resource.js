import { defineFunction } from '@aws-amplify/backend';

export const slackNotifier = defineFunction({
  name: 'slackNotifier',
  entry: './handler.js',
  timeoutSeconds: 30,
});
