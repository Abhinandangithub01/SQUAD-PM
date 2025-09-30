import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    return saved ? JSON.parse(saved) : getDefaultWidgets();
  });

  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(widgets));
  }, [widgets]);

  // Fetch real-time dashboard data
  const { data: dashboardData, refetch } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard');
      return response.data;
    },
    refetchInterval: refreshInterval,
  });

  // Fetch project statistics
  const { data: projectStats } = useQuery({
    queryKey: ['project-stats'],
    queryFn: async () => {
      const response = await api.get('/projects/stats');
      return response.data;
    },
    refetchInterval: refreshInterval,
  });

  // Fetch task statistics
  const { data: taskStats } = useQuery({
    queryKey: ['task-stats'],
    queryFn: async () => {
      const response = await api.get('/tasks/stats');
      return response.data;
    },
    refetchInterval: refreshInterval,
  });

  // Fetch team statistics
  const { data: teamStats } = useQuery({
    queryKey: ['team-stats'],
    queryFn: async () => {
      const response = await api.get('/users/stats');
      return response.data;
    },
    refetchInterval: refreshInterval,
  });

  // Fetch time tracking data
  const { data: timeData } = useQuery({
    queryKey: ['time-tracking-stats'],
    queryFn: async () => {
      const response = await api.get('/time-tracking/stats');
      return response.data;
    },
    refetchInterval: refreshInterval,
  });

  const addWidget = (widget) => {
    const newWidget = {
      ...widget,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setWidgets([...widgets, newWidget]);
  };

  const updateWidget = (id, updates) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const removeWidget = (id) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const reorderWidgets = (newOrder) => {
    setWidgets(newOrder);
  };

  const resetToDefault = () => {
    setWidgets(getDefaultWidgets());
  };

  const getWidgetData = (widget) => {
    switch (widget.dataSource) {
      case 'projects':
        return projectStats;
      case 'tasks':
        return taskStats;
      case 'team':
        return teamStats;
      case 'time':
        return timeData;
      case 'dashboard':
        return dashboardData;
      default:
        return null;
    }
  };

  const value = {
    widgets,
    addWidget,
    updateWidget,
    removeWidget,
    reorderWidgets,
    resetToDefault,
    getWidgetData,
    dashboardData,
    projectStats,
    taskStats,
    teamStats,
    timeData,
    refreshInterval,
    setRefreshInterval,
    refetch,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// Default widgets configuration
function getDefaultWidgets() {
  return [
    {
      id: '1',
      type: 'stat',
      title: 'Total Projects',
      dataSource: 'projects',
      dataKey: 'total',
      icon: 'folder',
      color: 'blue',
      size: 'small',
    },
    {
      id: '2',
      type: 'stat',
      title: 'Active Tasks',
      dataSource: 'tasks',
      dataKey: 'active',
      icon: 'check',
      color: 'green',
      size: 'small',
    },
    {
      id: '3',
      type: 'stat',
      title: 'Team Members',
      dataSource: 'team',
      dataKey: 'total',
      icon: 'users',
      color: 'purple',
      size: 'small',
    },
    {
      id: '4',
      type: 'stat',
      title: 'Hours Tracked',
      dataSource: 'time',
      dataKey: 'totalHours',
      icon: 'clock',
      color: 'orange',
      size: 'small',
    },
    {
      id: '5',
      type: 'chart',
      title: 'Project Progress',
      dataSource: 'projects',
      chartType: 'bar',
      dataKey: 'progressData',
      size: 'medium',
    },
    {
      id: '6',
      type: 'chart',
      title: 'Task Distribution',
      dataSource: 'tasks',
      chartType: 'pie',
      dataKey: 'distributionData',
      size: 'medium',
    },
  ];
}
