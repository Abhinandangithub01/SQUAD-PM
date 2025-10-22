'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { 
  BarChart3Icon, 
  TrendingUpIcon, 
  PieChartIcon, 
  ActivityIcon,
  DownloadIcon,
  CalendarIcon,
} from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const [projectsResult, tasksResult, usersResult] = await Promise.all([
        projectService.list(),
        taskService.list(),
        userService.list(),
      ]);

      const projects = projectsResult.data || [];
      const tasks = tasksResult.data || [];
      const users = usersResult.data || [];

      // Calculate statistics
      const tasksByStatus = {
        TODO: tasks.filter(t => t.status === 'TODO').length,
        IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        IN_REVIEW: tasks.filter(t => t.status === 'IN_REVIEW').length,
        DONE: tasks.filter(t => t.status === 'DONE').length,
        BLOCKED: tasks.filter(t => t.status === 'BLOCKED').length,
      };

      const tasksByPriority = {
        LOW: tasks.filter(t => t.priority === 'LOW').length,
        MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
        HIGH: tasks.filter(t => t.priority === 'HIGH').length,
        URGENT: tasks.filter(t => t.priority === 'URGENT').length,
      };

      const projectsByStatus = {
        ACTIVE: projects.filter(p => p.status === 'ACTIVE').length,
        ON_HOLD: projects.filter(p => p.status === 'ON_HOLD').length,
        COMPLETED: projects.filter(p => p.status === 'COMPLETED').length,
        ARCHIVED: projects.filter(p => p.status === 'ARCHIVED').length,
      };

      const usersByRole = {
        ADMIN: users.filter(u => u.role === 'ADMIN').length,
        MANAGER: users.filter(u => u.role === 'MANAGER').length,
        MEMBER: users.filter(u => u.role === 'MEMBER').length,
        VIEWER: users.filter(u => u.role === 'VIEWER').length,
      };

      const completionRate = tasks.length > 0 
        ? Math.round((tasksByStatus.DONE / tasks.length) * 100)
        : 0;

      setStats({
        overview: {
          totalProjects: projects.length,
          totalTasks: tasks.length,
          totalUsers: users.length,
          completionRate,
        },
        tasksByStatus,
        tasksByPriority,
        projectsByStatus,
        usersByRole,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Track your team's performance and progress</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Projects"
            value={stats.overview.totalProjects}
            icon={BarChart3Icon}
            color="blue"
            trend="+12%"
          />
          <StatCard
            title="Total Tasks"
            value={stats.overview.totalTasks}
            icon={ActivityIcon}
            color="purple"
            trend="+8%"
          />
          <StatCard
            title="Team Members"
            value={stats.overview.totalUsers}
            icon={TrendingUpIcon}
            color="green"
            trend="+5%"
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.overview.completionRate}%`}
            icon={PieChartIcon}
            color="orange"
            trend="+15%"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tasks by Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Status</h3>
            <BarChart data={stats.tasksByStatus} colors={statusColors} />
          </div>

          {/* Tasks by Priority */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
            <BarChart data={stats.tasksByPriority} colors={priorityColors} />
          </div>

          {/* Projects by Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects by Status</h3>
            <BarChart data={stats.projectsByStatus} colors={projectStatusColors} />
          </div>

          {/* Users by Role */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team by Role</h3>
            <BarChart data={stats.usersByRole} colors={roleColors} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <ActivityItem
              action="Project created"
              item="New Website Redesign"
              time="2 hours ago"
              icon="📁"
            />
            <ActivityItem
              action="Task completed"
              item="Update landing page"
              time="3 hours ago"
              icon="✅"
            />
            <ActivityItem
              action="Member added"
              item="John Doe joined the team"
              time="5 hours ago"
              icon="👤"
            />
            <ActivityItem
              action="Comment added"
              item="Discussion on API integration"
              time="1 day ago"
              icon="💬"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const colors = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colors[color]} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className="text-sm text-green-600 font-medium">{trend}</span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function BarChart({ data, colors }: any) {
  const maxValue = Math.max(...Object.values(data) as number[]);

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]: [string, any]) => {
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {key.replace('_', ' ')}
              </span>
              <span className="text-sm font-semibold text-gray-900">{value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${colors[key]}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityItem({ action, item, time, icon }: any) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{action}</p>
        <p className="text-sm text-gray-600">{item}</p>
      </div>
      <span className="text-xs text-gray-500">{time}</span>
    </div>
  );
}

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-400',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-yellow-500',
  DONE: 'bg-green-500',
  BLOCKED: 'bg-red-500',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
};

const projectStatusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500',
  ON_HOLD: 'bg-yellow-500',
  COMPLETED: 'bg-blue-500',
  ARCHIVED: 'bg-gray-400',
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-500',
  MANAGER: 'bg-blue-500',
  MEMBER: 'bg-green-500',
  VIEWER: 'bg-gray-400',
};
