'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useOrganization } from '@/lib/store';
import { ArrowLeft, Building, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { currentOrganization, setCurrentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    if (!user || !token) {
      router.push('/');
      return;
    }

    if (currentOrganization) {
      setOrgName(currentOrganization.name);
      setLogoUrl(currentOrganization.logo_url || '');
    }
  }, [user, token, currentOrganization]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Organization Settings</h1>
            <p className="text-sm text-gray-600">{currentOrganization.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-monday-purple to-monday-softPurple px-6 py-4">
            <div className="flex items-center space-x-3">
              <Building className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Organization Details</h2>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Logo URL (Optional)
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple"
              />
              <p className="text-xs text-gray-500 mt-1">URL to your organization's logo image</p>
            </div>

            {/* Organization Info (Read-only) */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Organization Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Plan:</span>
                  <span className="ml-2 font-medium text-gray-900 capitalize">{currentOrganization.plan}</span>
                </div>
                <div>
                  <span className="text-gray-600">Slug:</span>
                  <span className="ml-2 font-medium text-gray-900 font-mono">{currentOrganization.slug}</span>
                </div>
                <div>
                  <span className="text-gray-600">Max Users:</span>
                  <span className="ml-2 font-medium text-gray-900">{currentOrganization.max_users}</span>
                </div>
                <div>
                  <span className="text-gray-600">Max Projects:</span>
                  <span className="ml-2 font-medium text-gray-900">{currentOrganization.max_projects}</span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={loading || !orgName.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  loading || !orgName.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-monday-purple to-monday-softPurple text-white hover:shadow-lg hover:scale-105'
                }`}
              >
                <Save className="w-4 h-4 mr-2 inline" />
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
