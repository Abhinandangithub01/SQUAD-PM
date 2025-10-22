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

  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Projects
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: project.color || '#3B82F6' }}
              >
                <LayoutGridIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {tasks.length} tasks • {completionRate}% complete
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Edit2Icon className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2Icon className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-6">
            <TabButton
              active={activeTab === 'tasks'}
              onClick={() => setActiveTab('tasks')}
              icon={CheckSquareIcon}
              label="Tasks"
              count={tasks.length}
            />
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={BarChart3Icon}
              label="Overview"
            />
            <TabButton
              active={activeTab === 'members'}
              onClick={() => setActiveTab('members')}
              icon={UsersIcon}
              label="Members"
            />
            <TabButton
              active={activeTab === 'milestones'}
              onClick={() => setActiveTab('milestones')}
              icon={TargetIcon}
              label="Milestones"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'tasks' && (
            <TrelloKanbanComplete projectId={projectId} />
          )}

          {activeTab === 'overview' && (
            <div className="p-6 overflow-y-auto h-full">
              <OverviewTab
                project={project}
                tasks={tasks}
                completionRate={completionRate}
              />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="p-6 overflow-y-auto h-full">
              <ProjectMembers projectId={projectId} />
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="p-6 overflow-y-auto h-full">
              <MilestonesTab projectId={projectId} tasks={tasks} />
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <EditProjectModal
            formData={editFormData}
            onChange={setEditFormData}
            onSave={handleEdit}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-1 py-2 border-b-2 font-medium transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs ${
          active ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function OverviewTab({ project, tasks, completionRate }: any) {
  const todoTasks = tasks.filter((t: any) => t.status === 'TODO').length;
  const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Tasks" value={tasks.length} color="blue" icon={CheckSquareIcon} />
        <StatCard title="To Do" value={todoTasks} color="gray" icon={CheckSquareIcon} />
        <StatCard title="In Progress" value={inProgressTasks} color="purple" icon={CheckSquareIcon} />
        <StatCard title="Completed" value={completedTasks} color="green" icon={CheckSquareIcon} />
      </div>

      {/* Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Progress</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Overall Completion</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed projectId={project.id} limit={10} />
    </div>
  );
}

function MilestonesTab({ projectId, tasks }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
      <TargetIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Milestones Coming Soon</h3>
      <p className="text-gray-600 dark:text-gray-400">Track major project goals and deadlines</p>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    gray: 'bg-gray-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${colors[color]} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EditProjectModal({ formData, onChange, onSave, onClose }: any) {
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Project</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <XIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => onChange({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg transition-transform ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => onChange({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors = {
    ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    ON_HOLD: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    COMPLETED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    ARCHIVED: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400',
  };
  return colors[status as keyof typeof colors] || colors.ACTIVE;
}
