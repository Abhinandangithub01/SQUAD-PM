import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const OrganizationContext = createContext({});

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const client = generateClient();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrganization();
    } else {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Organization model exists (for backward compatibility)
      if (!client.models.OrganizationMember) {
        console.warn('OrganizationMember model not available yet');
        setLoading(false);
        return;
      }

      // Get user's organization membership
      const { data: memberships, errors } = await client.models.OrganizationMember.list({
        filter: { userId: { eq: user.id }, status: { eq: 'ACTIVE' } }
      });

      if (errors) {
        console.error('Error fetching memberships:', errors);
        setError('Failed to load organization');
        return;
      }

      if (memberships && memberships.length > 0) {
        const activeMembership = memberships[0];
        setMembership(activeMembership);

        // Get organization details
        if (client.models.Organization) {
          const { data: org, errors: orgErrors } = await client.models.Organization.get({
            id: activeMembership.organizationId
          });

          if (orgErrors) {
            console.error('Error fetching organization:', orgErrors);
            setError('Failed to load organization details');
            return;
          }

          setOrganization(org);
        }
      } else {
        // User is not part of any organization
        setOrganization(null);
        setMembership(null);
      }
    } catch (error) {
      console.error('Error in fetchOrganization:', error);
      setError(error.message || 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async (orgData) => {
    try {
      setLoading(true);

      if (!client.models.Organization) {
        throw new Error('Organization model not available');
      }

      // Create organization
      const { data: newOrg, errors } = await client.models.Organization.create({
        ...orgData,
        ownerId: user.id,
        status: 'TRIAL',
        plan: orgData.plan || 'FREE',
        limits: getPlanLimits(orgData.plan || 'FREE'),
        usage: {
          currentUsers: 1,
          currentProjects: 0,
          storageUsedBytes: 0,
          apiCallsThisMonth: 0,
        },
        settings: {
          allowedDomains: [],
          ssoEnabled: false,
          customBranding: {},
          features: {},
        },
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create organization');
      }

      // Create owner membership
      const { data: newMembership, errors: memberErrors } = await client.models.OrganizationMember.create({
        organizationId: newOrg.id,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
        permissions: JSON.stringify(['*']),
        joinedAt: new Date().toISOString(),
      });

      if (memberErrors) {
        console.error('Error creating membership:', memberErrors);
      }

      setOrganization(newOrg);
      setMembership(newMembership);
      toast.success('Organization created successfully!');
      
      return { success: true, organization: newOrg };
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error(error.message || 'Failed to create organization');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (email, role = 'MEMBER') => {
    try {
      if (!organization) {
        throw new Error('No organization selected');
      }

      // Check user limit
      if (organization.usage?.currentUsers >= organization.limits?.maxUsers) {
        throw new Error(`User limit reached for ${organization.plan} plan`);
      }

      // Create invitation
      const token = generateInviteToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: invitation, errors } = await client.models.Invitation.create({
        organizationId: organization.id,
        email,
        role,
        invitedBy: user.id,
        token,
        status: 'PENDING',
        expiresAt,
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to create invitation');
      }

      toast.success(`Invitation sent to ${email}`);
      return { success: true, invitation };
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error(error.message || 'Failed to invite user');
      return { success: false, error: error.message };
    }
  };

  const switchOrganization = async (orgId) => {
    try {
      setLoading(true);

      const { data: memberships } = await client.models.OrganizationMember.list({
        filter: { 
          userId: { eq: user.id },
          organizationId: { eq: orgId },
          status: { eq: 'ACTIVE' }
        }
      });

      if (memberships && memberships.length > 0) {
        const newMembership = memberships[0];
        setMembership(newMembership);

        const { data: org } = await client.models.Organization.get({ id: orgId });
        setOrganization(org);
        
        toast.success('Switched organization');
        return { success: true };
      } else {
        throw new Error('You are not a member of this organization');
      }
    } catch (error) {
      console.error('Error switching organization:', error);
      toast.error(error.message || 'Failed to switch organization');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    if (!membership) return false;
    
    // Owner and Admin have all permissions
    if (['OWNER', 'ADMIN'].includes(membership.role)) return true;
    
    // Check custom permissions
    try {
      const permissions = JSON.parse(membership.permissions || '[]');
      return permissions.includes('*') || permissions.includes(permission);
    } catch {
      return false;
    }
  };

  const canManageUsers = () => {
    return ['OWNER', 'ADMIN', 'MANAGER'].includes(membership?.role);
  };

  const canManageProjects = () => {
    return ['OWNER', 'ADMIN', 'MANAGER'].includes(membership?.role);
  };

  const value = {
    organization,
    membership,
    loading,
    error,
    hasOrganization: !!organization,
    isOwner: membership?.role === 'OWNER',
    isAdmin: ['OWNER', 'ADMIN'].includes(membership?.role),
    role: membership?.role,
    
    // Methods
    refreshOrganization: fetchOrganization,
    createOrganization,
    inviteUser,
    switchOrganization,
    hasPermission,
    canManageUsers,
    canManageProjects,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

// Helper functions
function getPlanLimits(plan) {
  const limits = {
    FREE: {
      maxUsers: 5,
      maxProjects: 3,
      maxStorageGB: 1,
      maxApiCallsPerMonth: 10000,
    },
    STARTER: {
      maxUsers: 20,
      maxProjects: 999,
      maxStorageGB: 10,
      maxApiCallsPerMonth: 100000,
    },
    PROFESSIONAL: {
      maxUsers: 100,
      maxProjects: 999,
      maxStorageGB: 100,
      maxApiCallsPerMonth: 1000000,
    },
    ENTERPRISE: {
      maxUsers: 999,
      maxProjects: 999,
      maxStorageGB: 1000,
      maxApiCallsPerMonth: 10000000,
    },
  };
  return limits[plan] || limits.FREE;
}

function generateInviteToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default OrganizationContext;
