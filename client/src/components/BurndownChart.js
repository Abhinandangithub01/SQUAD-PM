import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ChartBarIcon, TrendingDownIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import amplifyDataService from '../services/amplifyDataService';

const BurndownChart = ({ projectId, sprintId }) => {
  // Fetch sprint data
  const { data: sprintData } = useQuery({
    queryKey: ['sprint', sprintId],
    queryFn: async () => {
      const result = await amplifyDataService.sprints.get(sprintId);
      return result.success ? result.data : null;
    },
    enabled: !!sprintId,
  });

  // Fetch burndown data
  const { data: burndownData } = useQuery({
    queryKey: ['burndown', projectId, sprintId],
    queryFn: async () => {
      const result = await amplifyDataService.analytics.getBurndown({ 
        projectId, 
        sprintId 
      });
      return result.success ? result.data : [];
    },
  });

  // Calculate ideal burndown line
  const calculateIdealLine = () => {
    if (!sprintData || !burndownData || burndownData.length === 0) return [];

    const totalPoints = sprintData.total_story_points || 0;
    const sprintDays = burndownData.length;

    return burndownData.map((day, index) => ({
      ...day,
      ideal: totalPoints - (totalPoints / sprintDays) * index,
    }));
  };

  const data = calculateIdealLine();

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-12">
          <TrendingDownIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No burndown data available</p>
          <p className="text-sm text-gray-400 mt-1">
            Start a sprint to track burndown
          </p>
        </div>
      </div>
    );
  }

  const currentPoints = data[data.length - 1]?.remaining || 0;
  const idealPoints = data[data.length - 1]?.ideal || 0;
  const variance = currentPoints - idealPoints;
  const isAhead = variance < 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingDownIcon className="h-5 w-5 mr-2" />
              Sprint Burndown
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {sprintData?.name || 'Current Sprint'}
            </p>
          </div>

          {/* Sprint Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-xs text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-gray-900">{currentPoints}</p>
              <p className="text-xs text-gray-500">story points</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Variance</p>
              <p className={`text-2xl font-bold ${isAhead ? 'text-green-600' : 'text-red-600'}`}>
                {isAhead ? '↓' : '↑'} {Math.abs(variance).toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">
                {isAhead ? 'ahead' : 'behind'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'Story Points', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6b7280' } }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
            />
            <Area
              type="monotone"
              dataKey="ideal"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorIdeal)"
              name="Ideal Burndown"
              strokeDasharray="5 5"
            />
            <Area
              type="monotone"
              dataKey="remaining"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#colorActual)"
              name="Actual Burndown"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Sprint Insights</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Velocity</p>
            <p className="text-lg font-bold text-gray-900">
              {sprintData?.velocity || 0}
            </p>
            <p className="text-xs text-gray-500">points/day</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Days Remaining</p>
            <p className="text-lg font-bold text-gray-900">
              {sprintData?.days_remaining || 0}
            </p>
            <p className="text-xs text-gray-500">of {sprintData?.total_days || 0} days</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Completion</p>
            <p className="text-lg font-bold text-gray-900">
              {sprintData?.completion_percentage || 0}%
            </p>
            <p className="text-xs text-gray-500">of sprint</p>
          </div>
        </div>

        {/* Prediction */}
        {variance !== 0 && (
          <div className={`mt-4 p-3 rounded-lg ${
            isAhead ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm font-medium ${isAhead ? 'text-green-900' : 'text-red-900'}`}>
              {isAhead 
                ? '🎉 Sprint is ahead of schedule!'
                : '⚠️ Sprint is behind schedule'
              }
            </p>
            <p className={`text-xs mt-1 ${isAhead ? 'text-green-700' : 'text-red-700'}`}>
              {isAhead
                ? `You're ${Math.abs(variance).toFixed(1)} points ahead. Great work!`
                : `You're ${Math.abs(variance).toFixed(1)} points behind. Consider adjusting scope.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BurndownChart;
