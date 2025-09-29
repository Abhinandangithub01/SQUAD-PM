import React, { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  BellIcon, 
  CheckIcon, 
  XMarkIcon,
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

const NotificationDropdown = ({ unreadCount = 0 }) => {
  const [showAll, setShowAll] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', showAll ? 'all' : 'unread'],
    queryFn: async () => {
      const response = await api.get(`/notifications?unread_only=${!showAll}&limit=10`);
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await api.put(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      await api.delete(`/notifications/${notificationId}`);
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
    const iconClass = "h-4 w-4";
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

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
        <span className="sr-only">View notifications</span>
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-large ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  {showAll ? 'Unread only' : 'Show all'}
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700"
                    disabled={markAllAsReadMutation.isLoading}
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : notificationsData?.notifications?.length > 0 ? (
              <div className="py-1">
                {notificationsData.notifications.map((notification) => (
                  <Menu.Item key={notification.id}>
                    {({ active }) => (
                      <div
                        className={`${
                          active ? 'bg-gray-50' : ''
                        } ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        } px-4 py-3 border-b border-gray-100 last:border-b-0`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 p-1.5 bg-gray-50 rounded-lg">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-sm text-gray-500 mt-1">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {formatRelativeTime(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex-shrink-0 flex items-center space-x-1">
                            {!notification.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-green-500"
                                title="Mark as read"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                              title="Delete notification"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Menu.Item>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <BellIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You're all caught up!
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notificationsData?.notifications?.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100">
              <a
                href="/notifications"
                className="block text-center text-sm text-primary-600 hover:text-primary-700"
              >
                View all notifications
              </a>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default NotificationDropdown;
