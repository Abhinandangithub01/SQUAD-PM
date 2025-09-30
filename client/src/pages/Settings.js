import React, { useState, lazy, Suspense } from 'react';
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
  SwatchIcon,
  PhotoIcon,
  BuildingOfficeIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useForm } from 'react-hook-form';
import api from '../utils/api';
import { formatDate, getRoleColor, getRoleLabel } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';

// Lazy load components to avoid circular dependency
const UsersTable = lazy(() => import('../components/UsersTable'));
const AddUserModal = lazy(() => import('../components/AddUserModal'));
const DoubleNavbar = lazy(() => import('../components/DoubleNavbar'));

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
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <DoubleNavbar
        activeTab={tab}
        onTabChange={setActiveTab}
        userRole={user?.role}
      >
        <div className="card" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {tab === 'profile' && <ProfileSettings />}
          {tab === 'users' && user?.role === 'admin' && <UsersSettings />}
          {tab === 'notifications' && <NotificationSettings />}
          {tab === 'security' && <SecuritySettings />}
          {tab === 'preferences' && <PreferencesSettings />}
        </div>
      </DoubleNavbar>
    </Suspense>
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
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await api.post('/users', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User added successfully');
      setShowAddModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add user');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (user) => {
      const response = await api.put(`/users/${user.id}`, user);
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (user) => {
      await api.delete(`/users/${user.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const handleUpdateUser = (user) => {
    updateUserMutation.mutate(user);
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      deleteUserMutation.mutate(user);
    }
  };

  const handleAddUser = async (userData) => {
    await addUserMutation.mutateAsync(userData);
  };

  const handleInviteUser = () => {
    setShowAddModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">User Management</h2>
        <p className="text-sm text-gray-600">
          Manage team members, roles, and permissions
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner size="lg" />}>
        <UsersTable
          users={usersData?.users || []}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onInviteUser={handleInviteUser}
        />
      </Suspense>

      {/* Add User Modal */}
      <Suspense fallback={null}>
        <AddUserModal
          opened={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddUser}
        />
      </Suspense>
    </div>
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
  const { currentTheme, themes, customBranding, changeTheme, updateBranding } = useTheme();
  const [brandingForm, setBrandingForm] = useState(customBranding);
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'UTC',
    date_format: 'MM/dd/yyyy',
    time_format: '12h',
  });

  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
    toast.success(`Theme changed to ${themes[themeName].name}`);
  };

  const handleBrandingSubmit = (e) => {
    e.preventDefault();
    updateBranding(brandingForm);
    toast.success('Branding updated successfully!');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBrandingForm(prev => ({
          ...prev,
          logo: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Preferences</h2>
        <p className="text-gray-600">Customize your workspace appearance and settings</p>
      </div>

      {/* Theme Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <SwatchIcon className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Theme & Appearance</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => handleThemeChange(key)}
              className={`relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                currentTheme === key
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {/* Theme Preview */}
              <div className="space-y-2">
                <div className="flex space-x-1">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: theme.primary[500] }}
                  />
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: theme.background }}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">{theme.name}</p>
              </div>
              
              {currentTheme === key && (
                <div className="absolute top-2 right-2">
                  <CheckIcon className="h-4 w-4 text-primary-600" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Current Theme Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Theme</h4>
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div 
                className="w-6 h-6 rounded"
                style={{ backgroundColor: themes[currentTheme].primary[500] }}
              />
              <div 
                className="w-6 h-6 rounded"
                style={{ backgroundColor: themes[currentTheme].accent }}
              />
            </div>
            <div>
              <p className="font-medium text-gray-900">{themes[currentTheme].name}</p>
              <p className="text-sm text-gray-500">
                {themes[currentTheme].name === 'Dark Mode' || themes[currentTheme].name === 'Midnight Blue' 
                  ? 'Dark theme for reduced eye strain' 
                  : 'Light theme with vibrant colors'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Branding */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <BuildingOfficeIcon className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Custom Branding</h3>
        </div>

        <form onSubmit={handleBrandingSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={brandingForm.companyName}
              onChange={(e) => setBrandingForm(prev => ({
                ...prev,
                companyName: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Your Company Name"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <PhotoIcon className="h-4 w-4 inline mr-2" />
              Company Logo
            </label>
            <div className="flex items-center space-x-4">
              {brandingForm.logo && (
                <img
                  src={brandingForm.logo}
                  alt="Company Logo"
                  className="h-16 w-16 object-contain rounded-lg border border-gray-200 bg-white p-2"
                />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a logo (PNG, JPG, SVG recommended, max 2MB)
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              {brandingForm.logo ? (
                <img
                  src={brandingForm.logo}
                  alt="Logo"
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <div className="h-8 w-8 bg-primary-100 rounded flex items-center justify-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
                </div>
              )}
              <span className="font-semibold text-gray-900">
                {brandingForm.companyName}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors font-medium"
          >
            Save Branding
          </button>
        </form>
      </div>

      {/* Other Preferences */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Cog6ToothIcon className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="en">🇺🇸 English</option>
              <option value="es">🇪🇸 Spanish</option>
              <option value="fr">🇫🇷 French</option>
              <option value="de">🇩🇪 German</option>
              <option value="it">🇮🇹 Italian</option>
              <option value="pt">🇵🇹 Portuguese</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="UTC">UTC (GMT+0)</option>
              <option value="EST">Eastern Time (GMT-5)</option>
              <option value="PST">Pacific Time (GMT-8)</option>
              <option value="IST">India Standard Time (GMT+5:30)</option>
              <option value="JST">Japan Standard Time (GMT+9)</option>
              <option value="CET">Central European Time (GMT+1)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
            <select
              value={preferences.date_format}
              onChange={(e) => setPreferences(prev => ({ ...prev, date_format: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="MM/dd/yyyy">MM/dd/yyyy (US)</option>
              <option value="dd/MM/yyyy">dd/MM/yyyy (EU)</option>
              <option value="yyyy-MM-dd">yyyy-MM-dd (ISO)</option>
              <option value="dd MMM yyyy">dd MMM yyyy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
            <select
              value={preferences.time_format}
              onChange={(e) => setPreferences(prev => ({ ...prev, time_format: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="12h">12 Hour (AM/PM)</option>
              <option value="24h">24 Hour</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <button 
            onClick={() => toast.success('General preferences saved!')}
            className="px-6 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            Save General Settings
          </button>
        </div>
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
