import React, { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import amplifyDataService from '../services/amplifyDataService';
import { getPriorityColor } from '../utils/helpers';

const TimelineView = ({ projectId, onTaskClick }) => {
  const [startDate, setStartDate] = useState(new Date());
  const [timelineWidth, setTimelineWidth] = useState(0);
  const timelineRef = React.useRef(null);

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const result = await amplifyDataService.tasks.list({ projectId });
      return result.success ? result.data : [];
    },
  });

  const tasks = (tasksData || []).filter(t => t.start_date && t.due_date);

  useEffect(() => {
    if (timelineRef.current) {
      setTimelineWidth(timelineRef.current.offsetWidth);
    }
  }, []);

  // Calculate timeline range (30 days)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);

  const getDaysBetween = (start, end) => {
    const days = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const getTaskPosition = (task) => {
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.due_date);
    
    // Calculate position and width as percentage
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const startOffset = Math.max(0, (taskStart - startDate) / (1000 * 60 * 60 * 24));
    const duration = (taskEnd - taskStart) / (1000 * 60 * 60 * 24);
    
    const left = (startOffset / totalDays) * 100;
    const width = Math.max(2, (duration / totalDays) * 100);

    return { left: `${left}%`, width: `${width}%` };
  };

  const isTaskInRange = (task) => {
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.due_date);
    return taskStart <= endDate && taskEnd >= startDate;
  };

  const navigateTimeline = (days) => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + days);
    setStartDate(newDate);
  };

  const days = getDaysBetween(startDate, endDate);
  const visibleTasks = tasks.filter(isTaskInRange);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Timeline View
          </h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateTimeline(-7)}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setStartDate(new Date())}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateTimeline(7)}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 overflow-x-auto" ref={timelineRef}>
        {/* Date Headers */}
        <div className="flex border-b border-gray-200 pb-2 mb-4">
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;

            return (
              <div
                key={index}
                className={`flex-1 text-center min-w-[40px] ${
                  isWeekend ? 'bg-gray-50' : ''
                }`}
              >
                <div className={`text-xs font-semibold ${
                  isToday ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {day.toLocaleDateString('default', { weekday: 'short' })}
                </div>
                <div className={`text-sm font-bold ${
                  isToday 
                    ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto'
                    : 'text-gray-900'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tasks Timeline */}
        <div className="relative" style={{ minHeight: `${visibleTasks.length * 50}px` }}>
          {/* Today Marker */}
          {(() => {
            const today = new Date();
            if (today >= startDate && today <= endDate) {
              const offset = ((today - startDate) / (endDate - startDate)) * 100;
              return (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                  style={{ left: `${offset}%` }}
                >
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                </div>
              );
            }
            return null;
          })()}

          {/* Task Bars */}
          {visibleTasks.map((task, index) => {
            const position = getTaskPosition(task);
            const priorityClass = task.priority === 'URGENT' ? 'bg-red-500' :
                                 task.priority === 'HIGH' ? 'bg-orange-500' :
                                 task.priority === 'MEDIUM' ? 'bg-yellow-500' :
                                 'bg-green-500';

            return (
              <div
                key={task.id}
                className="absolute h-10 group cursor-pointer"
                style={{
                  top: `${index * 50}px`,
                  left: position.left,
                  width: position.width,
                }}
                onClick={() => onTaskClick(task)}
              >
                <div className={`h-full ${priorityClass} rounded-lg shadow-sm hover:shadow-md transition-all flex items-center px-3 group-hover:scale-105`}>
                  <p className="text-xs font-medium text-white truncate">
                    {task.title}
                  </p>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20">
                  <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl whitespace-nowrap">
                    <p className="font-semibold mb-1">{task.title}</p>
                    <p className="text-gray-300">
                      {new Date(task.start_date).toLocaleDateString()} - {new Date(task.due_date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-300 mt-1">
                      Priority: {task.priority}
                    </p>
                    {task.estimated_hours && (
                      <p className="text-gray-300">
                        Estimated: {task.estimated_hours}h
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {visibleTasks.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No tasks in this time range</p>
            <p className="text-sm text-gray-400 mt-1">
              Tasks with start and due dates will appear here
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-around p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{visibleTasks.length}</p>
          <p className="text-xs text-gray-600">Total Tasks</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {visibleTasks.filter(t => t.status === 'DONE').length}
          </p>
          <p className="text-xs text-gray-600">Completed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">
            {visibleTasks.filter(t => t.status === 'IN_PROGRESS').length}
          </p>
          <p className="text-xs text-gray-600">In Progress</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {visibleTasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'DONE').length}
          </p>
          <p className="text-xs text-gray-600">Overdue</p>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
