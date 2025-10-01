import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';

// This will be auto-generated after amplify push
// For now, this is a template
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID || 'us-east-1_XXXXXXXXX',
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID || 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
        given_name: {
          required: true,
        },
        family_name: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: process.env.REACT_APP_API_ENDPOINT || 'https://xxxxxxxxxxxxxxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      defaultAuthMode: 'userPool',
    },
  },
  Storage: {
    S3: {
      bucket: process.env.REACT_APP_S3_BUCKET || 'projectmanagementsystem-xxxxxx',
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    },
  },
};

// Configure Amplify
Amplify.configure(amplifyConfig);

// Create API client
export const client = generateClient();

export default amplifyConfig;
