'use client';

import { useState, useEffect } from 'react';
import { projectMemberService, type MemberRole } from '@/services/projectMemberService';
import { userService } from '@/services/userService';
import { useToast } from '@/contexts/ToastContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { UserPlusIcon, UserMinusIcon, ShieldIcon, Edit2Icon } from 'lucide-react';

interface ProjectMembersProps {
  projectId: string;
}

export default function ProjectMembers({ projectId }: ProjectMembersProps) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersResult, usersResult] = await Promise.all([
        projectMemberService.getByProject(projectId),
        userService.list(),
      ]);

      setMembers(membersResult.data || []);
      setAllUsers(usersResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId: string, role: MemberRole) => {
    try {
      const { error } = await projectMemberService.addMember({
        projectId,
        userId,
        role,
      });

      if (error) {
        toast.error(error);
        return;
      }

      await loadData();
      setShowAddModal(false);
      toast.success('Member added successfully!');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const { error } = await projectMemberService.removeMember(memberId);

      if (error) {
        toast.error(error);
        return;
      }

      setMembers(members.filter(m => m.id !== memberId));
      toast.success('Member removed successfully!');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: MemberRole) => {
    try {
      const { error } = await projectMemberService.updateRole(memberId, newRole);

      if (error) {
        toast.error(error);
        return;
      }

      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      toast.success('Role updated successfully!');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const availableUsers = allUsers.filter(
    u => !members.some(m => m.userId === u.id)
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ShieldIcon className="w-5 h-5" />
          Project Members ({members.length})
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <UserPlusIcon className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ShieldIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No members yet. Add team members to collaborate!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(member => {
            const memberUser = allUsers.find(u => u.id === member.userId);
            return (
              <MemberItem
                key={member.id}
                member={member}
                user={memberUser}
                onRemove={() => handleRemoveMember(member.id)}
                onUpdateRole={(role) => handleUpdateRole(member.id, role)}
                canManage={user?.id !== member.userId}
              />
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddMember}
          availableUsers={availableUsers}
        />
      )}
    </div>
  );
}

function MemberItem({ member, user, onRemove, onUpdateRole, canManage }: any) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roleColors = {
    OWNER: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    MEMBER: 'bg-green-100 text-green-800',
    VIEWER: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-semibold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`px-3 py-1 text-xs font-semibold rounded-full ${roleColors[member.role]} ${canManage ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            disabled={!canManage}
          >
            {member.role}
          </button>

          {showRoleMenu && canManage && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowRoleMenu(false)}></div>
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {(['ADMIN', 'MEMBER', 'VIEWER'] as MemberRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      onUpdateRole(role);
                      setShowRoleMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {canManage && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Remove member"
          >
            <UserMinusIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function AddMemberModal({ onClose, onAdd, availableUsers }: any) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState<MemberRole>('MEMBER');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      alert('Please select a user');
      return;
    }
    onAdd(selectedUser, selectedRole);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Team Member</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User *
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a user...</option>
              {availableUsers.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select the role for this team member
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
