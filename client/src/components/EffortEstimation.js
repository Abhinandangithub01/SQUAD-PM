import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const EffortEstimation = ({ task, onUpdate, size = 'md' }) => {
  const [showEstimationModal, setShowEstimationModal] = useState(false);
  const [estimation, setEstimation] = useState({
    storyPoints: task?.story_points || 0,
    estimatedHours: task?.estimated_hours || 0,
    complexity: task?.complexity || 'medium',
    priority: task?.priority || 'medium',
  });

  // Fibonacci sequence for story points (common in agile)
  const storyPointOptions = [0, 1, 2, 3, 5, 8, 13, 21, 34];
  
  const complexityOptions = [
    { value: 'low', label: 'Low', color: 'green', description: 'Simple, straightforward task' },
    { value: 'medium', label: 'Medium', color: 'yellow', description: 'Moderate complexity, some challenges' },
    { value: 'high', label: 'High', color: 'red', description: 'Complex, requires significant effort' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'blue' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' },
  ];

  const getComplexityColor = (complexity) => {
    const option = complexityOptions.find(opt => opt.value === complexity);
    return option?.color || 'gray';
  };

  const getPriorityColor = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option?.color || 'gray';
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        ...task,
        story_points: estimation.storyPoints,
        estimated_hours: estimation.estimatedHours,
        complexity: estimation.complexity,
        priority: estimation.priority,
      });
    }
    setShowEstimationModal(false);
  };

  const getEstimationSummary = () => {
    if (!task?.story_points && !task?.estimated_hours) {
      return 'Not estimated';
    }
    
    const parts = [];
    if (task.story_points) parts.push(`${task.story_points} SP`);
    if (task.estimated_hours) parts.push(`${task.estimated_hours}h`);
    return parts.join(' • ');
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <>
      {/* Estimation Display/Trigger */}
      <div 
        className={`flex items-center space-x-2 cursor-pointer ${sizeClasses[size]}`}
        onClick={() => setShowEstimationModal(true)}
      >
        {task?.story_points > 0 && (
          <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            <ScaleIcon className="h-3 w-3" />
            <span className="font-medium">{task.story_points}</span>
          </div>
        )}
        
        {task?.estimated_hours > 0 && (
          <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
            <ClockIcon className="h-3 w-3" />
            <span className="font-medium">{task.estimated_hours}h</span>
          </div>
        )}

        {task?.complexity && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium bg-${getComplexityColor(task.complexity)}-100 text-${getComplexityColor(task.complexity)}-800`}>
            {task.complexity}
          </div>
        )}

        {(!task?.story_points && !task?.estimated_hours) && (
          <button className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
            <ChartBarIcon className="h-4 w-4" />
            <span>Estimate</span>
          </button>
        )}
      </div>

      {/* Estimation Modal */}
      {showEstimationModal && createPortal(
        <div 
          className="modal-overlay bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={() => setShowEstimationModal(false)}
        >
          <div 
            className="modal-content bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <ChartBarIcon className="h-6 w-6 mr-2 text-primary-600" />
                Task Estimation
              </h2>
              <button
                onClick={() => setShowEstimationModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Task Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-1">{task?.title}</h3>
                {task?.description && (
                  <p className="text-gray-600 text-sm">{task.description}</p>
                )}
              </div>

              {/* Story Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <ScaleIcon className="h-4 w-4 inline mr-2" />
                  Story Points
                  <span className="text-gray-500 font-normal ml-2">(Fibonacci sequence)</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {storyPointOptions.map((points) => (
                    <button
                      key={points}
                      onClick={() => setEstimation(prev => ({ ...prev, storyPoints: points }))}
                      className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                        estimation.storyPoints === points
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {points}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-start space-x-2 text-xs text-gray-500">
                  <InformationCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p>Story points represent relative effort/complexity. Use Fibonacci sequence for better estimation accuracy.</p>
                </div>
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <ClockIcon className="h-4 w-4 inline mr-2" />
                  Estimated Hours
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[0.5, 1, 2, 4, 8, 16, 24, 40].map((hours) => (
                    <button
                      key={hours}
                      onClick={() => setEstimation(prev => ({ ...prev, estimatedHours: hours }))}
                      className={`p-2 rounded-lg border-2 font-medium transition-colors ${
                        estimation.estimatedHours === hours
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="0.5"
                  value={estimation.estimatedHours}
                  onChange={(e) => setEstimation(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Custom hours..."
                />
              </div>

              {/* Complexity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Complexity Level
                </label>
                <div className="space-y-2">
                  {complexityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setEstimation(prev => ({ ...prev, complexity: option.value }))}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                        estimation.complexity === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-600">
                            {option.description}
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          option.color === 'green' ? 'bg-green-500' :
                          option.color === 'yellow' ? 'bg-yellow-500' :
                          option.color === 'red' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Priority Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setEstimation(prev => ({ ...prev, priority: option.value }))}
                      className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                        estimation.priority === option.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimation Summary */}
              <div className="bg-primary-50 rounded-lg p-4">
                <h4 className="font-medium text-primary-900 mb-2">Estimation Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-primary-700">Story Points:</span>
                    <span className="font-medium ml-2">{estimation.storyPoints || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-primary-700">Estimated Hours:</span>
                    <span className="font-medium ml-2">{estimation.estimatedHours || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-primary-700">Complexity:</span>
                    <span className="font-medium ml-2 capitalize">{estimation.complexity}</span>
                  </div>
                  <div>
                    <span className="text-primary-700">Priority:</span>
                    <span className="font-medium ml-2 capitalize">{estimation.priority}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEstimationModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Save Estimation
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default EffortEstimation;
