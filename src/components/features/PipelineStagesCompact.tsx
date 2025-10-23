'use client';

import { useState } from 'react';

interface Stage {
  id: string;
  label: string;
  count: number;
  color: string;
}

interface PipelineStagesCompactProps {
  stages?: Stage[];
  activeStage?: string;
  onStageChange?: (stageId: string) => void;
}

const DEFAULT_STAGES: Stage[] = [
  { id: 'prospect', label: 'Prospect', count: 0, color: 'blue' },
  { id: 'applied', label: 'Applied', count: 0, color: 'purple' },
  { id: 'screening', label: 'Screening', count: 0, color: 'yellow' },
  { id: 'interview', label: 'Interview', count: 0, color: 'orange' },
  { id: 'offered', label: 'Offered', count: 0, color: 'green' },
  { id: 'onboarding', label: 'Onboarding', count: 0, color: 'teal' },
  { id: 'hired', label: 'Hired', count: 0, color: 'emerald' },
  { id: 'rejected', label: 'Rejected', count: 0, color: 'red' },
];

export default function PipelineStagesCompact({ 
  stages = DEFAULT_STAGES, 
  activeStage = 'prospect',
  onStageChange 
}: PipelineStagesCompactProps) {
  const [selected, setSelected] = useState(activeStage);

  const handleStageClick = (stageId: string) => {
    setSelected(stageId);
    onStageChange?.(stageId);
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    if (!isActive) {
      return {
        bg: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
        text: 'text-gray-700 dark:text-gray-300',
        badge: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
        border: 'border-transparent'
      };
    }

    const colors: Record<string, any> = {
      blue: {
        bg: 'bg-blue-500 dark:bg-blue-600',
        text: 'text-white',
        badge: 'bg-blue-600 dark:bg-blue-700 text-white',
        border: 'border-blue-600 dark:border-blue-500'
      },
      purple: {
        bg: 'bg-purple-500 dark:bg-purple-600',
        text: 'text-white',
        badge: 'bg-purple-600 dark:bg-purple-700 text-white',
        border: 'border-purple-600 dark:border-purple-500'
      },
      yellow: {
        bg: 'bg-yellow-500 dark:bg-yellow-600',
        text: 'text-white',
        badge: 'bg-yellow-600 dark:bg-yellow-700 text-white',
        border: 'border-yellow-600 dark:border-yellow-500'
      },
      orange: {
        bg: 'bg-orange-500 dark:bg-orange-600',
        text: 'text-white',
        badge: 'bg-orange-600 dark:bg-orange-700 text-white',
        border: 'border-orange-600 dark:border-orange-500'
      },
      green: {
        bg: 'bg-green-500 dark:bg-green-600',
        text: 'text-white',
        badge: 'bg-green-600 dark:bg-green-700 text-white',
        border: 'border-green-600 dark:border-green-500'
      },
      teal: {
        bg: 'bg-teal-500 dark:bg-teal-600',
        text: 'text-white',
        badge: 'bg-teal-600 dark:bg-teal-700 text-white',
        border: 'border-teal-600 dark:border-teal-500'
      },
      emerald: {
        bg: 'bg-emerald-500 dark:bg-emerald-600',
        text: 'text-white',
        badge: 'bg-emerald-600 dark:bg-emerald-700 text-white',
        border: 'border-emerald-600 dark:border-emerald-500'
      },
      red: {
        bg: 'bg-red-500 dark:bg-red-600',
        text: 'text-white',
        badge: 'bg-red-600 dark:bg-red-700 text-white',
        border: 'border-red-600 dark:border-red-500'
      },
    };

    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {stages.map((stage) => {
          const isActive = selected === stage.id;
          const colors = getColorClasses(stage.color, isActive);

          return (
            <button
              key={stage.id}
              onClick={() => handleStageClick(stage.id)}
              className={`
                group relative flex items-center gap-1.5 px-3 py-1.5 rounded-md
                transition-all duration-200 flex-shrink-0 border
                ${colors.bg} ${colors.text} ${colors.border}
              `}
            >
              {/* Label */}
              <span className="text-xs font-semibold whitespace-nowrap">
                {stage.label}
              </span>
              
              {/* Count Badge */}
              <span
                className={`
                  min-w-[20px] h-5 px-1.5 rounded-full
                  flex items-center justify-center
                  text-xs font-bold
                  ${colors.badge}
                `}
              >
                {stage.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
