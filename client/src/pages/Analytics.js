import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import amplifyDataService from '../services/amplifyDataService';
import { formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import TimeTrackingTable from '../components/TimeTrackingTable';
import { useTheme } from '../contexts/ThemeContext';

const Analytics = () => {
  const { projectId } = useParams();
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch analytics data from Amplify
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', projectId ? 'project' : 'dashboard', projectId, timeRange],
    queryFn: async () => {
      const result = await amplifyDataService.dashboard.getStats();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });

  const handleExport = async () => {
    if (!projectId) return;
    
    try {
      // TODO: Implement export with Amplify Data
      console.log('Export functionality - to be implemented');
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project-${projectId}-tasks.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {projectId && (
            <Link
              to="/analytics"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {projectId ? 'Project Analytics' : 'Analytics Dashboard'}
            </h1>
            <p className="text-gray-600">
              {projectId 
                ? 'Detailed insights for this project'
                : 'Overview of all your projects and tasks'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          {projectId && (
            <button
              onClick={handleExport}
              className="btn-outline"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export Data
            </button>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={projectId ? "Total Tasks" : "Total Projects"}
          value={analyticsData?.overview?.total_projects || analyticsData?.overview?.total_tasks || 0}
          icon={projectId ? CheckCircleIcon : ChartBarIcon}
          color="blue"
        />
        <StatCard
          title={projectId ? "Completed Tasks" : "Total Tasks"}
          value={analyticsData?.overview?.completed_tasks || analyticsData?.overview?.total_tasks || 0}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatCard
          title={projectId ? "Open Issues" : "Total Issues"}
          value={analyticsData?.overview?.total_issues || 0}
          icon={ExclamationTriangleIcon}
          color="red"
        />
        <StatCard
          title={projectId ? "Team Members" : "Completion Rate"}
          value={projectId 
            ? analyticsData?.overview?.team_members || 0
            : `${analyticsData?.overview?.completion_rate || 0}%`
          }
          icon={projectId ? UsersIcon : ArrowTrendingUpIcon}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        {analyticsData?.task_completion && (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Task Completion Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.task_completion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value, 'MMM dd')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value, 'MMM dd, yyyy')}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed_tasks" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Completed Tasks"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status Distribution */}
        {analyticsData?.status_distribution && (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Task Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.status_distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.status_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Priority Distribution */}
        {analyticsData?.priority_distribution && (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Priority Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.priority_distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Project Progress */}
        {analyticsData?.project_progress && (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Project Progress
            </h3>
            <div className="space-y-4">
              {analyticsData.project_progress.map((project) => (
                <div key={project.id} className="flex items-center space-x-4">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {project.name}
                      </p>
                      <span className="text-sm text-gray-500">
                        {project.completion_percentage || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${project.completion_percentage || 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                      <span>{project.completed_tasks}/{project.total_tasks} tasks</span>
                      <span>{project.resolved_issues}/{project.total_issues} issues</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Team Performance */}
      {analyticsData?.team_performance && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Team Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issues Resolved
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.team_performance.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.assigned_tasks || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.completed_tasks || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${member.completion_rate || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">
                          {member.completion_rate || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.resolved_issues || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overdue Tasks */}
      {analyticsData?.overdue_tasks && analyticsData.overdue_tasks.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            Overdue Tasks ({analyticsData.overdue_tasks.length})
          </h3>
          <div className="space-y-3">
            {analyticsData.overdue_tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`badge ${
                      task.type === 'issue' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {task.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      Due: {formatDate(task.due_date)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {task.assignees && task.assignees.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Assigned to: {task.assignees.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Time Tracking Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Team Time Tracking</h2>
              <p className="text-sm text-gray-500">Monitor team productivity and time allocation</p>
            </div>
          </div>
        </div>
        <TimeTrackingTable viewMode="team" />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
    yellow: 'text-yellow-600 bg-yellow-100',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
