'use client';

import { useState, useEffect } from 'react';
import { taskService } from '@/services/taskService';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  MoreVerticalIcon,
  CalendarIcon,
  UserIcon,
  FlagIcon,
  LayoutGridIcon,
  ListIcon,
  GanttChartIcon,
} from 'lucide-react';

interface ModernKanbanProps {
  projectId: string;
}

type ViewMode = 'kanban' | 'list' | 'timeline';

const STATUSES = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-100 border-gray-300' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 border-blue-300' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'DONE', label: 'Done', color: 'bg-green-100 border-green-300' },
];

export default function ModernKanban({ projectId }: ModernKanbanProps) {
  const { user } = useAuthContext();
  const toast = useToast();
  const router = useRouter();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('TODO');

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data } = await taskService.getByProject(projectId);
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      if (!user?.id && !user?.email) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error} = await taskService.create({
        ...taskData,
        projectId,
        assigneeId: user.id || user.email,
        status: selectedStatus,
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

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        
        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white shadow' : 'text-gray-600'}`}
              title="Kanban View"
            >
              <LayoutGridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600'}`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded ${viewMode === 'timeline' ? 'bg-white shadow' : 'text-gray-600'}`}
              title="Timeline View"
            >
              <GanttChartIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedStatus('TODO');
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' && (
        <KanbanView
          tasks={tasks}
          statuses={STATUSES}
          getTasksByStatus={getTasksByStatus}
          onTaskClick={(task) => router.push(`/dashboard/tasks/${task.id}`)}
          onAddTask={(status) => {
            setSelectedStatus(status);
            setShowCreateModal(true);
          }}
        />
      )}

      {viewMode === 'list' && (
        <ListView
          tasks={tasks}
          onTaskClick={(task) => router.push(`/dashboard/tasks/${task.id}`)}
        />
      )}

      {viewMode === 'timeline' && (
        <TimelineView tasks={tasks} />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          status={selectedStatus}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
        />
      )}
    </div>
  );
}

function KanbanView({ tasks, statuses, getTasksByStatus, onTaskClick, onAddTask }: any) {
  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-4 h-full pb-4">
        {statuses.map((status: any) => (
          <div key={status.id} className="flex-shrink-0 w-80">
            <div className={`rounded-lg border-2 ${status.color} h-full flex flex-col`}>
              {/* Column Header */}
              <div className="p-4 border-b border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{status.label}</h3>
                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                    {getTasksByStatus(status.id).length}
                  </span>
                </div>
                <button
                  onClick={() => onAddTask(status.id)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-white rounded transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Task
                </button>
              </div>

              {/* Tasks */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {getTasksByStatus(status.id).map((task: any) => (
                  <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, onClick }: any) {
  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700',
  };

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
    >
      <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <CalendarIcon className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

function ListView({ tasks, onTaskClick }: any) {
  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-700',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700',
  };

  const statusColors = {
    TODO: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    IN_REVIEW: 'bg-yellow-100 text-yellow-700',
    DONE: 'bg-green-100 text-green-700',
    BLOCKED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task: any) => (
            <tr
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-6 py-4">
                <div>
                  <div className="font-medium text-gray-900">{task.title}</div>
                  {task.description && (
                    <div className="text-sm text-gray-500 line-clamp-1">{task.description}</div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs rounded-full ${statusColors[task.status]}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimelineView({ tasks }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <GanttChartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Timeline View</h3>
      <p className="text-gray-600">Timeline view coming soon!</p>
      <p className="text-sm text-gray-500 mt-2">
        This will show tasks on a Gantt chart timeline
      </p>
    </div>
  );
}

function CreateTaskModal({ status, onClose, onCreate }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Task</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
