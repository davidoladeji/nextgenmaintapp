'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react';
import { useAuth, useOrganization } from '@/lib/store';
import { Project } from '@/types';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function ShareProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { token, user } = useAuth();
  const { currentOrganization, members: orgMembers } = useOrganization();
  const [project, setProject] = useState<Project | null>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingProject, setLoadingProject] = useState(true);

  const projectId = params.id as string;

  useEffect(() => {
    if (!user || !token) {
      router.push('/');
      return;
    }

    loadProject();
    loadProjectMembers();
    loadOrgMembers();
  }, [user, token, projectId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setProject(result.data);
      } else {
        toast.error('Failed to load project');
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
      router.push('/');
    } finally {
      setLoadingProject(false);
    }
  };

  const loadProjectMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
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

    try {
      const response = await fetch(`/api/organizations/${currentOrganization.id}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        // Org members are already loaded in useOrganization hook
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
      const response = await fetch(`/api/projects/${projectId}/members`, {
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
      const response = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, {
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
      owner: 'bg-accent text-white',
      editor: 'bg-teal-600 text-white',
      viewer: 'bg-gray-400 text-white',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-300 text-gray-700';
  };

  // Get org members who don't already have project access
  const availableMembers = (orgMembers as any[]).filter(
    (orgMember: any) => !projectMembers.some((pm: any) => pm.user_id === orgMember.user_id)
  );

  if (loadingProject) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="spinner mb-4 mx-auto" />
            <p className="text-gray-600 dark:text-slate-400">Loading project...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Share Project</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">{project.name}</p>
        </div>

        {/* Add Member Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Add Team Member</h2>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Select team member
                </label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'editor' | 'viewer')}
                  className="input"
                >
                  <option value="editor">Editor - Can edit FMEA data</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedUserId || availableMembers.length === 0}
              className="btn-primary btn-md w-full md:w-auto"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Adding...' : 'Add to Project'}
            </button>

            {availableMembers.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                All organization members already have access to this project
              </p>
            )}
          </form>
        </div>

        {/* Current Members */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Current Members ({projectMembers.length})
          </h2>

          {loadingMembers ? (
            <div className="text-center py-8">
              <div className="spinner mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-slate-400">Loading members...</p>
            </div>
          ) : projectMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              <p>No shared members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white text-lg font-semibold">
                      {member.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-slate-100 truncate">
                        {member.user?.name || 'Unknown'}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(member.role)}`}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                        {member.is_creator && (
                          <span className="text-xs text-gray-500 dark:text-slate-400">(Creator)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!member.is_creator && member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id, member.user?.name)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
    </DashboardLayout>
  );
}
