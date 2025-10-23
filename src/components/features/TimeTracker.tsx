'use client';

import { useState, useEffect } from 'react';
import { timeTrackingService } from '@/services/timeTrackingService';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { PlayIcon, PauseIcon, ClockIcon, PlusIcon, Trash2Icon } from 'lucide-react';

interface TimeTrackerProps {
  taskId: string;
}

export default function TimeTracker({ taskId }: TimeTrackerProps) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    loadTimeEntries();
    checkActiveTimer();
  }, [taskId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeTimer) {
      interval = setInterval(() => {
        const start = new Date(activeTimer.startTime);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const loadTimeEntries = async () => {
    try {
      setLoading(true);
      const { data } = await timeTrackingService.getByTask(taskId);
      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error loading time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveTimer = async () => {
    if (!user?.id) return;

    try {
      const { data } = await timeTrackingService.getActiveTimer(user.id);
      if (data && data.taskId === taskId) {
        setActiveTimer(data);
      }
    } catch (error) {
      console.error('Error checking active timer:', error);
    }
  };

  const handleStartTimer = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to track time');
      return;
    }

    try {
      const { data, error } = await timeTrackingService.startTimer(taskId, user.id);

      if (error) {
        toast.error(error);
        return;
      }

      setActiveTimer(data);
      toast.success('Timer started!');
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimer) return;

    try {
      const { error } = await timeTrackingService.stopTimer(activeTimer.id);

      if (error) {
        toast.error(error);
        return;
      }

      setActiveTimer(null);
      setElapsedTime(0);
      await loadTimeEntries();
      toast.success('Timer stopped!');
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error('Failed to stop timer');
    }
  };

  const handleAddManualEntry = async (duration: number, description: string) => {
    if (!user?.id) return;

    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - duration * 60 * 1000);

      const { error } = await timeTrackingService.createEntry({
        taskId,
        userId: user.id,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        duration,
        description,
        billable: false,
      });

      if (error) {
        toast.error(error);
        return;
      }

      await loadTimeEntries();
      setShowManualEntry(false);
      toast.success('Time entry added!');
    } catch (error) {
      console.error('Error adding time entry:', error);
      toast.error('Failed to add time entry');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      const { error } = await timeTrackingService.delete(entryId);

      if (error) {
        toast.error(error);
        return;
      }

      setTimeEntries(timeEntries.filter(e => e.id !== entryId));
      toast.success('Time entry deleted!');
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast.error('Failed to delete time entry');
    }
  };

  const totalTime = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ClockIcon className="w-5 h-5" />
          Time Tracking
        </h3>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold">{timeTrackingService.formatDuration(totalTime)}</span>
        </div>
      </div>

      {/* Active Timer */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        {activeTimer ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Timer Running</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatElapsedTime(elapsedTime)}
              </p>
            </div>
            <button
              onClick={handleStopTimer}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <PauseIcon className="w-4 h-4" />
              Stop
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">No active timer</p>
            <button
              onClick={handleStartTimer}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlayIcon className="w-4 h-4" />
              Start Timer
            </button>
          </div>
        )}
      </div>

      {/* Manual Entry Button */}
      <button
        onClick={() => setShowManualEntry(true)}
        className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Add Manual Entry
      </button>

      {/* Time Entries List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      ) : timeEntries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No time entries yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {timeEntries.map(entry => (
            <TimeEntryItem
              key={entry.id}
              entry={entry}
              onDelete={() => handleDeleteEntry(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <ManualEntryModal
          onClose={() => setShowManualEntry(false)}
          onSubmit={handleAddManualEntry}
        />
      )}
    </div>
  );
}

function TimeEntryItem({ entry, onDelete }: any) {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900">
            {timeTrackingService.formatDuration(entry.duration || 0)}
          </span>
          {entry.billable && (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
              Billable
            </span>
          )}
        </div>
        {entry.description && (
          <p className="text-sm text-gray-600">{entry.description}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {new Date(entry.startTime).toLocaleString()}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
        title="Delete entry"
      >
        <Trash2Icon className="w-4 h-4" />
      </button>
    </div>
  );
}

function ManualEntryModal({ onClose, onSubmit }: any) {
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durationMinutes = parseInt(duration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      alert('Please enter a valid duration');
      return;
    }
    onSubmit(durationMinutes, description);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Time Entry</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) *
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 60"
              required
              min="1"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="What did you work on?"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
