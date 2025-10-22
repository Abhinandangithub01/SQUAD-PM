'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CommentsSection from '@/components/features/CommentsSection';
import AttachmentsSection from '@/components/features/AttachmentsSection';
import TimeTracker from '@/components/features/TimeTracker';
import { taskService } from '@/services/taskService';
import { projectService } from '@/services/projectService';
import { useToast } from '@/contexts/ToastContext';
import {
  ArrowLeftIcon,
  Edit2Icon,
  Trash2Icon,
  CalendarIcon,
  UserIcon,
  FlagIcon,
  ClockIcon,
} from 'lucide-react';

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadTaskData();
  }, [taskId]);

  const loadTaskData = async () => {
    try {
      setLoading(true);

      const taskResult = await taskService.get(taskId);

      if (taskResult.error) {
        toast.error(taskResult.error);
        router.push('/dashboard/tasks');
        return;
      }

      setTask(taskResult.data);

      // Load project if task has projectId
      if (taskResult.data?.projectId) {
        const projectResult = await projectService.get(taskResult.data.projectId);
        if (!projectResult.error) {
          setProject(projectResult.data);
        }
      }
    } catch (error) {
      console.error('Error loading task:', error);
      toast.error('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { data, error } = await taskService.updateStatus(taskId, newStatus as any);

      if (error) {
        toast.error(error);
        return;
      }

      setTask(data);
      toast.success('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await taskService.delete(taskId);

      if (error) {
        toast.error(error);
        return;
      }

      toast.success('Task deleted successfully!');
      router.push('/dashboard/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Task not found</h2>
            <p className="text-gray-600 mb-4">The task you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/dashboard/tasks')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to Tasks
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const priorityColors = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    TODO: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    IN_REVIEW: 'bg-yellow-100 text-yellow-800',
    DONE: 'bg-green-100 text-green-800',
    BLOCKED: 'bg-red-100 text-red-800',
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/tasks')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Tasks
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[task.status]}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
                {project && (
                  <span className="text-sm text-gray-600">
                    in <strong>{project.name}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit2Icon className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2Icon className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description || 'No description provided.'}
              </p>
            </div>

            {/* Comments Section */}
            <CommentsSection taskId={taskId} />

            {/* Attachments Section */}
            <AttachmentsSection taskId={taskId} />

            {/* Time Tracking Section */}
            <TimeTracker taskId={taskId} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FlagIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Priority</p>
                    <p className="text-sm font-medium text-gray-900">{task.priority}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Assigned To</p>
                    <p className="text-sm font-medium text-gray-900">
                      {task.assignedToId || 'Unassigned'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity</h3>
              <div className="text-sm text-gray-500">
                <p>Task created {new Date(task.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
