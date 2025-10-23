'use client';

import { useState } from 'react';
import { 
  UserIcon, 
  FileTextIcon, 
  SearchIcon, 
  VideoIcon, 
  CheckCircleIcon, 
  UserCheckIcon, 
  XCircleIcon 
} from 'lucide-react';

interface Stage {
  id: string;
  label: string;
  icon: any;
  count: number;
  color: string;
}

interface PipelineStagesProps {
  stages?: Stage[];
  activeStage?: string;
  onStageChange?: (stageId: string) => void;
}

const DEFAULT_STAGES: Stage[] = [
  { id: 'prospect', label: 'Prospect', icon: UserIcon, count: 0, color: 'blue' },
  { id: 'applied', label: 'Applied', icon: FileTextIcon, count: 0, color: 'purple' },
  { id: 'screening', label: 'Screening', icon: SearchIcon, count: 0, color: 'yellow' },
  { id: 'interview', label: 'Interview', icon: VideoIcon, count: 0, color: 'orange' },
  { id: 'offered', label: 'Offered', icon: CheckCircleIcon, count: 0, color: 'green' },
  { id: 'onboarding', label: 'Onboarding', icon: UserCheckIcon, count: 0, color: 'teal' },
  { id: 'hired', label: 'Hired', icon: CheckCircleIcon, count: 0, color: 'emerald' },
  { id: 'rejected', label: 'Rejected', icon: XCircleIcon, count: 0, color: 'red' },
];

export default function PipelineStages({ 
  stages = DEFAULT_STAGES, 
  activeStage = 'prospect',
  onStageChange 
}: PipelineStagesProps) {
  const [selected, setSelected] = useState(activeStage);

  const handleStageClick = (stageId: string) => {
    setSelected(stageId);
    onStageChange?.(stageId);
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<string, { active: string; inactive: string; badge: string }> = {
      blue: {
        active: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-500',
        inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
        badge: 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
      },
      purple: {
        active: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-500',
        inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
        badge: 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
      },
      yellow: {
        active: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-500',
        inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
        badge: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200'
      },
      orange: {
        active: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-500',
        inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
        badge: 'bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200'
      },
      green: {
        active: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-500',
        inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
        badge: 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
      },
      teal: {
        active: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-500',
        inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
        badge: 'bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200'
      },
      emerald: {
        active: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-500',
        inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
        badge: 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200'
      },
      red: {
        active: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-500',
        inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
        badge: 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200'
      },
    };

    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {stages.map((stage) => {
            const isActive = selected === stage.id;
            const colorClasses = getColorClasses(stage.color, isActive);
            const Icon = stage.icon;

            return (
              <button
                key={stage.id}
                onClick={() => handleStageClick(stage.id)}
                className={`
                  group relative flex items-center gap-2 px-4 py-2 rounded-lg
                  transition-all duration-200 flex-shrink-0
                  ${isActive 
                    ? `${colorClasses.active} border-b-2 shadow-sm` 
                    : `${colorClasses.inactive} border-b-2 border-transparent`
                  }
                `}
              >
                {/* Icon */}
                <Icon className={`w-4 h-4 ${isActive ? 'opacity-100' : 'opacity-60'}`} />
                
                {/* Label */}
                <span className="text-sm font-medium whitespace-nowrap">
                  {stage.label}
                </span>
                
                {/* Count Badge */}
                <span
                  className={`
                    min-w-[24px] h-5 px-1.5 rounded-full
                    flex items-center justify-center
                    text-xs font-semibold
                    ${isActive ? colorClasses.badge : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}
                  `}
                >
                  {stage.count}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-current rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
