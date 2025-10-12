import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { sendInvitation } from './functions/send-invitation/resource';
import { acceptInvitation } from './functions/accept-invitation/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  auth,
  data,
  storage,
  sendInvitation,
  acceptInvitation,
});

// Note: Lambda environment variables and permissions will be configured via Amplify Gen 2 patterns
// The functions will have access to the data models through the Amplify Data client
