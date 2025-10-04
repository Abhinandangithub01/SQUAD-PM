import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  FolderIcon, 
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from './Avatar';
import amplifyDataService from '../services/amplifyDataService';
import toast from 'react-hot-toast';

const CleanDashboard = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Fetch projects from AWS Amplify
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await amplifyDataService.projects.list();
      return result.success ? result.data : [];
    },
  });

  // Fetch all tasks from AWS Amplify
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const result = await amplifyDataService.tasks.list();
      return result.success ? result.data : [];
    },
  });

  // Fetch users from AWS Amplify
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const result = await amplifyDataService.users.list();
      return { users: result.success ? result.data : [] };
    },
  });

  const isLoading = loadingProjects || loadingTasks || loadingUsers;

  // Calculate stats from real data
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'DONE').length,
    inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    todoTasks: tasks.filter(t => t.status === 'TODO').length,
    overdueTasks: tasks.filter(t => {
      if (!t.due_date || t.status === 'DONE') return false;
      return new Date(t.due_date) < new Date();
    }).length,
    completionRate: tasks.length > 0 
      ? Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100) 
      : 0,
  };

  // Get recent tasks (last 5)
  const recentTasks = tasks
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);

  // Get active projects (last 4)
  const activeProjects = projects
    .filter(p => p.status === 'ACTIVE')
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, {user?.first_name || 'User'}!
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Here's what's happening with your projects today
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              
              <Link
                to="/projects/new"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <PlusIcon className="h-5 w-5" />
                <span>New Project</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            subtitle={`${stats.activeProjects} active`}
            icon={FolderIcon}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            trend={stats.activeProjects > 0 ? `${stats.activeProjects} active` : null}
          />
          <StatCard
            title="Total Tasks"
            value={stats.totalTasks}
            subtitle={`${stats.completedTasks} completed`}
            icon={CheckCircleIcon}
            iconColor="text-green-600"
            iconBg="bg-green-50"
            trend={`${stats.completionRate}% done`}
          />
          <StatCard
            title="In Progress"
            value={stats.inProgressTasks}
            subtitle="Active tasks"
            icon={BoltIcon}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
          />
          <StatCard
            title="Overdue"
            value={stats.overdueTasks}
            subtitle="Need attention"
            icon={ExclamationCircleIcon}
            iconColor="text-red-600"
            iconBg="bg-red-50"
            isAlert={stats.overdueTasks > 0}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Projects */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
                  <p className="text-sm text-gray-500 mt-1">Your current projects</p>
                </div>
                <Link
                  to="/projects"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
                >
                  View all
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="p-6">
                {activeProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeProjects.map((project) => (
                      <Link
                        key={project.id}
                        to={`/projects/${project.id}/kanban`}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: project.color + '20' }}
                          >
                            <FolderIcon 
                              className="h-5 w-5" 
                              style={{ color: project.color || '#2563EB' }}
                            />
                          </div>
                          <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-700">
                            Active
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                          {project.description || 'No description'}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Updated {formatRelativeTime(project.updated_at)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FolderIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No active projects</p>
                    <Link
                      to="/projects/new"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Project
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
                  <p className="text-sm text-gray-500 mt-1">Latest updates</p>
                </div>
              </div>
              
              <div className="p-6">
                {recentTasks.length > 0 ? (
                  <div className="space-y-4">
                    {recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            task.status === 'DONE' ? 'bg-green-500' :
                            task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                            'bg-gray-300'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {task.title}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span className={`px-2 py-0.5 rounded ${
                                task.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                                task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {task.priority || 'MEDIUM'}
                              </span>
                              <span>{formatRelativeTime(task.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No recent tasks</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionCard
              icon={PlusIcon}
              title="New Project"
              description="Start a new project"
              to="/projects/new"
            />
            <QuickActionCard
              icon={ChartBarIcon}
              title="Analytics"
              description="View insights"
              to="/analytics"
            />
            <QuickActionCard
              icon={UserGroupIcon}
              title="Team"
              description="Manage members"
              to="/settings"
            />
            <QuickActionCard
              icon={CalendarIcon}
              title="Calendar"
              description="View schedule"
              to="/calendar"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, iconColor, iconBg, trend, isAlert }) => (
  <div className={`bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow ${
    isAlert ? 'border-red-200' : 'border-gray-200'
  }`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      {trend && (
        <span className="text-xs font-medium text-gray-500">
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {title}
      </p>
      <p className="text-3xl font-bold text-gray-900 mb-1">
        {value}
      </p>
      <p className="text-xs text-gray-500">
        {subtitle}
      </p>
    </div>
  </div>
);

// Quick Action Card Component
const QuickActionCard = ({ icon: Icon, title, description, to }) => (
  <Link
    to={to}
    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
  >
    <Icon className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors mb-3" />
    <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
    <p className="text-xs text-gray-500">{description}</p>
  </Link>
);

export default CleanDashboard;
