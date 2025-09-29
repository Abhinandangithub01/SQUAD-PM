import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../utils/api';
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
    formState: { errors },
  } = useForm({
    defaultValues: {
      priority: 'medium',
      tags: [],
    },
  });

  // Search users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users', 'search', assigneeSearch, projectId],
    queryFn: async () => {
      if (assigneeSearch.length < 2) return { users: [] };
      const response = await api.get(`/users/search?q=${assigneeSearch}&project_id=${projectId}`);
      return response.data;
    },
    enabled: assigneeSearch.length >= 2,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const response = await api.post('/tasks', {
        ...taskData,
        project_id: projectId,
        column_id: columnId,
        assignee_ids: selectedAssignees.map(user => user.id),
      });
      return response.data;
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
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
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
                      className={`mt-1 input ${errors.title ? 'input-error' : ''}`}
                      placeholder="Enter task title"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="mt-1 input"
                      placeholder="Describe the task (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        {...register('priority')}
                        className="mt-1 input"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                        Due Date
                      </label>
                      <input
                        {...register('due_date')}
                        type="date"
                        className="mt-1 input"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                      Tags
                    </label>
                    <input
                      {...register('tags')}
                      type="text"
                      className="mt-1 input"
                      placeholder="Enter tags separated by commas"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separate multiple tags with commas (e.g., frontend, urgent, bug)
                    </p>
                  </div>

                  {/* Assignees */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="input pr-10"
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

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={createTaskMutation.isLoading}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createTaskMutation.isLoading}
                      className="btn-primary"
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
