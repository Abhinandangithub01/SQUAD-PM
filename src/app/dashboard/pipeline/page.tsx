'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PipelineStages from '@/components/features/PipelineStages';
import { SearchIcon, FilterIcon, DownloadIcon, PlusIcon } from 'lucide-react';

export default function PipelinePage() {
  const [activeStage, setActiveStage] = useState('prospect');

  // Sample data
  const stages = [
    { id: 'prospect', label: 'Prospect', icon: require('lucide-react').UserIcon, count: 12, color: 'blue' },
    { id: 'applied', label: 'Applied', icon: require('lucide-react').FileTextIcon, count: 8, color: 'purple' },
    { id: 'screening', label: 'Screening', icon: require('lucide-react').SearchIcon, count: 5, color: 'yellow' },
    { id: 'interview', label: 'Interview', icon: require('lucide-react').VideoIcon, count: 3, color: 'orange' },
    { id: 'offered', label: 'Offered', icon: require('lucide-react').CheckCircleIcon, count: 2, color: 'green' },
    { id: 'onboarding', label: 'Onboarding', icon: require('lucide-react').UserCheckIcon, count: 1, color: 'teal' },
    { id: 'hired', label: 'Hired', icon: require('lucide-react').CheckCircleIcon, count: 15, color: 'emerald' },
    { id: 'rejected', label: 'Rejected', icon: require('lucide-react').XCircleIcon, count: 4, color: 'red' },
  ];

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage and track your recruitment pipeline
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <FilterIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <DownloadIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                <PlusIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Add Candidate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline Stages */}
        <PipelineStages 
          stages={stages} 
          activeStage={activeStage}
          onStageChange={setActiveStage}
        />

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No candidates in {stages.find(s => s.id === activeStage)?.label}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by adding candidates to your pipeline
              </p>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Add Candidate
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
