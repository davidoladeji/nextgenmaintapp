'use client';

import { useState, useEffect } from 'react';
import { usePlatformSettings } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign, Users, FolderOpen, Database, Zap, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PlanConfig } from '@/types';

const PLAN_NAMES = ['free', 'starter', 'professional', 'enterprise'] as const;
type PlanName = typeof PLAN_NAMES[number];

const PLAN_LABELS: Record<PlanName, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<PlanName, string> = {
  free: 'from-gray-500 to-gray-600',
  starter: 'from-blue-500 to-blue-600',
  professional: 'from-purple-500 to-purple-600',
  enterprise: 'from-amber-500 to-amber-600',
};

export default function PlansTab() {
  const { settings, updateSettings, isLoading } = usePlatformSettings();

  const [formData, setFormData] = useState<Record<PlanName, PlanConfig>>({
    free: {
      maxUsers: 3,
      maxProjects: 5,
      maxStorageGB: 1,
      featuresEnabled: [],
      price: 0,
      aiRequestsPerMonth: 100,
    },
    starter: {
      maxUsers: 10,
      maxProjects: 25,
      maxStorageGB: 10,
      featuresEnabled: [],
      price: 29,
      aiRequestsPerMonth: 500,
    },
    professional: {
      maxUsers: 50,
      maxProjects: 100,
      maxStorageGB: 50,
      featuresEnabled: [],
      price: 99,
      aiRequestsPerMonth: 2000,
    },
    enterprise: {
      maxUsers: -1,
      maxProjects: -1,
      maxStorageGB: 500,
      featuresEnabled: [],
      price: 299,
      aiRequestsPerMonth: -1,
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings?.planLimits) {
      setFormData({
        free: settings.planLimits.free,
        starter: settings.planLimits.starter,
        professional: settings.planLimits.professional,
        enterprise: settings.planLimits.enterprise,
      });
    }
  }, [settings]);

  const updatePlan = (planName: PlanName, field: keyof PlanConfig, value: any) => {
    setFormData({
      ...formData,
      [planName]: {
        ...formData[planName],
        [field]: value,
      },
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        planLimits: formData,
      });
      toast.success('Plan settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save plan settings');
      console.error('Error saving plan settings:', error);
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
    <div className="space-y-8">
      {/* Plans Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-gray-600 dark:text-slate-400" />
          Subscription Plans
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Configure pricing and limits for each subscription tier. Use -1 for unlimited resources.
        </p>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLAN_NAMES.map((planName) => {
          const plan = formData[planName];
          const label = PLAN_LABELS[planName];
          const colorGradient = PLAN_COLORS[planName];

          return (
            <div
              key={planName}
              className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Plan Header */}
              <div className={`bg-gradient-to-r ${colorGradient} px-6 py-4`}>
                <h4 className="text-xl font-bold text-white mb-1">{label}</h4>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">
                    ${plan.price}
                  </span>
                  <span className="text-white/80 text-sm ml-2">/month</span>
                </div>
              </div>

              {/* Plan Configuration */}
              <div className="p-6 space-y-4">
                {/* Price */}
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Monthly Price (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={plan.price}
                    onChange={(e) => updatePlan(planName, 'price', parseInt(e.target.value) || 0)}
                    className="input w-full text-sm"
                  />
                </div>

                {/* Max Users */}
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    Max Users
                  </label>
                  <input
                    type="number"
                    min="-1"
                    value={plan.maxUsers}
                    onChange={(e) => updatePlan(planName, 'maxUsers', parseInt(e.target.value) || 0)}
                    className="input w-full text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    -1 = unlimited
                  </p>
                </div>

                {/* Max Projects */}
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center">
                    <FolderOpen className="w-3 h-3 mr-1" />
                    Max Projects
                  </label>
                  <input
                    type="number"
                    min="-1"
                    value={plan.maxProjects}
                    onChange={(e) => updatePlan(planName, 'maxProjects', parseInt(e.target.value) || 0)}
                    className="input w-full text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    -1 = unlimited
                  </p>
                </div>

                {/* Max Storage */}
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center">
                    <Database className="w-3 h-3 mr-1" />
                    Max Storage (GB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={plan.maxStorageGB}
                    onChange={(e) => updatePlan(planName, 'maxStorageGB', parseInt(e.target.value) || 1)}
                    className="input w-full text-sm"
                  />
                </div>

                {/* AI Requests Per Month */}
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center">
                    <Zap className="w-3 h-3 mr-1" />
                    AI Requests/Month
                  </label>
                  <input
                    type="number"
                    min="-1"
                    value={plan.aiRequestsPerMonth}
                    onChange={(e) => updatePlan(planName, 'aiRequestsPerMonth', parseInt(e.target.value) || 0)}
                    className="input w-full text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    -1 = unlimited
                  </p>
                </div>

                {/* Features Count Badge */}
                <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-slate-400">
                      Enabled Features
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                      <Check className="w-3 h-3 mr-1" />
                      {plan.featuresEnabled.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
              Plan Configuration Tips
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Use -1 for unlimited users, projects, or AI requests</li>
              <li>• Free plan should have $0 price and limited features</li>
              <li>• Feature access is controlled in the Features tab</li>
              <li>• Changes take effect immediately for new subscriptions</li>
            </ul>
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
              Save Plan Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
