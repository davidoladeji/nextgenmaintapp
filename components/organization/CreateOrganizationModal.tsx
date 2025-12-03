'use client';

import { useState } from 'react';
import { Building, X } from 'lucide-react';
import { useAuth } from '@/lib/store';
import { Organization } from '@/types';
import toast from 'react-hot-toast';

interface CreateOrganizationModalProps {
  onClose: () => void;
  onSuccess: (organization: Organization) => void;
}

export default function CreateOrganizationModal({ onClose, onSuccess }: CreateOrganizationModalProps) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState<'free' | 'starter' | 'professional' | 'enterprise'>('free');
  const [loading, setLoading] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    // Generate slug: lowercase, replace spaces with hyphens, remove special chars
    const generatedSlug = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 50);
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Organization name is required');
      return;
    }

    if (!slug.trim()) {
      toast.error('Organization slug is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim(), plan }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Organization created successfully!');
        onSuccess(result.data);
      } else {
        toast.error(result.error || 'Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-accent px-6 py-4 flex items-center justify-between sticky top-0">
          <div className="flex items-center space-x-3">
            <Building className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Create Organization</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Acme Mining Corp"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
          </div>

          {/* Organization Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
              URL Slug *
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-slate-400">nextgenmaint.com/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="acme-mining"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent font-mono text-sm"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Unique identifier for your organization (lowercase, hyphens allowed)
            </p>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">
              Select Plan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlan('free')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  plan === 'free'
                    ? 'border-accent bg-accent/10'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-slate-100">Free</div>
                <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">Up to 3 users</div>
                <div className="text-xs text-gray-600 dark:text-slate-400">5 projects</div>
              </button>

              <button
                type="button"
                onClick={() => setPlan('starter')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  plan === 'starter'
                    ? 'border-accent bg-accent/10'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-slate-100">Starter</div>
                <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">Up to 10 users</div>
                <div className="text-xs text-gray-600 dark:text-slate-400">25 projects</div>
              </button>

              <button
                type="button"
                onClick={() => setPlan('professional')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  plan === 'professional'
                    ? 'border-accent bg-accent/10'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-slate-100">Professional</div>
                <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">Up to 50 users</div>
                <div className="text-xs text-gray-600 dark:text-slate-400">100 projects</div>
              </button>

              <button
                type="button"
                onClick={() => setPlan('enterprise')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  plan === 'enterprise'
                    ? 'border-accent bg-accent/10'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-slate-100">Enterprise</div>
                <div className="text-xs text-gray-600 dark:text-slate-400 mt-1">Unlimited users</div>
                <div className="text-xs text-gray-600 dark:text-slate-400">Unlimited projects</div>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-accent/10 border border-accent rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <div className="text-accent text-lg mt-0.5">ℹ️</div>
              <div className="flex-1 text-sm text-gray-700 dark:text-slate-300">
                <p className="font-medium text-gray-900 dark:text-slate-100 mb-1">You'll be the organization admin</p>
                <p>You can invite team members, create projects, and manage settings after creation.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !slug.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                loading || !name.trim() || !slug.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-accent text-white hover:bg-accent hover:shadow-lg hover:scale-105 active:scale-95'
              }`}
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
