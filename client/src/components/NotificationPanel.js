import React, { Fragment, useState } from 'react';
import { Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  CheckIcon, 
  BellIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { formatRelativeTime } from '../utils/helpers';
import LoadingSpinner from './LoadingSpinner';

const NotificationPanel = ({ isOpen, onClose }) => {
  const [showAll, setShowAll] = useState(false);
  const queryClient = useQueryClient();

  // Mock notifications data
  const mockNotifications = [
    {
      id: 1,
      type: 'task_assigned',
      title: 'New task assigned',
      message: 'You have been assigned to "Design new homepage layout"',
      created_at: '2024-10-05T10:30:00Z',
      is_read: false
    },
    {
      id: 2,
      type: 'task_completed',
      title: 'Task completed',
      message: 'John Doe completed "Research competitor analysis"',
      created_at: '2024-10-05T09:15:00Z',
      is_read: false
    },
    {
      id: 3,
      type: 'due_soon',
      title: 'Task due soon',
      message: '"Fix login authentication bug" is due in 2 hours',
      created_at: '2024-10-05T08:00:00Z',
      is_read: true
    },
    {
      id: 4,
      type: 'project_update',
      title: 'Project update',
      message: 'Website Redesign project has been updated',
      created_at: '2024-10-04T16:45:00Z',
      is_read: true
    },
    {
      id: 5,
      type: 'chat_mention',
      title: 'Mentioned in chat',
      message: 'You were mentioned in #general channel',
      created_at: '2024-10-04T14:20:00Z',
      is_read: false
    }
  ];

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', showAll ? 'all' : 'unread'],
    queryFn: async () => {
      // Use mock data for now
      return {
        notifications: showAll ? mockNotifications : mockNotifications.filter(n => !n.is_read),
        unread_count: mockNotifications.filter(n => !n.is_read).length
      };
    },
    refetchInterval: 30000,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      // Mock implementation
      console.log('Mark as read:', notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // Mock implementation
      console.log('Mark all as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      // Mock implementation
      console.log('Delete notification:', notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (notificationId) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const getNotificationIcon = (type) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'task_assigned':
        return <ClipboardDocumentListIcon className={`${iconClass} text-blue-500`} />;
      case 'task_completed':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
      case 'task_converted':
        return <ArrowPathIcon className={`${iconClass} text-purple-500`} />;
      case 'project_update':
        return <ChartBarIcon className={`${iconClass} text-indigo-500`} />;
      case 'chat_mention':
        return <ChatBubbleLeftRightIcon className={`${iconClass} text-orange-500`} />;
      case 'due_soon':
        return <ClockIcon className={`${iconClass} text-red-500`} />;
      default:
        return <SpeakerWaveIcon className={`${iconClass} text-gray-500`} />;
    }
  };

  const unreadCount = notificationsData?.unread_count || 0;

  return (
    <Transition
      show={isOpen}
      as={Fragment}
      enter="transform transition ease-in-out duration-300"
      enterFrom="translate-x-full"
      enterTo="translate-x-0"
      leave="transform transition ease-in-out duration-300"
      leaveFrom="translate-x-0"
      leaveTo="translate-x-full"
    >
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellIcon className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Filter buttons */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {showAll ? 'Unread only' : 'Show all'}
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                disabled={markAllAsReadMutation.isLoading}
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="sm" />
            </div>
          ) : notificationsData?.notifications?.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {notificationsData.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-1">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-green-500 rounded"
                          title="Mark as read"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                        title="Delete notification"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <BellIcon className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-sm text-gray-500 text-center">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notificationsData?.notifications?.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all notifications
            </button>
          </div>
        )}
      </div>
    </Transition>
  );
};

export default NotificationPanel;
