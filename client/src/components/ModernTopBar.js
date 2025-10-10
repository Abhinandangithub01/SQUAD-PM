import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BellIcon, 
  Cog6ToothIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { signOut } from 'aws-amplify/auth';
import toast from 'react-hot-toast';

const ModernTopBar = ({ title = 'Dashboard', user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="fixed top-0 left-16 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40">
      {/* Left: Title */}
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Settings */}
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Cog6ToothIcon className="h-6 w-6" />
        </button>

        {/* User Menu */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-gray-900">
                {user?.name || 'Abhinandan R'}
              </div>
              <div className="text-xs text-gray-500">Admin</div>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-gray-600" />
          </Menu.Button>

          <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 focus:outline-none">
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/profile"
                  className={`${
                    active ? 'bg-gray-50' : ''
                  } block px-4 py-2 text-sm text-gray-700`}
                >
                  Edit Profile
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/settings"
                  className={`${
                    active ? 'bg-gray-50' : ''
                  } block px-4 py-2 text-sm text-gray-700`}
                >
                  Settings
                </Link>
              )}
            </Menu.Item>
            <div className="border-t border-gray-200 my-1"></div>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`${
                    active ? 'bg-gray-50' : ''
                  } flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50`}
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>
      </div>
    </div>
  );
};

export default ModernTopBar;
