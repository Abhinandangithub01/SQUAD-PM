import React, { useState, useRef, useEffect } from 'react';
import { 
  UserIcon, 
  CalendarIcon, 
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { DatePicker } from '@mantine/dates';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { useTheme } from '../contexts/ThemeContext';
import Avatar from './Avatar';

const QuickActionMenu = ({ 
  task, 
  position, 
  onAssign, 
  onDueDate, 
  onTags, 
  onClose,
  teamMembers = [],
  availableTags = [],
  initialMenu = null, // 'assign', 'duedate', 'tags', or null
}) => {
  const { isDarkMode } = useTheme();
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(task.due_date || '');
  const [selectedTags, setSelectedTags] = useState(task.tags || []);
  const menuRef = useRef(null);

  const bgColor = isDarkMode() ? 'var(--color-surface)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#111827';
  const textSecondary = isDarkMode() ? 'var(--color-text-secondary)' : '#6b7280';

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Filter team members by search
  const filteredMembers = teamMembers.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter tags by search
  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssignUser = (user) => {
    onAssign(user);
    onClose();
  };

  const handleSaveDueDate = () => {
    onDueDate(selectedDate);
    onClose();
  };

  const handleToggleTag = (tag) => {
    const newTags = selectedTags.includes(tag.id)
      ? selectedTags.filter(t => t !== tag.id)
      : [...selectedTags, tag.id];
    setSelectedTags(newTags);
  };

  const handleSaveTags = () => {
    onTags(selectedTags);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 rounded-lg shadow-2xl border-2"
      style={{
        backgroundColor: bgColor,
        borderColor: '#3b82f6',
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '280px',
        maxWidth: '320px',
      }}
    >
      {/* Main Menu */}
      {!activeMenu && (
        <div className="p-2">
          <div className="text-xs font-semibold mb-2 px-2" style={{ color: textSecondary }}>
            Quick Actions
          </div>
          <button
            onClick={() => setActiveMenu('assign')}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <UserIcon className="h-5 w-5 text-primary-600" />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: textColor }}>
                Assign Member
              </div>
              <div className="text-xs" style={{ color: textSecondary }}>
                Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">M</kbd>
              </div>
            </div>
          </button>
          <button
            onClick={() => setActiveMenu('duedate')}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <CalendarIcon className="h-5 w-5 text-primary-600" />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: textColor }}>
                Set Due Date
              </div>
              <div className="text-xs" style={{ color: textSecondary }}>
                Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">D</kbd>
              </div>
            </div>
          </button>
          <button
            onClick={() => setActiveMenu('tags')}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <TagIcon className="h-5 w-5 text-primary-600" />
            <div className="flex-1">
              <div className="text-sm font-medium" style={{ color: textColor }}>
                Edit Tags
              </div>
              <div className="text-xs" style={{ color: textSecondary }}>
                Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">T</kbd>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Assign Member Menu */}
      {activeMenu === 'assign' && (
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: textColor }}>
              Assign Member
            </h3>
            <button
              onClick={() => setActiveMenu(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <XMarkIcon className="h-4 w-4" style={{ color: textSecondary }} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg mb-2 text-sm"
            style={{ borderColor, color: textColor }}
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleAssignUser(member)}
                className="w-full flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <Avatar user={member} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: textColor }}>
                    {member.first_name} {member.last_name}
                  </div>
                  <div className="text-xs truncate" style={{ color: textSecondary }}>
                    {member.email}
                  </div>
                </div>
              </button>
            ))}
            {filteredMembers.length === 0 && (
              <div className="text-center py-4 text-sm" style={{ color: textSecondary }}>
                No members found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Due Date Menu */}
      {activeMenu === 'duedate' && (
        <MantineProvider>
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: textColor }}>
                Set Due Date
              </h3>
              <button
                onClick={() => setActiveMenu(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="h-4 w-4" style={{ color: textSecondary }} />
              </button>
            </div>
            
            {/* Mantine DatePicker */}
            <div className="mb-3">
              <DatePicker
                value={selectedDate ? new Date(selectedDate) : null}
                onChange={(date) => {
                  if (date instanceof Date && !isNaN(date)) {
                    setSelectedDate(date.toISOString());
                  } else if (date === null) {
                    setSelectedDate('');
                  }
                }}
                placeholder="Pick a date"
                size="sm"
                styles={{
                  input: {
                    borderColor: borderColor,
                    color: textColor,
                  },
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today.toISOString());
                }}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor, color: textColor }}
              >
                Today
              </button>
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow.toISOString());
                }}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor, color: textColor }}
              >
                Tomorrow
              </button>
              <button
                onClick={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setSelectedDate(nextWeek.toISOString());
                }}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor, color: textColor }}
              >
                Next Week
              </button>
              <button
                onClick={() => setSelectedDate('')}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-100 transition-colors"
                style={{ borderColor, color: textColor }}
              >
                Clear
              </button>
            </div>
            <button
              onClick={handleSaveDueDate}
              className="w-full mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Save
            </button>
          </div>
        </MantineProvider>
      )}

      {/* Tags Menu */}
      {activeMenu === 'tags' && (
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: textColor }}>
              Edit Tags
            </h3>
            <button
              onClick={() => setActiveMenu(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <XMarkIcon className="h-4 w-4" style={{ color: textSecondary }} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg mb-2 text-sm"
            style={{ borderColor, color: textColor }}
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleToggleTag(tag)}
                className={`w-full flex items-center space-x-2 px-2 py-2 rounded-lg transition-colors text-left ${
                  selectedTags.includes(tag.id) ? 'bg-primary-50' : 'hover:bg-gray-100'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color || '#3b82f6' }}
                />
                <span className="text-sm flex-1" style={{ color: textColor }}>
                  {tag.name}
                </span>
                {selectedTags.includes(tag.id) && (
                  <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
            {filteredTags.length === 0 && (
              <div className="text-center py-4 text-sm" style={{ color: textSecondary }}>
                No tags found
              </div>
            )}
          </div>
          <button
            onClick={handleSaveTags}
            className="w-full mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickActionMenu;
