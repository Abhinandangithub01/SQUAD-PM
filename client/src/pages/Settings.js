import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserIcon,
  UsersIcon,
  BellIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import api from '../utils/api';
import { formatDate, getRoleColor, getRoleLabel } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';

const Settings = () => {
  const { tab = 'profile' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'users', name: 'Users', icon: UsersIcon, adminOnly: true },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon },
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || user?.role === 'admin');

  const setActiveTab = (tabId) => {
    navigate(`/settings/${tabId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {visibleTabs.map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => setActiveTab(tabItem.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  tab === tabItem.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <tabItem.icon className="mr-3 h-5 w-5" />
                {tabItem.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card">
            {tab === 'profile' && <ProfileSettings />}
            {tab === 'users' && user?.role === 'admin' && <UsersSettings />}
            {tab === 'notifications' && <NotificationSettings />}
            {tab === 'security' && <SecuritySettings />}
            {tab === 'preferences' && <PreferencesSettings />}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      avatar_url: user?.avatar_url || '',
    },
  });

  const onSubmit = async (data) => {
    const result = await updateProfile(data);
    if (result.success) {
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-outline btn-sm"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center space-x-6">
            <Avatar user={user} size="xl" />
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Avatar URL
              </label>
              <input
                {...register('avatar_url')}
                type="url"
                className="mt-1 input"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                {...register('first_name', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                })}
                type="text"
                className={`mt-1 input ${errors.first_name ? 'input-error' : ''}`}
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                {...register('last_name', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters',
                  },
                })}
                type="text"
                className={`mt-1 input ${errors.last_name ? 'input-error' : ''}`}
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                reset();
              }}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-6">
            <Avatar user={user} size="xl" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-gray-500">{user?.email}</p>
              <span className={`badge mt-2 ${getRoleColor(user?.role)}`}>
                {getRoleLabel(user?.role)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-sm text-gray-900">{getRoleLabel(user?.role)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Member Since</label>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(user?.created_at, 'MMMM dd, yyyy')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Login</label>
              <p className="mt-1 text-sm text-gray-900">
                {user?.last_login ? formatDate(user.last_login, 'MMMM dd, yyyy HH:mm') : 'Never'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UsersSettings = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', 'admin', searchQuery, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter) params.append('role', roleFilter);
      
      const response = await api.get(`/users?${params.toString()}`);
      return response.data;
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }) => {
      const response = await api.put(`/users/${userId}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: async (userId) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deactivated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate user');
    },
  });

  const handleUpdateUser = (userId, updates) => {
    updateUserMutation.mutate({ userId, updates });
  };

  const handleDeactivateUser = (userId, userName) => {
    if (window.confirm(`Are you sure you want to deactivate ${userName}?`)) {
      deactivateUserMutation.mutate(userId);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900">User Management</h2>
        <button className="btn-primary">
          <PlusIcon className="h-4 w-4 mr-2" />
          Invite User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersData?.users?.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onUpdateRole={(role) => handleUpdateUser(user.id, { role })}
                  onToggleStatus={() => handleUpdateUser(user.id, { is_active: !user.is_active })}
                  onDeactivate={() => handleDeactivateUser(user.id, `${user.first_name} ${user.last_name}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const UserRow = ({ user, onUpdateRole, onToggleStatus, onDeactivate }) => {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Avatar user={user} size="sm" />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={user.role}
          onChange={(e) => onUpdateRole(e.target.value)}
          className="text-sm border-gray-300 rounded-md"
        >
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.project_count || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {user.assigned_tasks || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`badge ${
          user.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleStatus}
            className="text-primary-600 hover:text-primary-900"
          >
            {user.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={onDeactivate}
            className="text-red-600 hover:text-red-900"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    task_assignments: true,
    project_updates: true,
    chat_mentions: true,
    due_date_reminders: true,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">General</h3>
          <div className="space-y-4">
            <ToggleOption
              label="Email Notifications"
              description="Receive notifications via email"
              checked={settings.email_notifications}
              onChange={() => handleToggle('email_notifications')}
            />
            <ToggleOption
              label="Push Notifications"
              description="Receive browser push notifications"
              checked={settings.push_notifications}
              onChange={() => handleToggle('push_notifications')}
            />
          </div>
        </div>

        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">Project Activity</h3>
          <div className="space-y-4">
            <ToggleOption
              label="Task Assignments"
              description="When you're assigned to a task"
              checked={settings.task_assignments}
              onChange={() => handleToggle('task_assignments')}
            />
            <ToggleOption
              label="Project Updates"
              description="When projects you're involved in are updated"
              checked={settings.project_updates}
              onChange={() => handleToggle('project_updates')}
            />
            <ToggleOption
              label="Due Date Reminders"
              description="Reminders for upcoming due dates"
              checked={settings.due_date_reminders}
              onChange={() => handleToggle('due_date_reminders')}
            />
          </div>
        </div>

        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">Chat</h3>
          <div className="space-y-4">
            <ToggleOption
              label="Chat Mentions"
              description="When someone mentions you in chat"
              checked={settings.chat_mentions}
              onChange={() => handleToggle('chat_mentions')}
            />
          </div>
        </div>

        <div className="pt-4">
          <button className="btn-primary">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

const SecuritySettings = () => {
  const { changePassword } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const newPassword = watch('new_password');

  const onSubmit = async (data) => {
    const result = await changePassword({
      current_password: data.current_password,
      new_password: data.new_password,
    });

    if (result.success) {
      toast.success('Password changed successfully');
      reset();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h2>
      
      <div className="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              {...register('current_password', {
                required: 'Current password is required',
              })}
              type="password"
              className={`mt-1 input ${errors.current_password ? 'input-error' : ''}`}
            />
            {errors.current_password && (
              <p className="mt-1 text-sm text-red-600">{errors.current_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              {...register('new_password', {
                required: 'New password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              type="password"
              className={`mt-1 input ${errors.new_password ? 'input-error' : ''}`}
            />
            {errors.new_password && (
              <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              {...register('confirm_password', {
                required: 'Please confirm your new password',
                validate: (value) =>
                  value === newPassword || 'Passwords do not match',
              })}
              type="password"
              className={`mt-1 input ${errors.confirm_password ? 'input-error' : ''}`}
            />
            {errors.confirm_password && (
              <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const PreferencesSettings = () => {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    date_format: 'MM/dd/yyyy',
    time_format: '12h',
  });

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Preferences</h2>
      
      <div className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700">Theme</label>
          <select
            value={preferences.theme}
            onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
            className="mt-1 input"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Language</label>
          <select
            value={preferences.language}
            onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
            className="mt-1 input"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date Format</label>
          <select
            value={preferences.date_format}
            onChange={(e) => setPreferences(prev => ({ ...prev, date_format: e.target.value }))}
            className="mt-1 input"
          >
            <option value="MM/dd/yyyy">MM/dd/yyyy</option>
            <option value="dd/MM/yyyy">dd/MM/yyyy</option>
            <option value="yyyy-MM-dd">yyyy-MM-dd</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Time Format</label>
          <select
            value={preferences.time_format}
            onChange={(e) => setPreferences(prev => ({ ...prev, time_format: e.target.value }))}
            className="mt-1 input"
          >
            <option value="12h">12 Hour</option>
            <option value="24h">24 Hour</option>
          </select>
        </div>

        <button className="btn-primary">
          Save Preferences
        </button>
      </div>
    </div>
  );
};

const ToggleOption = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          checked ? 'bg-primary-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default Settings;
