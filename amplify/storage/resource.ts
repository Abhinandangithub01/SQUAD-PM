import { defineStorage } from '@aws-amplify/backend';

/**
 * S3 Storage configuration for multi-tenant file uploads
 * Supports public, protected, and private access patterns
 */
export const storage = defineStorage({
  name: 'squadpmfiles',
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    'protected/{entity_id}/*': [
      allow.authenticated.to(['read']),
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    'private/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    'organizations/{organization_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
  })
});
