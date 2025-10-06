import React, { useState, useRef, useEffect } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  PaperClipIcon,
  CheckIcon,
  ClockIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import amplifyDataService from '../services/amplifyDataService';
import toast from 'react-hot-toast';

const InlineTaskCreator = ({ columnId, projectId, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDetails, setShowDetails] = useState(false);
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
    titleInputRef.current?.focus();
  }, []);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const result = await amplifyDataService.tasks.create({
        ...taskData,
        projectId,
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

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      assignee,
      due_date: dueDate || null,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      tags: tags.length > 0 ? tags : null,
      checklist: checklist.length > 0 ? JSON.stringify(checklist) : null,
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
    setShowDetails(false);
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

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 mb-3">
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        {/* Title Input */}
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for this card..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
        />

        {/* Quick Actions Bar */}
        <div className="flex items-center space-x-2 mb-3">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>{showDetails ? 'Hide' : 'Show'} Details</span>
          </button>

          {/* Priority Selector */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="space-y-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a more detailed description..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Assignee & Due Date Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700 mb-1">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Assignee</span>
                </label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="Username"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700 mb-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>Due Date</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="flex items-center space-x-1 text-xs font-medium text-gray-700 mb-1">
                <ClockIcon className="h-3.5 w-3.5" />
                <span>Estimated Hours</span>
              </label>
              <input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="0"
                step="0.5"
                min="0"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center space-x-1 text-xs font-medium text-gray-700 mb-1">
                <TagIcon className="h-3.5 w-3.5" />
                <span>Labels</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type and press Enter to add label..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center space-x-1 text-xs font-medium text-gray-700">
                  <CheckIcon className="h-3.5 w-3.5" />
                  <span>Checklist</span>
                </label>
                {!showChecklistInput && (
                  <button
                    type="button"
                    onClick={() => setShowChecklistInput(true)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Add Item
                  </button>
                )}
              </div>

              {checklist.length > 0 && (
                <div className="space-y-1 mb-2">
                  {checklist.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 group">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItem(index)}
                        className="rounded border-gray-300"
                      />
                      <span className={`text-sm flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                        {item.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(index)}
                        className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
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
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChecklistInput(false);
                      setChecklistInput('');
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="submit"
            disabled={!title.trim() || createTaskMutation.isLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createTaskMutation.isLoading ? 'Adding...' : 'Add card'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default InlineTaskCreator;
