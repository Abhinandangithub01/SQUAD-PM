import React, { useState, useMemo } from 'react';
import {
  ClockIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  FunnelIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as ClockIconSolid,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useTimeTracking } from '../contexts/TimeTrackingContext';
import Avatar from './Avatar';

const TimeTrackingTable = ({ viewMode = 'team' }) => {
  const { isDarkMode } = useTheme();
  const {
    timeEntries,
    activeTimer,
    formatDuration,
    getActiveTimerDuration,
    getUserTotalTime,
    getTaskTotalTime,
  } = useTimeTracking();

  const [filterUser, setFilterUser] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Mock users data (in real app, fetch from API)
  const users = [
    { id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', avatar_color: '#3b82f6' },
    { id: '2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', avatar_color: '#10b981' },
    { id: '3', first_name: 'Mike', last_name: 'Johnson', email: 'mike@example.com', avatar_color: '#f59e0b' },
    { id: '4', first_name: 'Sarah', last_name: 'Wilson', email: 'sarah@example.com', avatar_color: '#8b5cf6' },
  ];

  // Mock time entries with more data
  const mockEntries = useMemo(() => {
    const entries = [];
    const now = new Date();
    
    users.forEach((user, userIndex) => {
      for (let i = 0; i < 5; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        entries.push({
          id: `entry-${userIndex}-${i}`,
          user_id: user.id,
          user: user,
          task_id: `task-${i}`,
          task_title: [
            'Design new homepage layout',
            'Fix login authentication bug',
            'Research competitor analysis',
            'Create social media content',
            'Mobile app authentication'
          ][i % 5],
          project_name: ['Website Redesign', 'Mobile App', 'Marketing Campaign'][i % 3],
          start_time: new Date(date.setHours(9 + i, 0, 0)),
          end_time: new Date(date.setHours(9 + i + 2, 30, 0)),
          duration: (2.5 * 60 * 60 * 1000) + (Math.random() * 60 * 60 * 1000),
          description: 'Working on project tasks',
          status: i % 4 === 0 ? 'completed' : 'in_progress',
          billable: i % 3 !== 0,
        });
      }
    });
    
    return entries;
  }, [users]);

  const allEntries = [...(timeEntries || []), ...mockEntries];

  // Filter entries
  const filteredEntries = useMemo(() => {
    let filtered = allEntries;

    // Filter by user
    if (filterUser !== 'all') {
      filtered = filtered.filter(entry => entry.user_id === filterUser);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(entry => entry.status === filterStatus);
    }

    // Filter by date
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
    } else if (filterDate === 'last7days') {
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 7);
      filtered = filtered.filter(entry => new Date(entry.start_time) >= daysAgo);
    } else if (filterDate === 'last30days') {
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 30);
      filtered = filtered.filter(entry => new Date(entry.start_time) >= daysAgo);
    } else if (filterDate === 'last90days') {
      const daysAgo = new Date(today);
      daysAgo.setDate(daysAgo.getDate() - 90);
      filtered = filtered.filter(entry => new Date(entry.start_time) >= daysAgo);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.task_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.start_time) - new Date(a.start_time);
          break;
        case 'duration':
          comparison = b.duration - a.duration;
          break;
        case 'user':
          comparison = (a.user?.first_name || '').localeCompare(b.user?.first_name || '');
          break;
        case 'project':
          comparison = (a.project_name || '').localeCompare(b.project_name || '');
          break;
        default:
          break;
      }
      
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }, [allEntries, filterUser, filterStatus, filterDate, searchQuery, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDuration = filteredEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const completedTasks = filteredEntries.filter(e => e.status === 'completed').length;
    const inProgressTasks = filteredEntries.filter(e => e.status === 'in_progress').length;
    const uniqueUsers = new Set(filteredEntries.map(e => e.user_id)).size;

    return {
      totalDuration,
      completedTasks,
      inProgressTasks,
      totalTasks: filteredEntries.length,
      uniqueUsers,
    };
  }, [filteredEntries]);

  // User statistics
  const userStats = useMemo(() => {
    const stats = {};
    
    users.forEach(user => {
      const userEntries = filteredEntries.filter(e => e.user_id === user.id);
      const totalTime = userEntries.reduce((sum, entry) => sum + entry.duration, 0);
      const completedTasks = userEntries.filter(e => e.status === 'completed').length;
      
      stats[user.id] = {
        user,
        totalTime,
        entries: userEntries.length,
        completedTasks,
        inProgressTasks: userEntries.filter(e => e.status === 'in_progress').length,
      };
    });
    
    return stats;
  }, [users, filteredEntries]);

  const bgColor = isDarkMode() ? 'var(--color-surface)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#111827';
  const textSecondary = isDarkMode() ? 'var(--color-text-secondary)' : '#6b7280';
  const headerBg = isDarkMode() ? 'var(--color-surface-hover)' : '#f9fafb';
  
  // Blue theme colors
  const primaryBlue = '#3b82f6';
  const lightBlue = '#dbeafe';
  const darkBlue = '#1e40af';

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Project', 'Task', 'Duration', 'Status'];
    const rows = filteredEntries.map(entry => [
      new Date(entry.start_time).toLocaleDateString(),
      `${entry.user?.first_name} ${entry.user?.last_name}`,
      entry.project_name,
      entry.task_title,
      formatDuration(entry.duration),
      entry.status,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-tracking-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="rounded-xl p-6 border-2 shadow-sm hover:shadow-lg transition-all duration-200"
          style={{ backgroundColor: bgColor, borderColor: lightBlue }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                Total Time
              </p>
              <p className="text-3xl font-bold" style={{ color: primaryBlue }}>
                {formatDuration(stats.totalDuration)}
              </p>
            </div>
            <div className="p-4 rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${primaryBlue} 0%, ${darkBlue} 100%)` }}>
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="rounded-xl p-6 border-2 shadow-sm hover:shadow-lg transition-all duration-200"
          style={{ backgroundColor: bgColor, borderColor: lightBlue }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                Completed Tasks
              </p>
              <p className="text-3xl font-bold" style={{ color: primaryBlue }}>
                {stats.completedTasks}<span className="text-xl" style={{ color: textSecondary }}>/{stats.totalTasks}</span>
              </p>
            </div>
            <div className="p-4 rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${primaryBlue} 0%, ${darkBlue} 100%)` }}>
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="rounded-xl p-6 border-2 shadow-sm hover:shadow-lg transition-all duration-200"
          style={{ backgroundColor: bgColor, borderColor: lightBlue }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                In Progress
              </p>
              <p className="text-3xl font-bold" style={{ color: primaryBlue }}>
                {stats.inProgressTasks}
              </p>
            </div>
            <div className="p-4 rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${primaryBlue} 0%, ${darkBlue} 100%)` }}>
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="rounded-xl p-6 border-2 shadow-sm hover:shadow-lg transition-all duration-200"
          style={{ backgroundColor: bgColor, borderColor: lightBlue }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                Active Users
              </p>
              <p className="text-3xl font-bold" style={{ color: primaryBlue }}>
                {stats.uniqueUsers}
              </p>
            </div>
            <div className="p-4 rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${primaryBlue} 0%, ${darkBlue} 100%)` }}>
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* User Progress Cards (Team View) */}
      {viewMode === 'team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(userStats).map(({ user, totalTime, entries, completedTasks, inProgressTasks }) => (
            <div
              key={user.id}
              className="rounded-xl p-5 border shadow-sm hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
              style={{ backgroundColor: bgColor, borderColor }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative">
                  <Avatar user={user} size="lg" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base truncate" style={{ color: textColor }}>
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs truncate flex items-center" style={{ color: textSecondary }}>
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {entries} entries
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: lightBlue }}>
                      <svg className="h-4 w-4" style={{ color: primaryBlue }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium" style={{ color: textSecondary }}>Total</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: primaryBlue }}>
                    {formatDuration(totalTime)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: lightBlue }}>
                      <svg className="h-4 w-4" style={{ color: primaryBlue }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium" style={{ color: textSecondary }}>Done</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: primaryBlue }}>
                    {completedTasks} tasks
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: lightBlue }}>
                      <svg className="h-4 w-4" style={{ color: primaryBlue }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium" style={{ color: textSecondary }}>In Progress</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: primaryBlue }}>
                    {inProgressTasks} tasks
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters and Search */}
      <div 
        className="rounded-xl p-6 border-2 shadow-sm"
        style={{ backgroundColor: bgColor, borderColor: lightBlue }}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                style={{ color: textSecondary }}
              />
              <input
                type="text"
                placeholder="Search tasks, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                style={{ 
                  backgroundColor: isDarkMode() ? 'var(--color-input-bg)' : '#ffffff',
                  borderColor,
                  color: textColor
                }}
              />
            </div>
          </div>

          {/* User Filter */}
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            style={{ 
              backgroundColor: isDarkMode() ? 'var(--color-input-bg)' : '#ffffff',
              borderColor,
              color: textColor
            }}
          >
            <option value="all">All Users</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2.5 border-2 rounded-lg focus:ring-2 transition-all"
            style={{ 
              backgroundColor: isDarkMode() ? 'var(--color-input-bg)' : '#ffffff',
              borderColor: lightBlue,
              color: textColor,
              focusRingColor: primaryBlue
            }}
          >
            <option value="all">📅 All Time</option>
            <option value="today">📅 Today</option>
            <option value="week">📅 This Week</option>
            <option value="month">📅 This Month</option>
            <option value="last7days">📅 Last 7 Days</option>
            <option value="last30days">📅 Last 30 Days</option>
            <option value="last90days">📅 Last 90 Days</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            style={{ 
              backgroundColor: isDarkMode() ? 'var(--color-input-bg)' : '#ffffff',
              borderColor,
              color: textColor
            }}
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-5 py-2.5 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${primaryBlue} 0%, ${darkBlue} 100%)`
            }}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Time Entries Table */}
      <div 
        className="rounded-lg border overflow-hidden"
        style={{ backgroundColor: bgColor, borderColor }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor }}>
            <thead style={{ backgroundColor: headerBg }}>
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  style={{ color: textSecondary }}
                  onClick={() => {
                    setSortBy('user');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  User
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  style={{ color: textSecondary }}
                  onClick={() => {
                    setSortBy('project');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Project
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: textSecondary }}
                >
                  Task
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  style={{ color: textSecondary }}
                  onClick={() => {
                    setSortBy('date');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Date
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  style={{ color: textSecondary }}
                  onClick={() => {
                    setSortBy('duration');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Duration
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: textSecondary }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor }}>
              {filteredEntries.map((entry) => (
                <tr 
                  key={entry.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <Avatar user={entry.user} size="sm" />
                      <div>
                        <p className="font-medium" style={{ color: textColor }}>
                          {entry.user?.first_name} {entry.user?.last_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm" style={{ color: textColor }}>
                      {entry.project_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: textColor }}>
                      {entry.task_title}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4" style={{ color: textSecondary }} />
                      <span className="text-sm" style={{ color: textSecondary }}>
                        {new Date(entry.start_time).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4" style={{ color: textSecondary }} />
                      <span className="text-sm font-medium" style={{ color: textColor }}>
                        {formatDuration(entry.duration)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: entry.status === 'completed' ? lightBlue : lightBlue,
                        color: entry.status === 'completed' ? primaryBlue : primaryBlue
                      }}
                    >
                      {entry.status === 'completed' ? (
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ClockIconSolid className="h-4 w-4 mr-1" />
                      )}
                      {entry.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 mb-4" style={{ color: textSecondary }} />
            <p className="text-lg font-medium mb-2" style={{ color: textColor }}>
              No time entries found
            </p>
            <p className="text-sm" style={{ color: textSecondary }}>
              Try adjusting your filters or start tracking time on a task
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTrackingTable;
