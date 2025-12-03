'use client';

import { useState, useEffect } from 'react';
import { usePlatformSettings } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Globe, Calendar, DollarSign, Power, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'EST (Eastern Time)' },
  { value: 'America/Chicago', label: 'CST (Central Time)' },
  { value: 'America/Denver', label: 'MST (Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'PST (Pacific Time)' },
  { value: 'Europe/London', label: 'GMT (London)' },
  { value: 'Europe/Paris', label: 'CET (Central European Time)' },
  { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time)' },
  { value: 'Australia/Sydney', label: 'AEDT (Australian Eastern Time)' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Format)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (European Format)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Format)' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (German Format)' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
];

export default function SystemTab() {
  const { settings, updateSettings, isLoading } = usePlatformSettings();

  const [formData, setFormData] = useState({
    maintenanceMode: false,
    maintenanceMessage: '',
    registrationOpen: true,
    defaultTimezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings?.system) {
      setFormData({
        maintenanceMode: settings.system.maintenanceMode || false,
        maintenanceMessage: settings.system.maintenanceMessage || '',
        registrationOpen: settings.system.registrationOpen !== undefined ? settings.system.registrationOpen : true,
        defaultTimezone: settings.system.defaultTimezone || 'UTC',
        dateFormat: settings.system.dateFormat || 'MM/DD/YYYY',
        currency: settings.system.currency || 'USD',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        system: {
          ...settings?.system,
          maintenanceMode: formData.maintenanceMode,
          maintenanceMessage: formData.maintenanceMessage,
          registrationOpen: formData.registrationOpen,
          defaultTimezone: formData.defaultTimezone,
          dateFormat: formData.dateFormat,
          currency: formData.currency,
        },
      });
      toast.success('System settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save system settings');
      console.error('Error saving system settings:', error);
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
      {/* Maintenance Mode Warning */}
      {formData.maintenanceMode && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                Maintenance Mode is Active
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                The platform is currently in maintenance mode. Users will see the maintenance message and cannot access the application.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
          <Power className="w-5 h-5 mr-2 text-gray-600 dark:text-slate-400" />
          Maintenance
        </h3>
        <div className="space-y-4">
          {/* Maintenance Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-1 block">
                Maintenance Mode
              </label>
              <p className="text-xs text-gray-600 dark:text-slate-400">
                Temporarily disable platform access for maintenance
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, maintenanceMode: !formData.maintenanceMode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.maintenanceMode
                  ? 'bg-amber-600 dark:bg-amber-500'
                  : 'bg-gray-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Maintenance Message */}
          {formData.maintenanceMode && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                Maintenance Message
              </label>
              <textarea
                value={formData.maintenanceMessage}
                onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                placeholder="We're performing scheduled maintenance. We'll be back soon!"
                rows={3}
                className="input w-full resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                This message will be displayed to users during maintenance
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Registration Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
          <UserPlus className="w-5 h-5 mr-2 text-gray-600 dark:text-slate-400" />
          Registration
        </h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-1 block">
              Allow New Registrations
            </label>
            <p className="text-xs text-gray-600 dark:text-slate-400">
              Enable or disable new user sign-ups
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, registrationOpen: !formData.registrationOpen })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.registrationOpen
                ? 'bg-accent'
                : 'bg-gray-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.registrationOpen ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Localization Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-gray-600 dark:text-slate-400" />
          Localization
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Timezone */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center">
              <Globe className="w-4 h-4 mr-1.5" />
              Default Timezone
            </label>
            <select
              value={formData.defaultTimezone}
              onChange={(e) => setFormData({ ...formData, defaultTimezone: e.target.value })}
              className="input w-full"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Used for timestamps and notifications
            </p>
          </div>

          {/* Date Format */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1.5" />
              Date Format
            </label>
            <select
              value={formData.dateFormat}
              onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
              className="input w-full"
            >
              {DATE_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              How dates are displayed
            </p>
          </div>

          {/* Currency */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center">
              <DollarSign className="w-4 h-4 mr-1.5" />
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="input w-full"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.value} value={curr.value}>
                  {curr.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Used for pricing and billing
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
              Save System Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
