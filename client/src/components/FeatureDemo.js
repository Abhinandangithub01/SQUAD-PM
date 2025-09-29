import React, { useState } from 'react';
import {
  SwatchIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  PlayIcon,
  StopIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useTimeTracking } from '../contexts/TimeTrackingContext';
import TaskTimer from './TaskTimer';
import EffortEstimation from './EffortEstimation';
import MilestoneCelebration from './MilestoneCelebration';
import toast from 'react-hot-toast';

const FeatureDemo = () => {
  const { currentTheme, themes, changeTheme } = useTheme();
  const { activeTimer, formatDuration, getActiveTimerDuration } = useTimeTracking();
  const [showCelebration, setShowCelebration] = useState(false);
  const [demoTask, setDemoTask] = useState({
    id: 'demo-task-1',
    title: 'Demo Task for Testing',
    description: 'This is a demo task to test all features',
    story_points: 5,
    estimated_hours: 3,
    complexity: 'medium',
    priority: 'high',
    project_id: 'demo-project'
  });

  const demoMilestone = {
    id: 'demo-milestone',
    title: 'Feature Demo Complete!',
    description: 'Successfully tested all 4 advanced features',
    completed_tasks: 10,
    progress: 100,
    team_members: 3,
  };

  const handleTaskUpdate = (updatedTask) => {
    setDemoTask(updatedTask);
    toast.success('Demo task updated!');
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🚀 Feature Demo Dashboard
        </h1>
        <p className="text-gray-600">
          Test all 4 advanced features in one place
        </p>
      </div>

      {/* Feature 1: Theme System */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <SwatchIcon className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            1. 🎨 Theme System
          </h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          Current theme: <span className="font-semibold">{themes[currentTheme].name}</span>
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => {
                changeTheme(key);
                toast.success(`Switched to ${theme.name}!`);
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                currentTheme === key
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex space-x-1 mb-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: theme.primary[500] }}
                />
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: theme.accent }}
                />
              </div>
              <p className="text-sm font-medium">{theme.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Feature 2: Time Tracking */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <ClockIcon className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            2. ⏰ Time Tracking System
          </h2>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Demo Task</h3>
          <p className="text-gray-600 text-sm mb-3">{demoTask.title}</p>
          
          <div className="flex items-center justify-between">
            <TaskTimer task={demoTask} size="lg" showStats={true} />
            
            {activeTimer?.taskId === demoTask.id && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Timer Active</p>
                <p className="text-lg font-mono font-bold text-primary-600">
                  {formatDuration(getActiveTimerDuration())}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          💡 <strong>Test:</strong> Click play to start timer, stop to log time. Timer persists across page refreshes!
        </div>
      </div>

      {/* Feature 3: Milestone Celebrations */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <TrophyIcon className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            3. 🎊 Milestone Celebrations
          </h2>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => setShowCelebration(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-medium rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            🏆 Trigger Celebration!
          </button>
          
          <p className="text-sm text-gray-600 mt-3">
            💡 <strong>Test:</strong> Click to see animated celebration with confetti!
          </p>
        </div>
      </div>

      {/* Feature 4: Effort Estimation */}
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <ChartBarIcon className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            4. 📊 Task Effort Estimation
          </h2>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Demo Task Estimation</h3>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-gray-900">{demoTask.title}</p>
              <p className="text-sm text-gray-600">{demoTask.description}</p>
            </div>
            
            <EffortEstimation 
              task={demoTask}
              size="lg"
              onUpdate={handleTaskUpdate}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Story Points:</span>
              <span className="ml-2 font-medium">{demoTask.story_points || 'Not set'}</span>
            </div>
            <div>
              <span className="text-gray-500">Est. Hours:</span>
              <span className="ml-2 font-medium">{demoTask.estimated_hours || 'Not set'}</span>
            </div>
            <div>
              <span className="text-gray-500">Complexity:</span>
              <span className="ml-2 font-medium capitalize">{demoTask.complexity || 'Not set'}</span>
            </div>
            <div>
              <span className="text-gray-500">Priority:</span>
              <span className="ml-2 font-medium capitalize">{demoTask.priority || 'Not set'}</span>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mt-3">
          💡 <strong>Test:</strong> Click "Estimate" to set story points, hours, complexity, and priority!
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
        <h2 className="text-xl font-semibold text-primary-900 mb-4">
          ✅ Feature Status Summary
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-primary-800">🎨 Theme System - Active</span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${activeTimer ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-primary-800">⏰ Time Tracking - {activeTimer ? 'Running' : 'Ready'}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-primary-800">🎊 Celebrations - Ready</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-primary-800">📊 Estimation - Configured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Celebration Modal */}
      <MilestoneCelebration
        milestone={demoMilestone}
        isVisible={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default FeatureDemo;
