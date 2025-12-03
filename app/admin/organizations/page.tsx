'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import { isSuperAdmin } from '@/lib/permissions-client';
import { Building, Users, FolderOpen, Edit } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
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
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">All Organizations ({organizations.length})</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="spinner mx-auto mb-4" />
              <p className="text-gray-500 dark:text-slate-400">Loading organizations...</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-slate-400">
              <Building className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
              <p>No organizations yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Members</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Projects</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-accent/10 dark:bg-accent/20 rounded flex items-center justify-center">
                            <Building className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-slate-100">{org.name}</div>
                            <div className="text-sm text-gray-500 dark:text-slate-400 font-mono">{org.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-accent/10 dark:bg-accent/20 text-accent">
                          {org.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-gray-900 dark:text-slate-100">
                          <Users className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                          <span className="font-medium">{org.member_count || 0}</span>
                          <span className="text-gray-500 dark:text-slate-400 text-sm">/ {org.max_users}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-gray-900 dark:text-slate-100">
                          <FolderOpen className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                          <span className="font-medium">{org.project_count || 0}</span>
                          <span className="text-gray-500 dark:text-slate-400 text-sm">/ {org.max_projects}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toast('Organization editor coming soon', { icon: '⚙️' })}
                          className="p-2 text-accent hover:bg-accent/10 dark:hover:bg-accent/20 rounded-lg transition-colors"
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
    </DashboardLayout>
  );
}
