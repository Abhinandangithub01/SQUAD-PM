import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { 
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  FlagIcon,
  Bars3BottomLeftIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker } from '@mantine/dates';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import amplifyDataService from '../services/amplifyDataService';
import { formatDateTime } from '../utils/helpers';
import LoadingSpinner from './LoadingSpinner';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200' },
];

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

const CleanTaskDetailModal = ({ isOpen, onClose, taskId, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [tags, setTags] = useState([]);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm();

  // Fetch task details
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

  // Initialize form when task data is loaded
  useEffect(() => {
    if (taskData?.task) {
      const task = taskData.task;
      
      reset({
        title: task.title,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || null,
        estimated_hours: task.estimated_hours || '',
      });
      
      setDescription(task.description || '');
      setTags(Array.isArray(task.tags) ? task.tags : []);
      setSelectedAssignees(task.assignee_ids || []);
    }
  }, [taskData, reset]);

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updates) => {
      const result = await amplifyDataService.tasks.update(taskId, {
        ...updates,
        description,
        tags,
        assignee_ids: selectedAssignees,
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
    updateTaskMutation.mutate(data);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/25" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl p-8">
            <LoadingSpinner size="lg" />
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  if (!taskData?.task) return null;

  const task = taskData.task;
  const selectedPriority = watch('priority');

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Task details
                    </Dialog.Title>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {STATUS_OPTIONS.find(s => s.value === task.status)?.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={handleDelete}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex">
                  {/* Main Content */}
                  <div className="flex-1 p-6 space-y-6">
                    <form onSubmit={handleSubmit(handleSubmitTask)}>
                      {/* Title */}
                      <div>
                        {isEditing ? (
                          <input
                            {...register('title', { required: true })}
                            className="w-full px-3 py-2 text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <div className="flex items-center mb-2">
                          <Bars3BottomLeftIcon className="h-4 w-4 text-gray-500 mr-2" />
                          <label className="text-sm font-medium text-gray-700">Description</label>
                        </div>
                        {isEditing ? (
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Add a description..."
                          />
                        ) : (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {description || <span className="text-gray-400 italic">No description</span>}
                          </p>
                        )}
                      </div>

                      {/* Save Button */}
                      {isEditing && (
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={updateTaskMutation.isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {updateTaskMutation.isLoading ? 'Saving...' : 'Save changes'}
                          </button>
                        </div>
                      )}
                    </form>

                    {/* Comments */}
                    <div>
                      <div className="flex items-center mb-3">
                        <ChatBubbleLeftIcon className="h-4 w-4 text-gray-500 mr-2" />
                        <label className="text-sm font-medium text-gray-700">Activity</label>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex space-x-3">
                          <Avatar user={{ name: 'You' }} size="sm" />
                          <div className="flex-1">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              placeholder="Write a comment..."
                            />
                            {newComment && (
                              <button
                                type="button"
                                className="mt-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Save
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="w-80 border-l border-gray-200 p-6 bg-gray-50 space-y-5">
                    {/* Status */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">STATUS</label>
                      {isEditing ? (
                        <select
                          {...register('status')}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-block px-2.5 py-1 text-sm font-medium rounded ${
                          task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {STATUS_OPTIONS.find(s => s.value === task.status)?.label}
                        </span>
                      )}
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">PRIORITY</label>
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-2">
                          {PRIORITY_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => reset({ ...watch(), priority: option.value })}
                              className={`px-2 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                                selectedPriority === option.value
                                  ? option.color + ' border-current'
                                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={`inline-block px-2.5 py-1 text-sm font-medium rounded ${
                          task.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                          task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {PRIORITY_OPTIONS.find(p => p.value === task.priority)?.label}
                        </span>
                      )}
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">DUE DATE</label>
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
                                placeholder="Select date"
                                size="sm"
                                classNames={{
                                  input: 'px-3 py-2 text-sm border border-gray-300 rounded-lg',
                                }}
                              />
                            )}
                          />
                        </MantineProvider>
                      ) : (
                        <p className="text-sm text-gray-900">{task.due_date ? formatDateTime(task.due_date) : 'Not set'}</p>
                      )}
                    </div>

                    {/* Estimated Hours */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">ESTIMATED TIME</label>
                      {isEditing ? (
                        <input
                          {...register('estimated_hours')}
                          type="number"
                          step="0.5"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Hours"
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{task.estimated_hours ? `${task.estimated_hours}h` : 'Not set'}</p>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="pt-4 border-t border-gray-300 space-y-2 text-xs text-gray-600">
                      <p><span className="font-semibold">Created:</span> {formatDateTime(task.created_at)}</p>
                      <p><span className="font-semibold">Updated:</span> {formatDateTime(task.updated_at)}</p>
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

export default CleanTaskDetailModal;
