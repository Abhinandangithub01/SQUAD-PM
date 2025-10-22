'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ModernKanban from '@/components/features/ModernKanban';
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
} from 'lucide-react';

type TabType = 'overview' | 'tasks' | 'members' | 'milestones';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    loadProject();
    loadTasks();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const { data, error } = await projectService.get(projectId);
      
      if (error) {
        toast.error(error);
        router.push('/dashboard/projects');
        return;
      }

      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const { data } = await taskService.getByProject(projectId);
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await projectService.delete(projectId);
      
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
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p>Project not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

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
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: project.color || '#3B82F6' }}
              >
                <LayoutGridIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 mt-1">{project.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {tasks.length} tasks • {completionRate}% complete
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Edit2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2Icon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={BarChart3Icon}
              label="Overview"
            />
            <TabButton
              active={activeTab === 'tasks'}
              onClick={() => setActiveTab('tasks')}
              icon={CheckSquareIcon}
              label="Tasks"
              count={tasks.length}
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
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'overview' && (
            <OverviewTab
              project={project}
              tasks={tasks}
              completionRate={completionRate}
            />
          )}

          {activeTab === 'tasks' && (
            <ModernKanban projectId={projectId} />
          )}

          {activeTab === 'members' && (
            <ProjectMembers projectId={projectId} />
          )}

          {activeTab === 'milestones' && (
            <MilestonesTab projectId={projectId} tasks={tasks} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs ${
          active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
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
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Progress</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Overall Completion</span>
          <span className="text-2xl font-bold text-gray-900">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
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
  const [milestones, setMilestones] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Milestones</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Milestone
        </button>
      </div>

      {milestones.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <TargetIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Milestones Yet</h3>
          <p className="text-gray-600 mb-4">
            Create milestones to track major project goals and deadlines
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Milestone
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone: any) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateMilestoneModal
          projectId={projectId}
          tasks={tasks}
          onClose={() => setShowCreateModal(false)}
          onCreate={(milestone) => {
            setMilestones([...milestones, milestone]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function MilestoneCard({ milestone }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{milestone.name}</h3>
          <p className="text-gray-600 mt-1">{milestone.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-sm text-gray-500">
              Due: {new Date(milestone.dueDate).toLocaleDateString()}
            </span>
            <span className="text-sm text-gray-500">
              {milestone.tasks.length} tasks
            </span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          milestone.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {milestone.completed ? 'Completed' : 'In Progress'}
        </span>
      </div>
    </div>
  );
}

function CreateMilestoneModal({ projectId, tasks, onClose, onCreate }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    selectedTasks: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      id: Date.now().toString(),
      projectId,
      completed: false,
      tasks: formData.selectedTasks,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Milestone</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Milestone Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tasks (Optional)
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-500">No tasks available</p>
              ) : (
                tasks.map((task: any) => (
                  <label key={task.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedTasks.includes(task.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            selectedTasks: [...formData.selectedTasks, task.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            selectedTasks: formData.selectedTasks.filter(id => id !== task.id),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-900">{task.title}</span>
                  </label>
                ))
              )}
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
              Create Milestone
            </button>
          </div>
        </form>
      </div>
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

function getStatusColor(status: string) {
  const colors = {
    ACTIVE: 'bg-green-100 text-green-800',
    ON_HOLD: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  };
  return colors[status as keyof typeof colors] || colors.ACTIVE;
}
