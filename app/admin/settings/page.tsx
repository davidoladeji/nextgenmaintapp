'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import { isSuperAdmin } from '@/lib/permissions-client';
import { ArrowLeft, Settings, Zap, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !isSuperAdmin(user)) {
      toast.error('Superadmin access required');
      router.push('/');
    }
  }, [user]);

  if (!user || !isSuperAdmin(user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Platform Settings</h1>
            <p className="text-sm text-gray-600">Configure platform-wide features and limits</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-monday-purple to-monday-softPurple rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Platform Configuration Coming Soon</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Configure feature flags, plan limits, default settings, and platform-wide configurations.
            This advanced admin feature is planned for Phase 1 development.
          </p>
          <div className="space-y-4 max-w-md mx-auto text-left">
            <div className="flex items-start space-x-3 p-4 bg-monday-lightPurple rounded-lg">
              <Zap className="w-5 h-5 text-monday-purple flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Feature Flags</h3>
                <p className="text-xs text-gray-600 mt-1">Enable/disable features per plan tier</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-monday-lightPurple rounded-lg">
              <Shield className="w-5 h-5 text-monday-purple flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Plan Configuration</h3>
                <p className="text-xs text-gray-600 mt-1">Set max users, projects, and storage per plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
