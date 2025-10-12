import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/enhanced-resource';
import { storage } from './storage/resource';

/**
 * Complete AWS Amplify Backend Configuration
 * Includes: Auth, Data (GraphQL), Storage (S3)
 */
export const backend = defineBackend({
  auth,
  data,
  storage,
});

// Add custom configurations
const { cfnUserPool } = backend.auth.resources.cfnResources;

// Enable advanced security features
cfnUserPool.userPoolAddOns = {
  advancedSecurityMode: 'ENFORCED',
};

// Configure password policy
cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },
};

// Add email verification
cfnUserPool.emailVerificationMessage = 'Your verification code is {####}';
cfnUserPool.emailVerificationSubject = 'Verify your email for SQUAD MVP';

// Configure storage bucket
const { cfnBucket } = backend.storage.resources.cfnResources;

// Enable versioning for file history
cfnBucket.versioningConfiguration = {
  status: 'Enabled',
};

// Configure CORS for file uploads
cfnBucket.corsConfiguration = {
  corsRules: [
    {
      allowedHeaders: ['*'],
      allowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      allowedOrigins: ['*'], // Update with your domain in production
      exposedHeaders: ['ETag'],
      maxAge: 3000,
    },
  ],
};

// Add lifecycle rules for old files
cfnBucket.lifecycleConfiguration = {
  rules: [
    {
      id: 'DeleteOldVersions',
      status: 'Enabled',
      noncurrentVersionExpiration: {
        noncurrentDays: 90,
      },
    },
    {
      id: 'MoveToInfrequentAccess',
      status: 'Enabled',
      transitions: [
        {
          storageClass: 'STANDARD_IA',
          transitionInDays: 30,
        },
      ],
    },
  ],
};
