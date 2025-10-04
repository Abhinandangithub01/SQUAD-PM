import React, { useState, useMemo } from 'react';
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
  BoltIcon,
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
  Area,
  AreaChart,
} from 'recharts';
import amplifyDataService from '../services/amplifyDataService';
import { formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import TimeTrackingTable from '../components/TimeTrackingTable';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { projectId } = useParams();
  const [timeRange, setTimeRange] = useState('30d');
  const { isDarkMode } = useTheme();

  // Fetch real data from Amplify
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await amplifyDataService.projects.list();
      return result.success ? result.data : [];
    },
  });

  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const result = await amplifyDataService.tasks.list(projectId ? { projectId } : {});
      return result.success ? result.data : [];
    },
  });

  const isLoading = loadingProjects || loadingTasks;

  // Calculate analytics data from real data
  const analyticsData = useMemo(() => {
    if (!projects || !tasks) return null;

    // Filter data based on time range
    const now = new Date();
    const filterDate = new Date();
    
    switch (timeRange) {
      case '7d':
        filterDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        filterDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        filterDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        filterDate.setDate(now.getDate() - 30);
    }

    const filteredTasks = tasks.filter(task => 
      new Date(task.createdAt) >= filterDate
    );

    // Calculate overview stats
    const completedTasks = filteredTasks.filter(t => t.status === 'DONE').length;
    const totalIssues = filteredTasks.filter(t => 
      t.priority === 'HIGH' || t.priority === 'URGENT'
    ).length;
    const completionRate = filteredTasks.length > 0 
      ? Math.round((completedTasks / filteredTasks.length) * 100)
      : 0;

    // Status distribution
    const statusCounts = filteredTasks.reduce((acc, task) => {
      const status = task.status || 'TODO';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace('_', ' '),
      count,
    }));

    // Priority distribution
    const priorityCounts = filteredTasks.reduce((acc, task) => {
      const priority = task.priority || 'MEDIUM';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    const priorityDistribution = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority: priority.charAt(0) + priority.slice(1).toLowerCase(),
      count,
    }));

    // Task completion trend (last 7 days)
    const completionTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const completed = filteredTasks.filter(task => {
        const updatedAt = new Date(task.updatedAt);
        return task.status === 'DONE' && 
               updatedAt >= date && 
               updatedAt < nextDate;
      }).length;
      
      completionTrend.push({
        date: date.toISOString(),
        completed_tasks: completed,
      });
    }

    // Project progress
    const projectProgress = projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const projectCompleted = projectTasks.filter(t => t.status === 'DONE').length;
      const projectIssues = projectTasks.filter(t => 
        t.priority === 'HIGH' || t.priority === 'URGENT'
      );
      const resolvedIssues = projectIssues.filter(t => t.status === 'DONE').length;
      
      return {
        id: project.id,
        name: project.name,
        color: project.color || '#3B82F6',
        total_tasks: projectTasks.length,
        completed_tasks: projectCompleted,
        total_issues: projectIssues.length,
        resolved_issues: resolvedIssues,
        completion_percentage: projectTasks.length > 0 
          ? Math.round((projectCompleted / projectTasks.length) * 100)
          : 0,
      };
    });

    // Overdue tasks
    const overdueTasks = filteredTasks.filter(task => {
      if (!task.dueDate || task.status === 'DONE') return false;
      return new Date(task.dueDate) < now;
    }).map(task => ({
      id: task.id,
      title: task.title,
      type: 'task',
      due_date: task.dueDate,
      assignees: task.assignedToId ? ['Assigned'] : [],
    }));

    return {
      overview: {
        total_projects: projects.length,
        total_tasks: filteredTasks.length,
        completed_tasks: completedTasks,
        total_issues: totalIssues,
        completion_rate: completionRate,
        team_members: 4, // Mock for now
      },
      task_completion: completionTrend,
      status_distribution: statusDistribution,
      priority_distribution: priorityDistribution,
      project_progress: projectProgress,
      overdue_tasks: overdueTasks,
    };
  }, [projects, tasks, timeRange]);

  const handleExport = async () => {
    if (!projectId) return;
    
    try {
      // TODO: Implement export with Amplify Data
      console.log('Export functionality - to be implemented');
      // For now, just show a message
      toast.success('Export feature coming soon!');
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

  const bgColor = isDarkMode() ? 'var(--color-surface)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#111827';
  const textSecondary = isDarkMode() ? 'var(--color-text-secondary)' : '#6b7280';
  const primaryBlue = '#3b82f6';
  const lightBlue = '#dbeafe';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {projectId && (
            <Link
              to="/analytics"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{ color: textSecondary }}
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: textColor }}>
              {projectId ? 'Project Analytics' : 'Analytics Dashboard'}
            </h1>
            <p className="text-sm" style={{ color: textSecondary }}>
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
            className="px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
            style={{ 
              backgroundColor: bgColor,
              borderColor: lightBlue,
              color: textColor
            }}
          >
            <option value="7d">📅 Last 7 days</option>
            <option value="30d">📅 Last 30 days</option>
            <option value="90d">📅 Last 90 days</option>
            <option value="1y">📅 Last year</option>
          </select>
          
          {projectId && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryBlue, color: '#ffffff' }}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={projectId ? "Total Tasks" : "Total Projects"}
          value={projectId 
            ? analyticsData?.overview?.total_tasks || 0
            : analyticsData?.overview?.total_projects || 0
          }
          icon={projectId ? CheckCircleIcon : ChartBarIcon}
          bgColor={bgColor}
          borderColor={lightBlue}
          textColor={textColor}
          textSecondary={textSecondary}
          primaryColor={primaryBlue}
        />
        <StatCard
          title={projectId ? "Completed Tasks" : "Total Tasks"}
          value={projectId 
            ? analyticsData?.overview?.completed_tasks || 0
            : analyticsData?.overview?.total_tasks || 0
          }
          icon={CheckCircleIcon}
          bgColor={bgColor}
          borderColor={lightBlue}
          textColor={textColor}
          textSecondary={textSecondary}
          primaryColor={primaryBlue}
        />
        <StatCard
          title="In Progress"
          value={analyticsData?.status_distribution?.find(s => s.status === 'IN PROGRESS')?.count || 0}
          icon={BoltIcon}
          bgColor={bgColor}
          borderColor={lightBlue}
          textColor={textColor}
          textSecondary={textSecondary}
          primaryColor={primaryBlue}
        />
        <StatCard
          title="Active Users"
          value={analyticsData?.overview?.team_members || 4}
          icon={UsersIcon}
          bgColor={bgColor}
          borderColor={lightBlue}
          textColor={textColor}
          textSecondary={textSecondary}
          primaryColor={primaryBlue}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        {analyticsData?.task_completion && analyticsData.task_completion.length > 0 && (
          <div 
            className="rounded-xl p-6 border-2 shadow-sm"
            style={{ backgroundColor: bgColor, borderColor: lightBlue }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
              Task Completion Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.task_completion}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryBlue} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={primaryBlue} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value, 'MMM dd')}
                  stroke={textSecondary}
                />
                <YAxis stroke={textSecondary} />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value, 'MMM dd, yyyy')}
                  contentStyle={{ 
                    backgroundColor: bgColor, 
                    borderColor: borderColor,
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="completed_tasks" 
                  stroke={primaryBlue}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                  name="Completed Tasks"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status Distribution */}
        {analyticsData?.status_distribution && analyticsData.status_distribution.length > 0 && (
          <div 
            className="rounded-xl p-6 border-2 shadow-sm"
            style={{ backgroundColor: bgColor, borderColor: lightBlue }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
              Task Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.status_distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count, percent }) => 
                    `${status}: ${count} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.status_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: bgColor, 
                    borderColor: borderColor,
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Priority Distribution */}
        {analyticsData?.priority_distribution && analyticsData.priority_distribution.length > 0 && (
          <div 
            className="rounded-xl p-6 border-2 shadow-sm"
            style={{ backgroundColor: bgColor, borderColor: lightBlue }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
              Priority Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.priority_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis dataKey="priority" stroke={textSecondary} />
                <YAxis stroke={textSecondary} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: bgColor, 
                    borderColor: borderColor,
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill={primaryBlue}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Project Progress */}
        {analyticsData?.project_progress && analyticsData.project_progress.length > 0 && (
          <div 
            className="rounded-xl p-6 border-2 shadow-sm"
            style={{ backgroundColor: bgColor, borderColor: lightBlue }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
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
                      <p className="text-sm font-medium truncate" style={{ color: textColor }}>
                        {project.name}
                      </p>
                      <span className="text-sm font-bold" style={{ color: primaryBlue }}>
                        {project.completion_percentage || 0}%
                      </span>
                    </div>
                    <div 
                      className="w-full rounded-full h-2"
                      style={{ backgroundColor: isDarkMode() ? '#374151' : '#e5e7eb' }}
                    >
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${project.completion_percentage || 0}%`,
                          backgroundColor: primaryBlue
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs" style={{ color: textSecondary }}>
                      <span>✅ {project.completed_tasks}/{project.total_tasks} tasks</span>
                      {project.total_issues > 0 && (
                        <span>🔧 {project.resolved_issues}/{project.total_issues} issues</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>


      {/* Overdue Tasks */}
      {analyticsData?.overdue_tasks && analyticsData.overdue_tasks.length > 0 && (
        <div 
          className="rounded-xl p-6 border-2 shadow-sm"
          style={{ backgroundColor: bgColor, borderColor: '#fecaca' }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: textColor }}>
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            Overdue Tasks ({analyticsData.overdue_tasks.length})
          </h3>
          <div className="space-y-3">
            {analyticsData.overdue_tasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-center justify-between p-4 rounded-lg border-l-4"
                style={{ 
                  backgroundColor: isDarkMode() ? '#7f1d1d20' : '#fef2f2',
                  borderLeftColor: '#ef4444'
                }}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: textColor }}>{task.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {task.type}
                    </span>
                    <span className="text-xs" style={{ color: textSecondary }}>
                      📅 Due: {formatDate(task.due_date)}
                    </span>
                  </div>
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

const StatCard = ({ title, value, icon: Icon, bgColor, borderColor, textColor, textSecondary, primaryColor }) => {
  return (
    <div 
      className="rounded-xl p-6 border-2 shadow-sm hover:shadow-md transition-shadow"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
            {title}
          </p>
          <p className="text-3xl font-bold" style={{ color: primaryColor }}>
            {value}
          </p>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: primaryColor }}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
