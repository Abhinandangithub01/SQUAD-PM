import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from './LoadingSpinner';
import Avatar from './Avatar';

const GanttChart = () => {
  const { projectId } = useParams();
  const { isDarkMode } = useTheme();
  const [viewMode, setViewMode] = useState('month'); // day, week, month, quarter
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const chartRef = useRef(null);

  // Fetch tasks
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      // Mock data for now
      return mockTasks.filter(task => task.project_id === projectId);
    },
  });

  const tasks = tasksData || [];

  // Calculate date range based on view mode
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        start.setDate(start.getDate() - 3);
        end.setDate(end.getDate() + 10);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 35);
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 3);
        end.setDate(0);
        break;
      case 'quarter':
        start.setMonth(Math.floor(start.getMonth() / 3) * 3);
        start.setDate(1);
        end.setMonth(start.getMonth() + 12);
        end.setDate(0);
        break;
      default:
        break;
    }

    return { start, end };
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Generate timeline columns
  const generateTimelineColumns = () => {
    const columns = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      columns.push(new Date(current));
      
      switch (viewMode) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'quarter':
          current.setMonth(current.getMonth() + 3);
          break;
        default:
          break;
      }
    }

    return columns;
  };

  const timelineColumns = generateTimelineColumns();

  // Calculate task bar position and width
  const calculateTaskBar = (task) => {
    const taskStart = task.start_date ? new Date(task.start_date) : new Date();
    const taskEnd = task.due_date ? new Date(task.due_date) : new Date(taskStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const startOffset = Math.max(0, (taskStart - startDate) / (1000 * 60 * 60 * 24));
    const duration = (taskEnd - taskStart) / (1000 * 60 * 60 * 24);
    
    const left = (startOffset / totalDays) * 100;
    const width = Math.max(2, (duration / totalDays) * 100);

    return { left: `${left}%`, width: `${width}%` };
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'todo':
        return 'bg-gray-400';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Navigate timeline
  const navigateTimeline = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 28 : -28));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 12 : -12));
        break;
      default:
        break;
    }
    
    setCurrentDate(newDate);
  };

  // Format column header
  const formatColumnHeader = (date) => {
    switch (viewMode) {
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'week':
        return `Week ${Math.ceil((date.getDate()) / 7)}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'quarter':
        return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
      default:
        return '';
    }
  };

  const bgColor = isDarkMode() ? 'var(--color-surface)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#111827';
  const headerBg = isDarkMode() ? 'var(--color-surface-hover)' : '#f9fafb';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold" style={{ color: textColor }}>
            Gantt Chart
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateTimeline('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: textColor }}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: textColor }}
            >
              Today
            </button>
            <button
              onClick={() => navigateTimeline('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: textColor }}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {['day', 'week', 'month', 'quarter'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                viewMode === mode
                  ? 'bg-primary-600 text-white'
                  : 'hover:bg-gray-100'
              }`}
              style={viewMode !== mode ? { color: textColor } : {}}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 overflow-auto" ref={chartRef}>
        <div className="min-w-full inline-block align-middle">
          <div className="flex">
            {/* Task List Column */}
            <div 
              className="flex-shrink-0 w-80" 
              style={{ borderRight: `2px solid ${borderColor}` }}
            >
              {/* Header */}
              <div 
                className="h-12 flex items-center px-4 font-medium sticky top-0 z-10"
                style={{ backgroundColor: headerBg, borderBottom: `1px solid ${borderColor}`, color: textColor }}
              >
                Task Name
              </div>

              {/* Task Rows */}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="h-12 flex items-center px-4 cursor-pointer hover:bg-gray-50"
                  style={{ borderBottom: `1px solid ${borderColor}` }}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                    <span className="text-sm truncate" style={{ color: textColor }}>
                      {task.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline Column */}
            <div className="flex-1 relative">
              {/* Timeline Header */}
              <div 
                className="h-12 flex sticky top-0 z-10"
                style={{ backgroundColor: headerBg, borderBottom: `1px solid ${borderColor}` }}
              >
                {timelineColumns.map((date, index) => (
                  <div
                    key={index}
                    className="flex-1 flex items-center justify-center text-xs font-medium px-2"
                    style={{ 
                      borderRight: `1px solid ${borderColor}`,
                      minWidth: '80px',
                      color: textColor
                    }}
                  >
                    {formatColumnHeader(date)}
                  </div>
                ))}
              </div>

              {/* Timeline Grid */}
              <div className="relative">
                {/* Vertical Grid Lines */}
                <div className="absolute inset-0 flex">
                  {timelineColumns.map((_, index) => (
                    <div
                      key={index}
                      className="flex-1"
                      style={{ 
                        borderRight: `1px solid ${borderColor}`,
                        minWidth: '80px'
                      }}
                    />
                  ))}
                </div>

                {/* Task Bars */}
                {tasks.map((task) => {
                  const barStyle = calculateTaskBar(task);
                  return (
                    <div
                      key={task.id}
                      className="h-12 relative"
                      style={{ borderBottom: `1px solid ${borderColor}` }}
                    >
                      <div
                        className={`absolute top-2 h-8 rounded-lg ${getStatusColor(task.status)} opacity-80 hover:opacity-100 cursor-pointer transition-opacity flex items-center px-2`}
                        style={barStyle}
                        onClick={() => setSelectedTask(task)}
                      >
                        <span className="text-xs text-white font-medium truncate">
                          {task.title}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Today Indicator */}
                {(() => {
                  const today = new Date();
                  if (today >= startDate && today <= endDate) {
                    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
                    const todayOffset = (today - startDate) / (1000 * 60 * 60 * 24);
                    const left = (todayOffset / totalDays) * 100;
                    
                    return (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                        style={{ left: `${left}%` }}
                      >
                        <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Details Panel */}
      {selectedTask && (
        <div 
          className="fixed right-0 top-0 bottom-0 w-96 shadow-2xl z-50 overflow-y-auto"
          style={{ backgroundColor: bgColor, borderLeft: `1px solid ${borderColor}` }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                Task Details
              </h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRightIcon className="h-5 w-5" style={{ color: textColor }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2" style={{ color: textColor }}>
                  {selectedTask.title}
                </h4>
                <p className="text-sm" style={{ color: isDarkMode() ? 'var(--color-text-secondary)' : '#6b7280' }}>
                  {selectedTask.description || 'No description'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: isDarkMode() ? 'var(--color-text-muted)' : '#9ca3af' }}>
                    Status
                  </label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTask.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTask.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium" style={{ color: isDarkMode() ? 'var(--color-text-muted)' : '#9ca3af' }}>
                    Priority
                  </label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTask.priority === 'high' ? 'bg-red-100 text-red-800' :
                      selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: isDarkMode() ? 'var(--color-text-muted)' : '#9ca3af' }}>
                  Timeline
                </label>
                <div className="mt-1 text-sm" style={{ color: textColor }}>
                  {selectedTask.start_date && new Date(selectedTask.start_date).toLocaleDateString()} - {selectedTask.due_date && new Date(selectedTask.due_date).toLocaleDateString()}
                </div>
              </div>

              {selectedTask.assignee && (
                <div>
                  <label className="text-xs font-medium" style={{ color: isDarkMode() ? 'var(--color-text-muted)' : '#9ca3af' }}>
                    Assigned To
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Avatar user={selectedTask.assignee} size="sm" />
                    <span className="text-sm" style={{ color: textColor }}>
                      {selectedTask.assignee.first_name} {selectedTask.assignee.last_name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttChart;
