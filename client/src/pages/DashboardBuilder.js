import React, { useState } from 'react';
import { 
  PlusIcon,
  XMarkIcon,
  Squares2X2Icon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  UsersIcon,
  FolderIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DashboardBuilder = () => {
  const { isDarkMode } = useTheme();
  const [widgets, setWidgets] = useState([
    { id: '1', type: 'stats', title: 'Total Projects', value: '12', icon: FolderIcon, color: 'blue' },
    { id: '2', type: 'stats', title: 'Active Tasks', value: '48', icon: CheckCircleIcon, color: 'green' },
    { id: '3', type: 'stats', title: 'Team Members', value: '8', icon: UsersIcon, color: 'purple' },
    { id: '4', type: 'stats', title: 'Hours Tracked', value: '156', icon: ClockIcon, color: 'orange' },
    { id: '5', type: 'chart', title: 'Project Progress', chartType: 'bar' },
    { id: '6', type: 'chart', title: 'Task Distribution', chartType: 'pie' },
  ]);

  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const bgColor = isDarkMode() ? 'var(--color-surface)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#111827';
  const textSecondary = isDarkMode() ? 'var(--color-text-secondary)' : '#6b7280';

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addWidget = (widgetType) => {
    const newWidget = {
      id: Date.now().toString(),
      type: widgetType.type,
      title: widgetType.title,
      ...widgetType.config,
    };
    setWidgets([...widgets, newWidget]);
    setShowWidgetPicker(false);
  };

  const removeWidget = (id) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const availableWidgets = [
    { type: 'stats', title: 'Statistics Card', config: { value: '0', icon: ChartBarIcon, color: 'blue' } },
    { type: 'chart', title: 'Bar Chart', config: { chartType: 'bar' } },
    { type: 'chart', title: 'Line Chart', config: { chartType: 'line' } },
    { type: 'chart', title: 'Pie Chart', config: { chartType: 'pie' } },
    { type: 'list', title: 'Recent Activity', config: {} },
    { type: 'list', title: 'Upcoming Tasks', config: {} },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: textColor }}>
            Dashboard Builder
          </h1>
          <p className="mt-1" style={{ color: textSecondary }}>
            Customize your dashboard with drag-and-drop widgets
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              editMode
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
            style={!editMode ? { borderColor, color: textColor } : {}}
          >
            {editMode ? (
              <>
                <ArrowsPointingInIcon className="h-5 w-5" />
                <span>Done Editing</span>
              </>
            ) : (
              <>
                <ArrowsPointingOutIcon className="h-5 w-5" />
                <span>Edit Layout</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowWidgetPicker(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Widget</span>
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {widgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                editMode={editMode}
                onRemove={removeWidget}
                bgColor={bgColor}
                borderColor={borderColor}
                textColor={textColor}
                textSecondary={textSecondary}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty State */}
      {widgets.length === 0 && (
        <div className="text-center py-12">
          <Squares2X2Icon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium" style={{ color: textColor }}>
            No widgets yet
          </h3>
          <p className="mt-1 text-sm" style={{ color: textSecondary }}>
            Get started by adding your first widget
          </p>
          <button
            onClick={() => setShowWidgetPicker(true)}
            className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Widget
          </button>
        </div>
      )}

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowWidgetPicker(false)}></div>
            
            <div 
              className="relative rounded-lg shadow-xl max-w-2xl w-full p-6"
              style={{ backgroundColor: bgColor }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: textColor }}>
                  Add Widget
                </h2>
                <button
                  onClick={() => setShowWidgetPicker(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" style={{ color: textSecondary }} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {availableWidgets.map((widget, index) => (
                  <button
                    key={index}
                    onClick={() => addWidget(widget)}
                    className="p-4 border-2 rounded-lg text-left hover:border-primary-600 hover:bg-primary-50 transition-all"
                    style={{ borderColor }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        {widget.type === 'stats' && <ChartBarIcon className="h-6 w-6 text-primary-600" />}
                        {widget.type === 'chart' && <ChartBarIcon className="h-6 w-6 text-primary-600" />}
                        {widget.type === 'list' && <ClockIcon className="h-6 w-6 text-primary-600" />}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: textColor }}>
                          {widget.title}
                        </div>
                        <div className="text-sm" style={{ color: textSecondary }}>
                          {widget.type === 'stats' && 'Display key metrics'}
                          {widget.type === 'chart' && 'Visualize data'}
                          {widget.type === 'list' && 'Show recent items'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sortable Widget Component
const SortableWidget = ({ widget, editMode, onRemove, bgColor, borderColor, textColor, textSecondary }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = widget.icon || ChartBarIcon;

  const combinedStyle = {
    ...style,
    backgroundColor: bgColor,
    borderColor: borderColor,
  };

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      {...attributes}
      {...(editMode ? listeners : {})}
      className={`rounded-lg p-6 border-2 ${editMode ? 'cursor-move' : ''}`}
    >
      {editMode && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => onRemove(widget.id)}
            className="p-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {widget.type === 'stats' && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: textSecondary }}>{widget.title}</p>
            <p className="text-3xl font-bold mt-2" style={{ color: textColor }}>
              {widget.value}
            </p>
          </div>
          <div className={`p-3 rounded-lg bg-${widget.color}-100`}>
            <Icon className={`h-8 w-8 text-${widget.color}-600`} />
          </div>
        </div>
      )}

      {widget.type === 'chart' && (
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
            {widget.title}
          </h3>
          <div className="h-48 flex items-center justify-center" style={{ color: textSecondary }}>
            <ChartBarIcon className="h-12 w-12" />
            <span className="ml-2">{widget.chartType} chart</span>
          </div>
        </div>
      )}

      {widget.type === 'list' && (
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
            {widget.title}
          </h3>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-2 rounded border" style={{ borderColor }}>
                <div className="text-sm" style={{ color: textColor }}>Item {i}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardBuilder;
