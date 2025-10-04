import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ClockIcon,
  FlagIcon,
  UserCircleIcon,
  TagIcon,
  PaperClipIcon,
  CheckCircleIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '@mantine/dates';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import amplifyDataService from '../services/amplifyDataService';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200', icon: '🟢' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200', icon: '🔵' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200', icon: '🟠' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700 hover:bg-red-200', icon: '🔴' },
];

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do', color: 'bg-gray-100 text-gray-700', icon: '⭕' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-purple-100 text-purple-700', icon: '🔄' },
  { value: 'DONE', label: 'Done', color: 'bg-green-100 text-green-700', icon: '✅' },
];

const ModernCreateTaskModal = ({ isOpen, onClose, projectId, columnId, onSuccess }) => {
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

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
      due_date: null,
      estimated_hours: '',
    },
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const selectedPriority = watch('priority');
  const selectedStatus = watch('status');

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const result = await amplifyDataService.users.list();
      return { users: result.success ? result.data : [] };
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
        tags: tags,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      toast.success('✨ Task created successfully!', {
        style: {
          borderRadius: '12px',
          background: '#10B981',
          color: '#fff',
        },
      });
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
    createTaskMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createTaskMutation.isLoading) {
      reset();
      setSelectedAssignees([]);
      setTags([]);
      setTagInput('');
      onClose();
    }
  };

  const addAssignee = (user) => {
    if (!selectedAssignees.find(a => a.id === user.id)) {
      setSelectedAssignees([...selectedAssignees, user]);
    }
    setAssigneeSearch('');
    setShowAssigneeDropdown(false);
  };

  const removeAssignee = (userId) => {
    setSelectedAssignees(selectedAssignees.filter(a => a.id !== userId));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const filteredUsers = usersData?.users?.filter(u =>
    assigneeSearch.length >= 2 &&
    (u.first_name?.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
     u.last_name?.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
     u.email?.toLowerCase().includes(assigneeSearch.toLowerCase()))
  ) || [];

  const currentPriority = PRIORITY_OPTIONS.find(p => p.value === selectedPriority);
  const currentStatus = STATUS_OPTIONS.find(s => s.value === selectedStatus);

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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                {/* Gradient Header */}
                <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                        <SparklesIcon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-2xl font-bold text-white">
                          Create New Task
                        </Dialog.Title>
                        <p className="text-white/80 text-sm mt-1">
                          Add a new task to your project
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all"
                      onClick={handleClose}
                      disabled={createTaskMutation.isLoading}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                  {/* Title Input */}
                  <div>
                    <input
                      {...register('title', {
                        required: 'Task title is required',
                        minLength: { value: 2, message: 'Title must be at least 2 characters' },
                      })}
                      type="text"
                      className="w-full px-0 py-3 text-2xl font-semibold border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 placeholder-gray-400 transition-colors"
                      placeholder="Task title..."
                      autoFocus
                    />
                    {errors.title && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 resize-none transition-all"
                      placeholder="Add a description..."
                    />
                  </div>

                  {/* Properties Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <FlagIcon className="h-4 w-4 mr-2 text-gray-500" />
                        Priority
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {PRIORITY_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => reset({ ...watch(), priority: option.value })}
                            className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                              selectedPriority === option.value
                                ? option.color + ' ring-2 ring-offset-2 ring-blue-500 shadow-lg scale-105'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <span className="mr-2">{option.icon}</span>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <Squares2X2Icon className="h-4 w-4 mr-2 text-gray-500" />
                        Status
                      </label>
                      <div className="space-y-2">
                        {STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => reset({ ...watch(), status: option.value })}
                            className={`w-full px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${
                              selectedStatus === option.value
                                ? option.color + ' ring-2 ring-offset-2 ring-purple-500 shadow-lg'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <span className="mr-2">{option.icon}</span>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Due Date & Estimated Hours */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-500" />
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
                              placeholder="Select date"
                              className="w-full"
                              classNames={{
                                input: 'px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                              }}
                            />
                          )}
                        />
                      </MantineProvider>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                        Estimated Hours
                      </label>
                      <input
                        {...register('estimated_hours')}
                        type="number"
                        step="0.5"
                        min="0"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="8"
                      />
                    </div>
                  </div>

                  {/* Assignees */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <UserCircleIcon className="h-4 w-4 mr-2 text-gray-500" />
                      Assignees
                    </label>
                    
                    {selectedAssignees.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedAssignees.map((assignee) => (
                          <div
                            key={assignee.id}
                            className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 rounded-xl group hover:shadow-md transition-all"
                          >
                            <Avatar user={assignee} size="xs" />
                            <span className="text-sm font-medium text-gray-700">
                              {assignee.first_name} {assignee.last_name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAssignee(assignee.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type="text"
                        value={assigneeSearch}
                        onChange={(e) => {
                          setAssigneeSearch(e.target.value);
                          setShowAssigneeDropdown(e.target.value.length >= 2);
                        }}
                        className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search team members..."
                      />
                      <UserCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>

                    {showAssigneeDropdown && filteredUsers.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl shadow-lg bg-white">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addAssignee(user)}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-left transition-all"
                            disabled={selectedAssignees.find(a => a.id === user.id)}
                          >
                            <Avatar user={user} size="sm" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            {selectedAssignees.find(a => a.id === user.id) && (
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <TagIcon className="h-4 w-4 mr-2 text-gray-500" />
                      Tags
                    </label>
                    
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 group hover:shadow-md transition-all"
                          >
                            <span className="mr-1">🏷️</span>
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 opacity-0 group-hover:opacity-100 text-purple-500 hover:text-red-500 transition-all"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add a tag..."
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-6 border-t-2 border-gray-100">
                    <p className="text-sm text-gray-500 flex items-center">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      More options available after creation
                    </p>
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={createTaskMutation.isLoading}
                        className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createTaskMutation.isLoading}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 min-w-[140px] justify-center"
                      >
                        {createTaskMutation.isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="h-5 w-5" />
                            <span>Create Task</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModernCreateTaskModal;
