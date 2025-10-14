/**
 * Privacy & Data Management Page
 * GDPR compliance - data export and deletion
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleExportData = async () => {
    setExportLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/exportUserData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Your data export has been sent to your email address. Please check your inbox.');
      } else {
        setError(data.error || 'Failed to export data');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const confirmationToken = `DELETE_${user.id}_CONFIRMED`;
      
      const response = await fetch('/api/deleteUserData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          confirmationToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sign out and redirect
        await signOut();
        navigate('/login', { 
          state: { message: 'Your account has been deleted successfully.' }
        });
      } else {
        setError(data.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Privacy & Data</h1>
        <p className="mt-2 text-gray-600">Manage your personal data and privacy settings</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Data Export */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Export Your Data</h2>
            <p className="text-gray-600 mb-4">
              Download a copy of all your personal data stored in ProjectHub. This includes your profile, 
              tasks, comments, activities, and more.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>• Complete data export in JSON format</li>
              <li>• Includes all your activities and contributions</li>
              <li>• Sent to your registered email address</li>
              <li>• Processing may take a few minutes</li>
            </ul>
          </div>
          <button
            onClick={handleExportData}
            disabled={exportLoading}
            className="ml-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {exportLoading ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Privacy Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-semibold">Profile Visibility</h3>
              <p className="text-sm text-gray-600">Control who can see your profile</p>
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Everyone in organization</option>
              <option>Team members only</option>
              <option>Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-semibold">Activity Status</h3>
              <p className="text-sm text-gray-600">Show when you're online</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-semibold">Email Notifications</h3>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Data Retention</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>Active Data:</strong> Your data is retained as long as your account is active.
          </p>
          <p>
            <strong>Deleted Data:</strong> When you delete your account, most data is permanently removed. 
            Some data may be retained for legal or security purposes.
          </p>
          <p>
            <strong>Audit Logs:</strong> System audit logs are anonymized but retained for compliance purposes.
          </p>
          <p>
            <strong>Backup Data:</strong> Backup copies are automatically deleted after 30 days.
          </p>
        </div>
      </div>

      {/* Delete Account */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-900 mb-2">Delete Account</h2>
        <p className="text-red-700 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        
        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-2">What will be deleted:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Your user profile and settings</li>
            <li>✓ Your comments and activities</li>
            <li>✓ Your time entries and notifications</li>
            <li>✓ Your organization memberships</li>
          </ul>
          
          <h3 className="font-semibold mt-4 mb-2">What will be preserved:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Tasks you created (anonymized)</li>
            <li>• Audit logs (anonymized for compliance)</li>
            <li>• Organization data (if you're not the last member)</li>
          </ul>
        </div>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Delete My Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-red-900 mb-4">Confirm Account Deletion</h3>
            <p className="text-gray-700 mb-6">
              This action is permanent and cannot be undone. All your data will be deleted.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="DELETE"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirm !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                  setError('');
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GDPR Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Your Rights Under GDPR</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Right to Access:</strong> Export your data at any time</li>
          <li>• <strong>Right to Rectification:</strong> Update your profile information</li>
          <li>• <strong>Right to Erasure:</strong> Delete your account and data</li>
          <li>• <strong>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
          <li>• <strong>Right to Object:</strong> Opt-out of certain data processing</li>
        </ul>
      </div>
    </div>
  );
}
