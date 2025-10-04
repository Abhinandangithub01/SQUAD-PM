import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DatePicker } from '@mantine/dates';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import amplifyDataService from '../services/amplifyDataService';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

const CreateTaskModal = ({ isOpen, onClose, projectId, columnId, onSuccess }) => {
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      priority: 'medium',
      tags: '',
      due_date: null,
    },
  });

  // Search users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users', 'search', assigneeSearch, projectId],
    queryFn: async () => {
      if (assigneeSearch.length < 2) return { users: [] };
      // TODO: Implement user search with Amplify
      return { users: [] };
    },
    enabled: assigneeSearch.length >= 2,
  });

  const { user } = useAuth();
  
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const result = await amplifyDataService.tasks.create({
        ...taskData,
        createdById: user?.id,
        project_id: projectId,
        column_id: columnId,
        assignee_ids: selectedAssignees.map(user => user.id),
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      toast.success('Task created successfully!');
      reset();
      setSelectedAssignees([]);
      setAssigneeSearch('');
      onSuccess?.(data.task);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
    },
  });

  const onSubmit = (data) => {
    const formattedData = {
      ...data,
      tags: typeof data.tags === 'string' 
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) 
        : (Array.isArray(data.tags) ? data.tags : []),
      due_date: data.due_date || null,
    };
    createTaskMutation.mutate(formattedData);
  };

  const handleClose = () => {
    if (!createTaskMutation.isLoading) {
      reset();
      setSelectedAssignees([]);
      setAssigneeSearch('');
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                    Create New Task
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={handleClose}
                    disabled={createTaskMutation.isLoading}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                      Task Title *
                    </label>
                    <input
                      {...register('title', {
                        required: 'Task title is required',
                        minLength: {
                          value: 2,
                          message: 'Task title must be at least 2 characters',
                        },
                      })}
                      type="text"
                      className={`block w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter task title"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the task (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        {...register('priority')}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="due_date" className="block text-sm font-semibold text-gray-700 mb-2">
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
                              minDate={new Date()}
                              size="sm"
                              className="mt-1"
                              styles={{
                                input: {
                                  borderColor: '#d1d5db',
                                  borderRadius: '0.375rem',
                                  padding: '0.5rem 0.75rem',
                                },
                              }}
                            />
                          )}
                        />
                      </MantineProvider>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-2">
                      Tags
                    </label>
                    <input
                      {...register('tags')}
                      type="text"
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter tags separated by commas"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separate multiple tags with commas (e.g., frontend, urgent, bug)
                    </p>
                  </div>

                  {/* Assignees */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Assignees
                    </label>
                    
                    {/* Selected Assignees */}
                    {selectedAssignees.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedAssignees.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center space-x-2 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm"
                          >
                            <Avatar user={user} size="xs" />
                            <span>{user.first_name} {user.last_name}</span>
                            <button
                              type="button"
                              onClick={() => removeAssignee(user.id)}
                              className="text-primary-500 hover:text-primary-700"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search team members to assign..."
                      />
                      <UserPlusIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>

                    {/* Search Results */}
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

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={createTaskMutation.isLoading}
                      className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createTaskMutation.isLoading}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-w-[120px]"
                    >
                      {createTaskMutation.isLoading ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        'Create Task'
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

export default CreateTaskModal;
