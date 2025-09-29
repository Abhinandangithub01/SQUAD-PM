import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ListBulletIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  Bars3Icon,
  PencilIcon,
  UserIcon,
  CalendarIcon,
  CheckIcon,
  FlagIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { formatDate, getPriorityColor, truncateText } from '../utils/helpers';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import toast from 'react-hot-toast';

const KanbanBoard = () => {
  const { projectId } = useParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Mock data for demonstration
  const [kanbanData, setKanbanData] = useState({
    columns: [
      {
        id: 'todo',
        name: 'To Do',
        color: '#EF4444',
        tasks: [
          {
            id: 'task-1',
            title: 'Design new homepage layout',
            description: 'Create wireframes and mockups for the new homepage design',
            priority: 'high',
            assignee_name: 'JD',
            due_date: '2024-10-05',
            comment_count: 2,
            attachment_count: 5
          }
        ]
      },
      {
        id: 'backlog',
        name: 'Backlog',
        color: '#6B7280',
        tasks: [
          {
            id: 'task-2',
            title: 'Research competitor analysis',
            description: 'Analyze top 5 competitors in our market',
            priority: 'low',
            assignee_name: 'SW',
            due_date: '2024-10-10',
            comment_count: 1,
            attachment_count: 0
          },
          {
            id: 'task-3',
            title: 'Fix login authentication bug',
            description: 'Users are unable to login with social media accounts',
            priority: 'urgent',
            assignee_name: 'JS',
            due_date: '2024-09-30',
            comment_count: 3,
            attachment_count: 1
          }
        ]
      },
      {
        id: 'progress',
        name: 'In Progress',
        color: '#F59E0B',
        tasks: []
      },
      {
        id: 'review',
        name: 'Review',
        color: '#8B5CF6',
        tasks: []
      },
      {
        id: 'done',
        name: 'Done',
        color: '#10B981',
        tasks: []
      }
    ]
  });

  // Simple drag handlers
  const handleTaskDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleTaskDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
  };

  const handleColumnDragEnter = (e, columnId) => {
    e.preventDefault();
    if (draggedTask) {
      setDragOverColumn(columnId);
    }
  };

  const handleColumnDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleColumnDrop = (e, targetColumnId) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    // Find source column
    const sourceColumn = kanbanData.columns.find(col => 
      col.tasks.some(task => task.id === draggedTask.id)
    );
    
    if (!sourceColumn || sourceColumn.id === targetColumnId) {
      setDragOverColumn(null);
      return;
    }

    // Move task between columns
    const newColumns = kanbanData.columns.map(col => {
      if (col.id === sourceColumn.id) {
        return {
          ...col,
          tasks: col.tasks.filter(task => task.id !== draggedTask.id)
        };
      }
      if (col.id === targetColumnId) {
        return {
          ...col,
          tasks: [...col.tasks, draggedTask]
        };
      }
      return col;
    });

    setKanbanData({
      ...kanbanData,
      columns: newColumns
    });

    const targetColumn = kanbanData.columns.find(col => col.id === targetColumnId);
    toast.success(`Task moved to ${targetColumn.name}`);
    setDragOverColumn(null);
  };

  // Column drag handlers
  const handleColumnDragStart = (e, column) => {
    setDraggedColumn(column);
    e.dataTransfer.setData('text/plain', column.id);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumn(null);
  };

  const handleColumnReorder = (e, targetColumnId) => {
    e.preventDefault();
    
    if (!draggedColumn || draggedColumn.id === targetColumnId) return;

    const draggedIndex = kanbanData.columns.findIndex(col => col.id === draggedColumn.id);
    const targetIndex = kanbanData.columns.findIndex(col => col.id === targetColumnId);

    const newColumns = [...kanbanData.columns];
    const [removed] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, removed);

    setKanbanData({
      ...kanbanData,
      columns: newColumns
    });

    toast.success('Column order updated');
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
      kanbanData.columns.forEach(column => {
        column.tasks.forEach(task => allTaskIds.add(task.id));
      });
      setSelectedTasks(allTaskIds);
      setShowBulkActions(true);
    } else {
      setSelectedTasks(new Set());
      setShowBulkActions(false);
    }
  };

  // Add new column
  const handleAddColumn = () => {
    const columnName = prompt('Enter column name:');
    if (columnName) {
      const newColumn = {
        id: `column-${Date.now()}`,
        name: columnName,
        color: '#6B7280',
        tasks: []
      };
      
      setKanbanData({
        ...kanbanData,
        columns: [...kanbanData.columns, newColumn]
      });
      
      toast.success('Column added successfully');
    }
  };

  // Rename column
  const handleRenameColumn = (columnId, newName) => {
    const newColumns = kanbanData.columns.map(col => 
      col.id === columnId ? { ...col, name: newName } : col
    );
    
    setKanbanData({
      ...kanbanData,
      columns: newColumns
    });
    
    toast.success('Column renamed successfully');
    setEditingColumn(null);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  return (
    <div className="h-screen flex flex-col p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to={`/projects/${projectId}`}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
            <p className="text-gray-600">Drag and drop tasks and columns to organize your work</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm"
            />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-white/80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button className="flex items-center px-4 py-2 bg-white/80 border border-gray-300 rounded-lg hover:bg-white/90 min-w-[120px] backdrop-blur-sm transition-colors">
              <FunnelIcon className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
          
          <Link
            to={`/projects/${projectId}/list`}
            className="flex items-center px-4 py-2 bg-white/80 border border-gray-300 text-gray-700 rounded-lg hover:bg-white/90 backdrop-blur-sm transition-colors"
          >
            <ListBulletIcon className="h-4 w-4 mr-2" />
            List View
          </Link>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="mb-4 p-4 bg-white/80 border border-primary-200 rounded-lg backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-900">
              {selectedTasks.size} task(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                <UserIcon className="h-4 w-4 mr-1" />
                Assign
              </button>
              <button className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                <FlagIcon className="h-4 w-4 mr-1" />
                Priority
              </button>
              <button className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                <ArrowRightIcon className="h-4 w-4 mr-1" />
                Move
              </button>
              <button
                onClick={() => {
                  setSelectedTasks(new Set());
                  setShowBulkActions(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
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
          checked={selectedTasks.size > 0 && selectedTasks.size === kanbanData.columns.reduce((total, col) => total + col.tasks.length, 0)}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300 mr-2"
        />
        <span className="text-sm text-gray-700">Select All</span>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-6">
        <div className="flex space-x-4 h-full items-start" style={{ minWidth: 'max-content' }}>
          {kanbanData.columns.map((column) => (
            <div 
              key={column.id}
              className={`w-80 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex flex-col transition-all duration-200 ${
                dragOverColumn === column.id ? 'ring-2 ring-blue-400 bg-blue-50/80 scale-105' : ''
              } ${draggedColumn?.id === column.id ? 'opacity-70 scale-105 rotate-2' : ''}`}
              style={{ height: 'calc(100vh - 250px)' }}
              draggable
              onDragStart={(e) => handleColumnDragStart(e, column)}
              onDragEnd={handleColumnDragEnd}
              onDragOver={handleColumnDragOver}
              onDrop={(e) => handleColumnReorder(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/30 cursor-move hover:bg-white/40 transition-colors rounded-t-xl">
                <div className="flex items-center space-x-3">
                  <Bars3Icon className="h-4 w-4 text-gray-500" />
                  <div 
                    className="w-3 h-3 rounded-full shadow-sm"
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
                      className="font-semibold text-gray-900 bg-transparent border-b border-gray-400 focus:outline-none focus:border-primary-500 px-1"
                      autoFocus
                    />
                  ) : (
                    <h3 
                      className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600 transition-colors"
                      onClick={() => {
                        setEditingColumn(column.id);
                        setNewColumnName(column.name);
                      }}
                    >
                      {column.name}
                    </h3>
                  )}
                  <span className="text-sm text-gray-600 bg-white/60 px-2 py-1 rounded-full font-medium">
                    {column.tasks.length}
                  </span>
                </div>
                
                <Menu as="div" className="relative">
                  <Menu.Button className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-colors">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-1 w-48 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 z-10">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => {
                            setEditingColumn(column.id);
                            setNewColumnName(column.name);
                          }}
                          className={`${active ? 'bg-gray-100/80' : ''} flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left transition-colors`}
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
                          className={`${active ? 'bg-gray-100/80' : ''} flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left transition-colors`}
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Task
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Menu>
              </div>

              {/* Tasks Container */}
              <div
                className={`flex-1 p-3 overflow-y-auto space-y-3 ${
                  draggedTask && dragOverColumn === column.id ? 'bg-primary-50/70 border-2 border-dashed border-primary-400 rounded-lg m-1' : ''
                }`}
                style={{ 
                  height: 'calc(100vh - 350px)',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
                }}
                onDragOver={handleColumnDragOver}
                onDragEnter={(e) => handleColumnDragEnter(e, column.id)}
                onDragLeave={handleColumnDragLeave}
                onDrop={(e) => handleColumnDrop(e, column.id)}
              >
                {column.tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleTaskDragStart(e, task)}
                    onDragEnd={handleTaskDragEnd}
                    className={`bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-md border border-white/40 hover:shadow-lg cursor-move group transition-all duration-200 ${
                      selectedTasks.has(task.id) ? 'ring-2 ring-primary-500 bg-primary-50/90' : ''
                    } ${draggedTask?.id === task.id ? 'opacity-30' : ''}`}
                  >
                    {/* Task Header with Checkbox */}
                    <div className="flex items-start justify-between mb-3">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleTaskSelect(task.id, e.target.checked);
                        }}
                        className="rounded border-gray-300 mt-1 opacity-60 group-hover:opacity-100 transition-opacity"
                      />
                      <span className={`text-xs px-2 py-1 rounded-full font-medium shadow-sm ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    {/* Task Content */}
                    <div onClick={() => handleTaskClick(task)} className="cursor-pointer">
                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                        {task.title}
                      </h4>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {truncateText(task.description, 100)}
                        </p>
                      )}

                      {/* Task Meta */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          {task.assignee_name && (
                            <div className="flex items-center bg-gray-100/60 px-2 py-1 rounded-full">
                              <UserIcon className="h-3 w-3 mr-1" />
                              <span className="font-medium">{task.assignee_name}</span>
                            </div>
                          )}
                          {task.due_date && (
                            <div className="flex items-center bg-gray-100/60 px-2 py-1 rounded-full">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              <span>{formatDate(task.due_date)}</span>
                            </div>
                          )}
                        </div>
                        
                        {(task.comment_count > 0 || task.attachment_count > 0) && (
                          <div className="flex items-center space-x-2">
                            {task.comment_count > 0 && (
                              <span className="flex items-center bg-blue-100/60 px-2 py-1 rounded-full">
                                💬 {task.comment_count}
                              </span>
                            )}
                            {task.attachment_count > 0 && (
                              <span className="flex items-center bg-green-100/60 px-2 py-1 rounded-full">
                                📎 {task.attachment_count}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Quick Add Task */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300/60 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 hover:bg-white/40 transition-all duration-200 backdrop-blur-sm"
                >
                  <PlusIcon className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Add a task</span>
                </button>
              </div>
            </div>
          ))}
          
          {/* Add New Column */}
          <div className="w-80 flex-shrink-0">
            <button
              onClick={handleAddColumn}
              className="w-full h-40 border-2 border-dashed border-gray-300/60 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 hover:bg-white/40 transition-all duration-200 flex flex-col items-center justify-center backdrop-blur-sm"
            >
              <PlusIcon className="h-8 w-8 mb-2" />
              <span className="font-medium">Add another list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
        onSuccess={() => {
          setShowCreateModal(false);
        }}
      />

      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        taskId={selectedTask?.id}
        onUpdate={() => {
          // Handle task update
        }}
      />
    </div>
  );
};

export default KanbanBoard;
