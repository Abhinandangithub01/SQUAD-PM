'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { taskService } from '@/services/taskService';
import { useToast } from '@/contexts/ToastContext';
import { PlusIcon, MoreHorizontalIcon, XIcon } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  projectId?: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const INITIAL_COLUMNS: Column[] = [
  { id: 'TODO', title: 'To Do', tasks: [] },
  { id: 'IN_PROGRESS', title: 'In Progress', tasks: [] },
  { id: 'IN_REVIEW', title: 'In Review', tasks: [] },
  { id: 'DONE', title: 'Done', tasks: [] },
];

export default function TrelloBoardAllTasks() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [newCardTitle, setNewCardTitle] = useState<{ [key: string]: string }>({});
  const [showAddCard, setShowAddCard] = useState<{ [key: string]: boolean }>({});
  const toast = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await taskService.list();

      if (error) {
        toast.error(error);
        return;
      }

      if (data) {
        const updatedColumns = INITIAL_COLUMNS.map(col => ({
          ...col,
          tasks: data.filter((task: Task) => task.status === col.id),
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
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'COLUMN') {
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);
      setColumns(newColumns);
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const sourceTasks = Array.from(sourceColumn.tasks);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceTasks.splice(destination.index, 0, movedTask);
      const newColumns = columns.map(col =>
        col.id === sourceColumn.id ? { ...col, tasks: sourceTasks } : col
      );
      setColumns(newColumns);
    } else {
      const destTasks = Array.from(destColumn.tasks);
      movedTask.status = destination.droppableId;
      destTasks.splice(destination.index, 0, movedTask);

      const newColumns = columns.map(col => {
        if (col.id === sourceColumn.id) return { ...col, tasks: sourceTasks };
        if (col.id === destColumn.id) return { ...col, tasks: destTasks };
        return col;
      });
      setColumns(newColumns);

      try {
        const { error } = await taskService.update(movedTask.id, {
          status: destination.droppableId as any,
        });
        if (error) {
          toast.error(error);
          loadTasks();
        } else {
          toast.success('Task moved successfully');
        }
      } catch (error) {
        console.error('Error updating task:', error);
        toast.error('Failed to move task');
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

      // For tasks without a project, we'll need a default project or handle it differently
      toast.error('Please create tasks from within a project');
      return;
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
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
      case 'MEDIUM': return 'MEDIUM';
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
    <div className="h-full bg-white dark:bg-gray-900 overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 p-4 h-full"
              style={{ minWidth: 'max-content' }}
            >
              {columns.map((column, index) => (
                <Draggable key={column.id} draggableId={column.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex flex-col w-80 flex-shrink-0 ${
                        snapshot.isDragging ? 'opacity-50' : ''
                      }`}
                      style={{ height: 'calc(100vh - 250px)' }}
                    >
                      {/* Column Container - Dark like Trello */}
                      <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        {/* Column Header */}
                        <div
                          {...provided.dragHandleProps}
                          className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                              {column.title}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                              {column.tasks.length}
                            </span>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                            <MoreHorizontalIcon className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Column Content - Scrollable */}
                        <Droppable droppableId={column.id} type="CARD">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex-1 overflow-y-auto p-2 ${
                                snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                              style={{
                                minHeight: '100px',
                                maxHeight: 'calc(100vh - 350px)',
                              }}
                            >
                              {column.tasks.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                  No tasks
                                </div>
                              ) : (
                                column.tasks.map((task, taskIndex) => (
                                  <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg p-3 mb-2 cursor-pointer transition-all border border-gray-200 dark:border-gray-600 ${
                                          snapshot.isDragging ? 'shadow-2xl rotate-3 ring-2 ring-blue-500' : 'shadow-sm'
                                        }`}
                                      >
                                        {/* Priority Label */}
                                        {task.priority && (
                                          <div className="flex flex-wrap gap-1 mb-2">
                                            <span
                                              className={`${getPriorityColor(
                                                task.priority
                                              )} text-white text-xs px-2 py-0.5 rounded font-medium`}
                                            >
                                              {getPriorityLabel(task.priority)}
                                            </span>
                                          </div>
                                        )}

                                        {/* Card Title */}
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                                          {task.title}
                                        </h4>

                                        {/* Card Footer */}
                                        {task.dueDate && (
                                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(task.dueDate).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
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
