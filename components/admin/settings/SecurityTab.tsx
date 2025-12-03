'use client';

import { useState, useEffect } from 'react';
import { usePlatformSettings } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { CheckCircle, Shield, Lock, Key, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecurityTab() {
  const { settings, updateSettings, isLoading } = usePlatformSettings();

  const [formData, setFormData] = useState({
    sessionTimeout: 480,
    passwordMinLength: 8,
    requireMFA: false,
    maxLoginAttempts: 5,
    allowedDomains: '',
    ipWhitelist: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings?.security) {
      setFormData({
        sessionTimeout: settings.security.sessionTimeout || 480,
        passwordMinLength: settings.security.passwordMinLength || 8,
        requireMFA: settings.security.requireMFA || false,
        maxLoginAttempts: settings.security.maxLoginAttempts || 5,
        allowedDomains: settings.security.allowedDomains?.join(', ') || '',
        ipWhitelist: settings.security.ipWhitelist?.join(', ') || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        security: {
          ...settings?.security,
          sessionTimeout: formData.sessionTimeout,
          passwordMinLength: formData.passwordMinLength,
          requireMFA: formData.requireMFA,
          maxLoginAttempts: formData.maxLoginAttempts,
          allowedDomains: formData.allowedDomains
            ? formData.allowedDomains.split(',').map((d) => d.trim()).filter(Boolean)
            : [],
          ipWhitelist: formData.ipWhitelist
            ? formData.ipWhitelist.split(',').map((ip) => ip.trim()).filter(Boolean)
            : [],
        },
      });
      toast.success('Security settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save security settings');
      console.error('Error saving security settings:', error);
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
      {/* Session Management */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-gray-600 dark:text-slate-400" />
          Session Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Session Timeout */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="10080"
              value={formData.sessionTimeout}
              onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) || 480 })}
              className="input w-full"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Users will be logged out after this period of inactivity (default: 480 minutes / 8 hours)
            </p>
          </div>

          {/* Max Login Attempts */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
              Max Login Attempts
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.maxLoginAttempts}
              onChange={(e) => setFormData({ ...formData, maxLoginAttempts: parseInt(e.target.value) || 5 })}
              className="input w-full"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Account will be locked after this many failed login attempts
            </p>
          </div>
        </div>
      </div>

      {/* Password Policy */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-gray-600 dark:text-slate-400" />
          Password Policy
        </h3>
        <div className="space-y-4">
          {/* Password Min Length */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
              Minimum Password Length
            </label>
            <input
              type="number"
              min="6"
              max="64"
              value={formData.passwordMinLength}
              onChange={(e) => setFormData({ ...formData, passwordMinLength: parseInt(e.target.value) || 8 })}
              className="input w-full md:w-64"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Users must create passwords with at least this many characters (recommended: 8+)
            </p>
          </div>

          {/* Require MFA */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-1 block flex items-center">
                <Key className="w-4 h-4 mr-1.5" />
                Require Multi-Factor Authentication (MFA)
              </label>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                Force all users to enable 2FA for enhanced security
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, requireMFA: !formData.requireMFA })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.requireMFA
                  ? 'bg-accent'
                  : 'bg-gray-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.requireMFA ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Access Control */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-gray-600 dark:text-slate-400" />
          Access Control
        </h3>
        <div className="space-y-4">
          {/* Allowed Domains */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
              Allowed Email Domains (optional)
            </label>
            <input
              type="text"
              value={formData.allowedDomains}
              onChange={(e) => setFormData({ ...formData, allowedDomains: e.target.value })}
              placeholder="company.com, partner.com, client.com"
              className="input w-full"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Comma-separated list. If set, only users with these email domains can register. Leave empty to allow all domains.
            </p>
          </div>

          {/* IP Whitelist */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
              IP Whitelist (optional)
            </label>
            <input
              type="text"
              value={formData.ipWhitelist}
              onChange={(e) => setFormData({ ...formData, ipWhitelist: e.target.value })}
              placeholder="192.168.1.0/24, 10.0.0.0/8"
              className="input w-full"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Comma-separated list of allowed IP addresses or CIDR ranges. Leave empty to allow all IPs.
            </p>
          </div>

          {/* Security Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  Security Best Practices
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Enable MFA for superadmin accounts at minimum</li>
                  <li>• Use strong session timeouts for sensitive data</li>
                  <li>• Regularly review and update IP whitelists</li>
                  <li>• Monitor failed login attempts for suspicious activity</li>
                </ul>
              </div>
            </div>
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
              Save Security Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
