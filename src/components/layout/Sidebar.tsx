'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  FolderIcon,
  UsersIcon,
  BarChart3Icon,
  SettingsIcon,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderIcon },
  { name: 'Team', href: '/dashboard/team', icon: UsersIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3Icon },
  { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-20 bg-gray-900 dark:bg-gray-950 text-white min-h-screen flex flex-col border-r border-gray-800 dark:border-gray-900">
      {/* Logo */}
      <div className="p-3 flex items-center justify-center border-b border-gray-800 dark:border-gray-900">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          SP
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1">
        {navigation.map((item) => {
          // Fix: Only highlight exact match or direct children, not all sub-paths
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-3 px-2 transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-900 hover:text-white'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium text-center leading-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-800 dark:border-gray-900">
        <p className="text-[8px] text-gray-500 dark:text-gray-600 text-center">
          v2.0
        </p>
      </div>
    </div>
  );
}
