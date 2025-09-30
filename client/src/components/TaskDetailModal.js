import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { DatePicker } from '@mantine/dates';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import api from '../utils/api';
import { formatDateTime, getPriorityColor, getStatusColor } from '../utils/helpers';
import { mockMilestones } from '../utils/mockData';
import LoadingSpinner from './LoadingSpinner';
import Avatar from './Avatar';
import RichTextEditor from './RichTextEditor';
import toast from 'react-hot-toast';

const TaskDetailModal = ({ isOpen, onClose, taskId, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [quickEditField, setQuickEditField] = useState(null);
  const [milestoneSearch, setMilestoneSearch] = useState('');
  const [showMilestoneDropdown, setShowMilestoneDropdown] = useState(false);
  const queryClient = useQueryClient();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMilestoneDropdown && !event.target.closest('.milestone-dropdown')) {
        setShowMilestoneDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMilestoneDropdown]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      checklists: [{ name: '', items: [{ text: '', completed: false }] }]
    }
  });

  const { fields: checklistFields, append: appendChecklist, remove: removeChecklist } = useFieldArray({
    control,
    name: 'checklists'
  });

  // Fetch task details
  const { data: taskData, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      // Mock task data for now
      return {
        task: {
          id: taskId,
          title: 'Design new homepage layout',
          description: 'Create wireframes and mockups for the new homepage design',
          status: 'In Progress',
          priority: 'high',
          type: 'task', // 'task' or 'bug'
          project_id: '1',
          milestone_id: '1', // Linked to Design Phase Complete milestone
          assignee_ids: ['2'],
          assignee_names: ['John Doe'],
          due_date: '2024-10-05T00:00:00Z',
          created_at: '2024-09-20T00:00:00Z',
          updated_at: '2024-09-25T00:00:00Z',
          tags: ['ui', 'design', 'homepage'],
          checklists: [
            {
              name: 'Design Tasks',
              items: [
                { text: 'Create wireframes', completed: true },
                { text: 'Design mockups', completed: false },
                { text: 'Get feedback', completed: false }
              ]
            }
          ],
          comments: [
            {
              id: '1',
              content: 'Looking good so far!',
              author: 'Jane Smith',
              created_at: '2024-09-24T10:00:00Z'
            }
          ]
        }
      };
    },
    enabled: !!taskId && isOpen,
  });

  // Mock users data
  const usersData = {
    users: [
      { id: '1', first_name: 'Demo', last_name: 'User', email: 'demo@example.com' },
      { id: '2', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      { id: '3', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
      { id: '4', first_name: 'Sarah', last_name: 'Wilson', email: 'sarah@example.com' }
    ]
  };

  // Initialize form when task data is loaded
  useEffect(() => {
    if (taskData?.task) {
      const task = taskData.task;
      reset({
        title: task.title,
        status: task.status,
        priority: task.priority,
        type: task.type || 'task',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        checklists: task.checklists || [{ name: '', items: [{ text: '', completed: false }] }]
      });
      setDescription(task.description || '');
      setSelectedAssignees(task.assignee_ids || []);
    }
  }, [taskData, reset]);

  // Initialize milestone search when task data loads or editing starts
  useEffect(() => {
    if (taskData?.task && isEditing) {
      const currentMilestone = mockMilestones.find(m => m.id === taskData.task.milestone_id);
      setMilestoneSearch(currentMilestone ? currentMilestone.title : 'No milestone');
      setValue('milestone_id', taskData.task.milestone_id || '');
    }
  }, [taskData, isEditing, setValue]);

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updates) => {
      // Mock update
      return { task: { ...taskData.task, ...updates } };
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
      return { comment: { id: Date.now(), content: comment, author: 'Demo User', created_at: new Date().toISOString() } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task', taskId]);
      setNewComment('');
      toast.success('Comment added successfully');
    },
  });

  // Add tag mutation
  const addTagMutation = useMutation({
    mutationFn: async (tag) => {
      return { tag: { name: tag } };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task', taskId]);
      setNewTag('');
      toast.success('Tag added successfully');
    },
  });

  const handleSubmitTask = (data) => {
    const updates = {
      ...data,
      description,
      assignee_ids: selectedAssignees,
      checklists: data.checklists.filter(checklist => 
        checklist.name.trim() || checklist.items.some(item => item.text.trim())
      )
    };
    updateTaskMutation.mutate(updates);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTagMutation.mutate(newTag.trim());
    }
  };

  const handleAssigneeToggle = (userId) => {
    setSelectedAssignees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleQuickUpdate = (field, value) => {
    const updates = { [field]: value };
    updateTaskMutation.mutate(updates);
    setQuickEditField(null);
  };

  const addChecklistItem = (checklistIndex) => {
    const currentChecklists = watch('checklists');
    const updatedChecklists = [...currentChecklists];
    updatedChecklists[checklistIndex].items.push({ text: '', completed: false });
    setValue('checklists', updatedChecklists);
  };

  const removeChecklistItem = (checklistIndex, itemIndex) => {
    const currentChecklists = watch('checklists');
    const updatedChecklists = [...currentChecklists];
    updatedChecklists[checklistIndex].items.splice(itemIndex, 1);
    setValue('checklists', updatedChecklists);
  };

  if (isLoading) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <div className="fixed inset-0 bg-black bg-opacity-25" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  if (!taskData?.task) return null;

  const task = taskData.task;

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
              <Dialog.Panel className={`w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all ${
                task.type === 'bug' ? 'ring-2 ring-red-500' : ''
              }`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${
                  task.type === 'bug' ? 'bg-red-50' : ''
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${
                      task.type === 'bug' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {task.type === 'bug' ? (
                        <>
                          <BugAntIcon className="h-3 w-3 mr-1" />
                          Bug
                        </>
                      ) : (
                        <>
                          <DocumentTextIcon className="h-3 w-3 mr-1" />
                          Task
                        </>
                      )}
                    </span>
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                      {isEditing ? 'Edit Task' : task.title}
                    </Dialog.Title>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex">
                  {/* Main Content */}
                  <div className="flex-1 p-6">
                    {isEditing ? (
                      <form onSubmit={handleSubmit(handleSubmitTask)} className="space-y-6">
                        {/* Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            {...register('title', { required: 'Title is required' })}
                            className="input w-full"
                            placeholder="Enter task title"
                          />
                          {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                          )}
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <RichTextEditor
                            value={description}
                            onChange={setDescription}
                            placeholder="Enter task description..."
                          />
                        </div>

                        {/* Milestone Selection Dropdown */}
                        <div className="relative milestone-dropdown">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Link to Milestone
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search milestones..."
                              value={milestoneSearch}
                              onChange={(e) => setMilestoneSearch(e.target.value)}
                              onFocus={() => setShowMilestoneDropdown(true)}
                              className="w-full input pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowMilestoneDropdown(!showMilestoneDropdown)}
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            {showMilestoneDropdown && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                <div className="p-2">
                                  <div 
                                    className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded cursor-pointer"
                                    onClick={() => {
                                      setMilestoneSearch('No milestone');
                                      setValue('milestone_id', '');
                                      setShowMilestoneDropdown(false);
                                    }}
                                  >
                                    No milestone
                                  </div>
                                  {mockMilestones
                                    .filter(milestone => 
                                      milestone.title.toLowerCase().includes(milestoneSearch.toLowerCase()) ||
                                      milestone.description?.toLowerCase().includes(milestoneSearch.toLowerCase())
                                    )
                                    .map(milestone => (
                                      <div
                                        key={milestone.id}
                                        className="px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
                                        onClick={() => {
                                          setMilestoneSearch(milestone.title);
                                          setValue('milestone_id', milestone.id);
                                          setShowMilestoneDropdown(false);
                                        }}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <div 
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: milestone.color }}
                                          />
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">
                                              {milestone.title}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              Due: {new Date(milestone.due_date).toLocaleDateString()}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Checklists */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                              Checklists
                            </label>
                            <button
                              type="button"
                              onClick={() => appendChecklist({ name: '', items: [{ text: '', completed: false }] })}
                              className="btn-outline btn-sm"
                            >
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Add Checklist
                            </button>
                          </div>
                          
                          {checklistFields.map((checklist, checklistIndex) => (
                            <div key={checklist.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                              <div className="flex items-center justify-between mb-3">
                                <input
                                  {...register(`checklists.${checklistIndex}.name`)}
                                  placeholder="Checklist name"
                                  className="input flex-1 mr-2"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeChecklist(checklistIndex)}
                                  className="p-1 text-red-500 hover:text-red-700"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                              
                              {watch(`checklists.${checklistIndex}.items`)?.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center space-x-2 mb-2">
                                  <input
                                    type="checkbox"
                                    {...register(`checklists.${checklistIndex}.items.${itemIndex}.completed`)}
                                    className="rounded border-gray-300"
                                  />
                                  <input
                                    {...register(`checklists.${checklistIndex}.items.${itemIndex}.text`)}
                                    placeholder="Checklist item"
                                    className="input flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeChecklistItem(checklistIndex, itemIndex)}
                                    className="p-1 text-red-500 hover:text-red-700"
                                  >
                                    <MinusIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                              
                              <button
                                type="button"
                                onClick={() => addChecklistItem(checklistIndex)}
                                className="text-sm text-primary-600 hover:text-primary-700"
                              >
                                + Add item
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="btn-outline"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={updateTaskMutation.isLoading}
                            className="btn-primary"
                          >
                            {updateTaskMutation.isLoading ? (
                              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        {/* Description */}
                        {task.description && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                            <div 
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: task.description }}
                            />
                          </div>
                        )}

                        {/* Checklists */}
                        {task.checklists && task.checklists.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Checklists</h4>
                            {task.checklists.map((checklist, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                                <h5 className="font-medium text-gray-900 mb-2">{checklist.name}</h5>
                                <div className="space-y-2">
                                  {checklist.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-center space-x-2">
                                      <CheckCircleIcon 
                                        className={`h-4 w-4 ${
                                          item.completed ? 'text-green-500' : 'text-gray-300'
                                        }`}
                                      />
                                      <span className={item.completed ? 'line-through text-gray-500' : ''}>
                                        {item.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comments */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Comments</h4>
                          <div className="space-y-3 mb-4">
                            {task.comments?.map((comment) => (
                              <div key={comment.id} className="flex space-x-3">
                                <Avatar
                                  user={{ first_name: comment.author.split(' ')[0], last_name: comment.author.split(' ')[1] }}
                                  size="sm"
                                />
                                <div className="flex-1">
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                                      <span className="text-xs text-gray-500">
                                        {formatDateTime(comment.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Add Comment */}
                          <div className="flex space-x-3">
                            <Avatar
                              user={{ first_name: 'Demo', last_name: 'User' }}
                              size="sm"
                            />
                            <div className="flex-1">
                              <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="input w-full resize-none"
                                rows={3}
                              />
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={handleAddComment}
                                  disabled={!newComment.trim() || addCommentMutation.isLoading}
                                  className="btn-primary btn-sm"
                                >
                                  Add Comment
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
                    <div className="space-y-6">
                      {/* Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>

                      {/* Task Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        {isEditing ? (
                          <select 
                            value={watch('type') || 'task'}
                            onChange={(e) => setValue('type', e.target.value)}
                            className="input w-full"
                          >
                            <option value="task">Task</option>
                            <option value="bug">Bug</option>
                          </select>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {task.type === 'bug' ? (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                <BugAntIcon className="h-3 w-3" />
                                <span>Bug</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                <DocumentTextIcon className="h-3 w-3" />
                                <span>Task</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                        {isEditing ? (
                          <div className="space-y-2">
                            <MantineProvider>
                              <DatePicker
                                value={watch('due_date') ? new Date(watch('due_date')) : null}
                                onChange={(date) => {
                                  if (date instanceof Date && !isNaN(date)) {
                                    setValue('due_date', date.toISOString().split('T')[0]);
                                  } else if (date === null) {
                                    setValue('due_date', '');
                                  }
                                }}
                                placeholder="Select due date"
                                size="sm"
                                styles={{
                                  input: {
                                    borderColor: '#d1d5db',
                                    borderRadius: '0.375rem',
                                    padding: '0.5rem 0.75rem',
                                  },
                                }}
                              />
                            </MantineProvider>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const today = new Date().toISOString().split('T')[0];
                                  setValue('due_date', today);
                                }}
                                className="btn-outline btn-sm"
                              >
                                Today
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  setValue('due_date', tomorrow.toISOString().split('T')[0]);
                                }}
                                className="btn-outline btn-sm"
                              >
                                Tomorrow
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextWeek = new Date();
                                  nextWeek.setDate(nextWeek.getDate() + 7);
                                  setValue('due_date', nextWeek.toISOString().split('T')[0]);
                                }}
                                className="btn-outline btn-sm"
                              >
                                Next Week
                              </button>
                            </div>
                          </div>
                        ) : quickEditField === 'due_date' ? (
                          <div className="space-y-2">
                            <MantineProvider>
                              <DatePicker
                                defaultValue={task.due_date ? new Date(task.due_date) : null}
                                onChange={(date) => {
                                  if (date instanceof Date && !isNaN(date)) {
                                    handleQuickUpdate('due_date', date.toISOString().split('T')[0]);
                                  } else if (date === null) {
                                    handleQuickUpdate('due_date', '');
                                  }
                                }}
                                placeholder="Select due date"
                                size="sm"
                                autoFocus
                                styles={{
                                  input: {
                                    borderColor: '#d1d5db',
                                    borderRadius: '0.375rem',
                                    padding: '0.5rem 0.75rem',
                                  },
                                }}
                              />
                            </MantineProvider>
                            <div className="flex space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const today = new Date().toISOString().split('T')[0];
                                  handleQuickUpdate('due_date', today);
                                }}
                                className="btn-outline btn-sm text-xs"
                              >
                                Today
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  handleQuickUpdate('due_date', tomorrow.toISOString().split('T')[0]);
                                }}
                                className="btn-outline btn-sm text-xs"
                              >
                                Tomorrow
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickEditField(null)}
                                className="btn-outline btn-sm text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {task.due_date ? formatDateTime(task.due_date, 'MMM dd, yyyy') : 'No due date set'}
                            </div>
                            <button
                              onClick={() => setQuickEditField('due_date')}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            >
                              <PencilIcon className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        {isEditing ? (
                          <div className="space-y-2">
                            <select 
                              value={watch('priority') || 'medium'}
                              onChange={(e) => setValue('priority', e.target.value)}
                              className="input w-full"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>
                        ) : quickEditField === 'priority' ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                type="button"
                                onClick={() => handleQuickUpdate('priority', 'low')}
                                className="btn-outline btn-sm text-xs"
                              >
                                🟢 Low
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickUpdate('priority', 'medium')}
                                className="btn-outline btn-sm text-xs"
                              >
                                🟡 Medium
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickUpdate('priority', 'high')}
                                className="btn-outline btn-sm text-xs"
                              >
                                🟠 High
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickUpdate('priority', 'urgent')}
                                className="btn-outline btn-sm text-xs"
                              >
                                🔴 Urgent
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setQuickEditField(null)}
                              className="btn-outline btn-sm text-xs w-full"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority === 'low' && '🟢'} 
                              {task.priority === 'medium' && '🟡'} 
                              {task.priority === 'high' && '🟠'} 
                              {task.priority === 'urgent' && '🔴'} 
                              {task.priority}
                            </span>
                            <button
                              onClick={() => setQuickEditField('priority')}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            >
                              <PencilIcon className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Assignees */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assignees</label>
                        
                        {/* Current Assignees */}
                        <div className="space-y-2 mb-3">
                          {selectedAssignees.length > 0 ? (
                            selectedAssignees.map((assigneeId) => {
                              const user = usersData.users.find(u => u.id === assigneeId);
                              return user ? (
                                <div key={assigneeId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <Avatar user={user} size="sm" />
                                    <span className="text-sm font-medium">{user.first_name} {user.last_name}</span>
                                  </div>
                                  {isEditing && (
                                    <button
                                      onClick={() => handleAssigneeToggle(assigneeId)}
                                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                                      title="Remove assignee"
                                    >
                                      <XMarkIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ) : null;
                            })
                          ) : (
                            <div className="text-sm text-gray-500 italic">No assignees</div>
                          )}
                        </div>

                        {/* Add Assignee Dropdown */}
                        {isEditing && (
                          <div className="relative">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssigneeToggle(e.target.value);
                                  e.target.value = ''; // Reset dropdown
                                }
                              }}
                              className="input w-full"
                              defaultValue=""
                            >
                              <option value="" disabled>Add assignee...</option>
                              {usersData.users
                                .filter(user => !selectedAssignees.includes(user.id))
                                .map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {task.tags?.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full"
                            >
                              <TagIcon className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        {/* Add Tag */}
                        <div className="flex space-x-2">
                          <input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add tag"
                            className="input flex-1 text-sm"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                          />
                          <button
                            onClick={handleAddTag}
                            disabled={!newTag.trim()}
                            className="btn-outline btn-sm"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Created: {formatDateTime(task.created_at)}</div>
                          <div>Updated: {formatDateTime(task.updated_at)}</div>
                        </div>
                      </div>
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

export default TaskDetailModal;
