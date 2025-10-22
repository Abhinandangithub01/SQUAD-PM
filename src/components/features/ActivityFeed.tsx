'use client';

import { useState, useEffect } from 'react';
import { activityLogService } from '@/services/activityLogService';
import { ActivityIcon, ClockIcon } from 'lucide-react';

interface ActivityFeedProps {
  projectId?: string;
  userId?: string;
  limit?: number;
}

export default function ActivityFeed({ projectId, userId, limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [projectId, userId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      let result;

      if (projectId) {
        result = await activityLogService.getByProject(projectId, limit);
      } else if (userId) {
        result = await activityLogService.getByUser(userId, limit);
      } else {
        result = await activityLogService.getRecent(limit);
      }

      setActivities(result.data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <ActivityIcon className="w-5 h-5" />
        Recent Activity
      </h3>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ActivityIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No activity yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ activity }: any) {
  const icon = activityLogService.getActivityIcon(activity.action);

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">User</span>
          {' '}{activity.action}{' '}
          {activity.entityType && (
            <span className="font-medium">{activity.entityType}</span>
          )}
          {activity.entityName && (
            <span className="text-blue-600"> "{activity.entityName}"</span>
          )}
        </p>
        {activity.fromStatus && activity.toStatus && (
          <p className="text-xs text-gray-500 mt-1">
            Changed from <span className="font-medium">{activity.fromStatus}</span> to{' '}
            <span className="font-medium">{activity.toStatus}</span>
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          {formatTimeAgo(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}
