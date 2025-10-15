'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import { isSuperAdmin } from '@/lib/permissions-client';
import { Building, Users, FolderOpen, TrendingUp, Shield, BarChart3 } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4 mx-auto" />
          <p className="text-gray-600">Loading platform statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-monday-paleBlue via-gray-50 to-monday-lightPurple">
      {/* Header */}
      <div className="bg-gradient-to-r from-monday-darkNavy to-gray-900 text-white px-8 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Platform Administration</h1>
                <p className="text-white/80 mt-1">System-wide overview and management</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-monday-purple to-monday-softPurple rounded-lg">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.total_organizations}</div>
                <div className="text-sm text-gray-600">Organizations</div>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">
              +{stats.new_orgs_this_week} this week
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-monday-teal to-monday-lime rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.total_users}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">
              +{stats.new_users_this_week} this week
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-monday-orange to-monday-yellow rounded-lg">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.total_projects}</div>
                <div className="text-sm text-gray-600">Total Projects</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              {stats.active_projects} active
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-monday-pink to-red-400 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stats.total_failure_modes}</div>
                <div className="text-sm text-gray-600">Failure Modes</div>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">
              +{stats.new_projects_this_week} projects this week
            </div>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Plan Distribution</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.plan_distribution.free}</div>
              <div className="text-sm text-gray-600 mt-1">Free</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{stats.plan_distribution.starter}</div>
              <div className="text-sm text-blue-700 mt-1">Starter</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">{stats.plan_distribution.professional}</div>
              <div className="text-sm text-purple-700 mt-1">Professional</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-monday-purple/10 to-monday-pink/10 rounded-lg">
              <div className="text-2xl font-bold text-monday-purple">{stats.plan_distribution.enterprise}</div>
              <div className="text-sm text-monday-purple mt-1">Enterprise</div>
            </div>
          </div>
        </div>

        {/* Top Organizations */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Top Organizations by Projects</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Projects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.top_organizations.map((org: any) => (
                  <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{org.name}</div>
                      <div className="text-sm text-gray-500">{org.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-monday-purple/10 text-monday-purple">
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{org.project_count}</td>
                    <td className="px-6 py-4 text-gray-600">{org.member_count}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
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
            className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-monday-purple hover:shadow-lg transition-all text-left group"
          >
            <Building className="w-8 h-8 text-monday-purple mb-3" />
            <div className="font-semibold text-gray-900 mb-1">Manage Organizations</div>
            <div className="text-sm text-gray-600">View and manage all organizations</div>
          </button>

          <button
            onClick={() => router.push('/admin/users')}
            className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-monday-teal hover:shadow-lg transition-all text-left group"
          >
            <Users className="w-8 h-8 text-monday-teal mb-3" />
            <div className="font-semibold text-gray-900 mb-1">Manage Users</div>
            <div className="text-sm text-gray-600">View all users across all organizations</div>
          </button>

          <button
            onClick={() => router.push('/admin/settings')}
            className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-monday-orange hover:shadow-lg transition-all text-left group"
          >
            <Shield className="w-8 h-8 text-monday-orange mb-3" />
            <div className="font-semibold text-gray-900 mb-1">Platform Settings</div>
            <div className="text-sm text-gray-600">Configure features, plans, and limits</div>
          </button>
        </div>
      </div>
    </div>
  );
}
