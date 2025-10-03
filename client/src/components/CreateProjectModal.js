import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MegaphoneIcon, CurrencyDollarIcon, BriefcaseIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';
import amplifyDataService from '../services/amplifyDataService';
import { useAuth } from '../contexts/AuthContext';

const CreateProjectModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const createProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      const result = await amplifyDataService.projects.create(projectData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      toast.success('Project created successfully!');
      reset();
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create project');
    },
  });

  const onSubmit = (data) => {
    createProjectMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createProjectMutation.isLoading) {
      reset();
      setSelectedTemplate(null);
      onClose();
    }
  };

  const projectTemplates = [
    {
      id: 'blank',
      name: 'Blank Project',
      description: 'Start from scratch with an empty project',
      icon: RocketLaunchIcon,
      color: '#3B82F6',
    },
    {
      id: 'marketing',
      name: 'Marketing Campaign',
      description: 'Manage marketing campaigns and content',
      icon: MegaphoneIcon,
      color: '#F59E0B',
    },
    {
      id: 'sales',
      name: 'Sales Pipeline',
      description: 'Track leads and sales opportunities',
      icon: CurrencyDollarIcon,
      color: '#10B981',
    },
    {
      id: 'development',
      name: 'Software Development',
      description: 'Manage development sprints and tasks',
      icon: BriefcaseIcon,
      color: '#8B5CF6',
    },
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    setValue('template', template.id);
    setValue('color', template.color);
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Project Templates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Choose a Template
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {projectTemplates.map((template) => {
                        const Icon = template.icon;
                        return (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => handleTemplateSelect(template)}
                            className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                              selectedTemplate === template.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: `${template.color}20` }}
                              >
                                <Icon
                                  className="h-6 w-6"
                                  style={{ color: template.color }}
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">
                                  {template.name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {template.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
