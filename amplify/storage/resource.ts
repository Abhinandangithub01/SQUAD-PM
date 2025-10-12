import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'projectManagementStorage',
  access: (allow) => ({
    // Public access for task attachments
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    
    // Task attachments
    'tasks/{task_id}/attachments/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    
    // User avatars
    'avatars/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    
    // Project files
    'projects/{project_id}/files/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    
    // Chat attachments
    'chat/{channel_id}/attachments/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    
    // Cover images
    'covers/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    
    // Exports
    'exports/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
  })
});
