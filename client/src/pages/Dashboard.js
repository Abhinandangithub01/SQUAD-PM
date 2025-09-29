import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  FolderIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon,
  CalendarIcon,
  ChartBarIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  PaperClipIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { mockActivity, mockProjects, mockTasks } from '../utils/mockData';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime, getPriorityColor, getStatusColor } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // Use mock data first, fallback to API
      try {
        return {
          tasks: mockTasks.slice(0, 5),
          activity: mockActivity,
          projects: mockProjects,
          unread_notifications: 2
        };
      } catch (error) {
        // Fallback to API
        const response = await api.get('/users/me/dashboard');
        return response.data;
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { tasks = [], activity = [], projects = [], unread_notifications = 0 } = dashboardData || {};

  // Calculate stats
  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter(task => 
    task.due_date && new Date(task.due_date) < new Date()
  ).length;
  const dueSoonTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    return dueDate >= today && dueDate <= threeDaysFromNow;
  }).length;

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.task_count > 0 || p.issue_count > 0).length;

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Projects</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activeProjects}/{totalProjects}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">My Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{overdueTasks}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Due Soon</p>
              <p className="text-2xl font-semibold text-gray-900">{dueSoonTasks}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Work */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Tasks */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">My Work</h3>
                <Link
                  to="/tasks"
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                >
                  View all
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
            <div className="p-6">
              {tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          task.type === 'issue' ? 'bg-red-400' : 'bg-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/projects/${task.project_id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
                        >
                          {task.title}
                        </Link>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">{task.project_name}</span>
                          <span className={`badge text-xs ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <span className={`badge text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      {task.due_date && (
                        <div className="flex-shrink-0">
                          <span className={`text-xs ${
                            new Date(task.due_date) < new Date() 
                              ? 'text-red-600' 
                              : 'text-gray-500'
                          }`}>
                            {formatRelativeTime(task.due_date)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks assigned</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You're all caught up! Great job! 🎉
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <DashboardRecentActivity activity={activity} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Overview */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Projects</h3>
                <Link
                  to="/projects"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.slice(0, 4).map((project) => (
                    <div key={project.id} className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/projects/${project.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
                        >
                          {project.name}
                        </Link>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span>{project.task_count} tasks</span>
                          <span>•</span>
                          <span>{project.issue_count} issues</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-8 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-primary-500 rounded-full"
                            style={{ 
                              width: `${project.completed_tasks && project.task_count 
                                ? (project.completed_tasks / project.task_count) * 100 
                                : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first project.
                  </p>
                  <Link
                    to="/projects"
                    className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
                  >
                    Create Project
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6 space-y-3">
              <Link
                to="/projects"
                className="flex items-center p-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150"
              >
                <PlusIcon className="h-5 w-5 mr-3 text-gray-400" />
                Create Project
              </Link>
              <Link
                to="/chat"
                className="flex items-center p-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3 text-gray-400" />
                Start Chat
              </Link>
              <Link
                to="/settings"
                className="flex items-center p-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150"
              >
                <UserGroupIcon className="h-5 w-5 mr-3 text-gray-400" />
                Invite Team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Recent Activity Component with Fixed Height and Load More
const DashboardRecentActivity = ({ activity }) => {
  const [visibleCount, setVisibleCount] = useState(5);

  if (!activity || activity.length === 0) {
    return (
      <div className="text-center py-8">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
        <p className="mt-1 text-sm text-gray-500">
          Activity will appear here as your team works on projects.
        </p>
      </div>
    );
  }

  const getActionIcon = (action) => {
    const iconClass = "h-4 w-4";
    switch (action) {
      case 'completed':
        return <CheckCircleIcon className={`${iconClass} text-green-500`} />;
      case 'created':
        return <PlusIcon className={`${iconClass} text-blue-500`} />;
      case 'updated':
        return <PencilIcon className={`${iconClass} text-orange-500`} />;
      case 'commented':
        return <ChatBubbleLeftRightIcon className={`${iconClass} text-purple-500`} />;
      case 'assigned':
        return <UserIcon className={`${iconClass} text-indigo-500`} />;
      case 'uploaded':
        return <PaperClipIcon className={`${iconClass} text-gray-500`} />;
      case 'moved':
        return <ArrowPathIcon className={`${iconClass} text-yellow-500`} />;
      case 'reviewed':
        return <EyeIcon className={`${iconClass} text-teal-500`} />;
      default:
        return <ClipboardDocumentListIcon className={`${iconClass} text-gray-500`} />;
    }
  };

  const getActionText = (item) => {
    const { action, entity_type, entity_name, from_status, to_status } = item;
    
    if (action === 'moved' && from_status && to_status) {
      return `moved "${entity_name}" from ${from_status} to ${to_status}`;
    }
    
    if (entity_name) {
      return `${action} ${entity_type} "${entity_name}"`;
    }
    
    return `${action} ${entity_type}`;
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 5, activity.length));
  };

  const visibleActivities = activity.slice(0, visibleCount);
  const hasMore = visibleCount < activity.length;

  return (
    <div className="flex flex-col h-80">
      {/* Scrollable Activity List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {visibleActivities.map((item, index) => (
          <div key={item.id} className="flex items-start space-x-3 py-2">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm">
                {getActionIcon(item.action)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">
                  {item.first_name} {item.last_name}
                </span>{' '}
                {getActionText(item)}
                {item.project_name && (
                  <span className="text-gray-600"> in {item.project_name}</span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatRelativeTime(item.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Load More Button */}
      {hasMore && (
        <div className="flex-shrink-0 pt-4 border-t border-gray-100 mt-4">
          <button
            onClick={handleLoadMore}
            className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 transition-colors duration-200"
          >
            Load More ({activity.length - visibleCount} remaining)
          </button>
        </div>
      )}
      
      {/* All Loaded State */}
      {!hasMore && activity.length > 5 && (
        <div className="flex-shrink-0 pt-4 border-t border-gray-100 mt-4 text-center">
          <button className="text-sm text-gray-500 hover:text-gray-700 font-medium">
            All activity loaded ({activity.length} items)
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
