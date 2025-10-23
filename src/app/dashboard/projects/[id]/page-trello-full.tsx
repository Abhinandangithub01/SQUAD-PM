'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TrelloBoard from '@/components/features/TrelloBoard';
import { projectService } from '@/services/projectService';
import { useToast } from '@/contexts/ToastContext';
import {
  ArrowLeftIcon,
  SettingsIcon,
  UsersIcon,
  StarIcon,
} from 'lucide-react';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const { data, error } = await projectService.get(projectId);

      if (error) {
        toast.error(error);
        return;
      }

      if (data) {
        setProject(data);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">The project you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Trello-style Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            <button className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded transition-colors">
              <StarIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/dashboard/projects/${projectId}/members`)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded transition-colors"
            >
              <UsersIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Members</span>
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded transition-colors">
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Trello Board */}
      <div className="h-[calc(100vh-140px)]">
        <TrelloBoard projectId={projectId} />
      </div>
    </DashboardLayout>
  );
}
