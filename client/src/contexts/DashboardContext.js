import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import amplifyDataService from '../services/amplifyDataService';
import { useAuth } from './AuthContext';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    return saved ? JSON.parse(saved) : getDefaultWidgets();
  });

  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(widgets));
  }, [widgets]);

  // Fetch real-time dashboard data using Amplify
  const { data: dashboardData, refetch } = useQuery({
    queryKey: ['dashboard-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // Calculate stats from Amplify data
      const projects = await amplifyDataService.projects.list();
      const tasks = await amplifyDataService.tasks.list({ createdById: user.id });
      
      return {
        totalProjects: projects.data?.length || 0,
        activeTasks: tasks.data?.filter(t => t.status !== 'DONE').length || 0,
        completedTasks: tasks.data?.filter(t => t.status === 'DONE').length || 0,
      };
    },
    enabled: !!user?.id,
    refetchInterval: refreshInterval,
  });

  // Fetch project statistics
  const { data: projectStats } = useQuery({
    queryKey: ['project-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const result = await amplifyDataService.projects.list();
      const projects = result.data || [];
      
      return {
        total: projects.length,
        active: projects.filter(p => p.status === 'ACTIVE').length,
        completed: projects.filter(p => p.status === 'COMPLETED').length,
      };
    },
    enabled: !!user?.id,
    refetchInterval: refreshInterval,
  });

  // Fetch task statistics
  const { data: taskStats } = useQuery({
    queryKey: ['task-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const result = await amplifyDataService.tasks.list({ createdById: user.id });
      const tasks = result.data || [];
      
      return {
        total: tasks.length,
        active: tasks.filter(t => t.status !== 'DONE').length,
        completed: tasks.filter(t => t.status === 'DONE').length,
        overdue: tasks.filter(t => {
          if (!t.dueDate || t.status === 'DONE') return false;
          return new Date(t.dueDate) < new Date();
        }).length,
      };
    },
    enabled: !!user?.id,
    refetchInterval: refreshInterval,
  });

  // Fetch team statistics (placeholder)
  const { data: teamStats } = useQuery({
    queryKey: ['team-stats'],
    queryFn: async () => {
      // TODO: Implement team stats from Amplify
      return {
        total: 0,
        active: 0,
      };
    },
    refetchInterval: refreshInterval,
  });

  // Fetch time tracking data (placeholder)
  const { data: timeData } = useQuery({
    queryKey: ['time-tracking-stats'],
    queryFn: async () => {
      // TODO: Implement time tracking from Amplify
      return {
        totalHours: 0,
      };
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
