import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { 
  XMarkIcon, 
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CalendarIcon,
  TagIcon,
  PlusIcon,
  MinusIcon,
  DocumentTextIcon,
  BugAntIcon,
  ClockIcon,
  FlagIcon,
  ChartBarIcon,
  BoltIcon,
  UserGroupIcon,
  PhotoIcon,
  LinkIcon,
  EyeIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { DatePicker } from '@mantine/dates';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import amplifyDataService from '../services/amplifyDataService';
import { formatDateTime, getPriorityColor, getStatusColor } from '../utils/helpers';
import LoadingSpinner from './LoadingSpinner';
import Avatar from './Avatar';
import RichTextEditor from './RichTextEditor';
import toast from 'react-hot-toast';

const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21];
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const LABEL_COLORS = [
  { name: 'Frontend', color: '#3B82F6' },
  { name: 'Backend', color: '#10B981' },
  { name: 'Design', color: '#F59E0B' },
  { name: 'Bug', color: '#EF4444' },
  { name: 'Feature', color: '#8B5CF6' },
  { name: 'Documentation', color: '#6B7280' },
];

const EnhancedTaskDetailModal = ({ isOpen, onClose, taskId, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [selectedWatchers, setSelectedWatchers] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [watcherSearch, setWatcherSearch] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [activityLog, setActivityLog] = useState([]);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  // Field arrays
  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control,
    name: 'subtasks',
  });

  const { fields: checklistFields, append: appendChecklist, remove: removeChecklist } = useFieldArray({
    control,
    name: 'checklists',
  });

  // Fetch task details from Amplify
  const { data: taskData, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const result = await amplifyDataService.tasks.get(taskId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch task');
      }
      return { task: result.data };
    },
    enabled: !!taskId && isOpen,
  });

  // Fetch real users data from Amplify
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const result = await amplifyDataService.users.list();
      return { users: result.success ? result.data : [] };
    },
  });

  // Fetch all tasks for dependencies
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', taskData?.task?.projectId],
    queryFn: async () => {
      const result = await amplifyDataService.tasks.list({ projectId: taskData?.task?.projectId });
      return result.success ? result.data : [];
    },
    enabled: !!taskData?.task?.projectId,
  });

  // Initialize form when task data is loaded
  useEffect(() => {
    if (taskData?.task) {
      const task = taskData.task;
      reset({
        title: task.title,
        status: task.status,
        priority: task.priority,
        type: task.type || 'TASK',
        risk_level: task.risk_level || 'LOW',
        start_date: task.start_date || null,
        due_date: task.due_date || null,
        estimated_hours: task.estimated_hours || '',
        story_points: task.story_points || '',
        tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
        epic_id: task.epic_id || '',
        dependencies: task.dependencies || [],
        subtasks: task.subtasks || [{ title: '', completed: false }],
        checklists: task.checklists || [{ name: '', items: [{ text: '', completed: false }] }],
        recurring_pattern: task.recurring_pattern || '',
        recurring_interval: task.recurring_interval || 1,
      });
      setDescription(task.description || '');
      setSelectedAssignees(task.assignee_ids?.map(id => 
        usersData?.users?.find(u => u.id === id)
      ).filter(Boolean) || []);
      setSelectedWatchers(task.watcher_ids?.map(id => 
        usersData?.users?.find(u => u.id === id)
      ).filter(Boolean) || []);
      setSelectedLabels(task.labels || []);
      setAttachments(task.attachments || []);
      setLinks(task.links || []);
      setCoverImage(task.cover_image || '');
      setIsRecurring(task.is_recurring || false);
      setActivityLog(task.activity_log || []);
    }
  }, [taskData, reset, usersData]);

  // Update task mutation with real Amplify
  const updateTaskMutation = useMutation({
    mutationFn: async (updates) => {
      const result = await amplifyDataService.tasks.update(taskId, {
        ...updates,
        assignee_ids: selectedAssignees.map(u => u.id),
        watcher_ids: selectedWatchers.map(u => u.id),
        labels: selectedLabels,
        attachments,
        links,
        cover_image: coverImage,
        is_recurring: isRecurring,
      });
      if (!result.success) {
        throw new Error(result.error || 'Failed to update task');
      }
      return { task: result.data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task', taskId]);
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task updated successfully');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    },
    onError: (error) => {
      toast.error('Failed to update task');
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (comment) => {
      const result = await amplifyDataService.comments.create({
        taskId,
        content: comment,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task', taskId]);
      setNewComment('');
      toast.success('Comment added successfully');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const result = await amplifyDataService.tasks.delete(taskId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task deleted successfully');
      onClose();
      if (onUpdate) onUpdate();
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });

  const handleSubmitTask = (data) => {
    const updates = {
      ...data,
      description,
      tags: typeof data.tags === 'string' 
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) 
        : (Array.isArray(data.tags) ? data.tags : []),
      estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
      story_points: data.story_points ? parseInt(data.story_points) : null,
      subtasks: data.subtasks.filter(st => st.title?.trim()),
      checklists: data.checklists.filter(checklist => 
        checklist.name?.trim() || checklist.items?.some(item => item.text?.trim())
      ),
    };
    updateTaskMutation.mutate(updates);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate();
    }
  };

  const addAssignee = (user) => {
    if (!selectedAssignees.find(a => a.id === user.id)) {
      setSelectedAssignees([...selectedAssignees, user]);
    }
    setAssigneeSearch('');
  };

  const removeAssignee = (userId) => {
    setSelectedAssignees(selectedAssignees.filter(a => a.id !== userId));
  };

  const addWatcher = (user) => {
    if (!selectedWatchers.find(w => w.id === user.id)) {
      setSelectedWatchers([...selectedWatchers, user]);
    }
    setWatcherSearch('');
  };

  const removeWatcher = (userId) => {
    setSelectedWatchers(selectedWatchers.filter(w => w.id !== userId));
  };

  const toggleLabel = (label) => {
    if (selectedLabels.find(l => l.name === label.name)) {
      setSelectedLabels(selectedLabels.filter(l => l.name !== label.name));
    } else {
      setSelectedLabels([...selectedLabels, label]);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files.map(f => ({ name: f.name, size: f.size, file: f }))]);
  };

  const addLink = () => {
    if (newLink.trim()) {
      setLinks([...links, { url: newLink, title: newLink }]);
      setNewLink('');
    }
  };

  const calculateProgress = () => {
    if (!taskData?.task) return 0;
    
    const task = taskData.task;
    let total = 0;
    let completed = 0;

    // Count subtasks
    if (task.subtasks?.length > 0) {
      total += task.subtasks.length;
      completed += task.subtasks.filter(st => st.completed).length;
    }

    // Count checklist items
    if (task.checklists?.length > 0) {
      task.checklists.forEach(checklist => {
        if (checklist.items?.length > 0) {
          total += checklist.items.length;
          completed += checklist.items.filter(item => item.completed).length;
        }
      });
    }

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl p-8">
            <LoadingSpinner size="lg" />
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  if (!taskData?.task) return null;

  const task = taskData.task;
  const progress = calculateProgress();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Cover Image */}
                {(coverImage || task.cover_image) && (
                  <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
                    {(coverImage || task.cover_image) && (
                      <img 
                        src={coverImage || task.cover_image} 
                        alt="Cover" 
                        className="w-full h-full object-cover"
                      />
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Task Type Badge */}
                      <div className="flex items-center space-x-2 mb-3">
                        {task.type === 'BUG' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <BugAntIcon className="h-4 w-4 mr-1" />
                            Bug
                          </span>
                        ) : task.type === 'EPIC' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            <BoltIcon className="h-4 w-4 mr-1" />
                            Epic
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Task
                          </span>
                        )}
                        
                        {/* Labels */}
                        {selectedLabels.map(label => (
                          <span
                            key={label.name}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: label.color + '20',
                              color: label.color,
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </div>

                      {/* Title */}
                      {isEditing ? (
                        <input
                          {...register('title', { required: true })}
                          className="text-2xl font-bold text-gray-900 w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2"
                        />
                      ) : (
                        <Dialog.Title className="text-2xl font-bold text-gray-900">
                          {task.title}
                        </Dialog.Title>
                      )}

                      {/* Progress Bar */}
                      {progress > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span className="font-semibold">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!isEditing ? (
                        <>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={handleDelete}
                            className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      ) : null}
                      <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex">
                  {/* Main Content - 2/3 width */}
                  <div className="flex-1 p-6 space-y-6">
                    <form onSubmit={handleSubmit(handleSubmitTask)}>
                      <Tab.Group>
                        <Tab.List className="flex space-x-1 border-b border-gray-200 mb-6">
                          <Tab className={({ selected }) =>
                            `px-4 py-2 text-sm font-medium transition-colors ${
                              selected
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`
                          }>
                            Details
                          </Tab>
                          <Tab className={({ selected }) =>
                            `px-4 py-2 text-sm font-medium transition-colors ${
                              selected
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`
                          }>
                            Subtasks
                          </Tab>
                          <Tab className={({ selected }) =>
                            `px-4 py-2 text-sm font-medium transition-colors ${
                              selected
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`
                          }>
                            Activity
                          </Tab>
                          <Tab className={({ selected }) =>
                            `px-4 py-2 text-sm font-medium transition-colors ${
                              selected
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`
                          }>
                            Attachments
                          </Tab>
                        </Tab.List>

                        <Tab.Panels>
                          {/* Details Tab */}
                          <Tab.Panel className="space-y-6">
                            {/* Description */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Description
                              </label>
                              {isEditing ? (
                                <RichTextEditor
                                  value={description}
                                  onChange={setDescription}
                                  placeholder="Add a description..."
                                />
                              ) : (
                                <div className="prose max-w-none text-gray-700">
                                  {description || <span className="text-gray-400 italic">No description</span>}
                                </div>
                              )}
                            </div>

                            {/* Checklists */}
                            {isEditing && (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="block text-sm font-semibold text-gray-700">
                                    Checklists
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => appendChecklist({ name: '', items: [{ text: '', completed: false }] })}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                  >
                                    + Add Checklist
                                  </button>
                                </div>
                                
                                <div className="space-y-4">
                                  {checklistFields.map((field, checklistIndex) => (
                                    <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                                      <div className="flex items-center space-x-2 mb-3">
                                        <input
                                          {...register(`checklists.${checklistIndex}.name`)}
                                          type="text"
                                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                          placeholder="Checklist name..."
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeChecklist(checklistIndex)}
                                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                        >
                                          <MinusIcon className="h-5 w-5" />
                                        </button>
                                      </div>
                                      
                                      <Controller
                                        name={`checklists.${checklistIndex}.items`}
                                        control={control}
                                        render={({ field: itemsField }) => (
                                          <div className="space-y-2">
                                            {(itemsField.value || []).map((item, itemIndex) => (
                                              <div key={itemIndex} className="flex items-center space-x-2">
                                                <input
                                                  type="checkbox"
                                                  checked={item.completed}
                                                  onChange={(e) => {
                                                    const newItems = [...itemsField.value];
                                                    newItems[itemIndex] = { ...item, completed: e.target.checked };
                                                    itemsField.onChange(newItems);
                                                  }}
                                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <input
                                                  value={item.text}
                                                  onChange={(e) => {
                                                    const newItems = [...itemsField.value];
                                                    newItems[itemIndex] = { ...item, text: e.target.value };
                                                    itemsField.onChange(newItems);
                                                  }}
                                                  type="text"
                                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                  placeholder="Checklist item..."
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const newItems = itemsField.value.filter((_, i) => i !== itemIndex);
                                                    itemsField.onChange(newItems);
                                                  }}
                                                  className="p-1 text-red-500 hover:text-red-700"
                                                >
                                                  <XMarkIcon className="h-4 w-4" />
                                                </button>
                                              </div>
                                            ))}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                itemsField.onChange([...(itemsField.value || []), { text: '', completed: false }]);
                                              }}
                                              className="text-sm text-blue-600 hover:text-blue-700"
                                            >
                                              + Add Item
                                            </button>
                                          </div>
                                        )}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Tab.Panel>

                          {/* Subtasks Tab */}
                          <Tab.Panel className="space-y-4">
                            {isEditing && (
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => appendSubtask({ title: '', completed: false })}
                                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  + Add Subtask
                                </button>
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              {subtaskFields.map((field, index) => (
                                <div key={field.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                  {isEditing ? (
                                    <>
                                      <input
                                        type="checkbox"
                                        {...register(`subtasks.${index}.completed`)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <input
                                        {...register(`subtasks.${index}.title`)}
                                        type="text"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Subtask title..."
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeSubtask(index)}
                                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg"
                                      >
                                        <MinusIcon className="h-5 w-5" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircleIcon className={`h-5 w-5 ${field.completed ? 'text-green-500' : 'text-gray-300'}`} />
                                      <span className={field.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                                        {field.title}
                                      </span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </Tab.Panel>

                          {/* Activity Tab */}
                          <Tab.Panel className="space-y-4">
                            <div className="space-y-3">
                              {activityLog.length > 0 ? (
                                activityLog.map((activity, index) => (
                                  <div key={index} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <Avatar user={activity.user} size="sm" />
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-900">
                                        <span className="font-semibold">{activity.user?.name}</span>
                                        {' '}{activity.action}
                                      </p>
                                      <p className="text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                  <p>No activity yet</p>
                                </div>
                              )}
                            </div>
                          </Tab.Panel>

                          {/* Attachments Tab */}
                          <Tab.Panel className="space-y-6">
                            {isEditing && (
                              <>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Upload Files
                                  </label>
                                  <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Add Link
                                  </label>
                                  <div className="flex space-x-2">
                                    <input
                                      type="url"
                                      value={newLink}
                                      onChange={(e) => setNewLink(e.target.value)}
                                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="https://example.com"
                                    />
                                    <button
                                      type="button"
                                      onClick={addLink}
                                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Files List */}
                            {attachments.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Files</h4>
                                <div className="space-y-2">
                                  {attachments.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                      <div className="flex items-center space-x-3">
                                        <PaperClipIcon className="h-5 w-5 text-gray-400" />
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                      </div>
                                      {isEditing && (
                                        <button
                                          type="button"
                                          onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <XMarkIcon className="h-5 w-5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Links List */}
                            {links.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Links</h4>
                                <div className="space-y-2">
                                  {links.map((link, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                      <div className="flex items-center space-x-3">
                                        <LinkIcon className="h-5 w-5 text-gray-400" />
                                        <a
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                        >
                                          {link.title}
                                        </a>
                                      </div>
                                      {isEditing && (
                                        <button
                                          type="button"
                                          onClick={() => setLinks(links.filter((_, i) => i !== index))}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <XMarkIcon className="h-5 w-5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Tab.Panel>
                        </Tab.Panels>
                      </Tab.Group>

                      {/* Comments Section */}
                      <div className="mt-8">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Comments</h4>
                        
                        {/* Add Comment */}
                        <div className="flex space-x-3 mb-4">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={2}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Add a comment..."
                          />
                          <button
                            type="button"
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChatBubbleLeftIcon className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3">
                          {task.comments?.map((comment) => (
                            <div key={comment.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
                              <Avatar user={{ name: comment.author }} size="sm" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-semibold text-gray-900">{comment.author}</span>
                                  <span className="text-xs text-gray-500">{formatDateTime(comment.created_at)}</span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Save Button (when editing) */}
                      {isEditing && (
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={updateTaskMutation.isLoading}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                          >
                            {updateTaskMutation.isLoading ? (
                              <LoadingSpinner size="sm" color="white" />
                            ) : (
                              <>
                                <CheckCircleIcon className="h-5 w-5" />
                                <span>Save Changes</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Sidebar - 1/3 width */}
                  <div className="w-80 border-l border-gray-200 p-6 bg-gray-50 space-y-6">
                    {/* Status & Priority */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">STATUS</label>
                        {isEditing ? (
                          <select
                            {...register('status')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">PRIORITY</label>
                        {isEditing ? (
                          <select
                            {...register('priority')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">RISK LEVEL</label>
                        {isEditing ? (
                          <select
                            {...register('risk_level')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            {RISK_LEVELS.map(level => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            task.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            task.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            task.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.risk_level || 'LOW'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          <CalendarIcon className="h-3 w-3 inline mr-1" />
                          START DATE
                        </label>
                        {isEditing ? (
                          <MantineProvider>
                            <Controller
                              name="start_date"
                              control={control}
                              render={({ field }) => (
                                <DatePicker
                                  {...field}
                                  value={field.value ? new Date(field.value) : null}
                                  onChange={(date) => field.onChange(date ? date.toISOString() : null)}
                                  placeholder="Select start date"
                                  size="sm"
                                />
                              )}
                            />
                          </MantineProvider>
                        ) : (
                          <p className="text-sm text-gray-900">{task.start_date ? formatDateTime(task.start_date) : 'Not set'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          <CalendarIcon className="h-3 w-3 inline mr-1" />
                          DUE DATE
                        </label>
                        {isEditing ? (
                          <MantineProvider>
                            <Controller
                              name="due_date"
                              control={control}
                              render={({ field }) => (
                                <DatePicker
                                  {...field}
                                  value={field.value ? new Date(field.value) : null}
                                  onChange={(date) => field.onChange(date ? date.toISOString() : null)}
                                  placeholder="Select due date"
                                  size="sm"
                                />
                              )}
                            />
                          </MantineProvider>
                        ) : (
                          <p className="text-sm text-gray-900">{task.due_date ? formatDateTime(task.due_date) : 'Not set'}</p>
                        )}
                      </div>
                    </div>

                    {/* Estimation */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          <ClockIcon className="h-3 w-3 inline mr-1" />
                          ESTIMATED HOURS
                        </label>
                        {isEditing ? (
                          <input
                            {...register('estimated_hours')}
                            type="number"
                            step="0.5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="8"
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{task.estimated_hours ? `${task.estimated_hours}h` : 'Not set'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                          <ChartBarIcon className="h-3 w-3 inline mr-1" />
                          STORY POINTS
                        </label>
                        {isEditing ? (
                          <select
                            {...register('story_points')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">None</option>
                            {STORY_POINTS.map(points => (
                              <option key={points} value={points}>{points}</option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-sm text-gray-900">{task.story_points || 'Not set'}</p>
                        )}
                      </div>
                    </div>

                    {/* Assignees */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        <UserPlusIcon className="h-3 w-3 inline mr-1" />
                        ASSIGNEES
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedAssignees.map((user) => (
                          <div key={user.id} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            <Avatar user={user} size="xs" />
                            <span>{user.first_name}</span>
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeAssignee(user.id)}
                                className="hover:text-blue-900"
                              >
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {selectedAssignees.length === 0 && (
                          <span className="text-sm text-gray-500">None</span>
                        )}
                      </div>
                    </div>

                    {/* Watchers */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        <EyeIcon className="h-3 w-3 inline mr-1" />
                        WATCHERS
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedWatchers.map((user) => (
                          <div key={user.id} className="flex items-center space-x-1 bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">
                            <Avatar user={user} size="xs" />
                            <span>{user.first_name}</span>
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeWatcher(user.id)}
                                className="hover:text-gray-900"
                              >
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {selectedWatchers.length === 0 && (
                          <span className="text-sm text-gray-500">None</span>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        <TagIcon className="h-3 w-3 inline mr-1" />
                        TAGS
                      </label>
                      {isEditing ? (
                        <input
                          {...register('tags')}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder="tag1, tag2, tag3"
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {task.tags?.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {(!task.tags || task.tags.length === 0) && (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="pt-4 border-t border-gray-300 space-y-2 text-xs text-gray-600">
                      <p><span className="font-semibold">Created:</span> {formatDateTime(task.created_at)}</p>
                      <p><span className="font-semibold">Updated:</span> {formatDateTime(task.updated_at)}</p>
                      {task.completed_at && (
                        <p><span className="font-semibold">Completed:</span> {formatDateTime(task.completed_at)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EnhancedTaskDetailModal;
