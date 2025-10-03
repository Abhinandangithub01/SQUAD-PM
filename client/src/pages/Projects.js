import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  FolderIcon,
  UsersIcon,
  CalendarIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import amplifyDataService from '../services/amplifyDataService';
import { formatDate, getRoleColor, getRoleLabel } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import CreateProjectModal from '../components/CreateProjectModal';
import toast from 'react-hot-toast';

const Projects = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const queryClient = useQueryClient();

  // Fetch projects from Amplify
  const { data: projectsData, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await amplifyDataService.projects.list();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId) => {
      const result = await amplifyDataService.projects.delete(projectId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    },
  });

  const handleDeleteProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  // Filter projects
  const filteredProjects = projectsData?.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage and organize your team's projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Project
        </button>
      </div>

      {/* Filters and View Toggle - Single Row */}
      <div className="flex items-center gap-3">
        {/* Search - 50% width */}
        <div className="relative" style={{ width: '50%' }}>
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>

        {/* Status Filter - Reduced width */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-32"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>

        {/* Filters Button */}
        <button className="btn-outline whitespace-nowrap">
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filters
        </button>

        {/* View Toggle */}
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-2 transition-colors ${
              viewMode === 'card'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Card View"
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="List View"
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Projects Display */}
      {filteredProjects.length > 0 ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery || statusFilter !== 'all' ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first project'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Project
            </button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries(['projects']);
        }}
      />
    </div>
  );
};

const ProjectCard = ({ project, onDelete }) => {
  const completionRate = project.task_count > 0 
    ? Math.round((project.completed_tasks / project.task_count) * 100)
    : 0;

  return (
    <div className="card hover:shadow-medium transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <div className="min-w-0 flex-1">
              <Link
                to={`/projects/${project.id}`}
                className="text-lg font-semibold text-gray-900 hover:text-primary-600 truncate block"
              >
                {project.name}
              </Link>
              <span className={`badge text-xs mt-1 ${getRoleColor(project.user_role)}`}>
                {getRoleLabel(project.user_role)}
              </span>
            </div>
          </div>
          
          <Menu as="div" className="relative">
            <Menu.Button className="p-1 rounded-full text-gray-400 hover:text-gray-600">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </Menu.Button>
            <Menu.Items className="dropdown-menu">
              <Menu.Item>
                <Link to={`/projects/${project.id}`} className="dropdown-item">
                  View Details
                </Link>
              </Menu.Item>
              <Menu.Item>
                <Link to={`/projects/${project.id}/kanban`} className="dropdown-item">
                  Kanban Board
                </Link>
              </Menu.Item>
              <Menu.Item>
                <Link to={`/projects/${project.id}/list`} className="dropdown-item">
                  List View
                </Link>
              </Menu.Item>
              <Menu.Item>
                <Link to={`/projects/${project.id}/files`} className="dropdown-item">
                  Files
                </Link>
              </Menu.Item>
              {(project.user_role === 'owner' || project.user_role === 'admin') && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <Menu.Item>
                    <button
                      onClick={() => onDelete(project.id)}
                      className="dropdown-item text-red-600 hover:bg-red-50"
                    >
                      Delete Project
                    </button>
                  </Menu.Item>
                </>
              )}
            </Menu.Items>
          </Menu>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <ChartBarIcon className="h-4 w-4 mr-2" />
            <span>{project.task_count} tasks</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <UsersIcon className="h-4 w-4 mr-2" />
            <span>{project.member_count} members</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>Updated {formatDate(project.updated_at, 'MMM dd')}</span>
          </div>
          <div className="flex items-center">
            <span>Owner: {project.owner_name}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <Link
              to={`/projects/${project.id}/kanban`}
              className="flex-1 btn-outline btn-sm text-center"
            >
              Kanban
            </Link>
            <Link
              to={`/projects/${project.id}/list`}
              className="flex-1 btn-outline btn-sm text-center"
            >
              List View
            </Link>
            <Link
              to={`/projects/${project.id}/files`}
              className="flex-1 btn-outline btn-sm text-center"
            >
              Files
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectRow = ({ project, onDelete }) => {
  const completionRate = project.task_count > 0 
    ? Math.round((project.completed_tasks / project.task_count) * 100)
    : 0;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0 mr-3"
            style={{ backgroundColor: project.color }}
          />
          <div>
            <Link
              to={`/projects/${project.id}`}
              className="text-sm font-medium text-gray-900 hover:text-primary-600"
            >
              {project.name}
            </Link>
            <div className="text-xs text-gray-500 mt-1">{project.description}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
            <div 
              className="bg-primary-500 h-2 rounded-full"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-sm text-gray-900 font-medium">{completionRate}%</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center text-sm text-gray-900">
          <UsersIcon className="h-4 w-4 mr-2 text-gray-400" />
          {project.member_count} members
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(project.updated_at, 'MMM dd, yyyy')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <Link
            to={`/projects/${project.id}/kanban`}
            className="text-primary-600 hover:text-primary-900"
          >
            Kanban
          </Link>
          <Link
            to={`/projects/${project.id}/list`}
            className="text-primary-600 hover:text-primary-900"
          >
            List
          </Link>
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="p-1 rounded-full text-gray-400 hover:text-gray-600">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </Menu.Button>
            <Menu.Items className="dropdown-menu">
              <Menu.Item>
                <Link to={`/projects/${project.id}`} className="dropdown-item">
                  View Details
                </Link>
              </Menu.Item>
              {(project.user_role === 'owner' || project.user_role === 'admin') && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <Menu.Item>
                    <button
                      onClick={() => onDelete(project.id)}
                      className="dropdown-item text-red-600 hover:bg-red-50"
                    >
                      Delete Project
                    </button>
                  </Menu.Item>
                </>
              )}
            </Menu.Items>
          </Menu>
        </div>
      </td>
    </tr>
  );
};

export default Projects;
