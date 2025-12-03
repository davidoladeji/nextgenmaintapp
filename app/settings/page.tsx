'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useOrganization } from '@/lib/store';
import { Building, Save } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, isInitializing } = useAuth();
  const { currentOrganization, setCurrentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    // Wait for auth initialization
    if (isInitializing) {
      return;
    }

    if (!user || !token) {
      router.push('/');
      return;
    }

    if (currentOrganization) {
      setOrgName(currentOrganization.name);
      setLogoUrl(currentOrganization.logo_url || '');
    }
  }, [user, token, isInitializing, currentOrganization]);

  const handleSave = async () => {
    if (!currentOrganization) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/organizations/${currentOrganization.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: orgName,
          logo_url: logoUrl || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCurrentOrganization(result.data);
        toast.success('Organization settings saved successfully!');
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !currentOrganization) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
          {/* Header */}
          <div className="bg-accent/10 dark:bg-accent/20 px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <Building className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Organization Details</h2>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-gray-900 dark:text-slate-100"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                Logo URL (Optional)
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">URL to your organization's logo image</p>
            </div>

            {/* Organization Info (Read-only) */}
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Organization Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-slate-400">Plan:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-slate-100 capitalize">{currentOrganization.plan}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-slate-400">Slug:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-slate-100 font-mono">{currentOrganization.slug}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-slate-400">Max Users:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{currentOrganization.max_users}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-slate-400">Max Projects:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{currentOrganization.max_projects}</span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={handleSave}
                disabled={loading || !orgName.trim()}
                className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all ${
                  loading || !orgName.trim()
                    ? 'bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent hover:shadow-lg'
                }`}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
