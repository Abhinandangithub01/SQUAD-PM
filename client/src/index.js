import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';

// Configure AWS Amplify with backend
// For Amplify Gen 2, we need to properly structure the configuration
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: outputs.auth?.user_pool_id,
      userPoolClientId: outputs.auth?.user_pool_client_id,
      identityPoolId: outputs.auth?.identity_pool_id,
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
        minLength: outputs.auth?.password_policy?.min_length || 8,
        requireLowercase: outputs.auth?.password_policy?.require_lowercase || true,
        requireUppercase: outputs.auth?.password_policy?.require_uppercase || true,
        requireNumbers: outputs.auth?.password_policy?.require_numbers || true,
        requireSpecialCharacters: outputs.auth?.password_policy?.require_symbols || true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: outputs.data?.url,
      region: outputs.data?.aws_region,
      defaultAuthMode: 'userPool',
      apiKey: outputs.data?.api_key,
      modelIntrospection: outputs.data?.model_introspection,
    },
  },
};

Amplify.configure(amplifyConfig, {
  ssr: false
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
