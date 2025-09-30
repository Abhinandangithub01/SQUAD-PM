import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CalendarIcon,
  UserIcon,
  TagIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import Avatar from './Avatar';
import QuickActionMenu from './QuickActionMenu';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TaskCardWithShortcuts = ({ 
  task, 
  onClick,
  teamMembers = [],
  availableTags = [],
  projectId,
}) => {
  const { isDarkMode } = useTheme();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef(null);

  const bgColor = isDarkMode() ? 'var(--color-surface)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#111827';
  const textSecondary = isDarkMode() ? 'var(--color-text-secondary)' : '#6b7280';

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }) => {
      const response = await api.put(`/tasks/${taskId}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', projectId]);
      toast.success('Task updated');
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isHovered) return;

    const handleKeyPress = (e) => {
      // Don't trigger if typing in an input
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'm') {
        e.preventDefault();
        openQuickMenu('assign');
      } else if (key === 'd') {
        e.preventDefault();
        openQuickMenu('duedate');
      } else if (key === 't') {
        e.preventDefault();
        openQuickMenu('tags');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isHovered]);

  const openQuickMenu = (initialMenu = null) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
      setShowQuickMenu(initialMenu || true);
    }
  };

  const handleAssign = (user) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: { assignee_id: user.id },
    });
  };

  const handleDueDate = (date) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: { due_date: date },
    });
  };

  const handleTags = (tags) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: { tags },
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
          isHovered ? 'border-primary-500 shadow-lg' : 'border-transparent'
        }`}
        style={{ 
          backgroundColor: bgColor,
          borderColor: isHovered ? '#3b82f6' : borderColor,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        {/* Keyboard Hint Badge */}
        {isHovered && (
          <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-pulse">
            M · D · T
          </div>
        )}

        {/* Task Title */}
        <h3 className="font-medium mb-2 line-clamp-2" style={{ color: textColor }}>
          {task.title}
        </h3>

        {/* Task Description */}
        {task.description && (
          <p className="text-sm mb-3 line-clamp-2" style={{ color: textSecondary }}>
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${tag.color || '#3b82f6'}20`,
                  color: tag.color || '#3b82f6',
                }}
              >
                {tag.name}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs" style={{ color: textSecondary }}>
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor }}>
          {/* Assignee */}
          <div className="flex items-center space-x-2">
            {task.assignee ? (
              <>
                <Avatar user={task.assignee} size="xs" />
                <span className="text-xs" style={{ color: textSecondary }}>
                  {task.assignee.first_name}
                </span>
              </>
            ) : (
              <div className="flex items-center space-x-1 text-xs" style={{ color: textSecondary }}>
                <UserIcon className="h-4 w-4" />
                <span>Unassigned</span>
              </div>
            )}
          </div>

          {/* Due Date */}
          {task.due_date && (
            <div className="flex items-center space-x-1 text-xs" style={{ color: textSecondary }}>
              <CalendarIcon className="h-4 w-4" />
              <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Priority Badge */}
        {task.priority && (
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
        )}
      </div>

      {/* Quick Action Menu */}
      {showQuickMenu && (
        <QuickActionMenu
          task={task}
          position={menuPosition}
          onAssign={handleAssign}
          onDueDate={handleDueDate}
          onTags={handleTags}
          onClose={() => setShowQuickMenu(false)}
          teamMembers={teamMembers}
          availableTags={availableTags}
        />
      )}
    </>
  );
};

export default TaskCardWithShortcuts;
