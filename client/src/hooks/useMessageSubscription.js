import { useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';

const client = generateClient();

/**
 * Hook for subscribing to real-time message updates
 * @param {string} channelId - The channel ID to subscribe to
 * @param {function} onNewMessage - Callback when new message arrives
 */
export const useMessageSubscription = (channelId, onNewMessage) => {
  useEffect(() => {
    if (!channelId) return;

    console.log('Subscribing to messages for channel:', channelId);

    const subscription = client.models.Message.onCreate({
      filter: { channelId: { eq: channelId } },
    }).subscribe({
      next: (data) => {
        console.log('New message received:', data);
        if (onNewMessage) {
          onNewMessage(data);
        }
      },
      error: (error) => {
        console.error('Message subscription error:', error);
      },
    });

    return () => {
      console.log('Unsubscribing from channel:', channelId);
      subscription.unsubscribe();
    };
  }, [channelId, onNewMessage]);
};

/**
 * Hook for subscribing to task updates
 * @param {string} projectId - The project ID to subscribe to
 * @param {function} onTaskUpdate - Callback when task is updated
 */
export const useTaskSubscription = (projectId, onTaskUpdate) => {
  useEffect(() => {
    if (!projectId) return;

    console.log('Subscribing to tasks for project:', projectId);

    // Subscribe to task creation
    const createSub = client.models.Task.onCreate({
      filter: { projectId: { eq: projectId } },
    }).subscribe({
      next: (data) => {
        console.log('New task created:', data);
        if (onTaskUpdate) onTaskUpdate(data);
      },
      error: (error) => console.error('Task create subscription error:', error),
    });

    // Subscribe to task updates
    const updateSub = client.models.Task.onUpdate({
      filter: { projectId: { eq: projectId } },
    }).subscribe({
      next: (data) => {
        console.log('Task updated:', data);
        if (onTaskUpdate) onTaskUpdate(data);
      },
      error: (error) => console.error('Task update subscription error:', error),
    });

    // Subscribe to task deletion
    const deleteSub = client.models.Task.onDelete({
      filter: { projectId: { eq: projectId } },
    }).subscribe({
      next: (data) => {
        console.log('Task deleted:', data);
        if (onTaskUpdate) onTaskUpdate(data);
      },
      error: (error) => console.error('Task delete subscription error:', error),
    });

    return () => {
      console.log('Unsubscribing from tasks for project:', projectId);
      createSub.unsubscribe();
      updateSub.unsubscribe();
      deleteSub.unsubscribe();
    };
  }, [projectId, onTaskUpdate]);
};

export default useMessageSubscription;
