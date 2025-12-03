'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import { isSuperAdmin } from '@/lib/permissions-client';
import { Building, Users, FolderOpen, Shield, BarChart3 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is superadmin
    if (!user || !isSuperAdmin(user)) {
      toast.error('Superadmin access required');
      router.push('/');
      return;
    }

    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isSuperAdmin(user)) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="spinner mb-4 mx-auto" />
            <p className="text-gray-600 dark:text-slate-400">Loading platform statistics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-accent/10 dark:bg-accent/20 rounded-lg">
                <Building className="w-6 h-6 text-accent" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.total_organizations}</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Organizations</div>
              </div>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
              +{stats.new_orgs_this_week} this week
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.total_users}</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Total Users</div>
              </div>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
              +{stats.new_users_this_week} this week
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <FolderOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.total_projects}</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Total Projects</div>
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-slate-400">
              {stats.active_projects} active
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.total_failure_modes}</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Failure Modes</div>
              </div>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
              +{stats.new_projects_this_week} projects this week
            </div>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Plan Distribution</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.plan_distribution.free}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">Free</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700/50">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stats.plan_distribution.starter}</div>
              <div className="text-sm text-blue-700 dark:text-blue-400 mt-1">Starter</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700/50">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">{stats.plan_distribution.professional}</div>
              <div className="text-sm text-purple-700 dark:text-purple-400 mt-1">Professional</div>
            </div>
            <div className="text-center p-4 bg-accent/10 dark:bg-accent/20 rounded-lg border border-accent/30 dark:border-accent/50">
              <div className="text-2xl font-bold text-accent">{stats.plan_distribution.enterprise}</div>
              <div className="text-sm text-accent mt-1">Enterprise</div>
            </div>
          </div>
        </div>

        {/* Top Organizations */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Top Organizations by Projects</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Projects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {stats.top_organizations.map((org: any) => (
                  <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-slate-100">{org.name}</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">{org.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-accent/10 dark:bg-accent/20 text-accent">
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-slate-100">{org.project_count}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400">{org.member_count}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/admin/organizations')}
            className="p-6 bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-200 dark:border-slate-700 hover:border-accent dark:hover:border-accent hover:shadow-lg transition-all text-left group"
          >
            <Building className="w-8 h-8 text-accent mb-3" />
            <div className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Manage Organizations</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">View and manage all organizations</div>
          </button>

          <button
            onClick={() => router.push('/admin/users')}
            className="p-6 bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all text-left group"
          >
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
            <div className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Manage Users</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">View all users across all organizations</div>
          </button>

          <button
            onClick={() => router.push('/admin/settings')}
            className="p-6 bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-lg transition-all text-left group"
          >
            <Shield className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-3" />
            <div className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Platform Settings</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Configure features, plans, and limits</div>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
