import React, { useState } from 'react';
import { 
  XMarkIcon,
  ChartBarIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
  Square3Stack3DIcon,
  ClockIcon,
  CheckCircleIcon,
  UsersIcon,
  FolderIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const CustomWidgetBuilder = ({ onClose, onSave }) => {
  const { isDarkMode } = useTheme();
  const [step, setStep] = useState(1);
  const [widget, setWidget] = useState({
    type: '',
    title: '',
    dataSource: '',
    dataKey: '',
    chartType: '',
    icon: 'chart',
    color: 'blue',
    size: 'small',
    refreshRate: 30,
  });

  const bgColor = isDarkMode() ? 'var(--color-surface)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#111827';
  const textSecondary = isDarkMode() ? 'var(--color-text-secondary)' : '#6b7280';

  const widgetTypes = [
    { 
      id: 'stat', 
      name: 'Statistic Card', 
      description: 'Display a single metric or KPI',
      icon: Square3Stack3DIcon,
    },
    { 
      id: 'chart', 
      name: 'Chart Widget', 
      description: 'Visualize data with charts',
      icon: ChartBarIcon,
    },
    { 
      id: 'list', 
      name: 'List Widget', 
      description: 'Show a list of items',
      icon: ChartPieIcon,
    },
    { 
      id: 'progress', 
      name: 'Progress Tracker', 
      description: 'Track progress over time',
      icon: PresentationChartLineIcon,
    },
  ];

  const dataSources = [
    { id: 'projects', name: 'Projects', description: 'Project-related data' },
    { id: 'tasks', name: 'Tasks', description: 'Task statistics and metrics' },
    { id: 'team', name: 'Team', description: 'Team member data' },
    { id: 'time', name: 'Time Tracking', description: 'Time tracking metrics' },
    { id: 'dashboard', name: 'Dashboard', description: 'General dashboard data' },
  ];

  const chartTypes = [
    { id: 'bar', name: 'Bar Chart', icon: ChartBarIcon },
    { id: 'line', name: 'Line Chart', icon: PresentationChartLineIcon },
    { id: 'pie', name: 'Pie Chart', icon: ChartPieIcon },
    { id: 'area', name: 'Area Chart', icon: PresentationChartLineIcon },
  ];

  const icons = [
    { id: 'folder', name: 'Folder', icon: FolderIcon },
    { id: 'check', name: 'Check', icon: CheckCircleIcon },
    { id: 'users', name: 'Users', icon: UsersIcon },
    { id: 'clock', name: 'Clock', icon: ClockIcon },
    { id: 'bolt', name: 'Bolt', icon: BoltIcon },
    { id: 'chart', name: 'Chart', icon: ChartBarIcon },
  ];

  const colors = [
    { id: 'blue', name: 'Blue', hex: '#3b82f6' },
    { id: 'green', name: 'Green', hex: '#10b981' },
    { id: 'purple', name: 'Purple', hex: '#8b5cf6' },
    { id: 'orange', name: 'Orange', hex: '#f97316' },
    { id: 'red', name: 'Red', hex: '#ef4444' },
    { id: 'pink', name: 'Pink', hex: '#ec4899' },
  ];

  const sizes = [
    { id: 'small', name: 'Small', cols: 1 },
    { id: 'medium', name: 'Medium', cols: 2 },
    { id: 'large', name: 'Large', cols: 3 },
    { id: 'full', name: 'Full Width', cols: 4 },
  ];

  const dataKeys = {
    projects: [
      { id: 'total', name: 'Total Projects' },
      { id: 'active', name: 'Active Projects' },
      { id: 'completed', name: 'Completed Projects' },
      { id: 'progressData', name: 'Progress Data (Chart)' },
    ],
    tasks: [
      { id: 'total', name: 'Total Tasks' },
      { id: 'active', name: 'Active Tasks' },
      { id: 'completed', name: 'Completed Tasks' },
      { id: 'overdue', name: 'Overdue Tasks' },
      { id: 'distributionData', name: 'Distribution Data (Chart)' },
    ],
    team: [
      { id: 'total', name: 'Total Members' },
      { id: 'active', name: 'Active Members' },
      { id: 'online', name: 'Online Members' },
    ],
    time: [
      { id: 'totalHours', name: 'Total Hours' },
      { id: 'todayHours', name: 'Today Hours' },
      { id: 'weekHours', name: 'Week Hours' },
      { id: 'timeData', name: 'Time Data (Chart)' },
    ],
  };

  const handleSave = () => {
    onSave(widget);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return widget.type !== '';
      case 2:
        return widget.title !== '' && widget.dataSource !== '';
      case 3:
        return widget.dataKey !== '';
      case 4:
        return true;
      default:
        return false;
    }
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
              Create Custom Widget
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" style={{ color: textSecondary }} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= s ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300'
                }`} style={step < s ? { color: textSecondary } : {}}>
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
            {/* Step 1: Widget Type */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                  Choose Widget Type
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {widgetTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setWidget({ ...widget, type: type.id })}
                        className={`p-6 border-2 rounded-lg text-left transition-all ${
                          widget.type === type.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-8 w-8 text-primary-600 mb-3" />
                        <div className="font-medium text-lg mb-1" style={{ color: textColor }}>
                          {type.name}
                        </div>
                        <div className="text-sm" style={{ color: textSecondary }}>
                          {type.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Data Source & Title */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
                    Widget Configuration
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                        Widget Title
                      </label>
                      <input
                        type="text"
                        value={widget.title}
                        onChange={(e) => setWidget({ ...widget, title: e.target.value })}
                        placeholder="e.g., Total Projects"
                        className="w-full px-4 py-2 border rounded-lg"
                        style={{ backgroundColor: bgColor, borderColor, color: textColor }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                        Data Source
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {dataSources.map((source) => (
                          <button
                            key={source.id}
                            onClick={() => setWidget({ ...widget, dataSource: source.id, dataKey: '' })}
                            className={`p-3 border-2 rounded-lg text-left transition-all ${
                              widget.dataSource === source.id
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-medium" style={{ color: textColor }}>
                              {source.name}
                            </div>
                            <div className="text-sm" style={{ color: textSecondary }}>
                              {source.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Data Configuration */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                  Data Configuration
                </h3>

                {widget.type === 'chart' && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                      Chart Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {chartTypes.map((chart) => {
                        const Icon = chart.icon;
                        return (
                          <button
                            key={chart.id}
                            onClick={() => setWidget({ ...widget, chartType: chart.id })}
                            className={`p-4 border-2 rounded-lg flex items-center space-x-3 ${
                              widget.chartType === chart.id
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="h-6 w-6 text-primary-600" />
                            <span className="font-medium" style={{ color: textColor }}>
                              {chart.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                    Data Field
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {widget.dataSource && dataKeys[widget.dataSource]?.map((key) => (
                      <button
                        key={key.id}
                        onClick={() => setWidget({ ...widget, dataKey: key.id })}
                        className={`p-3 border-2 rounded-lg text-left ${
                          widget.dataKey === key.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="font-medium" style={{ color: textColor }}>
                          {key.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Styling */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                  Widget Styling
                </h3>

                {widget.type === 'stat' && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                      Icon
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {icons.map((icon) => {
                        const Icon = icon.icon;
                        return (
                          <button
                            key={icon.id}
                            onClick={() => setWidget({ ...widget, icon: icon.id })}
                            className={`p-4 border-2 rounded-lg flex flex-col items-center ${
                              widget.icon === icon.id
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="h-6 w-6 text-primary-600 mb-2" />
                            <span className="text-sm" style={{ color: textColor }}>
                              {icon.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                    Color
                  </label>
                  <div className="grid grid-cols-6 gap-3">
                    {colors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setWidget({ ...widget, color: color.id })}
                        className={`p-4 border-2 rounded-lg ${
                          widget.color === color.id
                            ? 'border-primary-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div 
                          className="w-full h-8 rounded"
                          style={{ backgroundColor: color.hex }}
                        ></div>
                        <div className="text-xs mt-2 text-center" style={{ color: textColor }}>
                          {color.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                    Size
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setWidget({ ...widget, size: size.id })}
                        className={`p-4 border-2 rounded-lg text-center ${
                          widget.size === size.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium" style={{ color: textColor }}>
                          {size.name}
                        </div>
                        <div className="text-xs mt-1" style={{ color: textSecondary }}>
                          {size.cols} col{size.cols > 1 ? 's' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                    Refresh Rate (seconds)
                  </label>
                  <input
                    type="number"
                    value={widget.refreshRate}
                    onChange={(e) => setWidget({ ...widget, refreshRate: parseInt(e.target.value) })}
                    min="5"
                    max="300"
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ backgroundColor: bgColor, borderColor, color: textColor }}
                  />
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
              disabled={!canProceed()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {step === 4 ? 'Create Widget' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomWidgetBuilder;
