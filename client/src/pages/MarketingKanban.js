import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  ListBulletIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';

const MarketingKanban = () => {
  const navigate = useNavigate();
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [columns, setColumns] = useState([
    {
      id: 'leads',
      title: 'Leads',
      color: '#3B82F6',
      items: [
        {
          id: '1',
          title: 'Website Contact Form',
          description: 'Lead from contact form submission',
          source: 'Website',
          value: '$2,500',
          assignee: 'John Doe',
          created: '2024-09-25',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Social Media Campaign',
          description: 'Lead from Facebook ads',
          source: 'Facebook',
          value: '$1,200',
          assignee: 'Jane Smith',
          created: '2024-09-24',
          priority: 'medium'
        }
      ]
    },
    {
      id: 'qualified',
      title: 'Qualified',
      color: '#F59E0B',
      items: [
        {
          id: '3',
          title: 'Enterprise Client Inquiry',
          description: 'Large company interested in our services',
          source: 'Email',
          value: '$15,000',
          assignee: 'Mike Johnson',
          created: '2024-09-23',
          priority: 'urgent'
        }
      ]
    },
    {
      id: 'nurturing',
      title: 'Nurturing',
      color: '#8B5CF6',
      items: [
        {
          id: '4',
          title: 'Email Campaign Follow-up',
          description: 'Following up on email campaign leads',
          source: 'Email',
          value: '$3,500',
          assignee: 'Sarah Wilson',
          created: '2024-09-22',
          priority: 'medium'
        }
      ]
    },
    {
      id: 'converted',
      title: 'Converted',
      color: '#10B981',
      items: [
        {
          id: '5',
          title: 'SaaS Subscription',
          description: 'Converted to monthly subscription',
          source: 'Website',
          value: '$5,000',
          assignee: 'John Doe',
          created: '2024-09-20',
          priority: 'high'
        }
      ]
    }
  ]);

  // Get initials from full name
  const getInitials = (fullName) => {
    if (!fullName) return '';
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('');
  };

  // Native drag and drop handlers
  const handleItemDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDragEnter = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleColumnDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleColumnDrop = (e, targetColumnId) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    // Find source and target columns
    const sourceColumn = columns.find(col => 
      col.items.some(item => item.id === draggedItem.id)
    );
    const targetColumn = columns.find(col => col.id === targetColumnId);

    if (!sourceColumn || !targetColumn) return;

    // If dropping in the same column, do nothing
    if (sourceColumn.id === targetColumn.id) {
      setDraggedItem(null);
      setDragOverColumn(null);
      return;
    }

    // Update columns
    setColumns(prevColumns => 
      prevColumns.map(column => {
        if (column.id === sourceColumn.id) {
          return {
            ...column,
            items: column.items.filter(item => item.id !== draggedItem.id)
          };
        } else if (column.id === targetColumn.id) {
          return {
            ...column,
            items: [...column.items, draggedItem]
          };
        }
        return column;
      })
    );

    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Pipeline</h1>
          <p className="text-gray-600">Drag and drop leads through your marketing pipeline</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button className="flex items-center px-3 py-2 bg-white text-primary-600 rounded-md shadow-sm">
              <ViewColumnsIcon className="h-4 w-4 mr-2" />
              Kanban
            </button>
            <button 
              onClick={() => navigate('/marketing/list')}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              <ListBulletIcon className="h-4 w-4 mr-2" />
              List
            </button>
          </div>
          
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Lead
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex space-x-6 pb-6" style={{ minWidth: 'max-content' }}>
          {columns.map((column) => (
            <div 
              key={column.id} 
              className={`w-80 bg-gray-50 rounded-lg p-4 transition-all duration-200 ${
                dragOverColumn === column.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''
              }`}
              onDragOver={handleColumnDragOver}
              onDragEnter={(e) => handleColumnDragEnter(e, column.id)}
              onDragLeave={handleColumnDragLeave}
              onDrop={(e) => handleColumnDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                    {column.items.length}
                  </span>
                </div>
                <button className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-white">
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 min-h-[200px]">
                {column.items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleItemDragStart(e, item)}
                    onDragEnd={handleItemDragEnd}
                    className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow-md cursor-move transition-all duration-200 ${
                      draggedItem?.id === item.id ? 'opacity-50 scale-105' : 'opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className="text-xs text-gray-500">{item.source}</span>
                    </div>

                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {item.title}
                    </h4>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center text-sm text-green-600 font-medium mb-3">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      {item.value}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <UserIcon className="h-3 w-3 mr-1" />
                        {getInitials(item.assignee)}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {new Date(item.created).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-150">
                  <PlusIcon className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketingKanban;
