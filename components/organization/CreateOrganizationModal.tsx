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
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-monday-purple to-monday-softPurple px-6 py-4 flex items-center justify-between sticky top-0">
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
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Acme Mining Corp"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple focus:border-transparent"
              required
            />
          </div>

          {/* Organization Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              URL Slug *
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">nextgenmaint.com/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="acme-mining"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple focus:border-transparent font-mono text-sm"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Unique identifier for your organization (lowercase, hyphens allowed)
            </p>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Select Plan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlan('free')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  plan === 'free'
                    ? 'border-monday-purple bg-monday-lightPurple'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">Free</div>
                <div className="text-xs text-gray-600 mt-1">Up to 3 users</div>
                <div className="text-xs text-gray-600">5 projects</div>
              </button>

              <button
                type="button"
                onClick={() => setPlan('starter')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  plan === 'starter'
                    ? 'border-monday-purple bg-monday-lightPurple'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">Starter</div>
                <div className="text-xs text-gray-600 mt-1">Up to 10 users</div>
                <div className="text-xs text-gray-600">25 projects</div>
              </button>

              <button
                type="button"
                onClick={() => setPlan('professional')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  plan === 'professional'
                    ? 'border-monday-purple bg-monday-lightPurple'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">Professional</div>
                <div className="text-xs text-gray-600 mt-1">Up to 50 users</div>
                <div className="text-xs text-gray-600">100 projects</div>
              </button>

              <button
                type="button"
                onClick={() => setPlan('enterprise')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  plan === 'enterprise'
                    ? 'border-monday-purple bg-monday-lightPurple'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">Enterprise</div>
                <div className="text-xs text-gray-600 mt-1">Unlimited users</div>
                <div className="text-xs text-gray-600">Unlimited projects</div>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-monday-paleBlue to-monday-lightPurple border border-monday-purple/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <div className="text-monday-purple text-lg mt-0.5">ℹ️</div>
              <div className="flex-1 text-sm text-gray-700">
                <p className="font-medium text-monday-darkNavy mb-1">You'll be the organization admin</p>
                <p>You can invite team members, create projects, and manage settings after creation.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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
                  : 'bg-gradient-to-r from-monday-purple to-monday-softPurple text-white hover:shadow-lg hover:scale-105 active:scale-95'
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
