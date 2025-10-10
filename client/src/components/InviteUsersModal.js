import React, { useState } from 'react';
import { X, Mail, UserPlus, Check, AlertCircle } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import toast from 'react-hot-toast';

const InviteUsersModal = ({ isOpen, onClose, organizationId, organizationName }) => {
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const roles = [
    { value: 'ADMIN', label: 'Admin', description: 'Can manage organization and invite users' },
    { value: 'MEMBER', label: 'Member', description: 'Can create and manage projects' },
    { value: 'VIEWER', label: 'Viewer', description: 'Can only view projects' },
  ];

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    try {
      const client = generateClient();
      const user = await getCurrentUser();
      
      // Parse emails (comma or newline separated)
      const emailList = emails
        .split(/[,\n]/)
        .map(e => e.trim())
        .filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

      if (emailList.length === 0) {
        toast.error('Please enter valid email addresses');
        setLoading(false);
        return;
      }

      const inviteResults = {
        success: [],
        failed: [],
      };

      // Create invitations for each email
      for (const email of emailList) {
        try {
          // Generate token
          const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

          // Create invitation in database
          await client.models.Invitation.create({
            organizationId,
            email,
            role,
            invitedBy: user.userId,
            token,
            status: 'PENDING',
            expiresAt: expiresAt.toISOString(),
          });

          // TODO: Call Lambda function to send email
          // For now, we'll just create the invitation record
          
          inviteResults.success.push(email);
        } catch (error) {
          console.error(`Failed to invite ${email}:`, error);
          inviteResults.failed.push({ email, error: error.message });
        }
      }

      setResults(inviteResults);

      if (inviteResults.success.length > 0) {
        toast.success(`Successfully invited ${inviteResults.success.length} user(s)!`);
      }

      if (inviteResults.failed.length > 0) {
        toast.error(`Failed to invite ${inviteResults.failed.length} user(s)`);
      }

      // Clear form if all successful
      if (inviteResults.failed.length === 0) {
        setEmails('');
        setTimeout(() => {
          onClose();
        }, 2000);
      }

    } catch (error) {
      console.error('Error inviting users:', error);
      toast.error('Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <UserPlus className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Invite Team Members</h2>
                <p className="text-sm text-gray-500">Invite users to join {organizationName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleInvite} className="p-6 space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Addresses *
              </label>
              <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                required
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter email addresses (one per line or comma-separated)&#10;example1@company.com&#10;example2@company.com"
              />
              <p className="mt-1 text-sm text-gray-500">
                <Mail className="w-4 h-4 inline mr-1" />
                Separate multiple emails with commas or new lines
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Role *
              </label>
              <div className="space-y-2">
                {roles.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      role === r.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={(e) => setRole(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{r.label}</div>
                      <div className="text-sm text-gray-600">{r.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-2">
                {results.success.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center text-green-800 font-medium mb-2">
                      <Check className="w-5 h-5 mr-2" />
                      Successfully Invited ({results.success.length})
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      {results.success.map((email, idx) => (
                        <li key={idx}>• {email}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.failed.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center text-red-800 font-medium mb-2">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Failed to Invite ({results.failed.length})
                    </div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {results.failed.map((item, idx) => (
                        <li key={idx}>• {item.email}: {item.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitations
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteUsersModal;
