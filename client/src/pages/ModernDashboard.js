import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import ModernSidebar from '../components/ModernSidebar';
import ModernTopBar from '../components/ModernTopBar';

const ModernDashboard = () => {
  const [timeRange, setTimeRange] = useState('Last 7 days');
  const [viewMode, setViewMode] = useState('grid');

  // Mock data - replace with real data from Amplify
  const metrics = [
    {
      title: 'Total Users',
      value: '124',
      change: '+8%',
      trend: 'up',
      subtitle: 'from last month',
      icon: UsersIcon,
      color: 'blue',
    },
    {
      title: 'Active Users',
      value: '118',
      change: '+5%',
      trend: 'up',
      subtitle: 'from last month',
      icon: UsersIcon,
      color: 'green',
    },
    {
      title: 'New Users This Month',
      value: '12',
      change: '+20%',
      trend: 'up',
      subtitle: 'from last month',
      icon: UsersIcon,
      color: 'purple',
    },
    {
      title: 'Total Departments',
      value: '8',
      change: '',
      trend: 'neutral',
      subtitle: 'Active departments',
      icon: BriefcaseIcon,
      color: 'orange',
    },
    {
      title: 'Attendance Rate',
      value: '94.5%',
      change: '+2%',
      trend: 'up',
      subtitle: 'from last month',
      icon: ClipboardDocumentCheckIcon,
      color: 'teal',
    },
    {
      title: 'Pending Leave Requests',
      value: '7',
      change: '',
      trend: 'neutral',
      subtitle: 'Awaiting approval',
      icon: DocumentTextIcon,
      color: 'yellow',
    },
    {
      title: 'Open Positions',
      value: '14',
      change: '+27%',
      trend: 'up',
      subtitle: 'from last month',
      icon: BriefcaseIcon,
      color: 'indigo',
    },
    {
      title: 'Applications This Month',
      value: '89',
      change: '+48%',
      trend: 'up',
      subtitle: 'from last month',
      icon: DocumentDuplicateIcon,
      color: 'pink',
    },
    {
      title: 'Pending Reviews',
      value: '23',
      change: '',
      trend: 'neutral',
      subtitle: 'Performance reviews',
      icon: ClipboardDocumentCheckIcon,
      color: 'red',
    },
    {
      title: 'Training Completion',
      value: '76%',
      change: '+12%',
      trend: 'up',
      subtitle: 'from last quarter',
      icon: ChartBarIcon,
      color: 'cyan',
    },
    {
      title: 'Payroll Status',
      value: 'On Track',
      change: '',
      trend: 'neutral',
      subtitle: 'Next run in 5 days',
      icon: CurrencyDollarIcon,
      color: 'emerald',
    },
    {
      title: 'Expiring Documents',
      value: '12',
      change: '',
      trend: 'neutral',
      subtitle: 'Within 30 days',
      icon: DocumentTextIcon,
      color: 'amber',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
      teal: 'bg-teal-50 text-teal-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      pink: 'bg-pink-50 text-pink-600',
      red: 'bg-red-50 text-red-600',
      cyan: 'bg-cyan-50 text-cyan-600',
      emerald: 'bg-emerald-50 text-emerald-600',
      amber: 'bg-amber-50 text-amber-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernSidebar />
      <ModernTopBar title="Dashboard" />

      {/* Main Content */}
      <div className="ml-16 mt-16 p-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Overview</p>
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                Abhinandan R
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ● Inactive
                </span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Employee ID: <span className="font-medium">N/A</span> • Shift: <span className="font-medium">Not Assigned</span>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Payslip
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center">
                Edit profile
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {['Activities', 'Feeds', 'Profile', 'Approvals', 'Leave', 'Attendance', 'Timelogs', 'Timesheets', 'Jobs', 'Files'].map((tab) => (
                <button
                  key={tab}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm ${
                    tab === 'Activities'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Insights Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Insights</h3>
              <p className="text-sm text-gray-500">12 metrics • Last 7 days</p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last year</option>
              </select>

              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${getColorClasses(metric.color)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {metric.change && (
                      <div className={`flex items-center text-xs font-medium ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.trend === 'up' ? (
                          <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                        )}
                        {metric.change}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{metric.title}</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                  <div className="text-xs text-gray-500">{metric.subtitle}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
