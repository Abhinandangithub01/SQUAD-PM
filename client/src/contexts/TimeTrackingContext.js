import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const TimeTrackingContext = createContext();

export const TimeTrackingProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [totalTimeToday, setTotalTimeToday] = useState(0);

  // Load active timer and time entries from localStorage
  useEffect(() => {
    if (user) {
      const savedTimer = localStorage.getItem(`activeTimer_${user.id}`);
      const savedEntries = localStorage.getItem(`timeEntries_${user.id}`);
      
      if (savedTimer) {
        try {
          const timer = JSON.parse(savedTimer);
          // Check if timer is still valid (not older than 24 hours)
          const now = new Date();
          const timerStart = new Date(timer.startTime);
          const hoursDiff = (now - timerStart) / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            setActiveTimer(timer);
          } else {
            localStorage.removeItem(`activeTimer_${user.id}`);
          }
        } catch (error) {
          console.error('Error parsing saved timer:', error);
        }
      }
      
      if (savedEntries) {
        try {
          setTimeEntries(JSON.parse(savedEntries));
        } catch (error) {
          console.error('Error parsing saved time entries:', error);
        }
      }
    }
  }, [user]);

  // Calculate total time today
  useEffect(() => {
    const today = new Date().toDateString();
    const todayEntries = timeEntries.filter(entry => 
      new Date(entry.date).toDateString() === today
    );
    const total = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);
    setTotalTimeToday(total);
  }, [timeEntries]);

  // Save to localStorage whenever activeTimer or timeEntries change
  useEffect(() => {
    if (user) {
      if (activeTimer) {
        localStorage.setItem(`activeTimer_${user.id}`, JSON.stringify(activeTimer));
      } else {
        localStorage.removeItem(`activeTimer_${user.id}`);
      }
    }
  }, [activeTimer, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`timeEntries_${user.id}`, JSON.stringify(timeEntries));
    }
  }, [timeEntries, user]);

  const startTimer = (taskId, taskTitle, projectId = null) => {
    if (activeTimer) {
      toast.error('Please stop the current timer before starting a new one');
      return false;
    }

    const timer = {
      id: `timer_${Date.now()}`,
      taskId,
      taskTitle,
      projectId,
      startTime: new Date().toISOString(),
      userId: user.id,
    };

    setActiveTimer(timer);
    toast.success(`Timer started for: ${taskTitle}`);
    return true;
  };

  const stopTimer = (description = '') => {
    if (!activeTimer) {
      toast.error('No active timer to stop');
      return null;
    }

    const endTime = new Date();
    const startTime = new Date(activeTimer.startTime);
    const duration = Math.floor((endTime - startTime) / 1000); // Duration in seconds

    const timeEntry = {
      id: `entry_${Date.now()}`,
      taskId: activeTimer.taskId,
      taskTitle: activeTimer.taskTitle,
      projectId: activeTimer.projectId,
      startTime: activeTimer.startTime,
      endTime: endTime.toISOString(),
      duration,
      description,
      date: new Date().toISOString(),
      userId: user.id,
    };

    setTimeEntries(prev => [timeEntry, ...prev]);
    setActiveTimer(null);

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    toast.success(`Timer stopped. Time logged: ${timeString}`);
    return timeEntry;
  };

  const pauseTimer = () => {
    if (!activeTimer) return false;

    // Stop current timer and create entry
    const entry = stopTimer('Paused session');
    if (entry) {
      toast.success('Timer paused');
    }
    return true;
  };

  const getActiveTimerDuration = () => {
    if (!activeTimer) return 0;
    
    const now = new Date();
    const start = new Date(activeTimer.startTime);
    return now - start; // Return milliseconds
  };

  const formatDuration = (milliseconds) => {
    // Convert milliseconds to seconds
    const totalSeconds = Math.floor(milliseconds / 1000);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTaskTotalTime = (taskId) => {
    return timeEntries
      .filter(entry => entry.taskId === taskId)
      .reduce((total, entry) => total + entry.duration, 0);
  };

  const getProjectTotalTime = (projectId) => {
    return timeEntries
      .filter(entry => entry.projectId === projectId)
      .reduce((total, entry) => total + entry.duration, 0);
  };

  const deleteTimeEntry = (entryId) => {
    setTimeEntries(prev => prev.filter(entry => entry.id !== entryId));
    toast.success('Time entry deleted');
  };

  const updateTimeEntry = (entryId, updates) => {
    setTimeEntries(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, ...updates } : entry
    ));
    toast.success('Time entry updated');
  };

  const getTimeEntriesForTask = (taskId) => {
    return timeEntries.filter(entry => entry.taskId === taskId);
  };

  const getTimeEntriesForProject = (projectId) => {
    return timeEntries.filter(entry => entry.projectId === projectId);
  };

  const getTodayTimeEntries = () => {
    const today = new Date().toDateString();
    return timeEntries.filter(entry => 
      new Date(entry.date).toDateString() === today
    );
  };

  const value = {
    activeTimer,
    timeEntries,
    totalTimeToday,
    startTimer,
    stopTimer,
    pauseTimer,
    getActiveTimerDuration,
    formatDuration,
    getTaskTotalTime,
    getProjectTotalTime,
    deleteTimeEntry,
    updateTimeEntry,
    getTimeEntriesForTask,
    getTimeEntriesForProject,
    getTodayTimeEntries,
  };

  return (
    <TimeTrackingContext.Provider value={value}>
      {children}
    </TimeTrackingContext.Provider>
  );
};

export const useTimeTracking = () => {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
  }
  return context;
};

export default TimeTrackingContext;
