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
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
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
  LineChart,
  Line,
} from 'recharts';
import amplifyDataService from '../services/amplifyDataService';
import LoadingSpinner from '../components/LoadingSpinner';

const CleanAnalytics = () => {
  const { projectId } = useParams();
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch data
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

  // Calculate analytics
  const analyticsData = useMemo(() => {
    if (!tasks) return null;

    const completed = tasks.filter(t => t.status === 'DONE').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todo = tasks.filter(t => t.status === 'TODO').length;

    // Status distribution
    const statusDistribution = [
      { status: 'To Do', count: todo, color: '#6B7280' },
      { status: 'In Progress', count: inProgress, color: '#2563EB' },
      { status: 'Done', count: completed, color: '#10B981' },
    ].filter(s => s.count > 0);

    // Priority distribution
    const priorityCounts = tasks.reduce((acc, task) => {
      const priority = task.priority || 'MEDIUM';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    const priorityDistribution = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority: priority.charAt(0) + priority.slice(1).toLowerCase(),
      count,
    }));

    // Task completion trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: Math.floor(Math.random() * 10), // Replace with real data
      };
    });

    return {
      total_tasks: tasks.length,
      completed_tasks: completed,
      in_progress: inProgress,
      todo_tasks: todo,
      completion_rate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
      status_distribution: statusDistribution,
      priority_distribution: priorityDistribution,
      task_completion: last7Days,
    };
  }, [tasks]);

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
            <div className="flex items-center space-x-4">
              {projectId && (
                <Link
                  to="/analytics"
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
              )}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {projectId ? 'Project insights and metrics' : 'Overview of all projects'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tasks"
            value={analyticsData?.total_tasks || 0}
            icon={ChartBarIcon}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            trend="+12%"
            trendUp={true}
          />
          <StatCard
            title="Completed"
            value={analyticsData?.completed_tasks || 0}
            icon={CheckCircleIcon}
            iconColor="text-green-600"
            iconBg="bg-green-50"
            trend="+8%"
            trendUp={true}
          />
          <StatCard
            title="In Progress"
            value={analyticsData?.in_progress || 0}
            icon={BoltIcon}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
            trend="-3%"
            trendUp={false}
          />
          <StatCard
            title="Completion Rate"
            value={`${analyticsData?.completion_rate || 0}%`}
            icon={ArrowTrendingUpIcon}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            trend="+5%"
            trendUp={true}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Completion Trend */}
          <ChartCard title="Task Completion Trend" subtitle="Last 7 days">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData?.task_completion || []}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280" 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  stroke="#6B7280" 
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#2563EB" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorCompleted)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Status Distribution */}
          <ChartCard title="Status Distribution" subtitle="Current overview">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.status_distribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="count"
                >
                  {(analyticsData?.status_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Priority Distribution - Full Width */}
        <ChartCard title="Priority Distribution" subtitle="Task breakdown by priority">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData?.priority_distribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="priority" 
                stroke="#6B7280" 
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis 
                stroke="#6B7280" 
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6B7280' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '8px 12px'
                }} 
              />
              <Bar 
                dataKey="count" 
                fill="#2563EB" 
                radius={[8, 8, 0, 0]}
                maxBarSize={80}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-500 mt-1">Latest updates from your team</p>
            </div>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </button>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Task completed</p>
                  <p className="text-xs text-gray-500 mt-1">John Doe completed "Design homepage"</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">2h ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, iconColor, iconBg, trend, trendUp }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      {trend && (
        <span className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {title}
      </p>
      <p className="text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  </div>
);

// Chart Card Component
const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
    {children}
  </div>
);

export default CleanAnalytics;
