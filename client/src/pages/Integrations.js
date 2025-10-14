/**
 * Integrations Page
 * Manage webhooks and third-party integrations
 */

import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useOrganization } from '../contexts/OrganizationContext';

const client = generateClient();

export default function Integrations() {
  const { organization } = useOrganization();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [],
    active: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const availableEvents = [
    'task.created',
    'task.updated',
    'task.completed',
    'task.deleted',
    'project.created',
    'project.updated',
    'comment.added',
    'user.invited',
    'user.joined',
  ];

  useEffect(() => {
    if (organization?.id) {
      loadWebhooks();
    }
  }, [organization]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const result = await client.models.Webhook.list({
        filter: { organizationId: { eq: organization.id } },
      });
      setWebhooks(result.data || []);
    } catch (err) {
      console.error('Error loading webhooks:', err);
      setError('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebhook = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
        setError('Please fill in all required fields');
        return;
      }

      // Generate secret
      const secret = crypto.randomUUID();

      await client.models.Webhook.create({
        organizationId: organization.id,
        name: newWebhook.name,
        url: newWebhook.url,
        events: newWebhook.events,
        secret,
        active: newWebhook.active,
        failureCount: 0,
      });

      setSuccess('Webhook created successfully!');
      setShowAddWebhook(false);
      setNewWebhook({ name: '', url: '', events: [], active: true });
      loadWebhooks();
    } catch (err) {
      console.error('Error creating webhook:', err);
      setError(err.message || 'Failed to create webhook');
    }
  };

  const handleToggleWebhook = async (webhook) => {
    try {
      await client.models.Webhook.update({
        id: webhook.id,
        active: !webhook.active,
      });
      setSuccess(`Webhook ${webhook.active ? 'disabled' : 'enabled'}`);
      loadWebhooks();
    } catch (err) {
      console.error('Error toggling webhook:', err);
      setError('Failed to update webhook');
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
    if (!window.confirm('Are you sure you want to delete this webhook?')) return;

    try {
      await client.models.Webhook.delete({ id: webhookId });
      setSuccess('Webhook deleted successfully');
      loadWebhooks();
    } catch (err) {
      console.error('Error deleting webhook:', err);
      setError('Failed to delete webhook');
    }
  };

  const handleEventToggle = (event) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-2 text-gray-600">Connect ProjectHub with your favorite tools</p>
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

      {/* Slack Integration */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Slack</h3>
              <p className="text-sm text-gray-600">Send notifications to your Slack workspace</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Connect Slack
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Get real-time notifications in Slack when tasks are created, updated, or completed.
        </p>
      </div>

      {/* Webhooks Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Webhooks</h2>
            <p className="text-sm text-gray-600">Send HTTP requests when events occur</p>
          </div>
          <button
            onClick={() => setShowAddWebhook(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Webhook
          </button>
        </div>

        {showAddWebhook && (
          <form onSubmit={handleAddWebhook} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">New Webhook</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="My Integration"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL *
                </label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://your-service.com/webhook"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events * (Select at least one)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map(event => (
                    <label key={event} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event)}
                        onChange={() => handleEventToggle(event)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newWebhook.active}
                  onChange={(e) => setNewWebhook({ ...newWebhook, active: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Active (start receiving events immediately)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Webhook
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddWebhook(false);
                  setNewWebhook({ name: '', url: '', events: [], active: true });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {webhooks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No webhooks</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new webhook.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map(webhook => (
              <div key={webhook.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold">{webhook.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        webhook.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {webhook.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 break-all">{webhook.url}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {webhook.events?.map(event => (
                        <span key={event} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          {event}
                        </span>
                      ))}
                    </div>
                    {webhook.lastTriggered && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
                      </p>
                    )}
                    {webhook.failureCount > 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        Failures: {webhook.failureCount}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleToggleWebhook(webhook)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      {webhook.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentation */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Webhook Documentation</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Webhooks will receive POST requests with event data</li>
          <li>• Each request includes an HMAC signature in the X-Webhook-Signature header</li>
          <li>• Failed webhooks will be retried up to 3 times</li>
          <li>• Webhooks are automatically disabled after 10 consecutive failures</li>
        </ul>
      </div>
    </div>
  );
}
