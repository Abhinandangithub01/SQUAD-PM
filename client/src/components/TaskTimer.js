import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useTimeTracking } from '../contexts/TimeTrackingContext';
import toast from 'react-hot-toast';

const TaskTimer = ({ task, size = 'md', showStats = true }) => {
  const {
    activeTimer,
    startTimer,
    stopTimer,
    pauseTimer,
    getActiveTimerDuration,
    formatDuration,
    getTaskTotalTime,
  } = useTimeTracking();

  const [currentDuration, setCurrentDuration] = useState(0);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [stopDescription, setStopDescription] = useState('');

  const isActiveForThisTask = activeTimer?.taskId === task.id;
  const taskTotalTime = getTaskTotalTime(task.id);

  // Update timer display every second
  useEffect(() => {
    if (isActiveForThisTask) {
      const interval = setInterval(() => {
        setCurrentDuration(getActiveTimerDuration());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isActiveForThisTask, getActiveTimerDuration]);

  const handleStart = () => {
    const success = startTimer(task.id, task.title, task.project_id);
    if (success) {
      setCurrentDuration(0);
    }
  };

  const handleStop = () => {
    if (currentDuration < 60) {
      // If less than 1 minute, stop immediately
      stopTimer(stopDescription);
      setShowStopConfirm(false);
      setStopDescription('');
      setCurrentDuration(0);
    } else {
      // Show confirmation dialog for longer sessions
      setShowStopConfirm(true);
    }
  };

  const confirmStop = () => {
    stopTimer(stopDescription);
    setShowStopConfirm(false);
    setStopDescription('');
    setCurrentDuration(0);
  };

  const handlePause = () => {
    pauseTimer();
    setCurrentDuration(0);
  };

  const sizeClasses = {
    sm: {
      button: 'p-1',
      icon: 'h-3 w-3',
      text: 'text-xs',
    },
    md: {
      button: 'p-2',
      icon: 'h-4 w-4',
      text: 'text-sm',
    },
    lg: {
      button: 'p-3',
      icon: 'h-5 w-5',
      text: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex items-center space-x-2">
      {/* Timer Controls */}
      <div className="flex items-center space-x-1">
        {!isActiveForThisTask ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStart();
            }}
            disabled={!!activeTimer}
            className={`${classes.button} ${
              activeTimer && !isActiveForThisTask
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
            } rounded-lg transition-colors`}
            title={activeTimer && !isActiveForThisTask ? 'Stop current timer first' : 'Start timer'}
          >
            <PlayIcon className={classes.icon} />
          </button>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePause();
              }}
              className={`${classes.button} text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors`}
              title="Pause timer"
            >
              <PauseIcon className={classes.icon} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStop();
              }}
              className={`${classes.button} text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors`}
              title="Stop timer"
            >
              <StopIcon className={classes.icon} />
            </button>
          </>
        )}
      </div>

      {/* Timer Display */}
      {isActiveForThisTask && (
        <div className={`flex items-center space-x-1 ${classes.text} font-mono text-primary-600`}>
          <ClockIcon className={classes.icon} />
          <span>{formatDuration(currentDuration)}</span>
        </div>
      )}

      {/* Total Time Stats */}
      {showStats && taskTotalTime > 0 && (
        <div className={`flex items-center space-x-1 ${classes.text} text-gray-500`}>
          <ChartBarIcon className={classes.icon} />
          <span>{formatDuration(taskTotalTime)}</span>
        </div>
      )}

      {/* Stop Confirmation Modal */}
      {showStopConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Stop Timer
            </h3>
            <p className="text-gray-600 mb-4">
              You've been working for {formatDuration(currentDuration)}. 
              Add a description for this time entry (optional):
            </p>
            <textarea
              value={stopDescription}
              onChange={(e) => setStopDescription(e.target.value)}
              placeholder="What did you work on?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowStopConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStop}
                className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
              >
                Stop Timer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTimer;
