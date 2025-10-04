import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import {
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  KeyIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import amplifyDataService from '../services/amplifyDataService';
import { uploadData } from 'aws-amplify/storage';
import toast from 'react-hot-toast';
import Avatar from './Avatar';

const CleanSettings = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  // Profile state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskUpdates, setTaskUpdates] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [mentions, setMentions] = useState(true);

  // Theme preferences
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      let avatarUrl = user?.avatar;

      // Upload avatar if changed
      if (avatarFile) {
        try {
          const result = await uploadData({
            path: `avatars/${user.id}/${Date.now()}_${avatarFile.name}`,
            data: avatarFile,
            options: {
              contentType: avatarFile.type,
            }
          }).result;
          
          avatarUrl = result.path;
        } catch (error) {
          console.error('Avatar upload error:', error);
          throw new Error('Failed to upload avatar');
        }
      }

      // Update user in database
      const result = await amplifyDataService.users.update(user.id, {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        bio: data.bio,
        avatar: avatarUrl,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      return result.data;
    },
    onSuccess: (data) => {
      toast.success('Profile updated successfully');
      updateUser(data);
      queryClient.invalidateQueries(['user']);
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (preferences) => {
      const result = await amplifyDataService.users.updatePreferences(user.id, {
        notifications: preferences,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update notifications');
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update notifications');
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (passwords) => {
      if (passwords.newPassword !== passwords.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const result = await amplifyDataService.users.updatePassword({
        userId: user.id,
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update password');
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update password');
    },
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName,
      lastName,
      email,
      bio,
    });
  };

  const handleSaveNotifications = () => {
    updateNotificationsMutation.mutate({
      emailNotifications,
      pushNotifications,
      taskUpdates,
      projectUpdates,
      mentions,
    });
  };

  const handleSavePassword = () => {
    updatePasswordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };

  const tabs = [
    { name: 'Profile', icon: UserIcon },
    { name: 'Notifications', icon: BellIcon },
    { name: 'Security', icon: ShieldCheckIcon },
    { name: 'Appearance', icon: PaintBrushIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tab.Group>
          <div className="flex space-x-8">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
              <Tab.List className="space-y-1">
                {tabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    className={({ selected }) =>
                      `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                        selected
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`
                    }
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </Tab>
                ))}
              </Tab.List>
            </div>

            {/* Content */}
            <div className="flex-1">
              <Tab.Panels>
                {/* Profile Panel */}
                <Tab.Panel>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Profile Information</h2>
                      <p className="text-sm text-gray-500">Update your personal information</p>
                    </div>

                    {/* Avatar Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Profile Picture
                      </label>
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Avatar preview"
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          ) : (
                            <Avatar user={user} size="xl" />
                          )}
                          <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                            <CameraIcon className="h-4 w-4 text-white" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Change photo</p>
                          <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 5MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isLoading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </Tab.Panel>

                {/* Notifications Panel */}
                <Tab.Panel>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Notification Preferences</h2>
                      <p className="text-sm text-gray-500">Manage how you receive notifications</p>
                    </div>

                    <div className="space-y-4">
                      <ToggleSetting
                        label="Email Notifications"
                        description="Receive notifications via email"
                        enabled={emailNotifications}
                        onChange={setEmailNotifications}
                      />
                      <ToggleSetting
                        label="Push Notifications"
                        description="Receive push notifications in browser"
                        enabled={pushNotifications}
                        onChange={setPushNotifications}
                      />
                      <ToggleSetting
                        label="Task Updates"
                        description="Get notified when tasks are updated"
                        enabled={taskUpdates}
                        onChange={setTaskUpdates}
                      />
                      <ToggleSetting
                        label="Project Updates"
                        description="Get notified about project changes"
                        enabled={projectUpdates}
                        onChange={setProjectUpdates}
                      />
                      <ToggleSetting
                        label="Mentions"
                        description="Get notified when someone mentions you"
                        enabled={mentions}
                        onChange={setMentions}
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSaveNotifications}
                        disabled={updateNotificationsMutation.isLoading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                      >
                        {updateNotificationsMutation.isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </Tab.Panel>

                {/* Security Panel */}
                <Tab.Panel>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Security Settings</h2>
                      <p className="text-sm text-gray-500">Manage your password and security</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button
                        onClick={handleSavePassword}
                        disabled={updatePasswordMutation.isLoading || !currentPassword || !newPassword || !confirmPassword}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {updatePasswordMutation.isLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </Tab.Panel>

                {/* Appearance Panel */}
                <Tab.Panel>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Appearance</h2>
                      <p className="text-sm text-gray-500">Customize how the app looks</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Theme
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {['light', 'dark', 'auto'].map((t) => (
                            <button
                              key={t}
                              onClick={() => setTheme(t)}
                              className={`p-4 border-2 rounded-lg transition-all ${
                                theme === t
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {t}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <button
                        onClick={() => toast.success('Appearance settings saved')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </div>
          </div>
        </Tab.Group>
      </div>
    </div>
  );
};

// Toggle Setting Component
const ToggleSetting = ({ label, description, enabled, onChange }) => (
  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
    <div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default CleanSettings;
