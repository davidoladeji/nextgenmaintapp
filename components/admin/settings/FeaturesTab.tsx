'use client';

import { useState, useEffect } from 'react';
import { usePlatformSettings } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Building2,
  Link2,
  Download,
  Code,
  Palette,
  BarChart3,
  FileText,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FeatureConfig {
  key: keyof typeof INITIAL_FEATURES;
  name: string;
  description: string;
  icon: typeof Bot;
}

const INITIAL_FEATURES = {
  aiAssistant: false,
  multiOrganization: false,
  guestLinks: false,
  dataExport: false,
  apiAccess: false,
  customBranding: false,
  advancedAnalytics: false,
  auditLogs: false,
};

const FEATURE_CONFIGS: FeatureConfig[] = [
  {
    key: 'aiAssistant',
    name: 'AI Assistant',
    description: 'Enable AI-powered suggestions and analysis',
    icon: Bot,
  },
  {
    key: 'multiOrganization',
    name: 'Multi-Organization',
    description: 'Allow users to belong to multiple organizations',
    icon: Building2,
  },
  {
    key: 'guestLinks',
    name: 'Guest Links',
    description: 'Enable shareable guest access links',
    icon: Link2,
  },
  {
    key: 'dataExport',
    name: 'Data Export',
    description: 'Allow exporting data to Excel/PDF',
    icon: Download,
  },
  {
    key: 'apiAccess',
    name: 'API Access',
    description: 'Enable REST API for integrations',
    icon: Code,
  },
  {
    key: 'customBranding',
    name: 'Custom Branding',
    description: 'Allow per-organization branding',
    icon: Palette,
  },
  {
    key: 'advancedAnalytics',
    name: 'Advanced Analytics',
    description: 'Enable advanced dashboard analytics',
    icon: BarChart3,
  },
  {
    key: 'auditLogs',
    name: 'Audit Logs',
    description: 'Track all user actions and changes',
    icon: FileText,
  },
];

export default function FeaturesTab() {
  const { settings, updateSettings, isLoading } = usePlatformSettings();
  const [features, setFeatures] = useState(INITIAL_FEATURES);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings into form
  useEffect(() => {
    if (settings?.features) {
      setFeatures(settings.features);
    }
  }, [settings]);

  const toggleFeature = (key: keyof typeof INITIAL_FEATURES) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        features,
      });
      toast.success('Feature settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save feature settings');
      console.error('Error saving features:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
          Feature Flags
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Enable or disable platform features. Changes apply platform-wide immediately after saving.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURE_CONFIGS.map((feature) => {
          const Icon = feature.icon;
          const isEnabled = features[feature.key];

          return (
            <div
              key={feature.key}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                isEnabled
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div
                    className={`p-2 rounded-lg ${
                      isEnabled
                        ? 'bg-blue-100 dark:bg-blue-900/40'
                        : 'bg-gray-100 dark:bg-slate-700'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isEnabled
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-slate-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">
                      {feature.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => toggleFeature(feature.key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isEnabled
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-200 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">
              {Object.values(features).filter(Boolean).length} of {FEATURE_CONFIGS.length} Features Enabled
            </h4>
            <p className="text-xs text-gray-600 dark:text-slate-400">
              Enabled features are available to all organizations based on their plan limits.
              You can control per-plan feature access in the Plans tab.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
        >
          {isSaving ? (
            <>
              <div className="spinner mr-2" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Feature Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
