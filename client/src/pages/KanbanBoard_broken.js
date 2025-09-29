import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  ArrowLeftIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  UserIcon,
  CalendarIcon,
  FlagIcon,
  ArrowRightIcon,
  Squares2X2Icon,
  ListBulletIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import api from '../utils/api';
import { formatDate, getPriorityColor, truncateText } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import toast from 'react-hot-toast';

const KanbanBoard = () => {
  const { projectId } = useParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [newColumnName, setNewColumnName] = useState('');
  const queryClient = useQueryClient();

  // Fetch kanban data
  const { data: kanbanData, isLoading } = useQuery({
    queryKey: ['kanban', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/kanban`);
      return response.data;
    },
    enabled: !!projectId,
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }) => {
      const response = await api.put(`/tasks/${taskId}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kanban', projectId]);
    },
  });

  // Update column order mutation
  const updateColumnOrderMutation = useMutation({
    mutationFn: async ({ columns }) => {
      const response = await api.put(`/projects/${projectId}/columns/reorder`, { columns });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kanban', projectId]);
      toast.success('Column order updated');
    },
    onError: () => {
      toast.error('Failed to update column order');
    },
  });

  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId, type } = result;
    
    // Handle column reordering
    if (type === 'COLUMN') {
      if (source.index !== destination.index) {
        // Reorder columns
        const newColumns = Array.from(kanbanData.columns);
        const [removed] = newColumns.splice(source.index, 1);
        newColumns.splice(destination.index, 0, removed);
        
        // Update column positions in the backend
        updateColumnOrderMutation.mutate({
          columns: newColumns.map((col, index) => ({
            id: col.id,
            position: index
          }))
        });
      }
      return;
    }
    
    // Handle task movement
    if (source.droppableId !== destination.droppableId) {
      // Move task between columns
      updateTaskMutation.mutate({
        taskId: draggableId,
        updates: { 
          status: destination.droppableId,
          position: destination.index 
        }
      });
    } else if (source.index !== destination.index) {
      // Reorder task within same column
      updateTaskMutation.mutate({
        taskId: draggableId,
        updates: { position: destination.index }
      });
    }
  };

  // Handle task selection
  const handleTaskSelect = (taskId, isSelected) => {
    const newSelected = new Set(selectedTasks);
    if (isSelected) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // Handle select all tasks
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const allTaskIds = new Set();
      kanbanData?.columns?.forEach(column => {
        column.tasks.forEach(task => allTaskIds.add(task.id));
      });
      setSelectedTasks(allTaskIds);
      setShowBulkActions(true);
    } else {
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    }
  };

  // Bulk actions
  const handleBulkAssign = async (assigneeId) => {
    try {
      await Promise.all(Array.from(selectedTasks).map(taskId => 
        api.put(`/tasks/${taskId}`, { assignee_id: assigneeId })
      ));
      queryClient.invalidateQueries(['kanban', projectId]);
      toast.success('Tasks assigned successfully');
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      toast.error('Failed to assign tasks');
    }
  };

  const handleBulkPriority = async (priority) => {
    try {
      await Promise.all(Array.from(selectedTasks).map(taskId => 
        api.put(`/tasks/${taskId}`, { priority })
      ));
      queryClient.invalidateQueries(['kanban', projectId]);
      toast.success('Priority updated successfully');
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      toast.error('Failed to update priority');
    }
  };

  const handleBulkMove = async (columnId) => {
    try {
      await Promise.all(Array.from(selectedTasks).map(taskId => 
        api.put(`/tasks/${taskId}`, { status: columnId })
      ));
      queryClient.invalidateQueries(['kanban', projectId]);
      toast.success('Tasks moved successfully');
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      toast.error('Failed to move tasks');
    }
  };

  const handleBulkDueDate = async (dueDate) => {
    try {
      await Promise.all(Array.from(selectedTasks).map(taskId => 
        api.put(`/tasks/${taskId}`, { due_date: dueDate })
      ));
      queryClient.invalidateQueries(['kanban', projectId]);
      toast.success('Due date updated successfully');
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    } catch (error) {
      toast.error('Failed to update due date');
    }
  };

  // Add new column
  const handleAddColumn = async () => {
    const columnName = prompt('Enter column name:');
    if (columnName) {
      try {
        await api.post(`/projects/${projectId}/columns`, { name: columnName });
        queryClient.invalidateQueries(['kanban', projectId]);
        toast.success('Column added successfully');
      } catch (error) {
        toast.error('Failed to add column');
      }
    }
  };

  // Rename column
  const handleRenameColumn = async (columnId, newName) => {
    try {
      await api.put(`/projects/${projectId}/columns/${columnId}`, { name: newName });
      queryClient.invalidateQueries(['kanban', projectId]);
      toast.success('Column renamed successfully');
      setEditingColumn(null);
    } catch (error) {
      toast.error('Failed to rename column');
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to={`/projects/${projectId}`}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
            <p className="text-gray-600">Drag and drop tasks to update their status</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 min-w-[120px]">
              <FunnelIcon className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
          
          <Link
            to={`/projects/${projectId}/list`}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <ListBulletIcon className="h-4 w-4 mr-2" />
            List View
          </Link>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-900">
              {selectedTasks.size} task(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                  <UserIcon className="h-4 w-4 mr-1" />
                  Assign
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleBulkAssign('user1')}
                        className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                      >
                        John Doe
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>

              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                  <FlagIcon className="h-4 w-4 mr-1" />
                  Priority
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  {['urgent', 'high', 'medium', 'low'].map((priority) => (
                    <Menu.Item key={priority}>
                      {({ active }) => (
                        <button
                          onClick={() => handleBulkPriority(priority)}
                          className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left capitalize`}
                        >
                          {priority}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Menu>

              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                  <ArrowRightIcon className="h-4 w-4 mr-1" />
                  Move
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  {kanbanData?.columns?.map((column) => (
                    <Menu.Item key={column.id}>
                      {({ active }) => (
                        <button
                          onClick={() => handleBulkMove(column.id)}
                          className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                        >
                          {column.name}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Menu>

              <input
                type="date"
                onChange={(e) => handleBulkDueDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                title="Set Due Date"
              />

              <button
                onClick={() => {
                  setSelectedTasks(new Set());
                  setShowBulkActions(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select All Checkbox */}
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          checked={selectedTasks.size > 0 && selectedTasks.size === kanbanData?.columns?.reduce((total, col) => total + col.tasks.length, 0)}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300 mr-2"
        />
        <span className="text-sm text-gray-600">Select All</span>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" type="COLUMN" direction="horizontal">
            {(provided) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex space-x-6 h-full pb-6" 
                style={{ minWidth: 'max-content' }}
              >
                {kanbanData?.columns?.map((column, index) => (
                  <Draggable key={column.id} draggableId={`column-${column.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`w-80 bg-gray-50 rounded-lg flex flex-col ${
                          snapshot.isDragging ? 'shadow-2xl rotate-3 transform' : ''
                        }`}
                      >
                        {/* Column Header - Drag Handle */}
                        <div 
                          {...provided.dragHandleProps}
                          className="flex items-center justify-between p-4 border-b border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                        >
                {/* Column Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                    {editingColumn === column.id ? (
                      <input
                        type="text"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onBlur={() => {
                          if (newColumnName.trim()) {
                            handleRenameColumn(column.id, newColumnName);
                          } else {
                            setEditingColumn(null);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameColumn(column.id, newColumnName);
                          }
                        }}
                        className="font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-primary-500"
                        autoFocus
                      />
                    ) : (
                      <h3 
                        className="font-semibold text-gray-900 cursor-pointer"
                        onClick={() => {
                          setEditingColumn(column.id);
                          setNewColumnName(column.name);
                        }}
                      >
                        {column.name}
                      </h3>
                    )}
                    <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                      {column.tasks.length}
                    </span>
                  </div>
                  
                  <Menu as="div" className="relative">
                    <Menu.Button className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-white">
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => {
                              setEditingColumn(column.id);
                              setNewColumnName(column.name);
                            }}
                            className={`${active ? 'bg-gray-100' : ''} flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                          >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Rename Column
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className={`${active ? 'bg-gray-100' : ''} flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Task
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </div>

                {/* Tasks */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-4 space-y-3 overflow-y-auto ${
                        snapshot.isDraggingOver ? 'bg-primary-50' : ''
                      }`}
                      style={{ minHeight: '500px' }}
                    >
                      {column.tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow cursor-pointer ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              } ${selectedTasks.has(task.id) ? 'ring-2 ring-primary-500' : ''}`}
                            >
                              {/* Task Header with Checkbox */}
                              <div className="flex items-start justify-between mb-2">
                                <input
                                  type="checkbox"
                                  checked={selectedTasks.has(task.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleTaskSelect(task.id, e.target.checked);
                                  }}
                                  className="rounded border-gray-300 mt-1"
                                />
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>

                              {/* Task Content */}
                              <div onClick={() => handleTaskClick(task)}>
                                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                                  {task.title}
                                </h4>
                                
                                {task.description && (
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {truncateText(task.description, 100)}
                                  </p>
                                )}

                                {/* Task Meta */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center space-x-2">
                                    {task.assignee_name && (
                                      <div className="flex items-center">
                                        <UserIcon className="h-3 w-3 mr-1" />
                                        {task.assignee_name}
                                      </div>
                                    )}
                                    {task.due_date && (
                                      <div className="flex items-center">
                                        <CalendarIcon className="h-3 w-3 mr-1" />
                                        {formatDate(task.due_date)}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {(task.comment_count > 0 || task.attachment_count > 0) && (
                                    <div className="flex items-center space-x-2">
                                      {task.comment_count > 0 && (
                                        <span className="flex items-center">
                                          💬 {task.comment_count}
                                        </span>
                                      )}
                                      {task.attachment_count > 0 && (
                                        <span className="flex items-center">
                                          📎 {task.attachment_count}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {/* Quick Add Task */}
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-150"
                      >
                        <PlusIcon className="h-4 w-4 mx-auto" />
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
            
            {/* Add New Column */}
            <div className="w-80 flex-shrink-0">
              <button
                onClick={handleAddColumn}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-150 flex flex-col items-center justify-center"
              >
                <PlusIcon className="h-6 w-6 mb-2" />
                <span className="font-medium">Add Column</span>
              </button>
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        onSuccess={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries(['kanban', projectId]);
        }}
      />

      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        taskId={selectedTask?.id}
        onUpdate={() => {
          queryClient.invalidateQueries(['kanban', projectId]);
        }}
      />
    </div>
  );
};

export default KanbanBoard;
