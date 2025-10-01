import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import QuickActionMenu from '../components/QuickActionMenu';
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
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  PaperClipIcon,
  BugAntIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import api from '../utils/api';
import { formatDate, getPriorityColor, truncateText } from '../utils/helpers';
import TaskTimer from '../components/TaskTimer';
import EffortEstimation from '../components/EffortEstimation';
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
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [pendingChatTasks, setPendingChatTasks] = useState([]);
  const [chatChannels, setChatChannels] = useState([
    { id: 'general', name: 'general', icon: 'chat', description: 'General project discussion' },
    { id: 'team-chat', name: 'team-chat', icon: 'users', description: 'Team discussions' },
    { id: 'tasks', name: 'tasks', icon: 'clipboard', description: 'Task updates and assignments' }
  ]);
  const [projectName, setProjectName] = useState('Project Management System');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterButtonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, task: null });
  const [hoveredTask, setHoveredTask] = useState(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [quickMenuPosition, setQuickMenuPosition] = useState({ top: 0, left: 0 });
  const [quickMenuTask, setQuickMenuTask] = useState(null);
  const taskCardRefs = useRef({});
  const scrollContainerRef = useRef(null);

  // Keyboard shortcuts for hovered task
  useEffect(() => {
    if (!hoveredTask) return;

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
      const cardRef = taskCardRefs.current[hoveredTask.id];

      if (key === 'm' || key === 'd' || key === 't') {
        e.preventDefault();
        if (cardRef) {
          const rect = cardRef.getBoundingClientRect();
          const menuWidth = 320;
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          
          // Try to position beside the card (to the right)
          let left = rect.right + 8;
          let top = rect.top;
          
          // If menu would go off-screen to the right, position to the left
          if (left + menuWidth > windowWidth) {
            left = rect.left - menuWidth - 8;
          }
          
          // If still off-screen to the left, position below
          if (left < 0) {
            left = rect.left;
            top = rect.bottom + 8;
          }
          
          // Ensure menu doesn't go off bottom of screen
          if (top + 400 > windowHeight) {
            top = Math.max(8, windowHeight - 408);
          }
          
          setQuickMenuPosition({ top, left });
          setQuickMenuTask(hoveredTask);
          // Directly open the specific menu based on key pressed
          if (key === 'm') {
            setShowQuickMenu('assign');
          } else if (key === 'd') {
            setShowQuickMenu('duedate');
          } else if (key === 't') {
            setShowQuickMenu('tags');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [hoveredTask]);

  // Update menu position on scroll
  useEffect(() => {
    if (!showQuickMenu || !quickMenuTask) return;

    const updateMenuPosition = () => {
      const cardRef = taskCardRefs.current[quickMenuTask.id];
      if (cardRef) {
        const rect = cardRef.getBoundingClientRect();
        const menuWidth = 320;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Try to position beside the card (to the right)
        let left = rect.right + 8;
        let top = rect.top;
        
        // If menu would go off-screen to the right, position to the left
        if (left + menuWidth > windowWidth) {
          left = rect.left - menuWidth - 8;
        }
        
        // If still off-screen to the left, position below
        if (left < 0) {
          left = rect.left;
          top = rect.bottom + 8;
        }
        
        // Ensure menu doesn't go off bottom of screen
        if (top + 400 > windowHeight) {
          top = Math.max(8, windowHeight - 408);
        }
        
        setQuickMenuPosition({ top, left });
      }
    };

    // Update on scroll
    const handleScroll = () => {
      updateMenuPosition();
    };

    // Find all scrollable containers
    const scrollContainers = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
    scrollContainers.forEach(container => {
      container.addEventListener('scroll', handleScroll);
    });

    window.addEventListener('scroll', handleScroll);

    return () => {
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll);
      });
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showQuickMenu, quickMenuTask]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-dropdown')) {
        setShowFilterDropdown(false);
      }
      if (contextMenu.show && !event.target.closest('.context-menu')) {
        closeContextMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown, contextMenu.show]);

  // Calculate dropdown position
  const toggleFilterDropdown = () => {
    if (!showFilterDropdown && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
    setShowFilterDropdown(!showFilterDropdown);
  };

  // Get icon component for channel type
  const getChannelIcon = (iconType) => {
    const iconClass = "h-5 w-5";
    switch (iconType) {
      case 'chat':
        return <ChatBubbleLeftRightIcon className={iconClass} />;
      case 'users':
        return <UserGroupIcon className={iconClass} />;
      case 'clipboard':
        return <ClipboardDocumentListIcon className={iconClass} />;
      default:
        return <ChatBubbleLeftRightIcon className={iconClass} />;
    }
  };

  // Get initials from full name
  const getInitials = (fullName) => {
    if (!fullName) return '';
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('');
  };

  // Handle right-click context menu
  const handleContextMenu = (e, task) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      task: task
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, task: null });
  };

  // Toggle task type between task and bug
  const toggleTaskType = (task) => {
    const newType = task.type === 'bug' ? 'task' : 'bug';
    
    // Update the task in kanbanData
    setKanbanData(prevData => ({
      ...prevData,
      columns: prevData.columns.map(column => ({
        ...column,
        tasks: column.tasks.map(t => 
          t.id === task.id ? { ...t, type: newType } : t
        )
      }))
    }));
    
    closeContextMenu();
    toast.success(`Task marked as ${newType === 'bug' ? 'Bug' : 'Task'}`);
  };

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
            type: 'task',
            assignee_id: 'JD',
            assignee_name: 'John Doe',
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
            type: 'task',
            assignee_id: 'SW',
            assignee_name: 'Sarah Wilson',
            due_date: '2024-10-10',
            tags: ['research', 'analysis'],
            comment_count: 1,
            attachment_count: 0,
            created_at: '2024-09-20T14:30:00.000Z',
            updated_at: '2024-09-20T14:30:00.000Z'
          },
          {
            id: 'task-3',
            title: 'Fix login authentication bug',
            description: 'Users are unable to login with social media accounts',
            priority: 'urgent',
            type: 'bug',
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

  // Fetch project details
  const fetchProjectDetails = async () => {
    console.log('Fetching project details for ID:', projectId);
    
    // First, try to find the project in mock data
    const mockProject = mockProjects.find(project => project.id === projectId);
    
    if (mockProject) {
      console.log('Found project in mock data:', mockProject);
      setProjectName(mockProject.name);
      return;
    }

    // Set immediate fallback based on projectId if not found in mock data
    if (projectId) {
      let immediateProjectName;
      // If projectId is just a number, make it more meaningful
      if (/^\d+$/.test(projectId)) {
        immediateProjectName = `Project ${projectId}`;
      } else {
        // Format text-based projectIds
        immediateProjectName = projectId.charAt(0).toUpperCase() + projectId.slice(1).replace(/[-_]/g, ' ');
      }
      setProjectName(immediateProjectName);
    }

    // Try API as fallback
    try {
      const endpoints = [
        `/projects/${projectId}`,
        `/api/projects/${projectId}`,
        `/project/${projectId}`
      ];

      let projectData = null;
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          projectData = response.data;
          console.log(`Project data from ${endpoint}:`, projectData);
          break;
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError.message);
          continue;
        }
      }

      if (projectData) {
        const name = projectData.name || projectData.title || projectData.project_name || projectData.projectName || null;
        if (name) {
          console.log('Setting project name from API to:', name);
          setProjectName(name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch project details from API:', error);
    }
  };

  // Fetch project chat channels
  const fetchChatChannels = async () => {
    try {
      // Try multiple possible API endpoints
      const endpoints = [
        `/projects/${projectId}/chat/channels`,
        `/projects/${projectId}/channels`,
        `/chat/projects/${projectId}/channels`
      ];

      let channels = [];
      let success = false;

      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          const fetchedChannels = response.data.channels || response.data || [];
          // Ensure we have an array
          channels = Array.isArray(fetchedChannels) ? fetchedChannels : [];
          success = true;
          console.log(`Successfully fetched channels from ${endpoint}:`, channels);
          break;
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed:`, endpointError.message);
          continue;
        }
      }

      if (!success || channels.length === 0) {
        // Fallback to default project channels
        channels = [
          { id: 'general', name: 'general', icon: 'chat', description: 'General project discussion' },
          { id: 'team-chat', name: 'team-chat', icon: 'users', description: 'Team discussions' },
          { id: 'tasks', name: 'tasks', icon: 'clipboard', description: 'Task updates and assignments' }
        ];
        console.log('Using fallback channels:', channels);
      }

      setChatChannels(Array.isArray(channels) ? channels : []);
    } catch (error) {
      console.error('Failed to fetch chat channels:', error);
      // Fallback to default channels
      setChatChannels([
        { id: 'general', name: 'general', icon: 'chat', description: 'General project discussion' },
        { id: 'team-chat', name: 'team-chat', icon: 'users', description: 'Team discussions' },
        { id: 'tasks', name: 'tasks', icon: 'clipboard', description: 'Task updates and assignments' }
      ]);
    }
  };

  // Fetch project details on component mount
  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  // Clean up any stuck styles when kanban data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const allTaskCards = document.querySelectorAll('[data-task-id]');
      allTaskCards.forEach(card => {
        // Only reset if not currently being dragged
        if (!draggedTask || card.getAttribute('data-task-id') !== draggedTask.id) {
          card.style.opacity = '';
          card.style.transform = '';
          card.classList.remove('opacity-30');
        }
      });
    }, 100);

  }, [kanbanData, draggedTask]);

  // Simple drag handlers
  const handleTaskDragStart = (e, task) => {
    e.stopPropagation();
    setDraggedTask({ ...task });
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.setData('application/json', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTaskDragEnd = (e) => {
    e.stopPropagation();
    
    // Reset all drag states
    setDraggedTask(null);
    setDragOverColumn(null);
    
    // Force reset any stuck styles on all task cards
    setTimeout(() => {
      const allTaskCards = document.querySelectorAll('[data-task-id]');
      allTaskCards.forEach(card => {
        card.style.opacity = '';
        card.style.transform = '';
        card.classList.remove('opacity-30');
      });
    }, 100);
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
    e.stopPropagation();
    
    // Get task data from multiple sources for reliability
    const taskId = e.dataTransfer.getData('text/plain');
    let taskToMove = draggedTask;
    
    // Fallback to dataTransfer if draggedTask is not available
    if (!taskToMove && taskId) {
      try {
        const taskData = e.dataTransfer.getData('application/json');
        if (taskData) {
          taskToMove = JSON.parse(taskData);
        }
      } catch (error) {
        console.error('Error parsing task data:', error);
      }
    }
    
    if (!taskToMove || !taskToMove.id) {
      console.log('No valid task found to move');
      setDragOverColumn(null);
      return;
    }

    console.log('Dropping task:', taskToMove.id, taskToMove.title, 'to column:', targetColumnId);

    // Find source column using the specific task ID
    const sourceColumn = kanbanData.columns.find(col => 
      col.tasks.some(task => task.id === taskToMove.id)
    );
    
    if (!sourceColumn) {
      console.log('Source column not found for task:', taskToMove.id);
      setDragOverColumn(null);
      return;
    }

    if (sourceColumn.id === targetColumnId) {
      console.log('Same column, no move needed');
      setDragOverColumn(null);
      return;
    }

    console.log('Moving task', taskToMove.id, 'from:', sourceColumn.name, 'to:', targetColumnId);
    console.log('Source column current tasks:', sourceColumn.tasks.map(t => t.id));

    // Create new columns array with ONLY the specific task moved
    const newColumns = kanbanData.columns.map(col => {
      if (col.id === sourceColumn.id) {
        // Remove ONLY the specific task by ID
        const filteredTasks = col.tasks.filter(task => {
          const shouldKeep = task.id !== taskToMove.id;
          console.log(`Task ${task.id}: ${shouldKeep ? 'keeping' : 'removing'}`);
          return shouldKeep;
        });
        console.log('Source column tasks before:', col.tasks.length, 'after:', filteredTasks.length);
        console.log('Removed task IDs:', col.tasks.filter(t => !filteredTasks.includes(t)).map(t => t.id));
        return {
          ...col,
          tasks: filteredTasks
        };
      }
      if (col.id === targetColumnId) {
        // Add ONLY the specific task
        const newTasks = [...col.tasks, { ...taskToMove }];
        console.log('Target column tasks before:', col.tasks.length, 'after:', newTasks.length);
        console.log('Added task:', taskToMove.id);
        return {
          ...col,
          tasks: newTasks
        };
      }
      return col;
    });

    setKanbanData({
      ...kanbanData,
      columns: newColumns
    });

    const targetColumn = kanbanData.columns.find(col => col.id === targetColumnId);
    toast.success(`Task "${taskToMove.title}" moved to ${targetColumn.name}`);
    setDragOverColumn(null);
    
    // Force cleanup of any stuck styles after state update
    setTimeout(() => {
      const allTaskCards = document.querySelectorAll('[data-task-id]');
      allTaskCards.forEach(card => {
        card.style.opacity = '';
        card.style.transform = '';
        card.classList.remove('opacity-30');
        // Ensure proper background and styling
        if (!card.classList.contains('ring-2')) {
          card.style.backgroundColor = '';
          card.style.filter = '';
        }
      });
    }, 150);
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

  // Prepare tasks for chat channel selection
  const handlePrepareTasksForChat = async (taskIds) => {
    const tasks = [];
    kanbanData.columns.forEach(column => {
      column.tasks.forEach(task => {
        if (taskIds.includes(task.id)) {
          tasks.push(task);
        }
      });
    });
    
    if (tasks.length === 0) return;
    
    setPendingChatTasks(tasks);
    setShowChannelDropdown(true);
    
    // Fetch latest chat channels after showing dropdown (non-blocking)
    fetchChatChannels().catch(error => {
      console.error('Error fetching channels:', error);
      // Ensure we have fallback channels even if fetch fails
      setChatChannels([
        { id: 'general', name: 'general', icon: 'chat', description: 'General project discussion' },
        { id: 'team-chat', name: 'team-chat', icon: 'users', description: 'Team discussions' },
        { id: 'tasks', name: 'tasks', icon: 'clipboard', description: 'Task updates and assignments' }
      ]);
    });
  };

  // Send tasks to specific chat channel
  const handleSendToChannel = async (channelId) => {
    try {
      if (pendingChatTasks.length === 0) return;

      const channel = chatChannels.find(ch => ch.id === channelId);
      
      // Create a more chat-friendly message format
      const taskList = pendingChatTasks.map(task => 
        `• ${task.title} (${task.priority} priority) - ${task.assignee_name || 'Unassigned'}`
      ).join('\n');

      const message = `Task Update from Kanban Board:\n\n${taskList}`;

      // Try multiple API endpoints to ensure compatibility
      let success = false;
      const endpoints = [
        `/projects/${projectId}/chat/messages`, // General chat endpoint
        `/projects/${projectId}/messages`, // Alternative endpoint
        `/chat/projects/${projectId}/messages` // Another possible structure
      ];

      for (const endpoint of endpoints) {
        try {
          await api.post(endpoint, {
            message: message,
            channel: channelId,
            type: 'task_notification',
            metadata: {
              source: 'kanban_board',
              tasks: pendingChatTasks.map(task => ({
                id: task.id,
                title: task.title,
                priority: task.priority,
                assignee: task.assignee_name,
                due_date: task.due_date
              }))
            }
          });
          success = true;
          break;
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed, trying next...`);
          continue;
        }
      }

      if (!success) {
        throw new Error('All endpoints failed');
      }

      toast.success(`${pendingChatTasks.length} task(s) sent to #${channel.name} channel`);
      
      // Clear states
      setPendingChatTasks([]);
      setShowChannelDropdown(false);
      
      // Clear selection if bulk action
      if (selectedTasks.size > 0) {
        setSelectedTasks(new Set());
        setShowBulkActions(false);
      }
    } catch (error) {
      toast.error('Failed to send tasks to chat channel');
      console.error('Send to chat error:', error);
      
      // For debugging - show what we tried to send
      console.log('Attempted to send:', {
        projectId,
        channelId,
        tasks: pendingChatTasks,
        message: `Task Update: ${pendingChatTasks.map(t => t.title).join(', ')}`
      });
    }
  };

  const handleBulkSendToChat = () => {
    handlePrepareTasksForChat(Array.from(selectedTasks));
  };

  const handleSingleTaskToChat = (task) => {
    handlePrepareTasksForChat([task.id]);
  };

  // Quick menu handlers
  const handleQuickAssign = (user) => {
    if (!quickMenuTask) return;
    
    // Update task with new assignee
    const updatedColumns = kanbanData.columns.map(col => ({
      ...col,
      tasks: col.tasks.map(t => 
        t.id === quickMenuTask.id 
          ? { ...t, assignee_id: user.id, assignee_name: `${user.first_name} ${user.last_name}` }
          : t
      )
    }));
    
    setKanbanData({ ...kanbanData, columns: updatedColumns });
    toast.success(`Assigned to ${user.first_name} ${user.last_name}`);
  };

  const handleQuickDueDate = (date) => {
    if (!quickMenuTask) return;
    
    // Update task with new due date
    const updatedColumns = kanbanData.columns.map(col => ({
      ...col,
      tasks: col.tasks.map(t => 
        t.id === quickMenuTask.id 
          ? { ...t, due_date: date }
          : t
      )
    }));
    
    setKanbanData({ ...kanbanData, columns: updatedColumns });
    toast.success('Due date updated');
  };

  const handleQuickTags = (tags) => {
    if (!quickMenuTask) return;
    
    // Update task with new tags
    const updatedColumns = kanbanData.columns.map(col => ({
      ...col,
      tasks: col.tasks.map(t => 
        t.id === quickMenuTask.id 
          ? { ...t, tags }
          : t
      )
    }));
    
    setKanbanData({ ...kanbanData, columns: updatedColumns });
    toast.success('Tags updated');
  };

  const handleBulkDueDate = (dueDate) => {
    if (!dueDate) return;
    
    // For now, just show a toast - this would integrate with your task update API
    toast.success(`Due date set to ${dueDate} for ${selectedTasks.size} task(s)`);
    setSelectedTasks(new Set());
    setShowBulkActions(false);
  };

  return (
    <div className="min-h-screen flex flex-col p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Project Header */}
      <div className="flex items-center mb-4">
        <Link
          to={`/projects/${projectId}`}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors mr-3"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{projectName}</h1>
      </div>

      {/* Full Width Control Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          {/* Left Side - Select All & Bulk Actions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTasks.size > 0 && selectedTasks.size === kanbanData.columns.reduce((total, col) => total + col.tasks.length, 0)}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 mr-2"
              />
              <span className="text-sm text-gray-700">Select All</span>
            </div>

            {/* Bulk Actions - Show when tasks are selected */}
            {showBulkActions && (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
                <span className="text-sm text-gray-600">{selectedTasks.size} task(s) selected</span>
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
                  onClick={handleBulkSendToChat}
                  className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                  Send to Chat
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
            )}
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Filter Dropdown */}
            <div className="relative filter-dropdown">
              <button 
                ref={filterButtonRef}
                onClick={toggleFilterDropdown}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* Filter Dropdown Portal */}
            {showFilterDropdown && createPortal(
              <div 
                className="fixed w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-[99999] filter-dropdown"
                style={{
                  top: `${dropdownPosition.top}px`,
                  right: `${dropdownPosition.right}px`
                }}
              >
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search Tasks</label>
                      <input
                        type="search"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <option value="">All Status</option>
                        <option value="todo">To Do</option>
                        <option value="inprogress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <option value="">All Assignees</option>
                        <option value="john">John Doe</option>
                        <option value="jane">Jane Smith</option>
                        <option value="demo">Demo User</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          placeholder="From"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="date"
                          placeholder="To"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date Filter</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <option value="">All Dates</option>
                        <option value="overdue">Overdue</option>
                        <option value="today">Due Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-between pt-2">
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setPriorityFilter('');
                          // Reset other filters here
                        }}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Clear All
                      </button>
                      <button 
                        onClick={() => setShowFilterDropdown(false)}
                        className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            
            <Link
              to={`/projects/${projectId}/list`}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ListBulletIcon className="h-4 w-4 mr-2" />
              List View
            </Link>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-8">
        <div className="flex space-x-4 items-start" style={{ minWidth: 'max-content', minHeight: 'calc(100vh - 200px)' }}>
          {kanbanData.columns.map((column) => (
            <div 
              key={column.id}
              className={`w-80 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex flex-col transition-all duration-200 ${
                dragOverColumn === column.id ? 'ring-2 ring-blue-400 bg-blue-50/80 scale-105' : ''
              } ${draggedColumn?.id === column.id ? 'opacity-70 scale-105 rotate-2' : ''}`}
              style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}
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
                  height: 'calc(100vh - 300px)',
                  minHeight: '500px',
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
                    ref={(el) => taskCardRefs.current[task.id] = el}
                    data-task-id={task.id}
                    draggable
                    onDragStart={(e) => handleTaskDragStart(e, task)}
                    onDragEnd={handleTaskDragEnd}
                    onContextMenu={(e) => handleContextMenu(e, task)}
                    onMouseEnter={() => setHoveredTask(task)}
                    onMouseLeave={() => setHoveredTask(null)}
                    className={`relative bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-md hover:shadow-lg cursor-move group transition-all duration-200 ${
                      task.type === 'bug' 
                        ? 'border-2 border-red-400 bg-red-50/90' 
                        : hoveredTask?.id === task.id 
                          ? 'border-2 border-primary-500' 
                          : 'border border-white/40'
                    } ${
                      selectedTasks.has(task.id) ? 'ring-2 ring-primary-500 bg-primary-50/90' : ''
                    } ${draggedTask?.id === task.id ? 'opacity-30' : 'opacity-100'}`}
                  >
                    {/* Task Header with Checkbox and Actions */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleTaskSelect(task.id, e.target.checked);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 mt-1 opacity-60 group-hover:opacity-100 transition-opacity"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSingleTaskToChat(task);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                          title="Send to Chat"
                        >
                          <PaperAirplaneIcon className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        {task.type === 'bug' && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <BugAntIcon className="h-3 w-3" />
                            <span>Bug</span>
                          </div>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium shadow-sm ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>

                    {/* Task Content */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task);
                      }} 
                      onMouseDown={(e) => e.stopPropagation()}
                      className="cursor-pointer"
                    >
                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                        {task.title}
                      </h4>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {truncateText(task.description, 100)}
                        </p>
                      )}

                      {/* Timer and Estimation */}
                      <div className="mb-3 space-y-2">
                        <TaskTimer task={task} size="sm" showStats={false} />
                        <EffortEstimation 
                          task={task} 
                          size="sm"
                          onUpdate={(updatedTask) => {
                            // Update task in kanbanData
                            setKanbanData(prev => ({
                              ...prev,
                              columns: prev.columns.map(col => ({
                                ...col,
                                tasks: col.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
                              }))
                            }));
                            toast.success('Task estimation updated!');
                          }}
                        />
                      </div>

                      {/* Task Meta */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          {task.assignee_name && (
                            <div className="flex items-center bg-gray-100/60 px-2 py-1 rounded-full">
                              <UserIcon className="h-3 w-3 mr-1" />
                              <span className="font-medium">{getInitials(task.assignee_name)}</span>
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
                              <span className="flex items-center bg-blue-100/60 px-2 py-1 rounded-full text-xs">
                                <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                                {task.comment_count}
                              </span>
                            )}
                            {task.attachment_count > 0 && (
                              <span className="flex items-center bg-green-100/60 px-2 py-1 rounded-full text-xs">
                                <PaperClipIcon className="h-3 w-3 mr-1" />
                                {task.attachment_count}
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
              className="w-full border-2 border-dashed border-gray-300/60 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 hover:bg-white/40 transition-all duration-200 flex flex-col items-center justify-center backdrop-blur-sm"
              style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}
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

      {/* Channel Selection Modal */}
      {showChannelDropdown && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Send to Chat Channel
              </h3>
              <button
                onClick={() => {
                  setShowChannelDropdown(false);
                  setPendingChatTasks([]);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Sending {pendingChatTasks.length} task(s) to chat channel:
              </p>
              <div className="mt-2 space-y-1">
                {pendingChatTasks.map(task => (
                  <div key={task.id} className="text-xs bg-gray-50 rounded px-2 py-1 flex items-center">
                    <ClipboardDocumentListIcon className="h-3 w-3 mr-1" />
                    {task.title}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {!Array.isArray(chatChannels) || chatChannels.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-500">Loading chat channels...</p>
                </div>
              ) : (
                chatChannels.map(channel => (
                  <button
                    key={channel.id}
                    onClick={() => handleSendToChannel(channel.id)}
                    className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 text-left"
                  >
                    <div className="mr-3 p-2 bg-gray-100 rounded-lg">
                      {getChannelIcon(channel.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">#{channel.name}</div>
                      <div className="text-sm text-gray-500">
                        {channel.description || `${channel.name} channel`}
                      </div>
                    </div>
                    <PaperAirplaneIcon className="h-4 w-4 text-gray-400" />
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowChannelDropdown(false);
                  setPendingChatTasks([]);
                }}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[99999] context-menu"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`
          }}
        >
          <div className="py-1">
            <button
              onClick={() => toggleTaskType(contextMenu.task)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
            >
              {contextMenu.task?.type === 'bug' ? (
                <>
                  <DocumentTextIcon className="h-4 w-4 text-blue-500" />
                  <span>Mark as Task</span>
                </>
              ) : (
                <>
                  <BugAntIcon className="h-4 w-4 text-red-500" />
                  <span>Mark as Bug</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Quick Action Menu */}
      {showQuickMenu && quickMenuTask && (
        <QuickActionMenu
          task={quickMenuTask}
          position={quickMenuPosition}
          initialMenu={showQuickMenu}
          onAssign={handleQuickAssign}
          onDueDate={handleQuickDueDate}
          onTags={handleQuickTags}
          onClose={() => {
            setShowQuickMenu(false);
            setQuickMenuTask(null);
          }}
          teamMembers={[
            { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
            { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
            { id: 3, first_name: 'Mike', last_name: 'Johnson', email: 'mike@example.com' },
          ]}
          availableTags={[
            { id: 1, name: 'Frontend', color: '#3b82f6' },
            { id: 2, name: 'Backend', color: '#10b981' },
            { id: 3, name: 'Design', color: '#f59e0b' },
            { id: 4, name: 'Bug', color: '#ef4444' },
            { id: 5, name: 'Feature', color: '#8b5cf6' },
          ]}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
