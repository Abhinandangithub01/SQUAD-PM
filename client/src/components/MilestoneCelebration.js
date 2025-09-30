import React, { useState, useEffect } from 'react';
import {
  TrophyIcon,
  SparklesIcon,
  XMarkIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  UsersIcon,
  StarIcon,
  FireIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import confetti from 'canvas-confetti';

const MilestoneCelebration = ({ milestone, isVisible, onClose }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showContributions, setShowContributions] = useState(false);

  // Generate mock user contributions (in real app, this would come from props or API)
  const getUserContributions = (milestone) => {
    const contributors = [
      {
        id: 1,
        name: 'John Doe',
        avatar: 'JD',
        tasksCompleted: 8,
        hoursWorked: 32,
        contribution: 35,
        role: 'Lead Developer',
        achievements: ['🚀 Most Tasks', '⚡ Fast Delivery'],
        color: 'bg-blue-500'
      },
      {
        id: 2,
        name: 'Sarah Wilson',
        avatar: 'SW',
        tasksCompleted: 6,
        hoursWorked: 28,
        contribution: 30,
        role: 'UI/UX Designer',
        achievements: ['🎨 Best Design', '💡 Creative Solutions'],
        color: 'bg-purple-500'
      },
      {
        id: 3,
        name: 'Mike Johnson',
        avatar: 'MJ',
        tasksCompleted: 4,
        hoursWorked: 24,
        contribution: 25,
        role: 'Backend Developer',
        achievements: ['🔧 Problem Solver'],
        color: 'bg-green-500'
      },
      {
        id: 4,
        name: 'Emily Chen',
        avatar: 'EC',
        tasksCompleted: 2,
        hoursWorked: 16,
        contribution: 10,
        role: 'QA Tester',
        achievements: ['🐛 Bug Hunter'],
        color: 'bg-orange-500'
      }
    ];
    
    return contributors.sort((a, b) => b.contribution - a.contribution);
  };

  const contributions = getUserContributions(milestone);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      
      // Trigger confetti animation
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

      (function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getCelebrationMessage = (milestone) => {
    const messages = [
      `🎉 Congratulations! You've completed "${milestone.title}"!`,
      `🌟 Amazing work! "${milestone.title}" is now complete!`,
      `🚀 Milestone achieved! "${milestone.title}" has been completed!`,
      `✨ Fantastic! You've successfully finished "${milestone.title}"!`,
      `🎯 Goal reached! "${milestone.title}" is done!`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getRandomEmoji = () => {
    const emojis = ['🎉', '🎊', '🥳', '🌟', '✨', '🚀', '🎯', '🏆', '💫', '🎈'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-500 ${
        showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-2xl p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <TrophyIcon className="h-16 w-16 text-yellow-300 animate-bounce" />
                <SparklesIcon className="h-6 w-6 text-yellow-200 absolute -top-1 -right-1 animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Milestone Completed!</h2>
            <p className="text-primary-100 opacity-90">
              {getCelebrationMessage(milestone)}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Milestone Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                {milestone.description && (
                  <p className="text-gray-600 text-sm mb-3">{milestone.description}</p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {milestone.due_date && (
                    <div className="flex items-center space-x-1">
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>Due: {new Date(milestone.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {milestone.team_members && (
                    <div className="flex items-center space-x-1">
                      <UsersIcon className="h-4 w-4" />
                      <span>{milestone.team_members} members</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Achievement Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {milestone.completed_tasks || 0}
              </div>
              <div className="text-sm text-gray-500">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {milestone.progress || 100}%
              </div>
              <div className="text-sm text-gray-500">Progress</div>
            </div>
          </div>

          {/* Team Contributions Toggle */}
          <div className="mb-6">
            <button
              onClick={() => setShowContributions(!showContributions)}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Team Contributions</span>
              </div>
              <div className="text-sm text-gray-600">
                {showContributions ? 'Hide' : 'Show'} Details
              </div>
            </button>
          </div>

          {/* User Contributions Section */}
          {showContributions && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  Individual Contributions
                </h4>
                <div className="text-xs text-gray-500">
                  {contributions.length} contributors
                </div>
              </div>

              <div className="space-y-3">
                {contributions.map((contributor, index) => (
                  <div key={contributor.id} className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {/* Rank Badge */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full ${contributor.color} flex items-center justify-center text-white text-sm font-medium`}>
                          {contributor.avatar}
                        </div>
                        
                        {/* User Info */}
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{contributor.name}</div>
                          <div className="text-xs text-gray-500">{contributor.role}</div>
                        </div>
                      </div>
                      
                      {/* Contribution Percentage */}
                      <div className="text-right">
                        <div className="font-bold text-primary-600">{contributor.contribution}%</div>
                        <div className="text-xs text-gray-500">contribution</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${contributor.contribution}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <div className="flex items-center space-x-4">
                        <span>✅ {contributor.tasksCompleted} tasks</span>
                        <span>⏰ {contributor.hoursWorked}h worked</span>
                      </div>
                    </div>

                    {/* Achievements */}
                    {contributor.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {contributor.achievements.map((achievement, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800"
                          >
                            {achievement}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Team Stats Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-lg text-gray-900">
                      {contributions.reduce((sum, c) => sum + c.tasksCompleted, 0)}
                    </div>
                    <div className="text-xs text-gray-500">Total Tasks</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-900">
                      {contributions.reduce((sum, c) => sum + c.hoursWorked, 0)}h
                    </div>
                    <div className="text-xs text-gray-500">Total Hours</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-900">
                      {contributions.length}
                    </div>
                    <div className="text-xs text-gray-500">Team Members</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Celebration Message */}
          <div className="text-center bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 mb-6">
            <div className="text-3xl mb-2">{getRandomEmoji()}</div>
            <p className="text-gray-700 font-medium">
              Great job! Your hard work has paid off.
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Keep up the momentum and tackle the next challenge!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Continue Working
            </button>
            <button
              onClick={() => {
                // Share achievement (could integrate with social media)
                navigator.clipboard?.writeText(`🎉 Just completed milestone: ${milestone.title}!`);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors font-medium"
            >
              Share Achievement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneCelebration;
