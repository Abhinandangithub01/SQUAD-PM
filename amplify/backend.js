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
