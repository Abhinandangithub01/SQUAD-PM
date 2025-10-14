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
    commandHooks: {
      beforeBundling: () => [],
      afterBundling: () => [],
      beforeInstall: () => [],
    },
    esbuildArgs: {
      '--external:@aws-sdk/client-dynamodb': true,
      '--external:@aws-sdk/lib-dynamodb': true,
    },
  },
});
