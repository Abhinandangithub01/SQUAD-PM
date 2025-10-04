import React, { Fragment, useState } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { 
  XMarkIcon, 
  UserPlusIcon, 
  PaperClipIcon,
  PhotoIcon,
  LinkIcon,
  ClockIcon,
  CalendarIcon,
  FlagIcon,
  TagIcon,
  CheckCircleIcon,
  UserGroupIcon,
  BoltIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '@mantine/dates';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import amplifyDataService from '../services/amplifyDataService';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import Avatar from './Avatar';
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

const EnhancedCreateTaskModal = ({ isOpen, onClose, projectId, columnId, onSuccess }) => {
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
  const [selectedTab, setSelectedTab] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      tags: '',
      start_date: null,
      due_date: null,
      estimated_hours: '',
      story_points: '',
      risk_level: 'LOW',
      epic_id: '',
      dependencies: [],
      subtasks: [{ title: '', completed: false }],
      checklists: [{ name: '', items: [{ text: '', completed: false }] }],
      recurring_pattern: '',
      recurring_interval: 1,
      custom_fields: {},
    },
  });

  // Field arrays for dynamic fields
  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control,
    name: 'subtasks',
  });

  const { fields: checklistFields, append: appendChecklist, remove: removeChecklist } = useFieldArray({
    control,
    name: 'checklists',
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Search users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users', 'search', assigneeSearch, projectId],
    queryFn: async () => {
      if (assigneeSearch.length < 2) return { users: [] };
      const result = await amplifyDataService.users.list();
      return { users: result.success ? result.data : [] };
    },
    enabled: assigneeSearch.length >= 2,
  });

  // Fetch all tasks for dependencies
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const result = await amplifyDataService.tasks.list({ projectId });
      return result.success ? result.data : [];
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const result = await amplifyDataService.tasks.create({
        ...taskData,
        createdById: user?.id,
        projectId,
        columnId,
        assignedToId: selectedAssignees.length > 0 ? selectedAssignees[0].id : null,
        assignee_ids: selectedAssignees.map(u => u.id),
        watcher_ids: selectedWatchers.map(u => u.id),
        labels: selectedLabels,
        attachments,
        links,
        cover_image: coverImage,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      toast.success('Task created successfully!');
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['tasks', projectId]);
      handleClose();
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create task');
    },
  });

  const onSubmit = (data) => {
    const formattedData = {
      ...data,
      tags: typeof data.tags === 'string' 
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) 
        : (Array.isArray(data.tags) ? data.tags : []),
      start_date: data.start_date || null,
      due_date: data.due_date || null,
      estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
      story_points: data.story_points ? parseInt(data.story_points) : null,
      subtasks: data.subtasks.filter(st => st.title.trim()),
      checklists: data.checklists.filter(cl => 
        cl.name.trim() || cl.items.some(item => item.text.trim())
      ),
      is_recurring: isRecurring,
    };
    createTaskMutation.mutate(formattedData);
  };

  const handleClose = () => {
    if (!createTaskMutation.isLoading) {
      reset();
      setSelectedAssignees([]);
      setSelectedWatchers([]);
      setSelectedLabels([]);
      setAttachments([]);
      setLinks([]);
      setCoverImage('');
      setIsRecurring(false);
      onClose();
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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    Create New Task
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    onClick={handleClose}
                    disabled={createTaskMutation.isLoading}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Tabs */}
                <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                  <Tab.List className="flex space-x-1 border-b border-gray-200 px-6">
                    <Tab className={({ selected }) =>
                      `px-4 py-3 text-sm font-medium transition-colors ${
                        selected
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`
                    }>
                      📝 Basic Info
                    </Tab>
                    <Tab className={({ selected }) =>
                      `px-4 py-3 text-sm font-medium transition-colors ${
                        selected
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`
                    }>
                      📊 Details & Planning
                    </Tab>
                    <Tab className={({ selected }) =>
                      `px-4 py-3 text-sm font-medium transition-colors ${
                        selected
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`
                    }>
                      ✅ Subtasks & Checklists
                    </Tab>
                    <Tab className={({ selected }) =>
                      `px-4 py-3 text-sm font-medium transition-colors ${
                        selected
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`
                    }>
                      📎 Attachments & Media
                    </Tab>
                  </Tab.List>

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <Tab.Panels className="p-6 max-h-[60vh] overflow-y-auto">
                      {/* Tab 1: Basic Info */}
                      <Tab.Panel className="space-y-6">
                        {/* Cover Image */}
                        {coverImage && (
                          <div className="relative h-32 rounded-lg overflow-hidden">
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setCoverImage('')}
                              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {/* Title */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Task Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            {...register('title', {
                              required: 'Task title is required',
                              minLength: { value: 2, message: 'Title must be at least 2 characters' },
                            })}
                            type="text"
                            className={`block w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.title ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter task title..."
                          />
                          {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                          )}
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            {...register('description')}
                            rows={4}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Describe the task in detail..."
                          />
                        </div>

                        {/* Priority, Status, Risk */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <FlagIcon className="h-4 w-4 inline mr-1" />
                              Priority
                            </label>
                            <select
                              {...register('priority')}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                              <option value="URGENT">Urgent</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                              Status
                            </label>
                            <select
                              {...register('status')}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="DONE">Done</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                              Risk Level
                            </label>
                            <select
                              {...register('risk_level')}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {RISK_LEVELS.map(level => (
                                <option key={level} value={level}>{level}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Labels */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <TagIcon className="h-4 w-4 inline mr-1" />
                            Labels
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {LABEL_COLORS.map(label => (
                              <button
                                key={label.name}
                                type="button"
                                onClick={() => toggleLabel(label)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                  selectedLabels.find(l => l.name === label.name)
                                    ? 'ring-2 ring-offset-2'
                                    : 'opacity-60 hover:opacity-100'
                                }`}
                                style={{
                                  backgroundColor: label.color + '20',
                                  color: label.color,
                                  ringColor: label.color,
                                }}
                              >
                                {label.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tags */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Tags
                          </label>
                          <input
                            {...register('tags')}
                            type="text"
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="frontend, urgent, bug"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Separate multiple tags with commas
                          </p>
                        </div>

                        {/* Assignees */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <UserPlusIcon className="h-4 w-4 inline mr-1" />
                            Assignees
                          </label>
                          
                          {selectedAssignees.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {selectedAssignees.map((user) => (
                                <div
                                  key={user.id}
                                  className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm"
                                >
                                  <Avatar user={user} size="xs" />
                                  <span>{user.first_name} {user.last_name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeAssignee(user.id)}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <XMarkIcon className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="relative">
                            <input
                              type="text"
                              value={assigneeSearch}
                              onChange={(e) => setAssigneeSearch(e.target.value)}
                              className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Search team members..."
                            />
                            <UserPlusIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          </div>

                          {usersData?.users && usersData.users.length > 0 && assigneeSearch.length >= 2 && (
                            <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                              {usersData.users.map((user) => (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => addAssignee(user)}
                                  className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 text-left"
                                  disabled={selectedAssignees.find(a => a.id === user.id)}
                                >
                                  <Avatar user={user} size="xs" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {user.first_name} {user.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Watchers */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <UserGroupIcon className="h-4 w-4 inline mr-1" />
                            Watchers
                          </label>
                          
                          {selectedWatchers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {selectedWatchers.map((user) => (
                                <div
                                  key={user.id}
                                  className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm"
                                >
                                  <Avatar user={user} size="xs" />
                                  <span>{user.first_name} {user.last_name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeWatcher(user.id)}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <XMarkIcon className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="relative">
                            <input
                              type="text"
                              value={watcherSearch}
                              onChange={(e) => setWatcherSearch(e.target.value)}
                              className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Add watchers..."
                            />
                            <UserGroupIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </Tab.Panel>

                      {/* Tab 2: Details & Planning */}
                      <Tab.Panel className="space-y-6">
                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <CalendarIcon className="h-4 w-4 inline mr-1" />
                              Start Date
                            </label>
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
                                    className="w-full"
                                  />
                                )}
                              />
                            </MantineProvider>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <CalendarIcon className="h-4 w-4 inline mr-1" />
                              Due Date
                            </label>
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
                                    minDate={watch('start_date') ? new Date(watch('start_date')) : new Date()}
                                    className="w-full"
                                  />
                                )}
                              />
                            </MantineProvider>
                          </div>
                        </div>

                        {/* Estimation */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <ClockIcon className="h-4 w-4 inline mr-1" />
                              Estimated Hours
                            </label>
                            <input
                              {...register('estimated_hours')}
                              type="number"
                              step="0.5"
                              min="0"
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="8"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <ChartBarIcon className="h-4 w-4 inline mr-1" />
                              Story Points
                            </label>
                            <select
                              {...register('story_points')}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">None</option>
                              {STORY_POINTS.map(points => (
                                <option key={points} value={points}>{points}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Dependencies */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <BoltIcon className="h-4 w-4 inline mr-1" />
                            Dependencies (Blocked By)
                          </label>
                          <select
                            {...register('dependencies')}
                            multiple
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            size="4"
                          >
                            {tasksData?.map(task => (
                              <option key={task.id} value={task.id}>
                                {task.title}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            Hold Ctrl/Cmd to select multiple tasks
                          </p>
                        </div>

                        {/* Recurring */}
                        <div>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isRecurring}
                              onChange={(e) => setIsRecurring(e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-semibold text-gray-700">
                              <ArrowPathIcon className="h-4 w-4 inline mr-1" />
                              Recurring Task
                            </span>
                          </label>

                          {isRecurring && (
                            <div className="mt-3 grid grid-cols-2 gap-4">
                              <div>
                                <select
                                  {...register('recurring_pattern')}
                                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="DAILY">Daily</option>
                                  <option value="WEEKLY">Weekly</option>
                                  <option value="MONTHLY">Monthly</option>
                                  <option value="YEARLY">Yearly</option>
                                </select>
                              </div>
                              <div>
                                <input
                                  {...register('recurring_interval')}
                                  type="number"
                                  min="1"
                                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Every X days/weeks/months"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Epic/Parent */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Epic / Parent Task
                          </label>
                          <select
                            {...register('epic_id')}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">None</option>
                            {tasksData?.filter(t => t.type === 'EPIC').map(epic => (
                              <option key={epic.id} value={epic.id}>
                                {epic.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Tab.Panel>

                      {/* Tab 3: Subtasks & Checklists */}
                      <Tab.Panel className="space-y-6">
                        {/* Subtasks */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-semibold text-gray-700">
                              Subtasks
                            </label>
                            <button
                              type="button"
                              onClick={() => appendSubtask({ title: '', completed: false })}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              + Add Subtask
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {subtaskFields.map((field, index) => (
                              <div key={field.id} className="flex items-center space-x-2">
                                <input
                                  {...register(`subtasks.${index}.title`)}
                                  type="text"
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Subtask title..."
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSubtask(index)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                >
                                  <MinusIcon className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Checklists */}
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
                      </Tab.Panel>

                      {/* Tab 4: Attachments & Media */}
                      <Tab.Panel className="space-y-6">
                        {/* Cover Image */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <PhotoIcon className="h-4 w-4 inline mr-1" />
                            Cover Image
                          </label>
                          <input
                            type="text"
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter image URL..."
                          />
                        </div>

                        {/* File Attachments */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <PaperClipIcon className="h-4 w-4 inline mr-1" />
                            File Attachments
                          </label>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          
                          {attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <PaperClipIcon className="h-5 w-5 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <XMarkIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Links */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <LinkIcon className="h-4 w-4 inline mr-1" />
                            Links
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
                          
                          {links.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {links.map((link, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                                  <button
                                    type="button"
                                    onClick={() => setLinks(links.filter((_, i) => i !== index))}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <XMarkIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Tab.Panel>
                    </Tab.Panels>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="text-sm text-gray-600">
                        {selectedTab === 0 && 'Fill in basic task information'}
                        {selectedTab === 1 && 'Add planning details and estimates'}
                        {selectedTab === 2 && 'Break down into subtasks and checklists'}
                        {selectedTab === 3 && 'Attach files and add links'}
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={createTaskMutation.isLoading}
                          className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={createTaskMutation.isLoading}
                          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-w-[140px]"
                        >
                          {createTaskMutation.isLoading ? (
                            <LoadingSpinner size="sm" color="white" />
                          ) : (
                            <>
                              <CheckCircleIcon className="h-5 w-5" />
                              <span>Create Task</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </Tab.Group>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EnhancedCreateTaskModal;
