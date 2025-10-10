import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import ModernSidebar from '../components/ModernSidebar';
import ModernTopBar from '../components/ModernTopBar';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';

const ModernDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    teamMembers: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const client = generateClient();
      const user = await getCurrentUser();

      // Get user's organization
      const { data: memberships } = await client.models.OrganizationMember.list({
        filter: { userId: { eq: user.userId } }
      });

      if (!memberships || memberships.length === 0) {
        setLoading(false);
        return;
      }

      const organizationId = memberships[0].organizationId;

      // Fetch projects
      const { data: projects } = await client.models.Project.list({
        filter: { organizationId: { eq: organizationId } }
      });

      // Fetch all tasks for the organization's projects
      const projectIds = projects?.map(p => p.id) || [];
      let allTasks = [];
      
      for (const projectId of projectIds) {
        const { data: tasks } = await client.models.Task.list({
          filter: { projectId: { eq: projectId } }
        });
        allTasks = [...allTasks, ...(tasks || [])];
      }

      // Fetch team members
      const { data: members } = await client.models.OrganizationMember.list({
        filter: { organizationId: { eq: organizationId } }
      });

      // Calculate stats
      const activeProjects = projects?.filter(p => p.status === 'ACTIVE').length || 0;
      const completedProjects = projects?.filter(p => p.status === 'COMPLETED').length || 0;
      const completedTasks = allTasks.filter(t => t.status === 'DONE').length;
      const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const overdueTasks = allTasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && t.status !== 'DONE';
      }).length;

      setStats({
        totalProjects: projects?.length || 0,
        activeProjects,
        completedProjects,
        totalTasks: allTasks.length,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        teamMembers: members?.length || 0,
      });

      setRecentProjects(projects?.slice(0, 5) || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    {
      title: 'Total Projects',
      value: stats.totalProjects.toString(),
      subtitle: `${stats.activeProjects} active`,
      icon: FolderIcon,
      color: 'blue',
      link: '/projects',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects.toString(),
      subtitle: `${stats.completedProjects} completed`,
      icon: ChartBarIcon,
      color: 'green',
      link: '/projects',
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks.toString(),
      subtitle: `${stats.completedTasks} completed`,
      icon: CheckCircleIcon,
      color: 'purple',
    },
    {
      title: 'In Progress',
      value: stats.inProgressTasks.toString(),
      subtitle: 'Tasks being worked on',
      icon: ClockIcon,
      color: 'orange',
    },
    {
      title: 'Overdue Tasks',
      value: stats.overdueTasks.toString(),
      subtitle: 'Need attention',
      icon: ExclamationTriangleIcon,
      color: 'red',
    },
    {
      title: 'Team Members',
      value: stats.teamMembers.toString(),
      subtitle: 'In your organization',
      icon: UsersIcon,
      color: 'indigo',
      link: '/organization/settings',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
      teal: 'bg-teal-50 text-teal-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      pink: 'bg-pink-50 text-pink-600',
      red: 'bg-red-50 text-red-600',
      cyan: 'bg-cyan-50 text-cyan-600',
      emerald: 'bg-emerald-50 text-emerald-600',
      amber: 'bg-amber-50 text-amber-600',
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernSidebar />
        <ModernTopBar title="Dashboard" />
        <div className="ml-16 mt-16 p-6 flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernSidebar />
      <ModernTopBar title="Dashboard" />

      {/* Main Content */}
      <div className="ml-16 mt-16 p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Overview</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your projects.</p>
            </div>
            <Link
              to="/projects"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Project
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const MetricCard = metric.link ? Link : 'div';
            return (
              <MetricCard
                key={index}
                to={metric.link}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getColorClasses(metric.color)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">{metric.title}</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{metric.value}</div>
                <div className="text-sm text-gray-500">{metric.subtitle}</div>
              </MetricCard>
            );
          })}
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
            <Link to="/projects" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              View All →
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No projects yet</p>
              <Link
                to="/projects"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Project
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}/kanban`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                      <FolderIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
