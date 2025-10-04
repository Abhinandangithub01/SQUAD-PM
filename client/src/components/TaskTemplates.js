import React, { useState } from 'react';
import { 
  DocumentDuplicateIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import amplifyDataService from '../services/amplifyDataService';
import toast from 'react-hot-toast';

const BUILT_IN_TEMPLATES = [
  {
    id: 'bug-report',
    name: 'Bug Report',
    icon: '🐛',
    description: 'Standard bug report template',
    data: {
      title: 'Bug: ',
      description: '**Steps to Reproduce:**\n1. \n2. \n3. \n\n**Expected Behavior:**\n\n**Actual Behavior:**\n\n**Environment:**\n- Browser:\n- OS:\n',
      priority: 'HIGH',
      type: 'BUG',
      labels: [{ name: 'Bug', color: '#EF4444' }],
      checklists: [{
        name: 'Bug Fix Checklist',
        items: [
          { text: 'Reproduce the bug', completed: false },
          { text: 'Identify root cause', completed: false },
          { text: 'Implement fix', completed: false },
          { text: 'Test fix', completed: false },
          { text: 'Deploy to production', completed: false },
        ]
      }]
    }
  },
  {
    id: 'feature-request',
    name: 'Feature Request',
    icon: '✨',
    description: 'New feature development template',
    data: {
      title: 'Feature: ',
      description: '**User Story:**\nAs a [user type], I want [goal] so that [benefit]\n\n**Acceptance Criteria:**\n- [ ] \n- [ ] \n\n**Technical Notes:**\n',
      priority: 'MEDIUM',
      type: 'FEATURE',
      labels: [{ name: 'Feature', color: '#8B5CF6' }],
      checklists: [{
        name: 'Development Checklist',
        items: [
          { text: 'Design UI/UX', completed: false },
          { text: 'Implement frontend', completed: false },
          { text: 'Implement backend', completed: false },
          { text: 'Write tests', completed: false },
          { text: 'Code review', completed: false },
          { text: 'Deploy', completed: false },
        ]
      }]
    }
  },
  {
    id: 'design-task',
    name: 'Design Task',
    icon: '🎨',
    description: 'UI/UX design template',
    data: {
      title: 'Design: ',
      description: '**Design Brief:**\n\n**Target Audience:**\n\n**Design Goals:**\n\n**Constraints:**\n',
      priority: 'MEDIUM',
      type: 'TASK',
      labels: [{ name: 'Design', color: '#F59E0B' }],
      checklists: [{
        name: 'Design Process',
        items: [
          { text: 'Research & inspiration', completed: false },
          { text: 'Wireframes', completed: false },
          { text: 'High-fidelity mockups', completed: false },
          { text: 'Design review', completed: false },
          { text: 'Handoff to development', completed: false },
        ]
      }]
    }
  },
  {
    id: 'code-review',
    name: 'Code Review',
    icon: '👀',
    description: 'Code review checklist',
    data: {
      title: 'Review: ',
      description: '**PR Link:**\n\n**Changes Summary:**\n\n**Review Notes:**\n',
      priority: 'HIGH',
      type: 'TASK',
      checklists: [{
        name: 'Review Checklist',
        items: [
          { text: 'Code follows style guide', completed: false },
          { text: 'Tests are included', completed: false },
          { text: 'Documentation updated', completed: false },
          { text: 'No security issues', completed: false },
          { text: 'Performance considered', completed: false },
          { text: 'Approved', completed: false },
        ]
      }]
    }
  },
  {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    icon: '🏃',
    description: 'Sprint planning meeting template',
    data: {
      title: 'Sprint Planning: ',
      description: '**Sprint Goal:**\n\n**Capacity:**\n\n**Commitments:**\n\n**Risks:**\n',
      priority: 'HIGH',
      type: 'EPIC',
      estimated_hours: 40,
      checklists: [{
        name: 'Planning Tasks',
        items: [
          { text: 'Review backlog', completed: false },
          { text: 'Estimate stories', completed: false },
          { text: 'Assign tasks', completed: false },
          { text: 'Set sprint goal', completed: false },
          { text: 'Identify risks', completed: false },
        ]
      }]
    }
  },
];

const TaskTemplates = ({ onSelectTemplate, onClose }) => {
  const [customTemplates, setCustomTemplates] = useState([]);
  const queryClient = useQueryClient();

  // Fetch custom templates
  const { data: templatesData } = useQuery({
    queryKey: ['task-templates'],
    queryFn: async () => {
      const result = await amplifyDataService.templates.list();
      return result.success ? result.data : [];
    },
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (template) => {
      const result = await amplifyDataService.templates.create(template);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task-templates']);
      toast.success('Template saved successfully');
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId) => {
      const result = await amplifyDataService.templates.delete(templateId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['task-templates']);
      toast.success('Template deleted');
    },
  });

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template.data);
    onClose();
    toast.success(`Applied "${template.name}" template`);
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Delete this template?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const allTemplates = [...BUILT_IN_TEMPLATES, ...(templatesData || [])];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Template</h3>
        <p className="text-sm text-gray-600 mb-6">
          Start with a pre-configured template to save time
        </p>
      </div>

      {/* Built-in Templates */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <BookmarkIcon className="h-4 w-4 mr-1" />
          Built-in Templates
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {BUILT_IN_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="text-left p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-start space-x-3">
                <span className="text-3xl">{template.icon}</span>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 group-hover:text-blue-700">
                    {template.name}
                  </h5>
                  <p className="text-xs text-gray-600 mt-1">
                    {template.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    {template.data.labels?.map(label => (
                      <span
                        key={label.name}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: label.color + '20',
                          color: label.color,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Templates */}
      {templatesData && templatesData.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            Your Templates
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {templatesData.map(template => (
              <div
                key={template.id}
                className="relative p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-all group"
              >
                <button
                  onClick={() => handleSelectTemplate(template)}
                  className="text-left w-full"
                >
                  <h5 className="font-semibold text-gray-900 group-hover:text-blue-700">
                    {template.name}
                  </h5>
                  <p className="text-xs text-gray-600 mt-1">
                    {template.description || 'Custom template'}
                  </p>
                </button>
                
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty Template */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            onSelectTemplate({});
            onClose();
          }}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all text-center"
        >
          <PlusIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Start from scratch</p>
          <p className="text-xs text-gray-500 mt-1">Create a blank task</p>
        </button>
      </div>
    </div>
  );
};

export default TaskTemplates;
