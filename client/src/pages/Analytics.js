import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  BoltIcon,
  UsersIcon,
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
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
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await amplifyDataService.projects.list();
      return result.success ? result.data : [];
    },
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
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

    const now = new Date();
    const filterDate = new Date();
    
    switch (timeRange) {
      case '7d': filterDate.setDate(now.getDate() - 7); break;
      case '30d': filterDate.setDate(now.getDate() - 30); break;
      case '90d': filterDate.setDate(now.getDate() - 90); break;
      case '1y': filterDate.setFullYear(now.getFullYear() - 1); break;
      default: filterDate.setDate(now.getDate() - 30);
    }

    const filteredTasks = tasks.filter(task => 
      new Date(task.createdAt || Date.now()) >= filterDate
    );

    const completedTasks = filteredTasks.filter(t => t.status === 'DONE').length;
    const inProgressTasks = filteredTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todoTasks = filteredTasks.filter(t => t.status === 'TODO').length;

    // Status distribution
    const statusDistribution = [
      { status: 'To Do', count: todoTasks, color: '#ef4444' },
      { status: 'In Progress', count: inProgressTasks, color: '#f59e0b' },
      { status: 'Done', count: completedTasks, color: '#10b981' },
    ].filter(s => s.count > 0);

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
        const updatedAt = new Date(task.updatedAt || task.createdAt);
        return task.status === 'DONE' && 
               updatedAt >= date && 
               updatedAt < nextDate;
      }).length;
      
      completionTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed,
      });
    }

    return {
      overview: {
        total_projects: projects.length,
        total_tasks: filteredTasks.length,
        completed_tasks: completedTasks,
        in_progress: inProgressTasks,
      },
      task_completion: completionTrend,
      status_distribution: statusDistribution,
      priority_distribution: priorityDistribution,
    };
  }, [projects, tasks, timeRange]);

  const bgColor = isDarkMode() ? 'var(--color-surface)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#111827';
  const textSecondary = isDarkMode() ? 'var(--color-text-secondary)' : '#6b7280';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: isDarkMode() ? '#0f1419' : '#fafafa' }}>
      {/* Compact Header */}
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: bgColor, borderColor }}>
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {projectId && (
                <Link to="/analytics" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ArrowLeftIcon className="h-3.5 w-3.5" style={{ color: textSecondary }} />
                </Link>
              )}
              <div>
                <h1 className="text-sm font-semibold" style={{ color: textColor }}>Analytics</h1>
                <p className="text-[10px]" style={{ color: textSecondary }}>
                  {projectId ? 'Project insights' : 'Overview of all projects'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-[11px] px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500"
                style={{ backgroundColor: bgColor, borderColor, color: textColor }}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              {projectId && (
                <button
                  onClick={() => toast.success('Export coming soon!')}
                  className="flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-medium text-white"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  <ArrowDownTrayIcon className="h-3 w-3" />
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
        {/* Compact Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatCard
            title={projectId ? "Total Tasks" : "Projects"}
            value={projectId ? analyticsData?.overview?.total_tasks || 0 : analyticsData?.overview?.total_projects || 0}
            icon={projectId ? CheckCircleIcon : ChartBarIcon}
            color="#3b82f6"
            bgColor={bgColor}
            borderColor={borderColor}
            textColor={textColor}
            textSecondary={textSecondary}
          />
          <StatCard
            title="Completed"
            value={analyticsData?.overview?.completed_tasks || 0}
            icon={CheckCircleIcon}
            color="#10b981"
            bgColor={bgColor}
            borderColor={borderColor}
            textColor={textColor}
            textSecondary={textSecondary}
          />
          <StatCard
            title="In Progress"
            value={analyticsData?.overview?.in_progress || 0}
            icon={BoltIcon}
            color="#f59e0b"
            bgColor={bgColor}
            borderColor={borderColor}
            textColor={textColor}
            textSecondary={textSecondary}
          />
          <StatCard
            title="Team"
            value={4}
            icon={UsersIcon}
            color="#8b5cf6"
            bgColor={bgColor}
            borderColor={borderColor}
            textColor={textColor}
            textSecondary={textSecondary}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Task Completion Trend */}
          {analyticsData?.task_completion && analyticsData.task_completion.length > 0 && (
            <ChartCard title="Task Completion Trend" bgColor={bgColor} borderColor={borderColor} textColor={textColor}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={analyticsData.task_completion}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                  <XAxis dataKey="date" stroke={textSecondary} style={{ fontSize: '10px' }} />
                  <YAxis stroke={textSecondary} style={{ fontSize: '10px' }} />
                  <Tooltip contentStyle={{ backgroundColor: bgColor, borderColor, borderRadius: '6px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Status Distribution */}
          {analyticsData?.status_distribution && analyticsData.status_distribution.length > 0 && (
            <ChartCard title="Status Distribution" bgColor={bgColor} borderColor={borderColor} textColor={textColor}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={analyticsData.status_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    dataKey="count"
                  >
                    {analyticsData.status_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: bgColor, borderColor, borderRadius: '6px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Priority Distribution */}
          {analyticsData?.priority_distribution && analyticsData.priority_distribution.length > 0 && (
            <ChartCard title="Priority Distribution" bgColor={bgColor} borderColor={borderColor} textColor={textColor}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analyticsData.priority_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                  <XAxis dataKey="priority" stroke={textSecondary} style={{ fontSize: '10px' }} />
                  <YAxis stroke={textSecondary} style={{ fontSize: '10px' }} />
                  <Tooltip contentStyle={{ backgroundColor: bgColor, borderColor, borderRadius: '6px', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* Time Tracking Section */}
        <div className="mt-4">
          <div className="flex items-center mb-3">
            <div className="p-1.5 rounded mr-2" style={{ backgroundColor: '#eff6ff' }}>
              <ClockIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: textColor }}>Team Time Tracking</h2>
              <p className="text-[10px]" style={{ color: textSecondary }}>Monitor team productivity</p>
            </div>
          </div>
          <TimeTrackingTable viewMode="team" projectId={projectId} />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, bgColor, borderColor, textColor, textSecondary }) => (
  <div className="rounded-xl p-5 border hover:shadow-md transition-all" style={{ backgroundColor: bgColor, borderColor }}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: textSecondary }}>
          {title}
        </p>
        <p className="text-3xl font-bold" style={{ color }}>
          {value}
        </p>
      </div>
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}15` }}>
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, bgColor, borderColor, textColor }) => (
  <div className="rounded-xl p-6 border hover:shadow-md transition-shadow" style={{ backgroundColor: bgColor, borderColor }}>
    <h3 className="text-base font-semibold mb-4" style={{ color: textColor }}>{title}</h3>
    {children}
  </div>
);

export default Analytics;
