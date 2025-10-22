'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TrelloKanbanComplete from '@/components/features/TrelloKanbanComplete';
import ProjectMembers from '@/components/features/ProjectMembers';
import ActivityFeed from '@/components/features/ActivityFeed';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { useToast } from '@/contexts/ToastContext';
import {
  ArrowLeftIcon,
  Edit2Icon,
  Trash2Icon,
  CheckSquareIcon,
  UsersIcon,
  BarChart3Icon,
  TargetIcon,
  LayoutGridIcon,
  XIcon,
  PlusIcon,
} from 'lucide-react';

type TabType = 'tasks' | 'overview' | 'members' | 'milestones';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    status: 'ACTIVE' as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED',
  });

  useEffect(() => {
    loadProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);

      const [projectResult, tasksResult] = await Promise.all([
        projectService.get(projectId),
        taskService.getByProject(projectId),
      ]);

      if (projectResult.error) {
        toast.error(projectResult.error);
        router.push('/dashboard/projects');
        return;
      }

      setProject(projectResult.data);
      setTasks(tasksResult.data || []);
      setEditFormData({
        name: projectResult.data.name,
        description: projectResult.data.description || '',
        color: projectResult.data.color || '#3B82F6',
        status: projectResult.data.status || 'ACTIVE',
      });
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      const { data, error } = await projectService.update(projectId, editFormData);
      
      if (error) {
        toast.error(error);
        return;
      }

      setProject(data);
      setShowEditModal(false);
      toast.success('Project updated successfully!');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

    try {
      const { error} = await projectService.delete(projectId);
      
      if (error) {
        toast.error(error);
        return;
      }

      toast.success('Project deleted successfully!');
      router.push('/dashboard/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-gray-900 dark:text-gray-100">Project not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'TODO').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    done: tasks.filter((t) => t.status === 'DONE').length,
  };

  const completionRate = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Projects
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: project.color || '#3B82F6' }}
              >
                <span className="text-2xl text-white font-bold">
                  {project.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 mt-1">{project.description || 'No description'}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Edit2Icon className="w-4 h-4" />
                Edit
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                <Trash2Icon className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Tasks"
            value={taskStats.total}
            icon={CheckSquareIcon}
            color="blue"
          />
          <StatCard
            title="In Progress"
            value={taskStats.inProgress}
            icon={BarChart3Icon}
            color="purple"
          />
          <StatCard
            title="Completed"
            value={taskStats.done}
            icon={CheckSquareIcon}
            color="green"
          />
          <StatCard
            title="Completion"
            value={`${completionRate}%`}
            icon={BarChart3Icon}
            color="orange"
          />
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Project Progress</h3>
            <span className="text-sm text-gray-600">{completionRate}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
            <button
              onClick={() => router.push(`/dashboard/tasks?project=${projectId}`)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              Add Task
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquareIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No tasks yet. Create your first task!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Project Members */}
        <div className="mb-8">
          <ProjectMembers projectId={projectId} />
        </div>

        {/* Activity Feed */}
        <ActivityFeed projectId={projectId} limit={10} />
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${colors[color]} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task }: any) {
  const statusColors = {
    TODO: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    IN_REVIEW: 'bg-yellow-100 text-yellow-800',
    DONE: 'bg-green-100 text-green-800',
    BLOCKED: 'bg-red-100 text-red-800',
  };

  const priorityColors = {
    LOW: 'text-gray-600',
    MEDIUM: 'text-blue-600',
    HIGH: 'text-orange-600',
    URGENT: 'text-red-600',
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{task.title}</h4>
        {task.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-1">{task.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status]}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors = {
    ACTIVE: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    ON_HOLD: 'bg-yellow-100 text-yellow-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  };
  return colors[status as keyof typeof colors] || colors.ACTIVE;
}
