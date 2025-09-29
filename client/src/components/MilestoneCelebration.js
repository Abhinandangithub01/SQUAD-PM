import React, { useState, useEffect } from 'react';
import {
  TrophyIcon,
  SparklesIcon,
  XMarkIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import confetti from 'canvas-confetti';

const MilestoneCelebration = ({ milestone, isVisible, onClose }) => {
  const [showAnimation, setShowAnimation] = useState(false);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-500 ${
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
