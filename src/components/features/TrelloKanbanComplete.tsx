'use client';

import { useState, useEffect } from 'react';
import { taskService } from '@/services/taskService';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  XIcon,
  MoreHorizontalIcon,
  Edit2Icon,
  Trash2Icon,
  CalendarIcon,
  GripVerticalIcon,
} from 'lucide-react';

interface TrelloKanbanCompleteProps {
  projectId: string;
}

const STATUSES = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'DONE', label: 'Done', color: 'bg-green-50 dark:bg-green-900/20' },
];

export default function TrelloKanbanComplete({ projectId }: TrelloKanbanCompleteProps) {
  const { user } = useAuthContext();
  const toast = useToast();
  const router = useRouter();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadTasks, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data } = await taskService.getByProject(projectId);
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddTask = async (status: string) => {
    if (!newTaskTitle.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      const userId = user?.id || user?.email;
      if (!userId) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await taskService.create({
        title: newTaskTitle,
        description: '',
        projectId,
        status: status as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED',
        priority: 'MEDIUM',
        createdById: userId,
        assignedToId: userId,
      });

      if (error) {
        toast.error(error);
        return;
      }

      await loadTasks();
      setNewTaskTitle('');
      setAddingToColumn(null);
      toast.success('Task created!');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await taskService.delete(taskId);
      
      if (error) {
        toast.error(error);
        return;
      }

      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleDragStart = (task: any) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const { error } = await taskService.update(draggedTask.id, { status: newStatus });
      
      if (error) {
        toast.error(error);
        return;
      }

      // Update local state
      setTasks(tasks.map(t => 
        t.id === draggedTask.id ? { ...t, status: newStatus } : t
      ));
      
      toast.success('Task moved!');
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
    } finally {
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto h-full">
        {STATUSES.map(status => (
          <div key={status.id} className="flex-shrink-0 w-80">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 h-full animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-3"></div>
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 overflow-x-auto h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {STATUSES.map((status) => (
        <TrelloList
          key={status.id}
          status={status}
          tasks={getTasksByStatus(status.id)}
          onTaskClick={(task) => router.push(`/dashboard/tasks/${task.id}`)}
          onDeleteTask={handleDeleteTask}
          isAddingTask={addingToColumn === status.id}
          onStartAddTask={() => setAddingToColumn(status.id)}
          onCancelAddTask={() => {
            setAddingToColumn(null);
            setNewTaskTitle('');
          }}
          newTaskTitle={newTaskTitle}
          onNewTaskTitleChange={setNewTaskTitle}
          onSaveTask={() => handleQuickAddTask(status.id)}
          onDragStart={handleDragStart}
          onDragOver={(e) => handleDragOver(e, status.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status.id)}
          isDraggedOver={draggedOverColumn === status.id}
        />
      ))}
    </div>
  );
}

function TrelloList({
  status,
  tasks,
  onTaskClick,
  onDeleteTask,
  isAddingTask,
  onStartAddTask,
  onCancelAddTask,
  newTaskTitle,
  onNewTaskTitleChange,
  onSaveTask,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDraggedOver,
}: any) {
  return (
    <div className="flex-shrink-0 w-80">
      <div 
        className={`${status.color} rounded-lg p-3 transition-all duration-200 ${
          isDraggedOver ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* List Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{status.label}</h3>
          <span className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded">
            {tasks.length}
          </span>
        </div>

        {/* Tasks */}
        <div className="space-y-2 mb-2 min-h-[100px]">
          {tasks.map((task: any) => (
            <TrelloCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onDelete={() => onDeleteTask(task.id)}
              onDragStart={() => onDragStart(task)}
            />
          ))}
        </div>

        {/* Add Card */}
        {isAddingTask ? (
          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
            <textarea
              autoFocus
              value={newTaskTitle}
              onChange={(e) => onNewTaskTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSaveTask();
                } else if (e.key === 'Escape') {
                  onCancelAddTask();
                }
              }}
              placeholder="Enter a title for this card..."
              className="w-full text-sm border-none outline-none resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              rows={3}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={onSaveTask}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                Add card
              </button>
              <button
                onClick={onCancelAddTask}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
              >
                <XIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onStartAddTask}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add a card
          </button>
        )}
      </div>
    </div>
  );
}

function TrelloCard({ task, onClick, onDelete, onDragStart }: any) {
  const [showMenu, setShowMenu] = useState(false);

  const priorityColors = {
    LOW: 'bg-gray-500',
    MEDIUM: 'bg-blue-500',
    HIGH: 'bg-orange-500',
    URGENT: 'bg-red-500',
  };

  const priorityLabels = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
  };

  return (
    <div 
      className="relative group"
      draggable
      onDragStart={onDragStart}
    >
      <div
        onClick={onClick}
        className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-move border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
      >
        {/* Drag Handle */}
        <div className="absolute left-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVerticalIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>

        {/* Card Content */}
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 pl-4">{task.title}</h4>
        
        {/* Labels & Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Badge */}
          <span className={`${priorityColors[task.priority]} text-white text-xs px-2 py-0.5 rounded`}>
            {priorityLabels[task.priority]}
          </span>

          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <CalendarIcon className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>

        {/* Description Preview */}
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{task.description}</p>
        )}
      </div>

      {/* Card Menu */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
      >
        <MoreHorizontalIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="absolute top-8 right-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <Edit2Icon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
            >
              <Trash2Icon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
