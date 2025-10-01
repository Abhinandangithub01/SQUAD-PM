import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PlusIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  TagIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  ListBulletIcon,
  DocumentIcon,
  CheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { PauseIcon } from '@heroicons/react/24/solid';
import { Menu } from '@headlessui/react';
import api from '../utils/api';
import { formatDate, getRoleColor, getRoleLabel } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  // Fetch project details
  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      // First try to find in mock data
      const mockProject = mockProjects.find(project => project.id === projectId);
      if (mockProject) {
        return { 
          project: {
            ...mockProject,
            members: [
              {
                id: '1',
                user_id: '1',
                first_name: 'Demo',
                last_name: 'User',
                email: 'demo@projecthub.com',
                role: 'owner',
                joined_at: '2024-08-01T00:00:00Z'
              },
              {
                id: '2',
                user_id: '2',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@projecthub.com',
                role: 'admin',
                joined_at: '2024-08-02T00:00:00Z'
              },
              {
                id: '3',
                user_id: '3',
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane@projecthub.com',
                role: 'member',
                joined_at: '2024-08-03T00:00:00Z'
              }
            ]
          }
        };
      }
      
      // Fallback to API
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      toast.success('Project deleted successfully');
      navigate('/projects');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    },
  });

  const handleDeleteProject = () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      deleteProjectMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!projectData?.project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Project not found</h3>
        <p className="text-gray-500 mt-1">The project you're looking for doesn't exist.</p>
        <Link to="/projects" className="mt-4 btn-primary">
          Back to Projects
        </Link>
      </div>
    );
  }

  const project = projectData.project;
  const canEdit = ['owner', 'admin'].includes(project.user_role) || project.user_role === 'admin';

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'members', name: 'Members', icon: UserPlusIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon, requiresEdit: true },
  ];

  const visibleTabs = tabs.filter(tab => !tab.requiresEdit || canEdit);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/projects"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 mt-1">{project.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {canEdit && (
            <Menu as="div" className="relative">
              <Menu.Button className="btn-outline">
                <Cog6ToothIcon className="h-4 w-4 mr-2" />
                Actions
              </Menu.Button>
              <Menu.Items className="dropdown-menu">
                <Menu.Item>
                  <button className="dropdown-item">
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Project
                  </button>
                </Menu.Item>
                <div className="border-t border-gray-100 my-1" />
                <Menu.Item>
                  <button
                    onClick={handleDeleteProject}
                    className="dropdown-item text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Project
                  </button>
                </Menu.Item>
              </Menu.Items>
            </Menu>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link
          to={`/projects/${projectId}/kanban`}
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all duration-200"
        >
          <Squares2X2Icon className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <p className="font-medium text-gray-900">Kanban Board</p>
            <p className="text-sm text-gray-500">Visual task management</p>
          </div>
        </Link>

        <Link
          to={`/projects/${projectId}/list`}
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all duration-200"
        >
          <ListBulletIcon className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <p className="font-medium text-gray-900">List View</p>
            <p className="text-sm text-gray-500">Spreadsheet-like view</p>
          </div>
        </Link>

        <Link
          to={`/projects/${projectId}/gantt`}
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all duration-200"
        >
          <ChartBarIcon className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <p className="font-medium text-gray-900">Gantt Chart</p>
            <p className="text-sm text-gray-500">Timeline view</p>
          </div>
        </Link>

        <Link
          to={`/projects/${projectId}/files`}
          className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all duration-200"
        >
          <DocumentIcon className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <p className="font-medium text-gray-900">Files</p>
            <p className="text-sm text-gray-500">Project documents</p>
          </div>
        </Link>

        <ProjectChatLink projectId={projectId} projectName={project.name} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && <OverviewTab project={project} />}
        {activeTab === 'members' && <MembersTab project={project} canEdit={canEdit} />}
        {activeTab === 'settings' && canEdit && <SettingsTab project={project} />}
      </div>
    </div>
  );
};

const OverviewTab = ({ project }) => {
  const completionRate = project.task_count > 0 
    ? Math.round(((project.completed_tasks || 0) / project.task_count) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Row - Progress and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Completion</span>
                <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{project.task_count || 0}</p>
                <p className="text-sm text-gray-500">Total Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{project.issue_count || 0}</p>
                <p className="text-sm text-gray-500">Issues</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">{project.task_count || 0}</p>
              <p className="text-sm text-gray-500">Total Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">{project.issue_count || 0}</p>
              <p className="text-sm text-gray-500">Issues</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-lg font-semibold text-primary-600">{Math.round(((project.completed_tasks || 0) / (project.task_count || 1)) * 100)}%</p>
              <p className="text-sm text-gray-500">Completion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Milestones - Single Container 100% Width */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Project Milestones</h3>
          <CreateMilestoneButton projectId={project.id} />
        </div>
        
        <MilestonesWithTasks projectId={project.id} />
      </div>

      {/* Recent Activity - Full Width */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <RecentActivity projectId={project.id} />
      </div>
    </div>
  );
};

const MembersTab = ({ project, canEdit }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const queryClient = useQueryClient();

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId) => {
      await api.delete(`/projects/${project.id}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project', project.id]);
      toast.success('Member removed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    },
  });

  const handleRemoveMember = (userId, memberName) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      removeMemberMutation.mutate(userId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Team Members ({project.members?.length || 0})
        </h3>
        {canEdit && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary"
          >
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Add Member
          </button>
        )}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {project.members?.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar user={member} size="sm" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getRoleColor(member.role)}`}>
                      {getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(member.joined_at, 'MMM dd, yyyy')}
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.user_id, `${member.first_name} ${member.last_name}`)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SettingsTab = ({ project }) => {
  const [projectStatus, setProjectStatus] = useState(project.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      // Here you would typically make an API call to update the project status
      console.log('Updating project status to:', newStatus);
      setProjectStatus(newStatus);
      toast.success(`Project marked as ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update project status');
      console.error('Status update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Details */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Project Details</h3>
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
              <input
                type="text"
                defaultValue={project.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
              <input
                type="text"
                defaultValue={project.owner_name}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={3}
              defaultValue={project.description}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter project description"
            />
          </div>

          {/* Project Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
              <input
                type="text"
                value={formatDate(project.created_at, 'MMMM dd, yyyy')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
              <input
                type="text"
                value={formatDate(project.updated_at, 'MMMM dd, yyyy')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
            </div>
          </div>

          {/* Project Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Project Status</label>
            <div className="flex items-center space-x-4">
              <span className={`badge ${getStatusColor(projectStatus)}`}>
                {projectStatus.replace('_', ' ')}
              </span>
              <div className="flex space-x-2">
                {projectStatus !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange('completed')}
                    disabled={isUpdating}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {isUpdating ? 'Updating...' : 'Mark as Completed'}
                  </button>
                )}
                {projectStatus !== 'active' && projectStatus !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange('active')}
                    disabled={isUpdating}
                    className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowRightIcon className="h-4 w-4 mr-2" />
                    Reactivate Project
                  </button>
                )}
                {projectStatus === 'active' && (
                  <button
                    onClick={() => handleStatusChange('on_hold')}
                    disabled={isUpdating}
                    className="flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PauseIcon className="h-4 w-4 mr-2" />
                    Put on Hold
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Project Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Color</label>
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: project.color }}
              />
              <input
                type="color"
                defaultValue={project.color}
                className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-500">Choose a color for your project</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-200">
        <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Delete Project</h4>
              <p className="text-sm text-red-700 mt-1">
                Once you delete a project, there is no going back. Please be certain.
              </p>
              <button className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                Delete Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to handle project chat navigation
const ProjectChatLink = ({ projectId, projectName }) => {
  const navigate = useNavigate();
  const { data: channelsData } = useQuery({
    queryKey: ['chat', 'channels'],
    queryFn: async () => {
      const response = await api.get('/chat/channels');
      return response.data;
    },
  });

  const handleChatClick = () => {
    // Find the project channel for this project
    const projectChannel = channelsData?.channels?.find(
      channel => channel.project_id === projectId && channel.type === 'project'
    );
    
    if (projectChannel) {
      // Navigate to the specific project channel
      navigate(`/chat/${projectChannel.id}`);
    } else {
      // Navigate to general chat if no project channel exists
      navigate('/chat');
    }
  };

  return (
    <button
      onClick={handleChatClick}
      className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all duration-200 w-full text-left"
    >
      <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary-600 mr-3" />
      <div>
        <p className="font-medium text-gray-900">Team Chat</p>
        <p className="text-sm text-gray-500">Collaborate in real-time</p>
      </div>
    </button>
  );
};

// Recent Activity Component
const RecentActivity = ({ projectId }) => {
  const [visibleCount, setVisibleCount] = useState(5);
  
  // Filter activities for this specific project
  const projectActivities = mockActivity.filter(activity => activity.project_id === projectId);
  
  if (projectActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <ChartBarIcon className="h-8 w-8 mx-auto" />
        </div>
        <p className="text-sm text-gray-500">No recent activity</p>
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

  const getActionText = (activity) => {
    const { action, entity_type, entity_name, from_status, to_status } = activity;
    
    if (action === 'moved' && from_status && to_status) {
      return `moved "${entity_name}" from ${from_status} to ${to_status}`;
    }
    
    return `${action} ${entity_type} "${entity_name}"`;
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 5, projectActivities.length));
  };

  const visibleActivities = projectActivities.slice(0, visibleCount);
  const hasMore = visibleCount < projectActivities.length;

  return (
    <div className="flex flex-col h-80">
      {/* Scrollable Activity List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {visibleActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 py-2">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
              {getActionIcon(activity.action)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">
                  {activity.first_name} {activity.last_name}
                </span>{' '}
                {getActionText(activity)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(activity.created_at, 'MMM dd, yyyy • h:mm a')}
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
            Load More ({projectActivities.length - visibleCount} remaining)
          </button>
        </div>
      )}
      
      {/* View All Activity Link */}
      {!hasMore && projectActivities.length > 5 && (
        <div className="flex-shrink-0 pt-4 border-t border-gray-100 mt-4 text-center">
          <button className="text-sm text-gray-500 hover:text-gray-700 font-medium">
            All activity loaded ({projectActivities.length} items)
          </button>
        </div>
      )}
    </div>
  );
};

// Linked Tasks Panel Component
const LinkedTasksPanel = ({ projectId, selectedMilestoneId }) => {
  // Get all tasks for the project
  const projectTasks = mockTasks.filter(task => task.project_id === projectId);
  
  // Get the selected milestone
  const selectedMilestone = mockMilestones.find(milestone => milestone.id === selectedMilestoneId);
  
  // Get tasks for the selected milestone
  const selectedMilestoneTasks = selectedMilestone 
    ? projectTasks.filter(task => task.milestone_id === selectedMilestone.id)
    : [];
  
  const completedTasks = selectedMilestoneTasks.filter(task => task.completed || task.status === 'Done');
  const progress = selectedMilestoneTasks.length > 0 
    ? Math.round((completedTasks.length / selectedMilestoneTasks.length) * 100) 
    : 0;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Review':
        return 'bg-purple-100 text-purple-800';
      case 'To Do':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 h-fit">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Linked Tasks</h3>
      
      {!selectedMilestone || selectedMilestoneTasks.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <ListBulletIcon className="h-8 w-8 mx-auto" />
          </div>
          <p className="text-sm text-gray-500">
            {!selectedMilestone ? 'Select a milestone to view tasks' : 'No tasks linked to this milestone'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {selectedMilestone.title}
              </h4>
              <span className="text-xs text-gray-500">
                {completedTasks.length}/{selectedMilestoneTasks.length}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: selectedMilestone.color
                }}
              />
            </div>

            <div className="space-y-2">
              {selectedMilestoneTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-2 p-2 bg-white rounded border">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.completed || task.status === 'Done' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className={`badge text-xs ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`badge text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Milestones with Tasks Component (manages selection state)
const MilestonesWithTasks = ({ projectId }) => {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
  
  // Filter milestones for this project
  const projectMilestones = mockMilestones.filter(milestone => milestone.project_id === projectId);
  
  // Calculate milestone progress based on linked tasks
  const calculateMilestoneProgress = (milestoneId) => {
    const linkedTasks = mockTasks.filter(task => task.milestone_id === milestoneId && task.project_id === projectId);
    if (linkedTasks.length === 0) return 0;
    
    const completedTasks = linkedTasks.filter(task => task.completed || task.status === 'Done').length;
    return Math.round((completedTasks / linkedTasks.length) * 100);
  };
  
  // Update milestones with calculated progress
  const milestonesWithProgress = projectMilestones.map(milestone => ({
    ...milestone,
    progress: calculateMilestoneProgress(milestone.id),
    linkedTasksCount: mockTasks.filter(task => task.milestone_id === milestone.id && task.project_id === projectId).length
  }));

  // Set default selected milestone to the first one with tasks
  React.useEffect(() => {
    if (!selectedMilestoneId && milestonesWithProgress.length > 0) {
      const firstMilestoneWithTasks = milestonesWithProgress.find(m => m.linkedTasksCount > 0);
      if (firstMilestoneWithTasks) {
        setSelectedMilestoneId(firstMilestoneWithTasks.id);
      } else {
        setSelectedMilestoneId(milestonesWithProgress[0].id);
      }
    }
  }, [milestonesWithProgress, selectedMilestoneId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      {/* Milestones Section - 70% */}
      <div className="lg:col-span-7">
        <ProjectMilestones 
          projectId={projectId} 
          selectedMilestoneId={selectedMilestoneId}
          onMilestoneSelect={setSelectedMilestoneId}
        />
      </div>

      {/* Linked Tasks Section - 30% */}
      <div className="lg:col-span-3">
        <LinkedTasksPanel 
          projectId={projectId} 
          selectedMilestoneId={selectedMilestoneId}
        />
      </div>
    </div>
  );
};

// Create Milestone Button Component
const CreateMilestoneButton = ({ projectId }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200"
      >
        <PlusIcon className="h-4 w-4 mr-1" />
        Add Milestone
      </button>
      {showModal && (
        <CreateMilestoneModal
          projectId={projectId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

// Project Milestones Component
const ProjectMilestones = ({ projectId, selectedMilestoneId, onMilestoneSelect }) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  
  // Filter milestones for this project
  const projectMilestones = mockMilestones.filter(milestone => milestone.project_id === projectId);
  
  // Calculate milestone progress based on linked tasks
  const calculateMilestoneProgress = (milestoneId) => {
    const linkedTasks = mockTasks.filter(task => task.milestone_id === milestoneId && task.project_id === projectId);
    if (linkedTasks.length === 0) return 0;
    
    const completedTasks = linkedTasks.filter(task => task.completed || task.status === 'Done').length;
    return Math.round((completedTasks / linkedTasks.length) * 100);
  };
  
  // Update milestones with calculated progress
  const milestonesWithProgress = projectMilestones.map(milestone => ({
    ...milestone,
    progress: calculateMilestoneProgress(milestone.id),
    linkedTasksCount: mockTasks.filter(task => task.milestone_id === milestone.id && task.project_id === projectId).length
  }));

  if (projectMilestones.length === 0) {
    return (
      <div className="text-center py-8">
        <FlagIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No milestones yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create your first milestone to track project progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'calendar'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Calendar View
          </button>
        </div>
        <span className="text-sm text-gray-500">
          {projectMilestones.length} milestone{projectMilestones.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      <div className="h-80">
        {viewMode === 'list' ? (
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <MilestoneListView 
              milestones={milestonesWithProgress} 
              selectedMilestoneId={selectedMilestoneId}
              onMilestoneClick={onMilestoneSelect}
            />
          </div>
        ) : (
          <MilestoneCalendarWithDetails 
            milestones={milestonesWithProgress} 
            onMilestoneSelect={onMilestoneSelect}
          />
        )}
      </div>
    </div>
  );
};

// Milestone List View Component
const MilestoneListView = ({ milestones, selectedMilestoneId, onMilestoneClick }) => {
  const getMilestoneStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="space-y-2">
      {milestones.map((milestone) => {
        const isSelected = selectedMilestoneId === milestone.id;
        return (
          <div
            key={milestone.id}
            onClick={() => onMilestoneClick && onMilestoneClick(milestone.id)}
            className={`flex items-center space-x-4 p-3 rounded-lg transition-colors duration-200 cursor-pointer ${
              isSelected 
                ? 'bg-primary-50 border-2 border-primary-200 shadow-sm' 
                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }`}
          >
          <div className="flex-shrink-0">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: milestone.color }}
            />
          </div>
          <div className="flex-1 min-w-0">
            {/* Single Row: Title, Status, Due Date, Progress */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                  {milestone.title}
                </h4>
              </div>
              
              {/* Middle Section: Status and Date */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className={`badge text-xs px-2 py-1 ${getMilestoneStatusColor(milestone.status)}`}>
                  {milestone.status.replace('_', ' ')}
                </span>
                {isOverdue(milestone.due_date) && milestone.status !== 'completed' && (
                  <span className="badge text-xs px-2 py-1 bg-red-100 text-red-800">
                    Overdue
                  </span>
                )}
                <div className="flex items-center text-xs text-gray-600 font-medium">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {formatDate(milestone.due_date, 'MMM dd')}
                </div>
              </div>

              {/* Right Section: Progress */}
              <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                <span className="text-xs text-gray-600 font-medium min-w-[2.5rem] text-right">{milestone.progress}%</span>
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${milestone.progress}%`,
                      backgroundColor: milestone.color
                    }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 truncate">
              {milestone.description}
            </p>
            {milestone.linkedTasksCount > 0 && (
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <span className="font-medium">{milestone.linkedTasksCount} linked task{milestone.linkedTasksCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
};

// Milestone Calendar with Details Panel Component
const MilestoneCalendarWithDetails = ({ milestones, onMilestoneSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 9, 1)); // October 2024
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMilestones, setSelectedMilestones] = useState([]);

  // Get upcoming milestones by default
  const upcomingMilestones = milestones
    .filter(milestone => milestone.status === 'upcoming' || milestone.status === 'in_progress')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  // Set default selected milestones to upcoming ones
  React.useEffect(() => {
    if (!selectedDate && upcomingMilestones.length > 0) {
      setSelectedMilestones(upcomingMilestones);
    }
  }, [upcomingMilestones, selectedDate]);

  // Get current month's calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days = [];
  const currentDay = new Date(startDate);
  
  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  const getMilestonesForDate = (date) => {
    return milestones.filter(milestone => {
      const milestoneDate = new Date(milestone.due_date);
      return milestoneDate.toDateString() === date.toDateString();
    });
  };

  const handleDateClick = (date, dayMilestones) => {
    setSelectedDate(date);
    if (dayMilestones.length > 0) {
      setSelectedMilestones(dayMilestones);
    } else {
      setSelectedMilestones([]);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMilestoneIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      case 'upcoming':
        return '📅';
      default:
        return '📋';
    }
  };

  const isOverdue = (dueDate, status) => {
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Fixed Size Calendar - Left Side */}
      <div className="lg:col-span-1">
        <div className="w-full">
          {/* Calendar Legend */}
          <div className="flex items-center justify-center bg-gray-50 p-1 rounded-lg mb-2">
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded bg-green-500"></div>
                <span className="text-gray-600">Done</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded bg-blue-500"></div>
                <span className="text-gray-600">Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded bg-red-500"></div>
                <span className="text-gray-600">Overdue</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-72">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => navigateMonth(-1)}
                className="flex items-center justify-center w-5 h-5 hover:bg-gray-200 rounded transition-colors"
              >
                <span className="text-gray-600 text-xs">←</span>
              </button>
              <h3 className="text-xs font-semibold text-gray-900">
                {monthNames[month]} {year}
              </h3>
              <button
                onClick={() => navigateMonth(1)}
                className="flex items-center justify-center w-5 h-5 hover:bg-gray-200 rounded transition-colors"
              >
                <span className="text-gray-600 text-xs">→</span>
              </button>
            </div>

            {/* Calendar Grid - Fixed Size */}
            <div className="p-1">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-600 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days - Fixed Height */}
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day, index) => {
                  const isCurrentMonth = day.getMonth() === month;
                  const isToday = day.toDateString() === new Date().toDateString();
                  const dayMilestones = getMilestonesForDate(day);
                  const isSelected = selectedDate && selectedDate.toDateString() === day.toDateString();

                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(day, dayMilestones)}
                      className={`h-8 w-8 p-0.5 border rounded text-xs cursor-pointer flex flex-col items-center justify-center ${
                        isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                      } ${isToday ? 'ring-1 ring-primary-400 bg-primary-50' : ''} ${
                        isSelected ? 'ring-1 ring-blue-400 bg-blue-50' : ''
                      } ${dayMilestones.length > 0 ? 'hover:shadow-sm border-primary-200' : 'hover:bg-gray-50'}`}
                    >
                      <span className={`text-xs leading-none ${
                        isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      } ${isToday ? 'text-primary-700 font-bold' : ''}`}>
                        {day.getDate()}
                      </span>
                      {dayMilestones.length > 0 && (
                        <div className="flex space-x-0.5 mt-0.5">
                          {dayMilestones.slice(0, 2).map(milestone => {
                            const overdue = isOverdue(milestone.due_date, milestone.status);
                            return (
                              <div
                                key={milestone.id}
                                className="w-1 h-1 rounded-full"
                                style={{ 
                                  backgroundColor: overdue ? '#EF4444' : milestone.color 
                                }}
                                title={milestone.title}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Details Panel - Right Side */}
      <div className="lg:col-span-2">
        <div className="h-72">
          <MilestoneDetailsPanel 
            milestones={selectedMilestones}
            selectedDate={selectedDate}
            isDefault={!selectedDate}
            onMilestoneSelect={onMilestoneSelect}
          />
        </div>
      </div>
    </div>
  );
};

// Original Calendar View Component (keeping for reference)
const MilestoneCalendarView = ({ milestones }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 9, 1)); // October 2024
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  
  // Get current month's calendar data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days = [];
  const currentDay = new Date(startDate);
  
  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  const getMilestonesForDate = (date) => {
    return milestones.filter(milestone => {
      const milestoneDate = new Date(milestone.due_date);
      return milestoneDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMilestoneIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      case 'upcoming':
        return '📅';
      default:
        return '📋';
    }
  };

  const isOverdue = (dueDate, status) => {
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  return (
    <div className="space-y-4">
      {/* Calendar Legend */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-gray-400"></div>
            <span className="text-gray-600">Upcoming</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-gray-600">Overdue</span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} total
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => navigateMonth(-1)}
            className="flex items-center justify-center w-8 h-8 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span className="text-gray-600">←</span>
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={() => navigateMonth(1)}
            className="flex items-center justify-center w-8 h-8 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span className="text-gray-600">→</span>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === month;
              const isToday = day.toDateString() === new Date().toDateString();
              const dayMilestones = getMilestonesForDate(day);

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border rounded-lg transition-all duration-200 ${
                    isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                  } ${isToday ? 'ring-2 ring-primary-400 bg-primary-50' : ''} ${
                    dayMilestones.length > 0 ? 'hover:shadow-lg cursor-pointer border-primary-200' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 flex items-center justify-between ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-primary-700 font-bold' : ''}`}>
                    <span>{day.getDate()}</span>
                    {dayMilestones.length > 0 && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayMilestones.slice(0, 2).map(milestone => {
                      const overdue = isOverdue(milestone.due_date, milestone.status);
                      return (
                        <div
                          key={milestone.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMilestone(milestone);
                          }}
                          className={`text-xs p-2 rounded-lg text-white cursor-pointer hover:scale-105 transition-all duration-200 shadow-sm ${
                            overdue ? 'bg-red-500 hover:bg-red-600' : 'hover:shadow-md'
                          }`}
                          style={{ 
                            backgroundColor: overdue ? '#EF4444' : milestone.color 
                          }}
                          title={`Click to view details: ${milestone.title}`}
                        >
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xs">
                              {getMilestoneIcon(milestone.status)}
                            </span>
                            <span className="font-medium text-xs">
                              {milestone.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <div className="font-medium text-xs leading-tight">
                            {milestone.title}
                          </div>
                          {milestone.progress > 0 && (
                            <div className="mt-1 flex items-center space-x-1">
                              <div className="flex-1 bg-white/30 rounded-full h-1">
                                <div 
                                  className="bg-white h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${milestone.progress}%` }}
                                />
                              </div>
                              <span className="text-xs opacity-90 font-medium">
                                {milestone.progress}%
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {dayMilestones.length > 2 && (
                      <div 
                        className="text-xs text-gray-600 bg-gray-100 p-1.5 rounded-lg text-center cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => {
                          // Show all milestones for this day
                          setSelectedMilestone({
                            ...dayMilestones[0],
                            title: `${dayMilestones.length} Milestones`,
                            description: `Multiple milestones due on ${formatDate(day, 'MMMM dd, yyyy')}:\n\n${dayMilestones.map(m => `• ${m.title} (${m.status})`).join('\n')}`
                          });
                        }}
                      >
                        +{dayMilestones.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Milestone Detail Modal */}
      {selectedMilestone && (
        <MilestoneDetailModal
          milestone={selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
        />
      )}
    </div>
  );
};

// Milestone Details Panel Component
const MilestoneDetailsPanel = ({ milestones, selectedDate, isDefault, onMilestoneSelect }) => {
  const getMilestoneStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate, status) => {
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  const getMilestoneIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '🔄';
      case 'upcoming':
        return '📅';
      default:
        return '📋';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h4 className="text-sm font-semibold text-gray-900">
          {isDefault ? 'Upcoming Milestones' : selectedDate ? `Milestones for ${formatDate(selectedDate, 'MMM dd, yyyy')}` : 'Milestone Details'}
        </h4>
        {milestones.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="p-3">
          {milestones.length === 0 ? (
            <div className="text-center py-6">
              <CalendarIcon className="mx-auto h-6 w-6 text-gray-300" />
              <p className="text-xs text-gray-500 mt-2">
                {selectedDate ? 'No milestones on this date' : 'No upcoming milestones'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => {
                const overdue = isOverdue(milestone.due_date, milestone.status);
                return (
                  <div
                    key={milestone.id}
                    onClick={() => onMilestoneSelect && onMilestoneSelect(milestone.id)}
                    className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: overdue ? '#EF4444' : milestone.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1">
                            <h5 className="text-xs font-medium text-gray-900 truncate">
                              {milestone.title}
                            </h5>
                            <span className={`badge text-xs ${getMilestoneStatusColor(milestone.status)}`}>
                              {milestone.status.replace('_', ' ')}
                            </span>
                            {overdue && (
                              <span className="badge text-xs bg-red-100 text-red-800">
                                Overdue
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle edit milestone
                              console.log('Edit milestone:', milestone.id);
                            }}
                            className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Edit milestone"
                          >
                            <PencilIcon className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {milestone.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {milestone.description}
                          </p>
                        )}

                        <div className="space-y-1">
                          {/* Progress */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">Progress</span>
                              <span className="text-xs font-medium text-gray-900">
                                {milestone.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all duration-300"
                                style={{
                                  width: `${milestone.progress}%`,
                                  backgroundColor: overdue ? '#EF4444' : milestone.color
                                }}
                              />
                            </div>
                          </div>

                          {/* Due Date */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Due Date</span>
                            <span className={`font-medium ${
                              overdue ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {formatDate(milestone.due_date, 'MMM dd, yyyy')}
                            </span>
                          </div>

                          {/* Created By */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Created by</span>
                            <span className="font-medium text-gray-900">
                              {milestone.created_by}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

// Milestone Detail Modal Component
const MilestoneDetailModal = ({ milestone, onClose }) => {
  const getMilestoneStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate, status) => {
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  const overdue = isOverdue(milestone.due_date, milestone.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: overdue ? '#EF4444' : milestone.color }}
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {milestone.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`badge text-xs ${getMilestoneStatusColor(milestone.status)}`}>
                  {milestone.status.replace('_', ' ')}
                </span>
                {overdue && (
                  <span className="badge text-xs bg-red-100 text-red-800">
                    Overdue
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Description */}
          {milestone.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {milestone.description}
              </p>
            </div>
          )}

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Progress</h4>
              <span className="text-sm font-medium text-gray-900">
                {milestone.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${milestone.progress}%`,
                  backgroundColor: overdue ? '#EF4444' : milestone.color
                }}
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-center justify-between py-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Due Date</span>
            </div>
            <span className={`text-sm font-medium ${
              overdue ? 'text-red-600' : 'text-gray-900'
            }`}>
              {formatDate(milestone.due_date, 'MMMM dd, yyyy')}
            </span>
          </div>

          {/* Created By */}
          <div className="flex items-center justify-between py-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Created by</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {milestone.created_by}
            </span>
          </div>

          {/* Linked Tasks */}
          {milestone.linked_tasks && milestone.linked_tasks.length > 0 && (
            <div className="py-3 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Linked Tasks ({milestone.linked_tasks.length})
              </h4>
              <div className="text-sm text-gray-600">
                {milestone.linked_tasks.length} task{milestone.linked_tasks.length !== 1 ? 's' : ''} linked to this milestone
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Edit Milestone
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Milestone Modal Component
const CreateMilestoneModal = ({ projectId, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    color: '#3B82F6'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically make an API call to create the milestone
    console.log('Creating milestone:', { ...formData, project_id: projectId });
    toast.success('Milestone created successfully!');
    onClose();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Yellow' },
    { value: '#EF4444', label: 'Red' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#F97316', label: 'Orange' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create Milestone</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter milestone title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter milestone description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex space-x-2">
              {colorOptions.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color.value ? 'border-gray-400' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Create Milestone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectDetail;
