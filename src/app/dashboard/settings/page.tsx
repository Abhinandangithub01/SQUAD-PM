'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserIcon, BellIcon, ShieldIcon, PaletteIcon } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldIcon },
    { id: 'appearance', name: 'Appearance', icon: PaletteIcon },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            {activeTab === 'profile' && <ProfileSettings user={user} />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'appearance' && <AppearanceSettings />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProfileSettings({ user }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>

      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Change Avatar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              defaultValue={user?.firstName}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              defaultValue={user?.lastName}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            defaultValue={user?.email}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          />
          <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <input
            type="text"
            defaultValue={user?.role}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            disabled
          />
        </div>

        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Settings</h2>

      <div className="space-y-4">
        <NotificationToggle
          title="Email Notifications"
          description="Receive email updates about your projects and tasks"
          defaultChecked={true}
        />
        <NotificationToggle
          title="Task Assignments"
          description="Get notified when you're assigned to a task"
          defaultChecked={true}
        />
        <NotificationToggle
          title="Project Updates"
          description="Receive updates about project changes"
          defaultChecked={true}
        />
        <NotificationToggle
          title="Comments & Mentions"
          description="Get notified when someone mentions you"
          defaultChecked={true}
        />
        <NotificationToggle
          title="Weekly Summary"
          description="Receive a weekly summary of your activities"
          defaultChecked={false}
        />
      </div>
    </div>
  );
}

function NotificationToggle({ title, description, defaultChecked }: any) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200">
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Update Password
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
          <p className="text-gray-600 mb-4">Add an extra layer of security to your account</p>
          <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Appearance Settings</h2>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Theme</h3>
          <div className="grid grid-cols-3 gap-4">
            <ThemeOption name="Light" selected={true} />
            <ThemeOption name="Dark" selected={false} />
            <ThemeOption name="System" selected={false} />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Accent Color</h3>
          <div className="flex gap-3">
            {['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'].map((color) => (
              <button
                key={color}
                className="w-10 h-10 rounded-lg border-2 border-transparent hover:border-gray-900"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeOption({ name, selected }: any) {
  return (
    <button
      className={`p-4 border-2 rounded-lg text-center ${
        selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <span className="font-medium">{name}</span>
    </button>
  );
}
