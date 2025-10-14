/**
 * Real-time Subscription Hooks
 * Subscribe to live updates from AppSync
 */

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';

const client = generateClient();

/**
 * Subscribe to task updates in a project
 */
export const useTaskSubscription = (projectId, onUpdate) => {
  useEffect(() => {
    if (!projectId) return;

    console.log('Subscribing to task updates for project:', projectId);

    const subscriptions = [
      // Subscribe to task creation
      client.models.Task.onCreate({
        filter: { projectId: { eq: projectId } }
      }).subscribe({
        next: (data) => {
          console.log('Task created:', data);
          onUpdate?.({ type: 'CREATE', data });
        },
        error: (error) => console.error('Task onCreate subscription error:', error),
      }),

      // Subscribe to task updates
      client.models.Task.onUpdate({
        filter: { projectId: { eq: projectId } }
      }).subscribe({
        next: (data) => {
          console.log('Task updated:', data);
          onUpdate?.({ type: 'UPDATE', data });
        },
        error: (error) => console.error('Task onUpdate subscription error:', error),
      }),

      // Subscribe to task deletion
      client.models.Task.onDelete({
        filter: { projectId: { eq: projectId } }
      }).subscribe({
        next: (data) => {
          console.log('Task deleted:', data);
          onUpdate?.({ type: 'DELETE', data });
        },
        error: (error) => console.error('Task onDelete subscription error:', error),
      }),
    ];

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      console.log('Unsubscribed from task updates');
    };
  }, [projectId, onUpdate]);
};

/**
 * Subscribe to comment updates on a task
 */
export const useCommentSubscription = (taskId, onUpdate) => {
  useEffect(() => {
    if (!taskId) return;

    console.log('Subscribing to comments for task:', taskId);

    const subscription = client.models.Comment.onCreate({
      filter: { taskId: { eq: taskId } }
    }).subscribe({
      next: (data) => {
        console.log('Comment added:', data);
        onUpdate?.(data);
      },
      error: (error) => console.error('Comment subscription error:', error),
    });

    return () => {
      subscription.unsubscribe();
      console.log('Unsubscribed from comments');
    };
  }, [taskId, onUpdate]);
};

/**
 * Subscribe to notifications for current user
 */
export const useNotificationSubscription = (userId, onNotification) => {
  useEffect(() => {
    if (!userId) return;

    console.log('Subscribing to notifications for user:', userId);

    const subscription = client.models.Notification.onCreate({
      filter: { userId: { eq: userId } }
    }).subscribe({
      next: (data) => {
        console.log('New notification:', data);
        onNotification?.(data);
        
        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: '/logo192.png',
          });
        }
      },
      error: (error) => console.error('Notification subscription error:', error),
    });

    return () => {
      subscription.unsubscribe();
      console.log('Unsubscribed from notifications');
    };
  }, [userId, onNotification]);
};

/**
 * Subscribe to project updates
 */
export const useProjectSubscription = (projectId, onUpdate) => {
  useEffect(() => {
    if (!projectId) return;

    console.log('Subscribing to project updates:', projectId);

    const subscription = client.models.Project.onUpdate({
      filter: { id: { eq: projectId } }
    }).subscribe({
      next: (data) => {
        console.log('Project updated:', data);
        onUpdate?.(data);
      },
      error: (error) => console.error('Project subscription error:', error),
    });

    return () => {
      subscription.unsubscribe();
      console.log('Unsubscribed from project updates');
    };
  }, [projectId, onUpdate]);
};

/**
 * User presence tracking
 */
export const usePresence = (organizationId, userId) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!organizationId || !userId) return;

    // Update own presence every 30 seconds
    const updatePresence = async () => {
      try {
        await client.models.User.update({
          id: userId,
          online: true,
          lastSeen: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    // Initial update
    updatePresence();

    // Set up interval
    const interval = setInterval(updatePresence, 30000);

    // Mark offline on unmount
    return () => {
      clearInterval(interval);
      client.models.User.update({
        id: userId,
        online: false,
        lastSeen: new Date().toISOString(),
      }).catch(console.error);
    };
  }, [organizationId, userId]);

  useEffect(() => {
    if (!organizationId) return;

    // Subscribe to user updates in organization
    const subscription = client.models.User.onUpdate({
      filter: { organizationId: { eq: organizationId } }
    }).subscribe({
      next: (data) => {
        setOnlineUsers(prev => {
          const index = prev.findIndex(u => u.id === data.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data;
            return updated;
          }
          return [...prev, data];
        });
      },
      error: (error) => console.error('User presence subscription error:', error),
    });

    return () => subscription.unsubscribe();
  }, [organizationId]);

  return onlineUsers;
};

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};
