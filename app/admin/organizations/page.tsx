'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import { isSuperAdmin } from '@/lib/permissions-client';
import { ArrowLeft, Building, Users, FolderOpen, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOrganizationsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSuperAdmin(user)) {
      toast.error('Superadmin access required');
      router.push('/');
      return;
    }

    loadOrganizations();
  }, [user]);

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        // Enhance with additional data
        const enhanced = await Promise.all(
          result.data.map(async (org: any) => {
            const detailsRes = await fetch(`/api/organizations/${org.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const details = await detailsRes.json();
            return details.success ? details.data : org;
          })
        );
        setOrganizations(enhanced);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isSuperAdmin(user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Manage Organizations</h1>
            <p className="text-sm text-gray-600">Platform-wide organization management</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">All Organizations ({organizations.length})</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="spinner mx-auto mb-4" />
              <p className="text-gray-500">Loading organizations...</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No organizations yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Members</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Projects</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-monday-purple to-monday-softPurple rounded flex items-center justify-center">
                            <Building className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{org.name}</div>
                            <div className="text-sm text-gray-500 font-mono">{org.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-monday-purple/10 text-monday-purple">
                          {org.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-gray-900">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{org.member_count || 0}</span>
                          <span className="text-gray-500 text-sm">/ {org.max_users}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-gray-900">
                          <FolderOpen className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{org.project_count || 0}</span>
                          <span className="text-gray-500 text-sm">/ {org.max_projects}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toast('Organization editor coming soon', { icon: '⚙️' })}
                          className="p-2 text-monday-purple hover:bg-monday-lightPurple rounded-lg transition-colors"
                          title="Edit organization"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
