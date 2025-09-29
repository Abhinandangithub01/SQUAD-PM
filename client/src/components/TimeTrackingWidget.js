import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  PlayIcon,
  StopIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useTimeTracking } from '../contexts/TimeTrackingContext';

const TimeTrackingWidget = () => {
  const {
    activeTimer,
    totalTimeToday,
    formatDuration,
    getActiveTimerDuration,
    stopTimer,
    getTodayTimeEntries,
  } = useTimeTracking();

  const [currentDuration, setCurrentDuration] = useState(0);
  const todayEntries = getTodayTimeEntries();

  // Update active timer display
  useEffect(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        setCurrentDuration(getActiveTimerDuration());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeTimer, getActiveTimerDuration]);

  const handleQuickStop = () => {
    stopTimer('Quick stop from dashboard');
  };

  return (
    <div className="bg-white rounded-xl shadow-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
          Time Tracking
        </h3>
      </div>

      {/* Active Timer */}
      {activeTimer ? (
        <div className="bg-primary-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-900 mb-1">
                Currently working on:
              </p>
              <p className="text-primary-700 font-semibold truncate">
                {activeTimer.taskTitle}
              </p>
            </div>
            <button
              onClick={handleQuickStop}
              className="ml-3 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Stop timer"
            >
              <StopIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-mono font-bold text-primary-900">
                {formatDuration(currentDuration)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
          <PlayIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            No active timer. Start timing a task to track your work.
          </p>
        </div>
      )}

      {/* Today's Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Today's Total</span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            {formatDuration(totalTimeToday)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Sessions</span>
          </div>
          <span className="text-lg font-bold text-gray-900">
            {todayEntries.length}
          </span>
        </div>

        {/* Recent Sessions */}
        {todayEntries.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Sessions</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {todayEntries.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate flex-1 mr-2">
                    {entry.taskTitle}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {formatDuration(entry.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button className="flex-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
            View All Entries
          </button>
          <button className="flex-1 text-xs text-gray-600 hover:text-gray-700 font-medium">
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingWidget;
