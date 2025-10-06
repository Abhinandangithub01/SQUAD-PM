import React, { useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  CheckIcon,
  ClockIcon,
  Bars3BottomLeftIcon,
} from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import amplifyDataService from '../services/amplifyDataService';
import toast from 'react-hot-toast';

const TrelloStyleTaskModal = ({ isOpen, onClose, columnId, projectId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [checklistInput, setChecklistInput] = useState('');
  const [showChecklistInput, setShowChecklistInput] = useState(false);
  
  const titleInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      // Ensure we have required fields
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      if (!columnId) {
        throw new Error('Column ID is required');
      }

      const result = await amplifyDataService.tasks.create({
        ...taskData,
        projectId: projectId,
        status: columnId,
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create task');
      }
      
      return result.data;
    },
    onSuccess: () => {
      toast.success('Task created successfully!');
      queryClient.invalidateQueries(['tasks', projectId]);
      if (onSuccess) onSuccess();
      handleReset();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create task');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (!columnId) {
      toast.error('Column ID is required');
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || '',
      priority: priority || 'MEDIUM',
      assignedToId: assignee.trim() || null,
      dueDate: dueDate || null,
      tags: tags.length > 0 ? tags : [],
      // Note: estimatedHours and checklist will be added when schema is updated
    };

    createTaskMutation.mutate(taskData);
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setAssignee('');
    setDueDate('');
    setPriority('MEDIUM');
    setTags([]);
    setTagInput('');
    setEstimatedHours('');
    setChecklist([]);
    setChecklistInput('');
    setShowChecklistInput(false);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddChecklistItem = () => {
    if (checklistInput.trim()) {
      setChecklist([...checklist, { text: checklistInput.trim(), completed: false }]);
      setChecklistInput('');
    }
  };

  const handleToggleChecklistItem = (index) => {
    const newChecklist = [...checklist];
    newChecklist[index].completed = !newChecklist[index].completed;
    setChecklist(newChecklist);
  };

  const handleRemoveChecklistItem = (index) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    handleReset();
    onClose();
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
          <div className="fixed inset-0 bg-black bg-opacity-50" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Add a card
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a title for this card..."
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <Bars3BottomLeftIcon className="h-4 w-4" />
                        <span>Description</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a more detailed description..."
                        rows={4}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* Assignee & Due Date Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                          <UserIcon className="h-4 w-4" />
                          <span>Assignee</span>
                        </label>
                        <input
                          type="text"
                          value={assignee}
                          onChange={(e) => setAssignee(e.target.value)}
                          placeholder="Username"
                          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Due Date</span>
                        </label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Estimated Hours */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <ClockIcon className="h-4 w-4" />
                        <span>Estimated Hours</span>
                      </label>
                      <input
                        type="number"
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(e.target.value)}
                        placeholder="0"
                        step="0.5"
                        min="0"
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Labels */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <TagIcon className="h-4 w-4" />
                        <span>Labels</span>
                      </label>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-medium"
                            >
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-blue-900"
                              >
                                <XMarkIcon className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Type and press Enter to add label..."
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Checklist */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <CheckIcon className="h-4 w-4" />
                          <span>Checklist</span>
                        </label>
                        {!showChecklistInput && (
                          <button
                            type="button"
                            onClick={() => setShowChecklistInput(true)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Add Item
                          </button>
                        )}
                      </div>

                      {checklist.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {checklist.map((item, index) => (
                            <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 group">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => handleToggleChecklistItem(index)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className={`text-sm flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                {item.text}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveChecklistItem(index)}
                                className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition-opacity"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {showChecklistInput && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={checklistInput}
                            onChange={(e) => setChecklistInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddChecklistItem();
                              }
                            }}
                            placeholder="Add an item..."
                            className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddChecklistItem}
                            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowChecklistInput(false);
                              setChecklistInput('');
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!title.trim() || createTaskMutation.isLoading}
                      className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {createTaskMutation.isLoading ? 'Adding...' : 'Add card'}
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

export default TrelloStyleTaskModal;
