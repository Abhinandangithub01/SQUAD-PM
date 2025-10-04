import React, { useState } from 'react';
import {
  BoltIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import amplifyDataService from '../services/amplifyDataService';
import toast from 'react-hot-toast';

const TRIGGERS = [
  { id: 'status_changed', name: 'Status changes to', field: 'status' },
  { id: 'priority_changed', name: 'Priority changes to', field: 'priority' },
  { id: 'assigned', name: 'Task is assigned to', field: 'assignee' },
  { id: 'due_date_approaching', name: 'Due date is within', field: 'days' },
  { id: 'created', name: 'Task is created', field: null },
  { id: 'completed', name: 'Task is completed', field: null },
];

const ACTIONS = [
  { id: 'notify', name: 'Send notification to', field: 'user' },
  { id: 'assign', name: 'Assign to', field: 'user' },
  { id: 'change_status', name: 'Change status to', field: 'status' },
  { id: 'change_priority', name: 'Change priority to', field: 'priority' },
  { id: 'add_comment', name: 'Add comment', field: 'text' },
  { id: 'add_label', name: 'Add label', field: 'label' },
  { id: 'move_to_project', name: 'Move to project', field: 'project' },
];

const TaskAutomation = ({ projectId }) => {
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [triggerValue, setTriggerValue] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [actionValue, setActionValue] = useState('');
  const [ruleName, setRuleName] = useState('');

  const queryClient = useQueryClient();

  // Fetch automation rules
  const { data: rulesData } = useQuery({
    queryKey: ['automation-rules', projectId],
    queryFn: async () => {
      const result = await amplifyDataService.automation.listRules({ projectId });
      return result.success ? result.data : [];
    },
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData) => {
      const result = await amplifyDataService.automation.createRule({
        ...ruleData,
        projectId,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-rules']);
      toast.success('Automation rule created');
      setShowCreateRule(false);
      resetForm();
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId) => {
      const result = await amplifyDataService.automation.deleteRule(ruleId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-rules']);
      toast.success('Rule deleted');
    },
  });

  // Toggle rule mutation
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, enabled }) => {
      const result = await amplifyDataService.automation.updateRule(ruleId, { enabled });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-rules']);
    },
  });

  const resetForm = () => {
    setRuleName('');
    setSelectedTrigger('');
    setTriggerValue('');
    setSelectedAction('');
    setActionValue('');
  };

  const handleCreateRule = () => {
    if (!ruleName || !selectedTrigger || !selectedAction) {
      toast.error('Please fill in all required fields');
      return;
    }

    createRuleMutation.mutate({
      name: ruleName,
      trigger: {
        type: selectedTrigger,
        value: triggerValue,
      },
      action: {
        type: selectedAction,
        value: actionValue,
      },
      enabled: true,
    });
  };

  const rules = rulesData || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Automation Rules</h3>
          <p className="text-sm text-gray-600 mt-1">
            Automate repetitive tasks with custom rules
          </p>
        </div>
        <button
          onClick={() => setShowCreateRule(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Rule</span>
        </button>
      </div>

      {/* Create Rule Form */}
      {showCreateRule && (
        <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900">Create New Rule</h4>
            <button
              onClick={() => {
                setShowCreateRule(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Rule Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rule Name
              </label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g., Auto-assign high priority bugs"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Trigger */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                When (Trigger)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedTrigger}
                  onChange={(e) => setSelectedTrigger(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select trigger...</option>
                  {TRIGGERS.map(trigger => (
                    <option key={trigger.id} value={trigger.id}>
                      {trigger.name}
                    </option>
                  ))}
                </select>
                
                {selectedTrigger && TRIGGERS.find(t => t.id === selectedTrigger)?.field && (
                  <input
                    type="text"
                    value={triggerValue}
                    onChange={(e) => setTriggerValue(e.target.value)}
                    placeholder="Value..."
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>

            {/* Action */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Then (Action)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select action...</option>
                  {ACTIONS.map(action => (
                    <option key={action.id} value={action.id}>
                      {action.name}
                    </option>
                  ))}
                </select>
                
                {selectedAction && ACTIONS.find(a => a.id === selectedAction)?.field && (
                  <input
                    type="text"
                    value={actionValue}
                    onChange={(e) => setActionValue(e.target.value)}
                    placeholder="Value..."
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>

            {/* Create Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateRule(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={createRuleMutation.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      {rules.length > 0 ? (
        <div className="space-y-3">
          {rules.map(rule => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-all"
            >
              <div className="flex items-start space-x-3 flex-1">
                <BoltIcon className={`h-5 w-5 mt-0.5 ${rule.enabled ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900">{rule.name}</h5>
                  <p className="text-sm text-gray-600 mt-1">
                    When <span className="font-medium">{TRIGGERS.find(t => t.id === rule.trigger.type)?.name}</span>
                    {rule.trigger.value && <span className="font-medium"> {rule.trigger.value}</span>}
                    , then <span className="font-medium">{ACTIONS.find(a => a.id === rule.action.type)?.name}</span>
                    {rule.action.value && <span className="font-medium"> {rule.action.value}</span>}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Triggered {rule.execution_count || 0} times</span>
                    {rule.last_executed && (
                      <span>Last: {new Date(rule.last_executed).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Toggle */}
                <button
                  onClick={() => toggleRuleMutation.mutate({ ruleId: rule.id, enabled: !rule.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    rule.enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      rule.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    if (window.confirm('Delete this automation rule?')) {
                      deleteRuleMutation.mutate(rule.id);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <BoltIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No automation rules yet</h4>
          <p className="text-sm text-gray-600 mb-4">
            Create rules to automate repetitive tasks
          </p>
          <button
            onClick={() => setShowCreateRule(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Rule
          </button>
        </div>
      )}

      {/* Examples */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Example Rules</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• When status changes to <span className="font-medium">Done</span>, notify <span className="font-medium">assignee</span></p>
          <p>• When priority changes to <span className="font-medium">Urgent</span>, assign to <span className="font-medium">team lead</span></p>
          <p>• When due date is within <span className="font-medium">1 day</span>, send notification</p>
          <p>• When task is created with label <span className="font-medium">Bug</span>, change priority to <span className="font-medium">High</span></p>
        </div>
      </div>
    </div>
  );
};

export default TaskAutomation;
