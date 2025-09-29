import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  FunnelIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import api from '../utils/api';
import { formatDate, getPriorityColor, getStatusColor, truncateText } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import toast from 'react-hot-toast';

const ListView = () => {
  const { projectId } = useParams();
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [editingTask, setEditingTask] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    assignee: '',
    type: '',
  });
  const queryClient = useQueryClient();

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }) => {
      const response = await api.put(`/tasks/${taskId}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', 'project', projectId]);
      setEditingTask(null);
      setEditingField(null);
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ taskIds, updates }) => {
      const response = await api.put('/tasks/bulk', { task_ids: taskIds, updates });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', 'project', projectId]);
      setSelectedTasks(new Set());
      toast.success('Tasks updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update tasks');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', 'project', projectId]);
      setSelectedTasks(new Set());
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    },
  });

  // Fetch tasks
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', 'project', projectId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await api.get(`/tasks/project/${projectId}?${params.toString()}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  // Convert to issue mutation
  const convertToIssueMutation = useMutation({
    mutationFn: async ({ taskId, issueData }) => {
      const response = await api.post(`/tasks/${taskId}/convert-to-issue`, issueData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', 'project', projectId]);
      toast.success('Task converted to issue successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to convert task');
    },
  });

  // Sort and filter tasks
  const sortedAndFilteredTasks = useMemo(() => {
    if (!tasksData?.tasks) return [];

    let filtered = tasksData.tasks;

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [tasksData?.tasks, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectTask = (taskId) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === sortedAndFilteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(sortedAndFilteredTasks.map(task => task.id)));
    }
  };

  const handleBulkUpdate = (updates) => {
    if (selectedTasks.size === 0) return;
    bulkUpdateMutation.mutate({
      taskIds: Array.from(selectedTasks),
      updates
    });
  };

  const handleConvertToIssue = (taskId) => {
    // Simple conversion with default values
    convertToIssueMutation.mutate({
      taskId,
      issueData: {
        severity: 'medium',
        environment: 'Production',
        steps_to_reproduce: 'Please provide steps to reproduce this issue.'
      }
    });
  };

  const SortButton = ({ column, children }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center space-x-1 text-left font-medium text-gray-700 hover:text-gray-900"
    >
      <span>{children}</span>
      {sortConfig.key === column && (
        sortConfig.direction === 'asc' ? 
          <ArrowUpIcon className="h-4 w-4" /> : 
          <ArrowDownIcon className="h-4 w-4" />
      )}
    </button>
  );

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
        <div className="flex items-center space-x-4">
          <Link
            to={`/projects/${projectId}`}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">List View</h1>
            <p className="text-gray-600">Manage tasks in a spreadsheet-like interface</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
          <div className="lg:col-span-1">
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input w-full"
            />
          </div>
          
          <div>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="input w-full"
            >
              <option value="">All Types</option>
              <option value="task">Tasks</option>
              <option value="issue">Issues</option>
            </select>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input w-full"
            >
              <option value="">All Status</option>
              <option value="Backlog">Backlog</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="input w-full"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <button className="btn-outline w-full">
              <FunnelIcon className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTasks.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-900">
              {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkUpdate({ status: e.target.value });
                    e.target.value = '';
                  }
                }}
                className="input-sm"
              >
                <option value="">Change Status</option>
                <option value="Backlog">Backlog</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Done">Done</option>
              </select>
              
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkUpdate({ priority: e.target.value });
                    e.target.value = '';
                  }
                }}
                className="input-sm"
              >
                <option value="">Change Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <button
                onClick={() => setSelectedTasks(new Set())}
                className="btn-outline btn-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTasks.size === sortedAndFilteredTasks.length && sortedAndFilteredTasks.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton column="type">Type</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton column="title">Title</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton column="status">Status</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton column="priority">Priority</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton column="due_date">Due Date</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton column="created_at">Created</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndFilteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSelected={selectedTasks.has(task.id)}
                  onSelect={() => handleSelectTask(task.id)}
                  onView={() => setSelectedTask(task)}
                  onConvertToIssue={() => handleConvertToIssue(task.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {sortedAndFilteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900">No tasks found</h3>
            <p className="text-sm text-gray-500 mt-1">
              {Object.values(filters).some(Boolean) 
                ? 'Try adjusting your filters'
                : 'Get started by creating your first task'
              }
            </p>
            {!Object.values(filters).some(Boolean) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Task
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries(['tasks', 'project', projectId]);
        }}
      />

      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        taskId={selectedTask?.id}
        onUpdate={() => {
          queryClient.invalidateQueries(['tasks', 'project', projectId]);
        }}
      />
    </div>
  );
};

const TaskRow = ({ task, isSelected, onSelect, onView, onConvertToIssue }) => {
  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-primary-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-gray-300"
        />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`badge ${
          task.type === 'issue' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {task.type === 'issue' ? '🐛 Issue' : '📋 Task'}
        </span>
      </td>
      
      <td className="px-6 py-4">
        <div className="max-w-xs">
          <button
            onClick={onView}
            className="text-sm font-medium text-gray-900 hover:text-primary-600 text-left"
          >
            {truncateText(task.title, 50)}
          </button>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1">
              {truncateText(task.description, 80)}
            </p>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`badge ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`badge ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {task.assignee_names && task.assignee_names.length > 0 ? (
          <div className="flex -space-x-1">
            {task.assignee_names.slice(0, 3).map((name, idx) => (
              <div
                key={idx}
                className="h-6 w-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-700"
                title={name}
              >
                {name.split(' ').map(n => n[0]).join('')}
              </div>
            ))}
            {task.assignee_names.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                +{task.assignee_names.length - 3}
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">Unassigned</span>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {task.due_date ? (
          <span className={new Date(task.due_date) < new Date() ? 'text-red-600' : ''}>
            {formatDate(task.due_date)}
          </span>
        ) : (
          '-'
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(task.created_at)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="p-1 rounded-full text-gray-400 hover:text-gray-600">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Menu.Button>
          <Menu.Items className="dropdown-menu">
            <Menu.Item>
              <button onClick={onView} className="dropdown-item">
                View Details
              </button>
            </Menu.Item>
            {task.type === 'task' && (
              <Menu.Item>
                <button onClick={onConvertToIssue} className="dropdown-item">
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Convert to Issue
                </button>
              </Menu.Item>
            )}
          </Menu.Items>
        </Menu>
      </td>
    </tr>
  );
};

export default ListView;
