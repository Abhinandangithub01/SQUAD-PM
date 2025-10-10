import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Mail, 
  Settings as SettingsIcon,
  Crown,
  UserPlus,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import toast from 'react-hot-toast';
import InviteUsersModal from '../components/InviteUsersModal';

const OrganizationSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      const client = generateClient();
      const user = await getCurrentUser();

      // Get user's organization membership
      const { data: memberships } = await client.models.OrganizationMember.list({
        filter: { userId: { eq: user.userId } }
      });

      if (!memberships || memberships.length === 0) {
        navigate('/organization-setup');
        return;
      }

      const membership = memberships[0];
      setCurrentUserRole(membership.role);

      // Get organization details
      const { data: org } = await client.models.Organization.get({ id: membership.organizationId });
      setOrganization(org);

      // Get all members
      const { data: orgMembers } = await client.models.OrganizationMember.list({
        filter: { organizationId: { eq: membership.organizationId } }
      });
      setMembers(orgMembers || []);

      // Get pending invitations
      const { data: pendingInvites } = await client.models.Invitation.list({
        filter: { 
          organizationId: { eq: membership.organizationId },
          status: { eq: 'PENDING' }
        }
      });
      setInvitations(pendingInvites || []);

    } catch (error) {
      console.error('Error fetching organization data:', error);
      toast.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrganization = async (e) => {
    e.preventDefault();
    
    try {
      const client = generateClient();
      await client.models.Organization.update({
        id: organization.id,
        name: organization.name,
        description: organization.description,
        industry: organization.industry,
        website: organization.website,
      });

      toast.success('Organization updated successfully');
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const client = generateClient();
      await client.models.OrganizationMember.delete({ id: memberId });
      
      setMembers(members.filter(m => m.id !== memberId));
      toast.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    try {
      const client = generateClient();
      await client.models.Invitation.update({
        id: invitationId,
        status: 'REVOKED',
      });

      setInvitations(invitations.filter(i => i.id !== invitationId));
      toast.success('Invitation revoked');
    } catch (error) {
      console.error('Error revoking invitation:', error);
      toast.error('Failed to revoke invitation');
    }
  };

  const canManageOrganization = ['OWNER', 'ADMIN'].includes(currentUserRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Organization Found</h2>
          <button
            onClick={() => navigate('/organization-setup')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Organization
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
              <p className="text-gray-600 mt-1">{organization.name}</p>
            </div>
            {canManageOrganization && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Invite Members
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {['general', 'members', 'invitations'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <form onSubmit={handleUpdateOrganization} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={organization.name}
                  onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                  disabled={!canManageOrganization}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={organization.description || ''}
                  onChange={(e) => setOrganization({ ...organization, description: e.target.value })}
                  disabled={!canManageOrganization}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={organization.industry || ''}
                    onChange={(e) => setOrganization({ ...organization, industry: e.target.value })}
                    disabled={!canManageOrganization}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={organization.website || ''}
                    onChange={(e) => setOrganization({ ...organization, website: e.target.value })}
                    disabled={!canManageOrganization}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plan
                  </label>
                  <div className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-900">
                    {organization.plan}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Users
                  </label>
                  <div className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-900">
                    {members.length} / {organization.maxUsers}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Projects
                  </label>
                  <div className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-900">
                    {organization.maxProjects}
                  </div>
                </div>
              </div>

              {canManageOrganization && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Team Members ({members.length})
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {members.map((member) => (
                  <div key={member.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          User {member.userId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.role}
                          {member.role === 'OWNER' && <Crown className="w-4 h-4 inline ml-1 text-yellow-500" />}
                        </div>
                      </div>
                    </div>
                    {canManageOrganization && member.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invitations Tab */}
          {activeTab === 'invitations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pending Invitations ({invitations.length})
                </h3>
              </div>

              {invitations.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending invitations</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {invitation.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            Role: {invitation.role} • Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {canManageOrganization && (
                        <button
                          onClick={() => handleRevokeInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteUsersModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          fetchOrganizationData();
        }}
        organizationId={organization?.id}
        organizationName={organization?.name}
      />
    </div>
  );
};

export default OrganizationSettings;
