import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  FlagIcon,
  Bars3BottomLeftIcon,
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
  { value: 'LOW', label: 'Low', color: 'text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200' },
];

const CleanCreateTaskModal = ({ isOpen, onClose, projectId, columnId, onSuccess }) => {
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

  // Fetch users
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
      toast.success('Task created successfully');
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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-98"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-98"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Create task
                  </Dialog.Title>
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    onClick={handleClose}
                    disabled={createTaskMutation.isLoading}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                  {/* Title */}
                  <div>
                    <input
                      {...register('title', {
                        required: 'Task title is required',
                        minLength: { value: 2, message: 'Title must be at least 2 characters' },
                      })}
                      type="text"
                      className="w-full px-3 py-2 text-base font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      placeholder="Task name"
                      autoFocus
                    />
                    {errors.title && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center mb-2">
                      <Bars3BottomLeftIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <label className="text-sm font-medium text-gray-700">Description</label>
                    </div>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 resize-none"
                      placeholder="Add a more detailed description..."
                    />
                  </div>

                  {/* Properties Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Priority */}
                    <div>
                      <div className="flex items-center mb-2">
                        <FlagIcon className="h-4 w-4 text-gray-500 mr-2" />
                        <label className="text-sm font-medium text-gray-700">Priority</label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {PRIORITY_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => reset({ ...watch(), priority: option.value })}
                            className={`px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                              selectedPriority === option.value
                                ? option.color + ' border-current'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Due Date */}
                    <div>
                      <div className="flex items-center mb-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500 mr-2" />
                        <label className="text-sm font-medium text-gray-700">Due date</label>
                      </div>
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
                              classNames={{
                                input: 'px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                              }}
                            />
                          )}
                        />
                      </MantineProvider>
                    </div>
                  </div>

                  {/* Assignees */}
                  <div>
                    <div className="flex items-center mb-2">
                      <UserIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <label className="text-sm font-medium text-gray-700">Assignees</label>
                    </div>
                    
                    {selectedAssignees.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedAssignees.map((assignee) => (
                          <div
                            key={assignee.id}
                            className="flex items-center space-x-2 bg-gray-100 px-2 py-1.5 rounded-lg group"
                          >
                            <Avatar user={assignee} size="xs" />
                            <span className="text-sm text-gray-700">
                              {assignee.first_name} {assignee.last_name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAssignee(assignee.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
                            >
                              <XMarkIcon className="h-3.5 w-3.5" />
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
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                        placeholder="Search members..."
                      />
                    </div>

                    {showAssigneeDropdown && filteredUsers.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg shadow-lg bg-white">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addAssignee(user)}
                            className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 text-left"
                            disabled={selectedAssignees.find(a => a.id === user.id)}
                          >
                            <Avatar user={user} size="sm" />
                            <div className="flex-1">
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

                  {/* Tags */}
                  <div>
                    <div className="flex items-center mb-2">
                      <TagIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <label className="text-sm font-medium text-gray-700">Labels</label>
                    </div>
                    
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 group"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1.5 opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800"
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
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                        placeholder="Add a label..."
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Estimated Hours */}
                  <div>
                    <div className="flex items-center mb-2">
                      <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <label className="text-sm font-medium text-gray-700">Estimated time</label>
                    </div>
                    <input
                      {...register('estimated_hours')}
                      type="number"
                      step="0.5"
                      min="0"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      placeholder="Hours"
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={createTaskMutation.isLoading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createTaskMutation.isLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                    >
                      {createTaskMutation.isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                      ) : (
                        'Create task'
                      )}
                    </button>
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

export default CleanCreateTaskModal;
