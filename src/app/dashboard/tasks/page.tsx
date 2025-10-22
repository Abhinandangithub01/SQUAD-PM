'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { taskService } from '@/services/taskService';
import { projectService } from '@/services/projectService';
import { PlusIcon, ListIcon, LayoutGridIcon, Edit2Icon, Trash2Icon, MoreVerticalIcon } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const TASK_STATUSES = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-200' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-200' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'bg-yellow-200' },
  { id: 'DONE', label: 'Done', color: 'bg-green-200' },
];

const PRIORITY_COLORS = {
  LOW: 'text-gray-600 bg-gray-100',
  MEDIUM: 'text-blue-600 bg-blue-100',
  HIGH: 'text-orange-600 bg-orange-100',
  URGENT: 'text-red-600 bg-red-100',
};

export default function TasksPage() {
  const { user } = useAuthContext();
  const toast = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksResult, projectsResult] = await Promise.all([
        taskService.list(),
        projectService.list(),
      ]);

      if (tasksResult.error) {
        toast.error(tasksResult.error);
      } else {
        setTasks(tasksResult.data || []);
      }

      if (projectsResult.error) {
        toast.error(projectsResult.error);
      } else {
        setProjects(projectsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (taskData: any) => {
    try {
      const { data, error } = await taskService.create({
        ...taskData,
        createdById: user?.id || '',
      });

      if (error) {
        toast.error(error);
        return;
      }

      setTasks([...tasks, data]);
      setShowCreateModal(false);
      toast.success('Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleUpdate = async (taskData: any) => {
    if (!selectedTask) return;

    try {
      const { data, error } = await taskService.update(selectedTask.id, taskData);

      if (error) {
        toast.error(error);
        return;
      }

      setTasks(tasks.map((t) => (t.id === selectedTask.id ? data : t)));
      setShowEditModal(false);
      setSelectedTask(null);
      toast.success('Task updated successfully!');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;

    try {
      const { error } = await taskService.delete(selectedTask.id);

      if (error) {
        toast.error(error);
        return;
      }

      setTasks(tasks.filter((t) => t.id !== selectedTask.id));
      setShowDeleteModal(false);
      setSelectedTask(null);
      toast.success('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { data, error } = await taskService.updateStatus(taskId, newStatus as any);

      if (error) {
        toast.error(error);
        return;
      }

      setTasks(tasks.map((t) => (t.id === taskId ? data : t)));
      toast.success('Task status updated!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const openEditModal = (task: any) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const openDeleteModal = (task: any) => {
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const tasksByStatus = TASK_STATUSES.reduce((acc, status) => {
    acc[status.id] = tasks.filter((task) => task.status === status.id);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600 mt-1">Manage and track your tasks</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-white rounded-lg shadow">
              <button
                onClick={() => setViewMode('board')}
                className={`p-2 rounded-l-lg ${
                  viewMode === 'board' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutGridIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-lg ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              New Task
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tasks...</p>
          </div>
        ) : viewMode === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TASK_STATUSES.map((status) => (
              <TaskColumn
                key={status.id}
                status={status}
                tasks={tasksByStatus[status.id]}
                projects={projects}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            projects={projects}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />
        )}

        {/* Modals */}
        {showCreateModal && (
          <TaskModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreate}
            projects={projects}
            title="Create New Task"
          />
        )}

        {showEditModal && selectedTask && (
          <TaskModal
            onClose={() => {
              setShowEditModal(false);
              setSelectedTask(null);
            }}
            onSubmit={handleUpdate}
            projects={projects}
            title="Edit Task"
            initialData={selectedTask}
          />
        )}

        {showDeleteModal && selectedTask && (
          <DeleteConfirmModal
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedTask(null);
            }}
            onConfirm={handleDelete}
            taskTitle={selectedTask.title}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function TaskColumn({ status, tasks, projects, onEdit, onDelete, onStatusChange }: any) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{status.label}</h3>
        <span className="text-sm text-gray-500">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No tasks</p>
        ) : (
          tasks.map((task: any) => (
            <TaskCard
              key={task.id}
              task={task}
              projects={projects}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, projects, onEdit, onDelete, onStatusChange }: any) {
  const [showMenu, setShowMenu] = useState(false);
  const project = projects.find((p: any) => p.id === task.projectId);

  return (
    <div className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow relative group">
      {/* Menu Button */}
      <div className="absolute top-2 right-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVerticalIcon className="w-4 h-4 text-gray-600" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            ></div>
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <button
                onClick={() => {
                  onEdit(task);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit2Icon className="w-4 h-4" />
                Edit Task
              </button>
              <button
                onClick={() => {
                  onDelete(task);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2Icon className="w-4 h-4" />
                Delete Task
              </button>
            </div>
          </>
        )}
      </div>

      <Link href={`/dashboard/tasks/${task.id}`}>
        <div className="cursor-pointer">
          <h4 className="font-medium text-gray-900 mb-2 pr-6">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
            {project && (
              <span className="text-xs text-gray-500">{project.name}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

function TaskList({ tasks, projects, onEdit, onDelete }: any) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task: any) => {
            const project = projects.find((p: any) => p.id === task.projectId);
            return (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    <div className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-500 line-clamp-1">{task.description}</div>
                    )}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{project?.name || '-'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(task)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(task)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TaskModal({ onClose, onSubmit, projects, title, initialData }: any) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    projectId: initialData?.projectId || '',
    priority: initialData?.priority || 'MEDIUM',
    status: initialData?.status || 'TODO',
    dueDate: initialData?.dueDate ? initialData.dueDate.split('T')[0] : '',
    assignedToId: initialData?.assignedToId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    if (!formData.projectId) {
      alert('Please select a project');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter task description"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a project</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {initialData && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {initialData ? 'Update' : 'Create'} Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ onClose, onConfirm, taskTitle }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Task</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{taskTitle}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
