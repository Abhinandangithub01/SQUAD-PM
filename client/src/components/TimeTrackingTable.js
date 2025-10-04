import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClockIcon,
  FunnelIcon,
  UserIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useTimeTracking } from '../contexts/TimeTrackingContext';
import amplifyDataService from '../services/amplifyDataService';
import Avatar from './Avatar';

const TimeTrackingTable = ({ viewMode = 'team', projectId = null }) => {
  const { isDarkMode } = useTheme();
  const {
    timeEntries,
    activeTimer,
    formatDuration,
    getUserTotalTime,
  } = useTimeTracking();

  const [filterUser, setFilterUser] = useState('all');
  const [filterDate, setFilterDate] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real users from Amplify
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const result = await amplifyDataService.users.list();
      return result.success ? result.data : [];
    },
  });

  // Fetch real tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const result = await amplifyDataService.tasks.list(projectId ? { projectId } : {});
      return result.success ? result.data : [];
    },
  });

  // Use only real time entries - NO MOCK DATA
  const allEntries = timeEntries || [];

  // Filter entries
  const filteredEntries = useMemo(() => {
    let filtered = allEntries;

    if (filterUser !== 'all') {
      filtered = filtered.filter(entry => entry.user_id === filterUser);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filterDate === 'today') {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.start_time);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === today.getTime();
      });
    } else if (filterDate === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(entry => new Date(entry.start_time) >= weekAgo);
    } else if (filterDate === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(entry => new Date(entry.start_time) >= monthAgo);
    }

    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.task_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.project_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [allEntries, filterUser, filterDate, searchQuery]);

  // Calculate user stats
  const userStats = useMemo(() => {
    if (!users || users.length === 0) return [];
    
    return users.map(user => {
      const userEntries = filteredEntries.filter(e => e.user_id === user.id);
      const totalTime = userEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
      const completedTasks = userEntries.filter(e => e.status === 'completed').length;
      const inProgressTasks = userEntries.filter(e => e.status === 'in_progress').length;
      
      return {
        ...user,
        totalTime,
        completedTasks,
        inProgressTasks,
        entries: userEntries.length,
      };
    });
  }, [users, filteredEntries]);

  const bgColor = isDarkMode() ? 'var(--color-surface)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#111827';
  const textSecondary = isDarkMode() ? 'var(--color-text-secondary)' : '#6b7280';

  if (allEntries.length === 0) {
    return (
      <div 
        className="rounded-lg p-8 text-center border"
        style={{ backgroundColor: bgColor, borderColor }}
      >
        <ClockIcon className="h-12 w-12 mx-auto mb-3" style={{ color: textSecondary }} />
        <h3 className="text-sm font-medium mb-1" style={{ color: textColor }}>
          No Time Entries Yet
        </h3>
        <p className="text-xs" style={{ color: textSecondary }}>
          Start tracking time on tasks to see analytics here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compact Filters */}
      <div 
        className="flex items-center justify-between p-3 rounded-lg border"
        style={{ backgroundColor: bgColor, borderColor }}
      >
        <div className="flex items-center space-x-2 flex-1">
          <MagnifyingGlassIcon className="h-4 w-4" style={{ color: textSecondary }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs bg-transparent border-none focus:outline-none flex-1"
            style={{ color: textColor }}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-xs px-2 py-1 rounded border focus:ring-1 focus:ring-blue-500"
            style={{ backgroundColor: bgColor, borderColor, color: textColor }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          
          {users.length > 0 && (
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="text-xs px-2 py-1 rounded border focus:ring-1 focus:ring-blue-500"
              style={{ backgroundColor: bgColor, borderColor, color: textColor }}
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {userStats.map(user => (
          <div
            key={user.id}
            className="rounded-lg p-3 border hover:shadow-sm transition-shadow"
            style={{ backgroundColor: bgColor, borderColor }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Avatar
                user={user}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: textColor }}>
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-[10px] truncate" style={{ color: textSecondary }}>
                  {user.entries} entries
                </p>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span style={{ color: textSecondary }}>Total</span>
                <span className="font-semibold" style={{ color: '#3b82f6' }}>
                  {formatDuration(user.totalTime)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span style={{ color: textSecondary }}>Done</span>
                <span className="font-medium" style={{ color: '#10b981' }}>
                  {user.completedTasks} tasks
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span style={{ color: textSecondary }}>In Progress</span>
                <span className="font-medium" style={{ color: '#f59e0b' }}>
                  {user.inProgressTasks} tasks
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Entries Table */}
      {filteredEntries.length > 0 && (
        <div 
          className="rounded-lg border overflow-hidden"
          style={{ backgroundColor: bgColor, borderColor }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: isDarkMode() ? '#1f2937' : '#f9fafb', borderBottomColor: borderColor }}>
                  <th className="text-left p-2 font-medium" style={{ color: textSecondary }}>User</th>
                  <th className="text-left p-2 font-medium" style={{ color: textSecondary }}>Task</th>
                  <th className="text-left p-2 font-medium" style={{ color: textSecondary }}>Project</th>
                  <th className="text-left p-2 font-medium" style={{ color: textSecondary }}>Date</th>
                  <th className="text-right p-2 font-medium" style={{ color: textSecondary }}>Duration</th>
                  <th className="text-center p-2 font-medium" style={{ color: textSecondary }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.slice(0, 10).map((entry, index) => (
                  <tr 
                    key={entry.id}
                    className="border-t hover:bg-gray-50 dark:hover:bg-gray-800"
                    style={{ borderTopColor: borderColor }}
                  >
                    <td className="p-2">
                      <div className="flex items-center space-x-1.5">
                        <Avatar user={entry.user} size="xs" />
                        <span className="font-medium" style={{ color: textColor }}>
                          {entry.user?.first_name?.[0]}{entry.user?.last_name?.[0]}
                        </span>
                      </div>
                    </td>
                    <td className="p-2" style={{ color: textColor }}>{entry.task_title || 'N/A'}</td>
                    <td className="p-2" style={{ color: textSecondary }}>{entry.project_name || 'N/A'}</td>
                    <td className="p-2" style={{ color: textSecondary }}>
                      {new Date(entry.start_time).toLocaleDateString()}
                    </td>
                    <td className="p-2 text-right font-semibold" style={{ color: '#3b82f6' }}>
                      {formatDuration(entry.duration)}
                    </td>
                    <td className="p-2 text-center">
                      {entry.status === 'completed' ? (
                        <CheckCircleIcon className="h-3.5 w-3.5 mx-auto text-green-500" />
                      ) : (
                        <ClockIcon className="h-3.5 w-3.5 mx-auto text-orange-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTrackingTable;
