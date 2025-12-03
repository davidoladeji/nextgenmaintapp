'use client';

import { useState, useEffect } from 'react';
import { usePlatformSettings } from '@/lib/store';
import ColorPicker from '../ColorPicker';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BrandingTab() {
  const { settings, updateSettings, isLoading } = usePlatformSettings();

  // Local state for form
  const [formData, setFormData] = useState({
    platformName: '',
    companyName: '',
    accentColor: '#3B82F6',
    accentColorDark: '#F59E0B',
    accentColorHover: '#2563EB',
    accentColorDarkHover: '#D97706',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load settings into form
  useEffect(() => {
    if (settings?.branding) {
      setFormData({
        platformName: settings.branding.platformName || '',
        companyName: settings.branding.companyName || '',
        accentColor: settings.branding.accentColor || '#3B82F6',
        accentColorDark: settings.branding.accentColorDark || '#F59E0B',
        accentColorHover: settings.branding.accentColorHover || '#2563EB',
        accentColorDarkHover: settings.branding.accentColorDarkHover || '#D97706',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        branding: {
          ...settings?.branding,
          platformName: formData.platformName,
          companyName: formData.companyName,
          accentColor: formData.accentColor,
          accentColorDark: formData.accentColorDark,
          accentColorHover: formData.accentColorHover,
          accentColorDarkHover: formData.accentColorDarkHover,
        },
      });
      toast.success('Branding settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save branding settings');
      console.error('Error saving branding:', error);
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
      {/* Platform Identity */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Platform Identity
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
              Platform Name
            </label>
            <input
              type="text"
              value={formData.platformName}
              onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
              placeholder="NextMint Platform"
              className="input w-full"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Displayed in the header and browser title
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
              Company Name
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Your Company Name"
              className="input w-full"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Used in emails and legal documents
            </p>
          </div>
        </div>
      </div>

      {/* Color Theme */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Color Theme
        </h3>
        <div className="space-y-6">
          {/* Base Accent Colors */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              Base Accent Colors
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ColorPicker
                label="Accent Color (Light Mode)"
                value={formData.accentColor}
                onChange={(color) => setFormData({ ...formData, accentColor: color })}
              />
              <ColorPicker
                label="Accent Color (Dark Mode)"
                value={formData.accentColorDark}
                onChange={(color) => setFormData({ ...formData, accentColorDark: color })}
              />
            </div>
          </div>

          {/* Hover State Colors */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              Hover State Colors
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ColorPicker
                label="Hover Color (Light Mode)"
                value={formData.accentColorHover}
                onChange={(color) => setFormData({ ...formData, accentColorHover: color })}
              />
              <ColorPicker
                label="Hover Color (Dark Mode)"
                value={formData.accentColorDarkHover}
                onChange={(color) => setFormData({ ...formData, accentColorDarkHover: color })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logo & Favicon */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Logo & Favicon
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Upload Placeholder */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
              Platform Logo
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-slate-500 transition-colors">
              <ImageIcon className="w-10 h-10 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                Logo upload coming soon
              </p>
              <Button variant="outline" size="sm" disabled>
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                Recommended: 200x50px, PNG or SVG
              </p>
            </div>
          </div>

          {/* Favicon Upload Placeholder */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
              Favicon
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-slate-500 transition-colors">
              <ImageIcon className="w-10 h-10 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                Favicon upload coming soon
              </p>
              <Button variant="outline" size="sm" disabled>
                <Upload className="w-4 h-4 mr-2" />
                Upload Favicon
              </Button>
              <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                Recommended: 32x32px, ICO or PNG
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Live Preview
        </h3>
        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
            See how your accent colors look on buttons and UI elements. Hover over buttons to see the hover state:
          </p>
          <div className="space-y-4">
            {/* Light Mode Preview */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-3">Light Mode</p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: formData.accentColor }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = formData.accentColorHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = formData.accentColor}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium border-2 transition-all hover:shadow-md"
                  style={{
                    borderColor: formData.accentColor,
                    color: formData.accentColor
                  }}
                >
                  Outline Button
                </button>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" style={{ color: formData.accentColor }} />
                  <span className="text-sm" style={{ color: formData.accentColor }}>
                    Success State
                  </span>
                </div>
              </div>
            </div>

            {/* Dark Mode Preview */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <p className="text-xs font-medium text-slate-400 mb-3">Dark Mode</p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-900 transition-all hover:shadow-lg"
                  style={{ backgroundColor: formData.accentColorDark }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = formData.accentColorDarkHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = formData.accentColorDark}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium border-2 transition-all hover:shadow-md"
                  style={{
                    borderColor: formData.accentColorDark,
                    color: formData.accentColorDark
                  }}
                >
                  Outline Button
                </button>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" style={{ color: formData.accentColorDark }} />
                  <span className="text-sm" style={{ color: formData.accentColorDark }}>
                    Success State
                  </span>
                </div>
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
              Save Branding Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
