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

  // Custom achievement icons
  const getAchievementIcon = (achievement) => {
    const iconMap = {
      'Most Tasks': (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
        </svg>
      ),
      'Fast Delivery': (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,1L15.5,6L21,6.5L17.5,11L18.5,17L13,14L7.5,17L8.5,11L5,6.5L10.5,6L13,1Z"/>
        </svg>
      ),
      'Best Design': (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
        </svg>
      ),
      'Creative Solutions': (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z"/>
        </svg>
      ),
      'Problem Solver': (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z"/>
        </svg>
      ),
      'Bug Hunter': (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,12H10V10H14M14,16H10V14H14M20,8H17.19C16.74,7.22 16.12,6.55 15.37,6.04L17,4.41L15.59,3L13.42,5.17C12.96,5.06 12.5,5 12,5C11.5,5 11.04,5.06 10.59,5.17L8.41,3L7,4.41L8.62,6.04C7.88,6.55 7.26,7.22 6.81,8H4V10H6.09C6.04,10.33 6,10.66 6,11V12H4V14H6V15C6,15.34 6.04,15.67 6.09,16H4V18H6.81C7.85,19.79 9.78,21 12,21C14.22,21 16.15,19.79 17.19,18H20V16H17.91C17.96,15.67 18,15.34 18,15V14H20V12H18V11C18,10.66 17.96,10.33 17.91,10H20V8Z"/>
        </svg>
      )
    };
    return iconMap[achievement] || (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2Z"/>
      </svg>
    );
  };

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
        achievements: ['Most Tasks', 'Fast Delivery'],
        color: 'bg-blue-500',
        customIcon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L13.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
          </svg>
        )
      },
      {
        id: 2,
        name: 'Sarah Wilson',
        avatar: 'SW',
        tasksCompleted: 6,
        hoursWorked: 28,
        contribution: 30,
        role: 'UI/UX Designer',
        achievements: ['Best Design', 'Creative Solutions'],
        color: 'bg-purple-500',
        customIcon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
          </svg>
        )
      },
      {
        id: 3,
        name: 'Mike Johnson',
        avatar: 'MJ',
        tasksCompleted: 4,
        hoursWorked: 24,
        contribution: 25,
        role: 'Backend Developer',
        achievements: ['Problem Solver'],
        color: 'bg-green-500',
        customIcon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z"/>
          </svg>
        )
      },
      {
        id: 4,
        name: 'Emily Chen',
        avatar: 'EC',
        tasksCompleted: 2,
        hoursWorked: 16,
        contribution: 10,
        role: 'QA Tester',
        achievements: ['Bug Hunter'],
        color: 'bg-orange-500',
        customIcon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,12H10V10H14M14,16H10V14H14M20,8H17.19C16.74,7.22 16.12,6.55 15.37,6.04L17,4.41L15.59,3L13.42,5.17C12.96,5.06 12.5,5 12,5C11.5,5 11.04,5.06 10.59,5.17L8.41,3L7,4.41L8.62,6.04C7.88,6.55 7.26,7.22 6.81,8H4V10H6.09C6.04,10.33 6,10.66 6,11V12H4V14H6V15C6,15.34 6.04,15.67 6.09,16H4V18H6.81C7.85,19.79 9.78,21 12,21C14.22,21 16.15,19.79 17.19,18H20V16H17.91C17.96,15.67 18,15.34 18,15V14H20V12H18V11C18,10.66 17.96,10.33 17.91,10H20V8Z"/>
          </svg>
        )
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
                        
                        {/* Avatar with Custom Icon */}
                        <div className={`w-8 h-8 rounded-full ${contributor.color} flex items-center justify-center text-white relative`}>
                          <div className="text-xs font-medium">{contributor.avatar}</div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <div className="text-gray-600 scale-75">
                              {contributor.customIcon}
                            </div>
                          </div>
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
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                          </svg>
                          {contributor.tasksCompleted} tasks
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                          </svg>
                          {contributor.hoursWorked}h worked
                        </span>
                      </div>
                    </div>

                    {/* Achievements */}
                    {contributor.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {contributor.achievements.map((achievement, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200"
                          >
                            <span className="mr-1 text-yellow-600">
                              {getAchievementIcon(achievement)}
                            </span>
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
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mb-2">
                      <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                      </svg>
                    </div>
                    <div className="font-bold text-lg text-gray-900">
                      {contributions.reduce((sum, c) => sum + c.tasksCompleted, 0)}
                    </div>
                    <div className="text-xs text-gray-500">Total Tasks</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mb-2">
                      <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                      </svg>
                    </div>
                    <div className="font-bold text-lg text-gray-900">
                      {contributions.reduce((sum, c) => sum + c.hoursWorked, 0)}h
                    </div>
                    <div className="text-xs text-gray-500">Total Hours</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mb-2">
                      <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16,4C16.88,4 17.67,4.84 17.67,5.75S16.88,7.5 16,7.5C15.12,7.5 14.33,6.66 14.33,5.75S15.12,4 16,4M8.5,4C9.38,4 10.17,4.84 10.17,5.75S9.38,7.5 8.5,7.5C7.62,7.5 6.83,6.66 6.83,5.75S7.62,4 8.5,4M12.25,4C13.13,4 13.92,4.84 13.92,5.75S13.13,7.5 12.25,7.5C11.37,7.5 10.58,6.66 10.58,5.75S11.37,4 12.25,4M16,9.5C16.88,9.5 17.67,10.34 17.67,11.25S16.88,13 16,13C15.12,13 14.33,12.16 14.33,11.25S15.12,9.5 16,9.5M8.5,9.5C9.38,9.5 10.17,10.34 10.17,11.25S9.38,13 8.5,13C7.62,13 6.83,12.16 6.83,11.25S7.62,9.5 8.5,9.5M12.25,9.5C13.13,9.5 13.92,10.34 13.92,11.25S13.13,13 12.25,13C11.37,13 10.58,12.16 10.58,11.25S11.37,9.5 12.25,9.5M16,15C16.88,15 17.67,15.84 17.67,16.75S16.88,18.5 16,18.5C15.12,18.5 14.33,17.66 14.33,16.75S15.12,15 16,15M8.5,15C9.38,15 10.17,15.84 10.17,16.75S9.38,18.5 8.5,18.5C7.62,18.5 6.83,17.66 6.83,16.75S7.62,15 8.5,15M12.25,15C13.13,15 13.92,15.84 13.92,16.75S13.13,18.5 12.25,18.5C11.37,18.5 10.58,17.66 10.58,16.75S11.37,15 12.25,15Z"/>
                      </svg>
                    </div>
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
