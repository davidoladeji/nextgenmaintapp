'use client';

import { useState } from 'react';
import { Mail, X, UserPlus } from 'lucide-react';
import { useAuth, useOrganization } from '@/lib/store';
import toast from 'react-hot-toast';

interface InviteMemberModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteMemberModal({ onClose, onSuccess }: InviteMemberModalProps) {
  const { token } = useAuth();
  const { currentOrganization } = useOrganization();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'org_admin' | 'project_manager' | 'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!currentOrganization) {
      toast.error('No organization selected');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/organizations/${currentOrganization.id}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Invitation sent to ${email}`);

        // Copy invitation link to clipboard
        if (result.data.invitation_link) {
          navigator.clipboard.writeText(result.data.invitation_link);
          toast.success('Invitation link copied to clipboard!', { duration: 3000 });
        }

        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-accent dark:bg-accent px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-3">
            <UserPlus className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Invite Team Member</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
              Role *
            </label>
            <div className="space-y-2">
              <label className="flex items-start space-x-3 p-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:border-accent transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="org_admin"
                  checked={role === 'org_admin'}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-slate-100">Organization Admin</div>
                  <div className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
                    Full control: manage team, create projects, organization settings
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:border-accent transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="project_manager"
                  checked={role === 'project_manager'}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-slate-100">Project Manager</div>
                  <div className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
                    Create and manage projects, assign team members
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:border-accent transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="editor"
                  checked={role === 'editor'}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-slate-100">Editor</div>
                  <div className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
                    Edit FMEA data in assigned projects
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:border-accent transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="viewer"
                  checked={role === 'viewer'}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-slate-100">Viewer</div>
                  <div className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
                    Read-only access to projects
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Info */}
          <div className="bg-accent/10 border border-accent rounded-lg p-3">
            <p className="text-sm text-gray-700 dark:text-slate-300">
              <span className="font-medium">📧 Email invitation</span> will be sent with a link to join <strong>{currentOrganization?.name}</strong>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                loading || !email.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-accent text-white hover:bg-accent hover:shadow-lg hover:scale-105 active:scale-95'
              }`}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
