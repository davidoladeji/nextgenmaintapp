'use client';

import { useState, useEffect } from 'react';
import { Share2, X, Trash2, UserPlus } from 'lucide-react';
import { useAuth, useOrganization } from '@/lib/store';
import { Project, ProjectMember } from '@/types';
import toast from 'react-hot-toast';

interface ShareProjectModalProps {
  project: Project;
  onClose: () => void;
}

export default function ShareProjectModal({ project, onClose }: ShareProjectModalProps) {
  const { token } = useAuth();
  const { currentOrganization, members: orgMembers } = useOrganization();
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    loadProjectMembers();
    loadOrgMembers();
  }, [project.id]);

  const loadProjectMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setProjectMembers(result.data);
      }
    } catch (error) {
      console.error('Failed to load project members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadOrgMembers = async () => {
    if (!currentOrganization) return;

    // Org members are already loaded in useOrganization hook
    // We'll fetch them again to ensure fresh data
    try {
      const response = await fetch(`/api/organizations/${currentOrganization.id}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        // Filter out members who already have access to this project
        // This will be handled in the dropdown
      }
    } catch (error) {
      console.error('Failed to load org members:', error);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error('Please select a team member');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: selectedUserId, role: selectedRole }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Project shared successfully!');
        setSelectedUserId('');
        setSelectedRole('viewer');
        loadProjectMembers();
      } else {
        toast.error(result.error || 'Failed to share project');
      }
    } catch (error) {
      console.error('Error sharing project:', error);
      toast.error('Failed to share project');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName}'s access to this project?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/members?userId=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${userName} removed from project`);
        loadProjectMembers();
      } else {
        toast.error(result.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      owner: 'bg-monday-purple text-white',
      editor: 'bg-monday-teal text-white',
      viewer: 'bg-gray-400 text-white',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-300 text-gray-700';
  };

  // Get org members who don't already have project access
  const availableMembers = orgMembers.filter(
    (orgMember) => !projectMembers.some((pm) => pm.user_id === orgMember.user_id)
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-monday-purple to-monday-softPurple px-6 py-4 flex items-center justify-between sticky top-0 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Share2 className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Share Project</h2>
              <p className="text-sm text-white/90">{project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Member Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Add Team Member</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="input"
                  disabled={availableMembers.length === 0}
                >
                  <option value="">Select team member...</option>
                  {availableMembers.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.user?.name} ({member.user?.email})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="input"
                >
                  <option value="editor">Editor - Can edit FMEA data</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedUserId || availableMembers.length === 0}
                className="btn-primary btn-sm w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? 'Adding...' : 'Add to Project'}
              </button>

              {availableMembers.length === 0 && (
                <p className="text-xs text-gray-500 text-center">
                  All organization members already have access to this project
                </p>
              )}
            </form>
          </div>

          {/* Current Members */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Current Members ({projectMembers.length})
            </h3>

            {loadingMembers ? (
              <div className="text-center py-8">
                <div className="spinner mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading members...</p>
              </div>
            ) : projectMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No shared members yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {projectMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-monday-purple to-monday-softPurple rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {member.user?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {member.user?.name || 'Unknown'}
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(member.role)}`}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                          {member.is_creator && (
                            <span className="text-xs text-gray-500">(Creator)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!member.is_creator && member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id, member.user?.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
