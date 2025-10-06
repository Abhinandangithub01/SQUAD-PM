import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, HashtagIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import amplifyDataService from '../services/amplifyDataService';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const CreateChannelModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [channelType, setChannelType] = useState('public');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Fetch projects for project-based channels using Amplify
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await amplifyDataService.projects.list();
      return { projects: result.data || [] };
    },
    enabled: isOpen && !!user,
  });

  const createChannelMutation = useMutation({
    mutationFn: async (channelData) => {
      if (!user || !user.id) {
        throw new Error('User must be logged in to create channels');
      }

      const result = await amplifyDataService.chat.getOrCreateChannel({
        name: channelData.name,
        description: channelData.description || '',
        type: channelData.type === 'public' ? 'GENERAL' : 'PROJECT',
        createdById: user.id,
        projectId: channelData.projectId || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create channel');
      }

      return result.data;
    },
    onSuccess: (data) => {
      toast.success('Channel created successfully!');
      queryClient.invalidateQueries(['channels']);
      reset();
      setChannelType('public');
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create channel');
    },
  });

  const onSubmit = (data) => {
    const channelData = {
      name: data.name,
      description: data.description,
      type: channelType,
      projectId: data.project_id || null,
    };
    createChannelMutation.mutate(channelData);
  };

  const handleClose = () => {
    if (!createChannelMutation.isLoading) {
      reset();
      setChannelType('public');
      onClose();
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Create New Channel
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={handleClose}
                    disabled={createChannelMutation.isLoading}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Channel Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Channel Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setChannelType('public')}
                        className={`flex items-center space-x-2 p-3 border rounded-lg text-left transition-colors duration-150 ${
                          channelType === 'public'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <HashtagIcon className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Public</p>
                          <p className="text-xs text-gray-500">Anyone can join</p>
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setChannelType('private')}
                        className={`flex items-center space-x-2 p-3 border rounded-lg text-left transition-colors duration-150 ${
                          channelType === 'private'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <LockClosedIcon className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Private</p>
                          <p className="text-xs text-gray-500">Invite only</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Channel Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Channel Name *
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <HashtagIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        {...register('name', {
                          required: 'Channel name is required',
                          minLength: {
                            value: 2,
                            message: 'Channel name must be at least 2 characters',
                          },
                          pattern: {
                            value: /^[a-z0-9-_]+$/,
                            message: 'Channel name can only contain lowercase letters, numbers, hyphens, and underscores',
                          },
                        })}
                        type="text"
                        className={`pl-9 input ${errors.name ? 'input-error' : ''}`}
                        placeholder="e.g., general, random, project-updates"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Use lowercase letters, numbers, hyphens, and underscores only
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="mt-1 input"
                      placeholder="What's this channel about? (optional)"
                    />
                  </div>

                  {/* Project Association */}
                  <div>
                    <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                      Link to Project (Optional)
                    </label>
                    <select
                      {...register('project_id')}
                      className="mt-1 input"
                    >
                      <option value="">No project association</option>
                      {projectsData?.projects?.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Link this channel to a specific project for better organization
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={createChannelMutation.isLoading}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createChannelMutation.isLoading}
                      className="btn-primary"
                    >
                      {createChannelMutation.isLoading ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        'Create Channel'
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

export default CreateChannelModal;
