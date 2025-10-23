'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { taskService } from '@/services/taskService';
import { useToast } from '@/contexts/ToastContext';
import {
  PlusIcon,
  MoreHorizontalIcon,
  XIcon,
  Edit2Icon,
  Trash2Icon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  CheckSquareIcon,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  assignedToId?: string;
  tags?: string[];
  position?: number;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

interface TrelloBoardProps {
  projectId: string;
}

const INITIAL_COLUMNS: Column[] = [
  { id: 'TODO', title: 'Work In Pipeline', tasks: [], color: 'bg-blue-500' },
  { id: 'IN_PROGRESS', title: 'Work In Progress', tasks: [], color: 'bg-yellow-500' },
  { id: 'IN_REVIEW', title: 'Work Completed', tasks: [], color: 'bg-purple-500' },
  { id: 'DONE', title: 'Track Completed', tasks: [], color: 'bg-green-500' },
  { id: 'BLOCKED', title: 'Goal Achieved', tasks: [], color: 'bg-red-500' },
];

export default function TrelloBoard({ projectId }: TrelloBoardProps) {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [newCardTitle, setNewCardTitle] = useState<{ [key: string]: string }>({});
  const [showAddCard, setShowAddCard] = useState<{ [key: string]: boolean }>({});
  const [showCardMenu, setShowCardMenu] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<Task | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await taskService.getByProject(projectId);

      if (error) {
        toast.error(error);
        return;
      }

      if (data) {
        const updatedColumns = INITIAL_COLUMNS.map(col => ({
          ...col,
          tasks: data.filter((task: Task) => task.status === col.id)
            .sort((a: Task, b: Task) => (a.position || 0) - (b.position || 0)),
        }));
        setColumns(updatedColumns);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Handle column reordering
    if (type === 'COLUMN') {
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);
      setColumns(newColumns);
      return;
    }

    // Handle card reordering
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const sourceTasks = Array.from(sourceColumn.tasks);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      // Moving within the same column
      sourceTasks.splice(destination.index, 0, movedTask);
      const newColumns = columns.map(col =>
        col.id === sourceColumn.id ? { ...col, tasks: sourceTasks } : col
      );
      setColumns(newColumns);
    } else {
      // Moving to a different column
      const destTasks = Array.from(destColumn.tasks);
      movedTask.status = destination.droppableId;
      destTasks.splice(destination.index, 0, movedTask);

      const newColumns = columns.map(col => {
        if (col.id === sourceColumn.id) return { ...col, tasks: sourceTasks };
        if (col.id === destColumn.id) return { ...col, tasks: destTasks };
        return col;
      });
      setColumns(newColumns);

      // Update in database
      try {
        const { error } = await taskService.update(movedTask.id, {
          status: destination.droppableId as any,
        });
        if (error) {
          toast.error(error);
          loadTasks(); // Reload on error
        } else {
          toast.success('Card moved successfully');
        }
      } catch (error) {
        console.error('Error updating task:', error);
        toast.error('Failed to move card');
        loadTasks();
      }
    }
  };

  const handleAddCard = async (columnId: string) => {
    const title = newCardTitle[columnId]?.trim();
    if (!title) return;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user?.id || user?.email;

      if (!userId) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await taskService.create({
        title,
        description: '',
        projectId,
        status: columnId as any,
        priority: 'MEDIUM',
        createdById: userId,
        assignedToId: userId,
      });

      if (error) {
        toast.error(error);
        return;
      }

      if (data) {
        toast.success('Card created successfully');
        setNewCardTitle({ ...newCardTitle, [columnId]: '' });
        setShowAddCard({ ...showAddCard, [columnId]: false });
        loadTasks();
      }
    } catch (error) {
      console.error('Error creating card:', error);
      toast.error('Failed to create card');
    }
  };

  const handleDeleteCard = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      const { error } = await taskService.delete(taskId);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Card deleted successfully');
        loadTasks();
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    }
    setShowCardMenu(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'HOTFIX';
      case 'HIGH': return 'High Priority';
      case 'MEDIUM': return 'Module';
      case 'LOW': return 'Low Priority';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 min-h-[calc(100vh-200px)]"
            >
              {columns.map((column, index) => (
                <Draggable key={column.id} draggableId={column.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex-shrink-0 w-80 ${snapshot.isDragging ? 'opacity-50' : ''}`}
                    >
                      {/* Column Header */}
                      <div
                        {...provided.dragHandleProps}
                        className="bg-gray-100 dark:bg-gray-800 rounded-t-lg p-3 flex items-center justify-between cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-1 h-6 ${column.color} rounded`}></div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {column.title}
                          </h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {column.tasks.length}
                          </span>
                        </div>
                        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                          <MoreHorizontalIcon className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Column Content */}
                      <Droppable droppableId={column.id} type="CARD">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`bg-gray-50 dark:bg-gray-700/50 rounded-b-lg p-2 min-h-[200px] ${
                              snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            {/* Cards */}
                            {column.tasks.map((task, taskIndex) => (
                              <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white dark:bg-gray-800 rounded-lg p-3 mb-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                                      snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                    }`}
                                  >
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        {/* Labels/Tags */}
                                        <div className="flex flex-wrap gap-1 mb-2">
                                          <span className={`${getPriorityColor(task.priority)} text-white text-xs px-2 py-0.5 rounded font-medium`}>
                                            {getPriorityLabel(task.priority)}
                                          </span>
                                          {task.tags?.map((tag, i) => (
                                            <span key={i} className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                        {/* Card Title */}
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                          {task.title}
                                        </h4>
                                      </div>
                                      {/* Card Menu */}
                                      <div className="relative">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowCardMenu(showCardMenu === task.id ? null : task.id);
                                          }}
                                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                          <MoreHorizontalIcon className="w-4 h-4" />
                                        </button>
                                        {showCardMenu === task.id && (
                                          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                            <button
                                              onClick={() => {
                                                setEditingCard(task);
                                                setShowCardMenu(null);
                                              }}
                                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                            >
                                              <Edit2Icon className="w-4 h-4" />
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => handleDeleteCard(task.id)}
                                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                            >
                                              <Trash2Icon className="w-4 h-4" />
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                      {task.dueDate && (
                                        <div className="flex items-center gap-1">
                                          <CalendarIcon className="w-3 h-3" />
                                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                        </div>
                                      )}
                                      {task.assignedToId && (
                                        <div className="flex items-center gap-1">
                                          <UserIcon className="w-3 h-3" />
                                        </div>
                                      )}
                                      {task.description && (
                                        <div className="flex items-center gap-1">
                                          <CheckSquareIcon className="w-3 h-3" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}

                            {/* Add Card Button */}
                            {showAddCard[column.id] ? (
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                                <textarea
                                  autoFocus
                                  value={newCardTitle[column.id] || ''}
                                  onChange={(e) => setNewCardTitle({ ...newCardTitle, [column.id]: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAddCard(column.id);
                                    }
                                    if (e.key === 'Escape') {
                                      setShowAddCard({ ...showAddCard, [column.id]: false });
                                      setNewCardTitle({ ...newCardTitle, [column.id]: '' });
                                    }
                                  }}
                                  placeholder="Enter a title for this card..."
                                  className="w-full p-2 text-sm border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded dark:bg-gray-700 dark:text-white resize-none"
                                  rows={3}
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => handleAddCard(column.id)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                  >
                                    Add card
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowAddCard({ ...showAddCard, [column.id]: false });
                                      setNewCardTitle({ ...newCardTitle, [column.id]: '' });
                                    }}
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                  >
                                    <XIcon className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowAddCard({ ...showAddCard, [column.id]: true })}
                                className="w-full text-left px-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center gap-2 transition-colors"
                              >
                                <PlusIcon className="w-4 h-4" />
                                Add a card
                              </button>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
