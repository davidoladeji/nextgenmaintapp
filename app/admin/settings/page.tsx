'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, usePlatformSettings } from '@/lib/store';
import { isSuperAdmin } from '@/lib/permissions-client';
import {
  Palette,
  Zap,
  Shield,
  DollarSign,
  Settings,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import toast from 'react-hot-toast';
import BrandingTab from '@/components/admin/settings/BrandingTab';
import FeaturesTab from '@/components/admin/settings/FeaturesTab';
import PlansTab from '@/components/admin/settings/PlansTab';
import SecurityTab from '@/components/admin/settings/SecurityTab';
import SystemTab from '@/components/admin/settings/SystemTab';

type Tab = 'branding' | 'features' | 'plans' | 'security' | 'system';

const TABS: { id: Tab; label: string; icon: typeof Palette }[] = [
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'features', label: 'Features', icon: Zap },
  { id: 'plans', label: 'Plans', icon: DollarSign },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'system', label: 'System', icon: Settings },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { loadSettings } = usePlatformSettings();
  const [activeTab, setActiveTab] = useState<Tab>('branding');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !isSuperAdmin(user)) {
      toast.error('Superadmin access required');
      router.push('/');
      return;
    }

    // Load platform settings
    const initSettings = async () => {
      try {
        await loadSettings();
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load platform settings');
      } finally {
        setIsLoading(false);
      }
    };

    initSettings();
  }, [user, loadSettings, router]);

  if (!user || !isSuperAdmin(user)) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="flex -mb-px">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative px-6 py-4 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner" />
              </div>
            ) : (
              <>
                {activeTab === 'branding' && <BrandingTab />}
                {activeTab === 'features' && <FeaturesTab />}
                {activeTab === 'plans' && <PlansTab />}
                {activeTab === 'security' && <SecurityTab />}
                {activeTab === 'system' && <SystemTab />}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
