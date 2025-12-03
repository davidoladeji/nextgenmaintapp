'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Trash2, Edit, Clock, CheckCircle, X as XIcon } from 'lucide-react';
import { useAuth, useOrganization } from '@/lib/store';
import { OrganizationMember, OrganizationInvitation } from '@/types';
import InviteMemberModal from './InviteMemberModal';
import toast from 'react-hot-toast';

export default function TeamMembersPage() {
  const { token, user } = useAuth();
  const { currentOrganization } = useOrganization();
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      loadMembers();
      loadInvitations();
    }
  }, [currentOrganization]);

  const loadMembers = async () => {
    if (!currentOrganization) return;

    try {
      const response = await fetch(`/api/organizations/${currentOrganization.id}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setMembers(result.data);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    if (!currentOrganization) return;

    try {
      const response = await fetch(`/api/organizations/${currentOrganization.id}/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setInvitations(result.data.filter((inv: any) => inv.status === 'pending'));
      }
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the organization?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/organizations/${currentOrganization?.id}/members?userId=${memberId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success(`${memberName} removed successfully`);
        loadMembers();
      } else {
        toast.error(result.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!confirm(`Cancel invitation for ${email}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/organizations/${currentOrganization?.id}/invitations?invitationId=${invitationId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Invitation cancelled');
        loadInvitations();
      } else {
        toast.error(result.error || 'Failed to cancel invitation');
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      org_admin: 'bg-purple-600 text-white',
      project_manager: 'bg-teal-600 text-white',
      editor: 'bg-orange-600 text-white',
      viewer: 'bg-gray-400 text-white',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-300 text-gray-700';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      org_admin: 'Org Admin',
      project_manager: 'Project Manager',
      editor: 'Editor',
      viewer: 'Viewer',
    };
    return labels[role as keyof typeof labels] || role;
  };

  if (!currentOrganization) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Please select an organization first</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-gray-500">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Team Members</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{currentOrganization.name}</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary btn-md"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </button>
      </div>

      {/* Active Members */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">Active Members ({members.length})</h2>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p>No team members yet. Invite your first team member!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {members.map((member) => (
              <div key={member.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 bg-accent/10 dark:bg-accent/20 rounded-full flex items-center justify-center text-accent font-semibold">
                      {member.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900 dark:text-slate-100">{member.user?.name || 'Unknown'}</div>
                        {member.user?.id === user?.id && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">You</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">{member.user?.email}</div>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {member.user?.id !== user?.id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRemoveMember(member.user.id, member.user.name)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Pending Invitations ({invitations.length})</h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {invitations.map((invitation) => {
              const expiresAt = new Date(invitation.expires_at);
              const isExpired = expiresAt < new Date();

              return (
                <div key={invitation.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
                      </div>

                      {/* Invitation Info */}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-slate-100">{invitation.email}</div>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(invitation.role)}`}>
                            {getRoleLabel(invitation.role)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            {isExpired ? (
                              <span className="text-red-600 dark:text-red-400">Expired {expiresAt.toLocaleDateString()}</span>
                            ) : (
                              <span>Expires {expiresAt.toLocaleDateString()}</span>
                            )}
                          </span>
                          {invitation.invited_by_user && (
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              Invited by {invitation.invited_by_user.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                      className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Cancel invitation"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            loadMembers();
            loadInvitations();
          }}
        />
      )}
    </div>
  );
}
