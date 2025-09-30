import React, { useState } from 'react';
import { 
  PlusIcon, 
  BoltIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const Automation = () => {
  const { isDarkMode } = useTheme();
  const [automations, setAutomations] = useState([
    {
      id: 1,
      name: 'Auto-assign new tasks',
      description: 'Automatically assign tasks to team members based on workload',
      trigger: 'When task is created',
      action: 'Assign to least busy team member',
      enabled: true,
      lastRun: '2 hours ago',
      runs: 24,
    },
    {
      id: 2,
      name: 'Overdue task notifications',
      description: 'Send notifications for overdue tasks',
      trigger: 'Daily at 9:00 AM',
      action: 'Send email notification',
      enabled: true,
      lastRun: '1 day ago',
      runs: 156,
    },
    {
      id: 3,
      name: 'Move completed tasks',
      description: 'Move tasks to Done column when marked complete',
      trigger: 'When task status changes to completed',
      action: 'Move to Done column',
      enabled: false,
      lastRun: 'Never',
      runs: 0,
    },
  ]);

  const [showBuilder, setShowBuilder] = useState(false);

  const bgColor = isDarkMode() ? 'var(--color-surface)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#111827';
  const textSecondary = isDarkMode() ? 'var(--color-text-secondary)' : '#6b7280';

  const toggleAutomation = (id) => {
    setAutomations(automations.map(auto => 
      auto.id === id ? { ...auto, enabled: !auto.enabled } : auto
    ));
  };

  const deleteAutomation = (id) => {
    if (window.confirm('Are you sure you want to delete this automation?')) {
      setAutomations(automations.filter(auto => auto.id !== id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: textColor }}>
            Automation
          </h1>
          <p className="mt-1" style={{ color: textSecondary }}>
            Automate repetitive tasks and workflows
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Automation</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className="rounded-lg p-4 border"
          style={{ backgroundColor: bgColor, borderColor }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: textSecondary }}>Total Automations</p>
              <p className="text-2xl font-bold mt-1" style={{ color: textColor }}>
                {automations.length}
              </p>
            </div>
            <BoltIcon className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div 
          className="rounded-lg p-4 border"
          style={{ backgroundColor: bgColor, borderColor }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: textSecondary }}>Active</p>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {automations.filter(a => a.enabled).length}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div 
          className="rounded-lg p-4 border"
          style={{ backgroundColor: bgColor, borderColor }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: textSecondary }}>Inactive</p>
              <p className="text-2xl font-bold mt-1 text-gray-600">
                {automations.filter(a => !a.enabled).length}
              </p>
            </div>
            <PauseIcon className="h-8 w-8 text-gray-600" />
          </div>
        </div>

        <div 
          className="rounded-lg p-4 border"
          style={{ backgroundColor: bgColor, borderColor }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: textSecondary }}>Total Runs</p>
              <p className="text-2xl font-bold mt-1" style={{ color: textColor }}>
                {automations.reduce((sum, a) => sum + a.runs, 0)}
              </p>
            </div>
            <PlayIcon className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        {automations.map((automation) => (
          <div
            key={automation.id}
            className="rounded-lg p-6 border"
            style={{ backgroundColor: bgColor, borderColor }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                    {automation.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    automation.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {automation.enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-sm" style={{ color: textSecondary }}>
                  {automation.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium" style={{ color: textSecondary }}>
                      TRIGGER
                    </p>
                    <p className="mt-1 text-sm" style={{ color: textColor }}>
                      {automation.trigger}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: textSecondary }}>
                      ACTION
                    </p>
                    <p className="mt-1 text-sm" style={{ color: textColor }}>
                      {automation.action}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-6 text-sm" style={{ color: textSecondary }}>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>Last run: {automation.lastRun}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <PlayIcon className="h-4 w-4" />
                    <span>{automation.runs} runs</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => toggleAutomation(automation.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    automation.enabled
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={automation.enabled ? 'Pause' : 'Activate'}
                >
                  {automation.enabled ? (
                    <PauseIcon className="h-5 w-5" />
                  ) : (
                    <PlayIcon className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => setShowBuilder(true)}
                  className="p-2 rounded-lg bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => deleteAutomation(automation.id)}
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {automations.length === 0 && (
        <div className="text-center py-12">
          <BoltIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium" style={{ color: textColor }}>
            No automations yet
          </h3>
          <p className="mt-1 text-sm" style={{ color: textSecondary }}>
            Get started by creating your first automation
          </p>
          <button
            onClick={() => setShowBuilder(true)}
            className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Automation
          </button>
        </div>
      )}

      {/* Automation Builder Modal - Will be implemented next */}
      {showBuilder && (
        <AutomationBuilder
          onClose={() => setShowBuilder(false)}
          onSave={(automation) => {
            setAutomations([...automations, { ...automation, id: Date.now(), enabled: true, lastRun: 'Never', runs: 0 }]);
            setShowBuilder(false);
          }}
        />
      )}
    </div>
  );
};

// Automation Builder Component
const AutomationBuilder = ({ onClose, onSave }) => {
  const { isDarkMode } = useTheme();
  const [step, setStep] = useState(1);
  const [automation, setAutomation] = useState({
    name: '',
    description: '',
    trigger: { type: '', config: {} },
    action: { type: '', config: {} },
  });

  const bgColor = isDarkMode() ? 'var(--color-surface)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#111827';
  const textSecondary = isDarkMode() ? 'var(--color-text-secondary)' : '#6b7280';

  const triggers = [
    { id: 'task_created', name: 'Task Created', description: 'When a new task is created' },
    { id: 'task_updated', name: 'Task Updated', description: 'When a task is updated' },
    { id: 'task_completed', name: 'Task Completed', description: 'When a task is marked as complete' },
    { id: 'task_overdue', name: 'Task Overdue', description: 'When a task becomes overdue' },
    { id: 'schedule', name: 'Schedule', description: 'Run on a schedule (daily, weekly, etc.)' },
  ];

  const actions = [
    { id: 'assign_task', name: 'Assign Task', description: 'Assign task to a team member' },
    { id: 'send_notification', name: 'Send Notification', description: 'Send email or in-app notification' },
    { id: 'move_task', name: 'Move Task', description: 'Move task to a different column' },
    { id: 'update_status', name: 'Update Status', description: 'Change task status' },
    { id: 'add_comment', name: 'Add Comment', description: 'Add a comment to the task' },
  ];

  const handleSave = () => {
    onSave({
      name: automation.name,
      description: automation.description,
      trigger: triggers.find(t => t.id === automation.trigger.type)?.name || '',
      action: actions.find(a => a.id === automation.action.type)?.name || '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
        
        <div 
          className="relative rounded-lg shadow-xl max-w-4xl w-full p-6"
          style={{ backgroundColor: bgColor }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: textColor }}>
              Create Automation
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <XCircleIcon className="h-6 w-6" style={{ color: textSecondary }} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= s ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300'
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-primary-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                  Name your automation
                </h3>
                <input
                  type="text"
                  placeholder="e.g., Auto-assign new tasks"
                  value={automation.name}
                  onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: bgColor, borderColor, color: textColor }}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={automation.description}
                  onChange={(e) => setAutomation({ ...automation, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg"
                  style={{ backgroundColor: bgColor, borderColor, color: textColor }}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                  Choose a trigger
                </h3>
                <p style={{ color: textSecondary }}>
                  When should this automation run?
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {triggers.map((trigger) => (
                    <button
                      key={trigger.id}
                      onClick={() => setAutomation({ ...automation, trigger: { type: trigger.id, config: {} } })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        automation.trigger.type === trigger.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium" style={{ color: textColor }}>
                        {trigger.name}
                      </div>
                      <div className="text-sm mt-1" style={{ color: textSecondary }}>
                        {trigger.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                  Choose an action
                </h3>
                <p style={{ color: textSecondary }}>
                  What should happen when the trigger fires?
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => setAutomation({ ...automation, action: { type: action.id, config: {} } })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        automation.action.type === action.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium" style={{ color: textColor }}>
                        {action.name}
                      </div>
                      <div className="text-sm mt-1" style={{ color: textSecondary }}>
                        {action.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                  Review and save
                </h3>
                <div 
                  className="p-4 border rounded-lg space-y-3"
                  style={{ backgroundColor: bgColor, borderColor }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: textSecondary }}>Name</p>
                    <p style={{ color: textColor }}>{automation.name}</p>
                  </div>
                  {automation.description && (
                    <div>
                      <p className="text-sm font-medium" style={{ color: textSecondary }}>Description</p>
                      <p style={{ color: textColor }}>{automation.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium" style={{ color: textSecondary }}>Trigger</p>
                    <p style={{ color: textColor }}>
                      {triggers.find(t => t.id === automation.trigger.type)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: textSecondary }}>Action</p>
                    <p style={{ color: textColor }}>
                      {actions.find(a => a.id === automation.action.type)?.name}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t" style={{ borderColor }}>
            <button
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              style={{ borderColor, color: textColor }}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={() => step < 4 ? setStep(step + 1) : handleSave()}
              disabled={
                (step === 1 && !automation.name) ||
                (step === 2 && !automation.trigger.type) ||
                (step === 3 && !automation.action.type)
              }
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {step === 4 ? 'Create Automation' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Automation;
