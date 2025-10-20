import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * Multi-tenant authentication with Cognito
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    givenName: {
      required: true,
      mutable: true,
    },
    familyName: {
      required: true,
      mutable: true,
    },
    phoneNumber: {
      required: false,
      mutable: true,
    },
  },
  accountRecovery: 'EMAIL_ONLY',
  multifactor: {
    mode: 'OPTIONAL',
    sms: true,
  },
});
