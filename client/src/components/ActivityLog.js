import React from 'react';
import { 
  ClockIcon,
  UserIcon,
  PencilIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  UserPlusIcon,
  FlagIcon,
  CalendarIcon,
  TagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Avatar from './Avatar';
import { formatDateTime } from '../utils/helpers';

const ActivityLog = ({ activities = [], showAll = false }) => {
  const displayActivities = showAll ? activities : activities.slice(0, 10);

  const getActivityIcon = (type) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'created':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
      case 'updated':
        return <PencilIcon className={`${iconClass} text-blue-500`} />;
      case 'commented':
        return <ChatBubbleLeftIcon className={`${iconClass} text-purple-500`} />;
      case 'assigned':
        return <UserPlusIcon className={`${iconClass} text-indigo-500`} />;
      case 'status_changed':
        return <CheckCircleIcon className={`${iconClass} text-orange-500`} />;
      case 'priority_changed':
        return <FlagIcon className={`${iconClass} text-red-500`} />;
      case 'due_date_changed':
        return <CalendarIcon className={`${iconClass} text-yellow-500`} />;
      case 'attachment_added':
        return <PaperClipIcon className={`${iconClass} text-gray-500`} />;
      case 'tag_added':
        return <TagIcon className={`${iconClass} text-pink-500`} />;
      case 'deleted':
        return <TrashIcon className={`${iconClass} text-red-600`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-400`} />;
    }
  };

  const getActivityText = (activity) => {
    const { type, user, field, old_value, new_value, details } = activity;
    const userName = user?.first_name ? `${user.first_name} ${user.last_name}` : 'Someone';

    switch (type) {
      case 'created':
        return `${userName} created this task`;
      case 'updated':
        return `${userName} updated ${field || 'the task'}`;
      case 'commented':
        return `${userName} added a comment`;
      case 'assigned':
        return `${userName} assigned this to ${details || 'someone'}`;
      case 'status_changed':
        return `${userName} changed status from ${old_value} to ${new_value}`;
      case 'priority_changed':
        return `${userName} changed priority from ${old_value} to ${new_value}`;
      case 'due_date_changed':
        return `${userName} changed due date to ${new_value}`;
      case 'attachment_added':
        return `${userName} added an attachment`;
      case 'tag_added':
        return `${userName} added tag "${details}"`;
      case 'deleted':
        return `${userName} deleted this task`;
      default:
        return `${userName} made a change`;
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 text-sm">No activity yet</p>
        <p className="text-gray-400 text-xs mt-1">Activity will appear here as changes are made</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity, index) => (
        <div key={activity.id || index} className="flex space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex-shrink-0 mt-1">
            {getActivityIcon(activity.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Avatar user={activity.user} size="xs" />
                <p className="text-sm text-gray-900">
                  {getActivityText(activity)}
                </p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {formatDateTime(activity.timestamp || activity.created_at)}
              </span>
            </div>
            
            {activity.comment && (
              <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                <p className="text-sm text-gray-700">{activity.comment}</p>
              </div>
            )}
            
            {activity.changes && Object.keys(activity.changes).length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                {Object.entries(activity.changes).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <span className="font-medium">{key}:</span>
                    <span className="text-gray-500 line-through">{value.old}</span>
                    <span>→</span>
                    <span className="text-gray-900">{value.new}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {!showAll && activities.length > 10 && (
        <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
          Show {activities.length - 10} more activities
        </button>
      )}
    </div>
  );
};

export default ActivityLog;
