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
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
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
  const [milestoneSearch, setMilestoneSearch] = useState('');
  const [showMilestoneDropdown, setShowMilestoneDropdown] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
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

  // Initialize milestone search when task data loads or editing starts
  useEffect(() => {
    if (taskData?.task && isEditing) {
      const currentMilestone = mockMilestones.find(m => m.id === taskData.task.milestone_id);
      setMilestoneSearch(currentMilestone ? currentMilestone.title : 'No milestone');
      setValue('milestone_id', taskData.task.milestone_id || '');
    }
  }, [taskData, isEditing, setValue]);

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
          type: 'task',
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
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        checklists: task.checklists || [{ name: '', items: [{ text: '', completed: false }] }]
      });
      setDescription(task.description || '');
      setSelectedAssignees(task.assignee_ids || []);
    }
  }, [taskData, reset]);

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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.type === 'issue' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {task.type === 'issue' ? '🐛 Issue' : '📋 Task'}
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

                        {/* Status and Priority */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Status
                            </label>
                            <select {...register('status')} className="input w-full">
                              <option value="Backlog">Backlog</option>
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Review">Review</option>
                              <option value="Done">Done</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Priority
                            </label>
                            <select {...register('priority')} className="input w-full">
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>
                        </div>

                        {/* Due Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Due Date
                          </label>
                          <input
                            type="date"
                            {...register('due_date')}
                            className="input w-full"
                          />
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

                      {/* Priority */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Due Date */}
                      {task.due_date && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                          <div className="flex items-center text-sm text-gray-600">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {formatDateTime(task.due_date, 'MMM dd, yyyy')}
                          </div>
                        </div>
                      )}

                      {/* Assignees */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assignees</label>
                        {isEditing ? (
                          <div className="space-y-2">
                            {usersData.users.map((user) => (
                              <label key={user.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedAssignees.includes(user.id)}
                                  onChange={() => handleAssigneeToggle(user.id)}
                                  className="rounded border-gray-300 mr-2"
                                />
                                <Avatar user={user} size="sm" className="mr-2" />
                                <span className="text-sm">{user.first_name} {user.last_name}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="flex -space-x-1">
                            {task.assignee_names?.map((name, idx) => (
                              <Avatar
                                key={idx}
                                user={{ first_name: name.split(' ')[0], last_name: name.split(' ')[1] }}
                                size="sm"
                                className="border-2 border-white"
                              />
                            ))}
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
                  <div className="flex h-[80vh]">
                    {/* Main Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`badge ${
                              task.type === 'issue' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {task.type === 'issue' ? '🐛 Issue' : '📋 Task'}
                            </span>
                            <span className={`badge ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`badge ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                          
                          {isEditing ? (
                            <form onSubmit={handleSubmit(handleUpdateTask)} className="space-y-4">
                              <input
                                {...register('title', { required: 'Title is required' })}
                                defaultValue={task.title}
                                className="text-2xl font-bold bg-transparent border-b-2 border-gray-300 focus:border-primary-500 outline-none w-full"
                              />
                              <textarea
                                {...register('description')}
                                defaultValue={task.description || ''}
                                rows={3}
                                className="w-full input"
                                placeholder="Task description"
                              />
                              
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
                              
                              <input
                                {...register('tags')}
                                defaultValue={task.tags?.join(', ') || ''}
                                className="input"
                                placeholder="Tags (comma separated)"
                              />
                              <div className="flex space-x-2">
                                <button type="submit" className="btn-primary btn-sm">
                                  Save Changes
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setIsEditing(false)}
                                  className="btn-outline btn-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {task.title}
                              </h1>
                              {task.description && (
                                <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                                  {task.description}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {!isEditing && (
                            <button
                              onClick={() => setIsEditing(true)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>

                      {/* Issue-specific fields */}
                      {task.type === 'issue' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                          <h3 className="font-medium text-red-900 mb-2">Issue Details</h3>
                          <div className="space-y-2 text-sm">
                            {task.severity && (
                              <div>
                                <span className="font-medium">Severity:</span> 
                                <span className={`ml-2 badge ${
                                  task.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                  task.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                  task.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {task.severity}
                                </span>
                              </div>
                            )}
                            {task.environment && (
                              <div>
                                <span className="font-medium">Environment:</span> {task.environment}
                              </div>
                            )}
                            {task.steps_to_reproduce && (
                              <div>
                                <span className="font-medium">Steps to Reproduce:</span>
                                <pre className="mt-1 text-sm bg-white p-2 rounded border whitespace-pre-wrap">
                                  {task.steps_to_reproduce}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {task.tags.map((tag, index) => (
                              <span key={index} className="badge bg-gray-100 text-gray-800">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attachments */}
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Attachments</h3>
                          <div className="space-y-2">
                            {task.attachments.map((file) => (
                              <div key={file.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                                <PaperClipIcon className="h-5 w-5 text-gray-400" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{file.original_name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <a
                                  href={`/api/files/${file.id}/download`}
                                  className="text-primary-600 hover:text-primary-700 text-sm"
                                >
                                  Download
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Checklists */}
                      {task.checklists && task.checklists.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Checklist</h3>
                          <div className="space-y-2">
                            {task.checklists.map((item) => (
                              <div key={item.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={item.is_completed}
                                  readOnly
                                  className="rounded border-gray-300"
                                />
                                <span className={`text-sm ${
                                  item.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
                                }`}>
                                  {item.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comments */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-4">
                          Comments ({task.comments?.length || 0})
                        </h3>
                        
                        {/* Add Comment */}
                        <form onSubmit={handleAddComment} className="mb-4">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                            className="input"
                            placeholder="Add a comment..."
                          />
                          <div className="mt-2 flex justify-end">
                            <button
                              type="submit"
                              disabled={!newComment.trim() || addCommentMutation.isLoading}
                              className="btn-primary btn-sm"
                            >
                              {addCommentMutation.isLoading ? (
                                <LoadingSpinner size="sm" color="white" />
                              ) : (
                                'Add Comment'
                              )}
                            </button>
                          </div>
                        </form>

                        {/* Comments List */}
                        <div className="space-y-4">
                          {task.comments?.map((comment) => (
                            <div key={comment.id} className="flex space-x-3">
                              <Avatar 
                                user={{
                                  first_name: comment.first_name,
                                  last_name: comment.last_name,
                                  avatar_url: comment.avatar_url
                                }} 
                                size="sm" 
                              />
                              <div className="flex-1">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-900">
                                      {comment.first_name} {comment.last_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDateTime(comment.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
                      <div className="space-y-6">
                        {/* Actions */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Actions</h3>
                          <div className="space-y-2">
                            {task.type === 'task' && (
                              <button
                                onClick={() => setShowConvertDialog(true)}
                                className="w-full btn-outline btn-sm flex items-center justify-center"
                              >
                                <ArrowPathIcon className="h-4 w-4 mr-2" />
                                Convert to Issue
                              </button>
                            )}
                            <button
                              onClick={handleDeleteTask}
                              className="w-full btn-danger btn-sm flex items-center justify-center"
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete Task
                            </button>
                          </div>
                        </div>

                        {/* Assignees */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Assignees</h3>
                          {task.assignees && task.assignees.length > 0 ? (
                            <div className="space-y-2">
                              {task.assignees.map((assignee) => (
                                <div key={assignee.id} className="flex items-center space-x-2">
                                  <Avatar user={assignee} size="sm" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {assignee.first_name} {assignee.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">{assignee.email}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No assignees</p>
                          )}
                        </div>

                        {/* Details */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Details</h3>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-gray-500">Project:</span>
                              <p className="font-medium">{task.project_name}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Reporter:</span>
                              <p className="font-medium">{task.reporter_name}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Created:</span>
                              <p className="font-medium">{formatDateTime(task.created_at)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Updated:</span>
                              <p className="font-medium">{formatDateTime(task.updated_at)}</p>
                            </div>
                            {task.due_date && (
                              <div>
                                <span className="text-gray-500">Due Date:</span>
                                <p className={`font-medium ${
                                  new Date(task.due_date) < new Date() ? 'text-red-600' : ''
                                }`}>
                                  {formatDateTime(task.due_date)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">Task not found</p>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        {/* Convert to Issue Dialog */}
        <ConvertToIssueDialog
          isOpen={showConvertDialog}
          onClose={() => setShowConvertDialog(false)}
          onConfirm={handleConvertToIssue}
          isLoading={convertToIssueMutation.isLoading}
        />
      </Dialog>
    </Transition>
  );
};

const ConvertToIssueDialog = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = (data) => {
    onConfirm(data);
    reset();
  };

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 mb-4">
                  Convert Task to Issue
                </Dialog.Title>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Severity *
                    </label>
                    <select
                      {...register('severity', { required: true })}
                      className="mt-1 input"
                    >
                      <option value="">Select severity</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Environment
                    </label>
                    <input
                      {...register('environment')}
                      type="text"
                      className="mt-1 input"
                      placeholder="e.g., Production, Staging, Development"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Steps to Reproduce
                    </label>
                    <textarea
                      {...register('steps_to_reproduce')}
                      rows={4}
                      className="mt-1 input"
                      placeholder="Describe the steps to reproduce this issue..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary"
                    >
                      {isLoading ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        'Convert to Issue'
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

export default TaskDetailModal;
