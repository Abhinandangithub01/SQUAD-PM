import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ViewColumnsIcon,
  ListBulletIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const Sales = () => {
  const stats = [
    { name: 'Active Deals', value: '24', icon: CurrencyDollarIcon, color: 'bg-blue-500' },
    { name: 'Pipeline Value', value: '$234,567', icon: ChartBarIcon, color: 'bg-green-500' },
    { name: 'Closed Deals', value: '18', icon: TrophyIcon, color: 'bg-purple-500' },
    { name: 'Conversion Rate', value: '24.5%', icon: UserGroupIcon, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600">Manage your sales opportunities and deals</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/sales/kanban"
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ViewColumnsIcon className="h-5 w-5 mr-2" />
            Kanban View
          </Link>
          <Link
            to="/sales/list"
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ListBulletIcon className="h-5 w-5 mr-2" />
            List View
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/sales/kanban"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <ViewColumnsIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Kanban Board</p>
              <p className="text-sm text-gray-500">Visual sales pipeline</p>
            </div>
          </Link>
          <Link
            to="/sales/list"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <ListBulletIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">List View</p>
              <p className="text-sm text-gray-500">Detailed deal tracking</p>
            </div>
          </Link>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all">
            <CurrencyDollarIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">New Deal</p>
              <p className="text-sm text-gray-500">Create sales opportunity</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sales;
