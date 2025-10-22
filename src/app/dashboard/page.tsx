'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { FolderIcon, CheckSquareIcon, UsersIcon, TrendingUpIcon } from 'lucide-react';

const client = generateClient<Schema>();

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    teamMembers: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch projects
      const { data: projects } = await client.models.Project.list({
        filter: { status: { eq: 'ACTIVE' } },
      });

      // Fetch tasks
      const { data: tasks } = await client.models.Task.list();

      // Fetch users
      const { data: users } = await client.models.User.list();

      setStats({
        totalProjects: projects?.length || 0,
        activeTasks: tasks?.filter((t) => t.status !== 'DONE').length || 0,
        teamMembers: users?.length || 0,
        completedTasks: tasks?.filter((t) => t.status === 'DONE').length || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Welcome back, {user?.firstName}!
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Total Projects"
            value={loading ? '...' : stats.totalProjects}
            icon={FolderIcon}
            color="blue"
          />
          <StatCard
            title="Active Tasks"
            value={loading ? '...' : stats.activeTasks}
            icon={CheckSquareIcon}
            color="purple"
          />
          <StatCard
            title="Team Members"
            value={loading ? '...' : stats.teamMembers}
            icon={UsersIcon}
            color="green"
          />
          <StatCard
            title="Completed"
            value={loading ? '...' : stats.completedTasks}
            icon={TrendingUpIcon}
            color="orange"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickActionButton
              href="/dashboard/projects"
              title="Create Project"
              description="Start a new project"
            />
            <QuickActionButton
              href="/dashboard/tasks"
              title="Add Task"
              description="Create a new task"
            />
            <QuickActionButton
              href="/dashboard/team"
              title="Invite Member"
              description="Add team member"
            />
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 shadow rounded-lg p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <p className="mb-4 opacity-90">
            Welcome to SQUAD PM! Your project management system is ready.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span className="text-sm">Authentication configured</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span className="text-sm">Database ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span className="text-sm">File storage enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span className="text-sm">Real-time updates</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${colors[color]} p-3 rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-2xl font-bold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({ href, title, description }: any) {
  return (
    <a
      href={href}
      className="block p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
    >
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  );
}
