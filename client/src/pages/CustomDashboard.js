import React, { useState } from 'react';
import { 
  PlusIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useDashboard } from '../contexts/DashboardContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CustomWidgetBuilder from '../components/CustomWidgetBuilder';
import RealTimeWidget from '../components/RealTimeWidget';

const CustomDashboard = () => {
  const { isDarkMode } = useTheme();
  const {
    widgets,
    addWidget,
    removeWidget,
    reorderWidgets,
    resetToDefault,
    refetch,
  } = useDashboard();

  const [showWidgetBuilder, setShowWidgetBuilder] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
      const oldIndex = widgets.findIndex((item) => item.id === active.id);
      const newIndex = widgets.findIndex((item) => item.id === over.id);
      reorderWidgets(arrayMove(widgets, oldIndex, newIndex));
    }
  };

  const handleAddWidget = (widget) => {
    addWidget(widget);
    setShowWidgetBuilder(false);
  };

  const getGridCols = (size) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-2';
      case 'large':
        return 'col-span-3';
      case 'full':
        return 'col-span-4';
      default:
        return 'col-span-1';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: textColor }}>
            Custom Dashboard
          </h1>
          <p className="mt-1" style={{ color: textSecondary }}>
            Customize your dashboard with real-time widgets
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            style={{ borderColor, color: textColor }}
            title="Refresh Data"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            style={{ borderColor, color: textColor }}
          >
            <Cog6ToothIcon className="h-5 w-5" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              editMode
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'border hover:bg-gray-50'
            }`}
            style={!editMode ? { borderColor, color: textColor } : {}}
          >
            {editMode ? (
              <>
                <ArrowsPointingInIcon className="h-5 w-5" />
                <span>Done</span>
              </>
            ) : (
              <>
                <ArrowsPointingOutIcon className="h-5 w-5" />
                <span>Edit</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowWidgetBuilder(true)}
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
              <div key={widget.id} className={getGridCols(widget.size)}>
                <SortableWidget
                  widget={widget}
                  editMode={editMode}
                  onRemove={removeWidget}
                  bgColor={bgColor}
                  borderColor={borderColor}
                  textColor={textColor}
                  textSecondary={textSecondary}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty State */}
      {widgets.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">📊</div>
          <h3 className="text-sm font-medium" style={{ color: textColor }}>
            No widgets yet
          </h3>
          <p className="mt-1 text-sm" style={{ color: textSecondary }}>
            Get started by adding your first custom widget
          </p>
          <button
            onClick={() => setShowWidgetBuilder(true)}
            className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Widget
          </button>
        </div>
      )}

      {/* Custom Widget Builder Modal */}
      {showWidgetBuilder && (
        <CustomWidgetBuilder
          onClose={() => setShowWidgetBuilder(false)}
          onSave={handleAddWidget}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onReset={() => {
            resetToDefault();
            setShowSettings(false);
          }}
        />
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

  const combinedStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: bgColor,
    borderColor: borderColor,
  };

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      {...attributes}
      {...(editMode ? listeners : {})}
      className={`rounded-lg p-6 border-2 ${editMode ? 'cursor-move' : ''} h-full`}
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

      <RealTimeWidget 
        widget={widget}
        textColor={textColor}
        textSecondary={textSecondary}
      />
    </div>
  );
};

// Settings Modal
const SettingsModal = ({ onClose, onReset }) => {
  const { isDarkMode } = useTheme();
  const { refreshInterval, setRefreshInterval } = useDashboard();

  const bgColor = isDarkMode() ? 'var(--color-surface)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#111827';
  const textSecondary = isDarkMode() ? 'var(--color-text-secondary)' : '#6b7280';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
        
        <div 
          className="relative rounded-lg shadow-xl max-w-md w-full p-6"
          style={{ backgroundColor: bgColor }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: textColor }}>
              Dashboard Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" style={{ color: textSecondary }} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                Auto-Refresh Interval (seconds)
              </label>
              <input
                type="number"
                value={refreshInterval / 1000}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) * 1000)}
                min="5"
                max="300"
                className="w-full px-4 py-2 border rounded-lg"
                style={{ backgroundColor: bgColor, borderColor, color: textColor }}
              />
              <p className="text-xs mt-1" style={{ color: textSecondary }}>
                How often to refresh widget data
              </p>
            </div>

            <div className="pt-4 border-t" style={{ borderColor }}>
              <button
                onClick={onReset}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset to Default Dashboard
              </button>
              <p className="text-xs mt-2 text-center" style={{ color: textSecondary }}>
                This will remove all custom widgets
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDashboard;
