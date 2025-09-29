import React, { useState } from 'react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
} from '@heroicons/react/24/outline';

const RichTextEditor = ({ value, onChange, placeholder = "Enter description..." }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleInput = (e) => {
    onChange(e.target.innerHTML);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center space-x-1 p-2 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={() => handleFormat('bold')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Bold"
        >
          <BoldIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleFormat('italic')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Italic"
        >
          <ItalicIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleFormat('underline')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => handleFormat('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Bullet List"
        >
          <ListBulletIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleFormat('insertOrderedList')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Numbered List"
        >
          <NumberedListIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        dangerouslySetInnerHTML={{ __html: value }}
        className={`min-h-[120px] p-3 outline-none ${
          isFocused ? 'ring-2 ring-primary-500' : ''
        }`}
        style={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
        data-placeholder={placeholder}
      />
      
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
