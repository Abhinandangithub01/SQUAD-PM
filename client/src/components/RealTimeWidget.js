import React from 'react';
import { 
  FolderIcon,
  CheckCircleIcon,
  UsersIcon,
  ClockIcon,
  BoltIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useDashboard } from '../contexts/DashboardContext';

const RealTimeWidget = ({ widget, textColor, textSecondary }) => {
  const { getWidgetData } = useDashboard();
  const data = getWidgetData(widget);

  const getIcon = (iconName) => {
    const icons = {
      folder: FolderIcon,
      check: CheckCircleIcon,
      users: UsersIcon,
      clock: ClockIcon,
      bolt: BoltIcon,
      chart: ChartBarIcon,
    };
    return icons[iconName] || ChartBarIcon;
  };

  const getColorHex = (colorName) => {
    const colors = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      orange: '#f97316',
      red: '#ef4444',
      pink: '#ec4899',
    };
    return colors[colorName] || '#3b82f6';
  };

  const getValue = () => {
    if (!data) return '...';
    
    // Handle nested data keys
    const keys = widget.dataKey.split('.');
    let value = data;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return 'N/A';
    }
    
    return value;
  };

  const getChartData = () => {
    if (!data) return [];
    
    const value = getValue();
    if (Array.isArray(value)) return value;
    
    // Mock data for demonstration
    return [
      { name: 'Mon', value: 12 },
      { name: 'Tue', value: 19 },
      { name: 'Wed', value: 15 },
      { name: 'Thu', value: 25 },
      { name: 'Fri', value: 22 },
      { name: 'Sat', value: 18 },
      { name: 'Sun', value: 20 },
    ];
  };

  const colorHex = getColorHex(widget.color);
  const Icon = getIcon(widget.icon);

  // Statistic Widget
  if (widget.type === 'stat') {
    return (
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium mb-2" style={{ color: textSecondary }}>
            {widget.title}
          </p>
          <p className="text-3xl font-bold" style={{ color: textColor }}>
            {getValue()}
          </p>
          <p className="text-xs mt-1" style={{ color: textSecondary }}>
            Updated just now
          </p>
        </div>
        <div 
          className="p-4 rounded-xl"
          style={{ backgroundColor: `${colorHex}20` }}
        >
          <Icon className="h-8 w-8" style={{ color: colorHex }} />
        </div>
      </div>
    );
  }

  // Chart Widget
  if (widget.type === 'chart') {
    const chartData = getChartData();
    
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
          {widget.title}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          {widget.chartType === 'bar' && (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={colorHex} />
            </BarChart>
          )}
          {widget.chartType === 'line' && (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={colorHex} strokeWidth={2} />
            </LineChart>
          )}
          {widget.chartType === 'area' && (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke={colorHex} fill={`${colorHex}40`} />
            </AreaChart>
          )}
          {widget.chartType === 'pie' && (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill={colorHex}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorHex(['blue', 'green', 'purple', 'orange', 'red', 'pink'][index % 6])} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
        <p className="text-xs mt-2 text-center" style={{ color: textSecondary }}>
          Last updated: just now
        </p>
      </div>
    );
  }

  // List Widget
  if (widget.type === 'list') {
    const listData = Array.isArray(getValue()) ? getValue() : [];
    
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
          {widget.title}
        </h3>
        <div className="space-y-2">
          {listData.length > 0 ? (
            listData.slice(0, 5).map((item, index) => (
              <div 
                key={index} 
                className="p-3 rounded border"
                style={{ borderColor: textSecondary }}
              >
                <div className="text-sm font-medium" style={{ color: textColor }}>
                  {item.title || item.name || `Item ${index + 1}`}
                </div>
                {item.description && (
                  <div className="text-xs mt-1" style={{ color: textSecondary }}>
                    {item.description}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-4" style={{ color: textSecondary }}>
              No items to display
            </div>
          )}
        </div>
      </div>
    );
  }

  // Progress Widget
  if (widget.type === 'progress') {
    const progressValue = typeof getValue() === 'number' ? getValue() : 0;
    
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
          {widget.title}
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: textSecondary }}>Progress</span>
              <span className="font-medium" style={{ color: textColor }}>
                {progressValue}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progressValue}%`,
                  backgroundColor: colorHex 
                }}
              ></div>
            </div>
          </div>
          <p className="text-xs" style={{ color: textSecondary }}>
            Updated in real-time
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default RealTimeWidget;
