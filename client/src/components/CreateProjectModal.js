import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import api from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const CreateProjectModal = ({ isOpen, onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const createProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      const response = await api.post('/projects', projectData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Project created successfully!');
      reset();
      onSuccess?.(data.project);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    },
  });

  const onSubmit = (data) => {
    createProjectMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createProjectMutation.isLoading) {
      reset();
      onClose();
    }
  };

  const projectColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

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
                    Create New Project
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={handleClose}
                    disabled={createProjectMutation.isLoading}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Project Name *
                    </label>
                    <input
                      {...register('name', {
                        required: 'Project name is required',
                        minLength: {
                          value: 2,
                          message: 'Project name must be at least 2 characters',
                        },
                      })}
                      type="text"
                      className={`mt-1 input ${errors.name ? 'input-error' : ''}`}
                      placeholder="Enter project name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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
                      placeholder="Describe your project (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Color
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {projectColors.map((color) => (
                        <label key={color} className="cursor-pointer">
                          <input
                            {...register('color')}
                            type="radio"
                            value={color}
                            className="sr-only"
                            defaultChecked={color === '#3B82F6'}
                          />
                          <div
                            className="w-8 h-8 rounded-full border-2 border-transparent hover:border-gray-300 focus-within:border-gray-400 transition-colors duration-150"
                            style={{ backgroundColor: color }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={createProjectMutation.isLoading}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createProjectMutation.isLoading}
                      className="btn-primary"
                    >
                      {createProjectMutation.isLoading ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        'Create Project'
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

export default CreateProjectModal;
