import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

/**
 * SQUAD PM Backend Configuration
 * Multi-tenant project management system with AWS Amplify Gen 2
 * @see https://docs.amplify.aws/react/build-a-backend/
 */
export const backend = defineBackend({
  auth,
  data,
  storage,
});

// Additional Lambda functions can be added here
// Example: sendInvitation, acceptInvitation, processNotifications, etc.
