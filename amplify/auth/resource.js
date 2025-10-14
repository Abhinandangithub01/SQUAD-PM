import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource with multi-tenancy support
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
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
    // Custom attributes for multi-tenancy
    'custom:organizationId': {
      dataType: 'String',
      mutable: true,
    },
    'custom:role': {
      dataType: 'String',
      mutable: true,
    },
  },
  // Multi-factor authentication
  multifactor: {
    mode: 'OPTIONAL',
    sms: true,
    totp: true,
  },
});
