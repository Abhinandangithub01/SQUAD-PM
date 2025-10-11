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
  ChartBarIcon,
  ArrowRightIcon,
  FlagIcon,
  ListBulletIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  UserIcon,
  PaperClipIcon,
  ArrowPathIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime, getPriorityColor, getStatusColor } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { generateClient } from 'aws-amplify/data';
import amplifyDataService from '../services/amplifyDataService';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch dashboard data from AWS Amplify
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const result = await amplifyDataService.dashboard.getStats();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
      return result.data;
    },
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <p className="text-xs text-gray-400">Unable to fetch data from AWS Amplify</p>
        </div>
      </div>
    );
  }

  // Use stats from Amplify
  const stats = dashboardData || {
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  };

  const totalTasks = stats.totalTasks;
  const overdueTasks = stats.overdueTasks;
  const tasks = []; // Will be populated from recent activity
  const activity = [];
  const projects = [];
  const unread_notifications = 0;

  // Keep old calculation for compatibility
  const oldOverdueTasks = tasks.filter(task => 
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <Link
          to="/projects"
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Project
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Projects */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProjects || 0}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.activeProjects || 0} active</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FolderIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeProjects || 0}</p>
              <p className="text-xs text-gray-500 mt-1">0 completed</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTasks || 0}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.completedTasks || 0} completed</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ListBulletIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Overdue Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{stats.overdueTasks || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Need attention</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Project Progress Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* In Progress Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">In Progress</h3>
            <ClockIcon className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-orange-600">{stats.inProgressTasks || 0}</p>
            <p className="text-sm text-gray-500 mt-2">tasks being worked on</p>
          </div>
        </div>

        {/* Team Members */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
            <UserGroupIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-500 mt-2">in your organization</p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Completion Rate</h3>
            <ChartBarIcon className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">{stats.completionRate || 0}%</p>
            <p className="text-sm text-gray-500 mt-2">overall progress</p>
          </div>
        </div>
      </div>

      {/* Milestones & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Milestones */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Milestones</h3>
              <FlagIcon className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <FlagIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No milestones yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create milestones to track project progress
              </p>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
              <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {projects.length > 0 ? (
              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color || '#3B82F6' }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.task_count || 0} tasks</p>
                      </div>
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first project
                </p>
              </div>
            )}
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
