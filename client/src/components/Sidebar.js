import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  XMarkIcon,
  HomeIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  BoltIcon,
  ViewColumnsIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import Avatar from './Avatar';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Automation', href: '/automation', icon: BoltIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const Sidebar = ({ open, setOpen, onNotificationClick }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const location = useLocation();

  // Fetch unread notifications count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      // Mock data for now
      return { unread_count: 3 };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const bgColor = isDarkMode() ? 'var(--color-sidebar-bg)' : '#ffffff';
  const borderColor = isDarkMode() ? 'var(--color-border)' : '#e5e7eb';
  const textColor = isDarkMode() ? 'var(--color-text)' : '#374151';
  const hoverBg = isDarkMode() ? 'var(--color-surface-hover)' : '#f3f4f6';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex flex-col items-center h-20 flex-shrink-0 px-2 py-3 bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-md transform hover:scale-105 transition-transform duration-200">
          <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        </div>
        <div className="mt-1 text-center">
          <h1 className="text-white text-sm font-bold">SQUAD</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto" style={{ backgroundColor: bgColor }}>
        {/* Navigation Links */}
        <div className="space-y-3">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                isActive
                  ? 'flex flex-col items-center px-2 py-3 font-medium rounded-lg bg-primary-100 text-primary-700'
                  : 'flex flex-col items-center px-2 py-3 font-medium rounded-lg hover:text-gray-900'
              }
              style={({ isActive }) => ({
                color: isActive ? undefined : textColor,
                backgroundColor: isActive ? undefined : 'transparent',
                fontSize: '11px'
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('bg-primary-100')) {
                  e.currentTarget.style.backgroundColor = hoverBg;
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('bg-primary-100')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onClick={() => setOpen(false)}
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span className="text-center leading-tight">{item.name}</span>
            </NavLink>
          ))}
          
          {/* Notifications */}
          <div className="pt-2" style={{ borderTop: `1px solid ${borderColor}` }}>
            <button 
              onClick={onNotificationClick}
              className="flex flex-col items-center px-2 py-3 font-medium rounded-lg w-full relative"
              style={{ color: textColor, fontSize: '11px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="relative">
                <BellIcon className="h-6 w-6 mb-1" />
                {notificationsData?.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificationsData.unread_count > 9 ? '9+' : notificationsData.unread_count}
                  </span>
                )}
              </div>
              <span className="text-center leading-tight">Notifications</span>
            </button>
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div 
        className="flex-shrink-0 flex flex-col items-center p-3" 
        style={{ 
          borderTop: `1px solid ${borderColor}`,
          backgroundColor: bgColor
        }}
      >
        <Avatar
          user={user}
          size="sm"
        />
        <div className="mt-2 text-center">
          <p className="text-xs font-medium truncate" style={{ color: textColor }}>
            {user?.first_name}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14">
              {/* Force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-20 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
