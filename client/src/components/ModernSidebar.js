import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  BriefcaseIcon,
  UsersIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  EllipsisHorizontalIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

const ModernSidebar = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Jobs', href: '/projects', icon: BriefcaseIcon },
    { name: 'Users', href: '/users', icon: UsersIcon },
    { name: 'Pipeline', href: '/pipeline', icon: ChartBarIcon },
    { name: 'Payroll', href: '/payroll', icon: CurrencyDollarIcon },
    { name: 'PMS', href: '/pms', icon: Cog6ToothIcon },
    { name: 'LMS', href: '/lms', icon: DocumentTextIcon },
    { name: 'Squad Bot', href: '/squad-bot', icon: Squares2X2Icon },
    { name: 'Reports', href: '/reports', icon: ClipboardDocumentListIcon },
    { name: 'More', href: '/more', icon: EllipsisHorizontalIcon },
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <Link to="/dashboard" className="mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">SQ</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center space-y-2 w-full px-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                w-full flex flex-col items-center justify-center py-3 rounded-lg
                transition-all duration-200 group relative
                ${active 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default ModernSidebar;
