import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  PlusIcon, 
  EllipsisVerticalIcon,
  ArrowLeftIcon,
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
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import api from '../utils/api';
import { useSocket } from '../contexts/SocketContext';
import { formatDate, getPriorityColor, truncateText } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import toast from 'react-hot-toast';

const KanbanBoard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [newColumnName, setNewColumnName] = useState('');
  const filters = React.useMemo(() => ({
    assignee: assigneeFilter,
    priority: priorityFilter,
    search: searchQuery,
  }), [assigneeFilter, priorityFilter, searchQuery]);
  const queryClient = useQueryClient();
  const { socket, joinProject, leaveProject, updateKanban } = useSocket();

  // Join project room for real-time updates
  useEffect(() => {
    if (projectId) {
      joinProject(projectId);
      return () => leaveProject(projectId);
    }
  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleTaskClick = (task) => {
      setSelectedTask(task);
            ...column,
            tasks: column.tasks.map(t => t.id === task.id ? task : t)
          }))
        };
      });
    };

    const handleTaskCreated = (task) => {
      queryClient.invalidateQueries(['kanban', projectId]);
      toast.success('New task created');
    };

    const handleKanbanUpdated = (update) => {
      queryClient.invalidateQueries(['kanban', projectId]);
    };

    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_created', handleTaskCreated);
    socket.on('kanban_updated', handleKanbanUpdated);

    return () => {
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_created', handleTaskCreated);
      socket.off('kanban_updated', handleKanbanUpdated);
    };
  }, [socket, projectId, queryClient]);

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
    onSuccess: (data) => {
      queryClient.invalidateQueries(['kanban', projectId]);
      updateKanban(projectId, { type: 'task_moved', task: data.task });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
      queryClient.invalidateQueries(['kanban', projectId]);
    },
  });

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = kanbanData.columns.find(col => col.id === source.droppableId);
    const destColumn = kanbanData.columns.find(col => col.id === destination.droppableId);
    const task = sourceColumn.tasks.find(task => task.id === draggableId);

    // Update task position and column
    updateTaskMutation.mutate({
      taskId: draggableId,
      updates: {
        column_id: destination.droppableId,
        position: destination.index,
        status: destColumn.name,
      },
    });

    // Optimistic update
    queryClient.setQueryData(['kanban', projectId], (oldData) => {
      if (!oldData) return oldData;

      const newColumns = oldData.columns.map(column => {
        if (column.id === source.droppableId) {
          return {
            ...column,
            tasks: column.tasks.filter(t => t.id !== draggableId)
          };
        }
        if (column.id === destination.droppableId) {
          const newTasks = [...column.tasks];
          newTasks.splice(destination.index, 0, {
            ...task,
            column_id: destination.droppableId,
            status: column.name
          });
          return {
            ...column,
            tasks: newTasks
          };
        }
        return column;
      });

      return { ...oldData, columns: newColumns };
    });
  };

  const handleCreateTask = (columnId) => {
    setCreateModalColumn(columnId);
    setShowCreateModal(true);
  };

  // Filter tasks
  const filteredColumns = kanbanData?.columns?.map(column => ({
    ...column,
    tasks: column.tasks.filter(task => {
      const matchesSearch = !filters.search || 
        task.title.toLowerCase().includes(filters.search.toLowerCase());
      const matchesAssignee = !filters.assignee || 
        task.assignee_ids?.includes(filters.assignee);
      const matchesPriority = !filters.priority || 
        task.priority === filters.priority;
      
      return matchesSearch && matchesAssignee && matchesPriority;
    })
  })) || [];

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
        
        <div className="flex items-center space-x-4">
          {/* Filters */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="input w-48"
            />
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="input"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button className="btn-outline">
              <FunnelIcon className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-6 pb-6" style={{ minWidth: 'max-content' }}>
            {filteredColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onCreateTask={() => handleCreateTask(column.id)}
                onTaskClick={setSelectedTask}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateModalColumn(null);
        }}
        projectId={projectId}
        columnId={createModalColumn}
        onSuccess={() => {
          setShowCreateModal(false);
          setCreateModalColumn(null);
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

const KanbanColumn = ({ column, onCreateTask, onTaskClick }) => {
  return (
    <div className="kanban-column">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-semibold text-gray-900">{column.name}</h3>
          <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
            {column.tasks.length}
          </span>
        </div>
        <button
          onClick={onCreateTask}
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Tasks */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-3 min-h-[200px] ${
              snapshot.isDraggingOver ? 'bg-primary-50 rounded-lg' : ''
            }`}
          >
            {column.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {provided.placeholder}
            
            {/* Quick Add */}
            <button
              onClick={onCreateTask}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <PlusIcon className="h-4 w-4 mx-auto" />
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
};

const TaskCard = ({ task, index, onClick }) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`kanban-card ${snapshot.isDragging ? 'dragging' : ''}`}
          onClick={onClick}
        >
          {/* Task Type Indicator */}
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              task.type === 'issue' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {task.type === 'issue' ? '🐛 Issue' : '📋 Task'}
            </span>
            <span className={`badge text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>

          {/* Title */}
          <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
            {task.title}
          </h4>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {truncateText(task.description, 80)}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center space-x-3">
              {task.comment_count > 0 && (
                <div className="flex items-center">
                  <ChatBubbleLeftIcon className="h-3 w-3 mr-1" />
                  {task.comment_count}
                </div>
              )}
              {task.attachment_count > 0 && (
                <div className="flex items-center">
                  <PaperClipIcon className="h-3 w-3 mr-1" />
                  {task.attachment_count}
                </div>
              )}
              {task.checklist_total > 0 && (
                <div className="flex items-center">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  {task.checklist_completed}/{task.checklist_total}
                </div>
              )}
            </div>
            {task.due_date && (
              <div className={`flex items-center ${
                new Date(task.due_date) < new Date() ? 'text-red-600' : ''
              }`}>
                <CalendarIcon className="h-3 w-3 mr-1" />
                {formatDate(task.due_date, 'MMM dd')}
              </div>
            )}
          </div>

          {/* Assignees */}
          {task.assignee_names && task.assignee_names.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex -space-x-1">
                {task.assignee_names.slice(0, 3).map((name, idx) => (
                  <div
                    key={idx}
                    className="h-6 w-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-700"
                    title={name}
                  >
                    {name.split(' ').map(n => n[0]).join('')}
                  </div>
                ))}
                {task.assignee_names.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                    +{task.assignee_names.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default KanbanBoard;
