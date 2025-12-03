'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, useOrganization, useProject } from '@/lib/store';
import { CreateProjectForm, Project } from '@/types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const ASSET_TYPES = [
  'Pump',
  'Motor',
  'Compressor',
  'Heat Exchanger',
  'Valve',
  'Turbine',
  'Generator',
  'Transformer',
  'Conveyor',
  'Reactor',
  'Other'
];

const CRITICALITY_OPTIONS = [
  { value: 'low', label: 'Low', description: 'Minimal impact on operations' },
  { value: 'medium', label: 'Medium', description: 'Moderate impact on operations' },
  { value: 'high', label: 'High', description: 'Significant impact on operations' },
  { value: 'critical', label: 'Critical', description: 'Severe impact on safety/operations' },
];

const COMMON_STANDARDS = [
  'ISO 14224',
  'API 580',
  'API 581',
  'IEC 60812',
  'MIL-STD-1629A',
  'SAE J1739',
  'AIAG FMEA',
];

export default function NewProjectPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { setCurrentProject } = useProject();
  const [isLoading, setIsLoading] = useState(false);
  const [customStandards, setCustomStandards] = useState<string[]>([]);
  const [newStandard, setNewStandard] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateProjectForm>({
    defaultValues: {
      criticality: 'medium',
      standards: [],
    },
  });

  const watchedStandards = watch('standards') || [];

  useEffect(() => {
    if (!user || !token) {
      router.push('/');
      return;
    }

    if (!currentOrganization) {
      toast.error('Please select an organization first');
      router.push('/');
      return;
    }
  }, [user, token, currentOrganization, router]);

  const addCustomStandard = () => {
    if (newStandard.trim() && !customStandards.includes(newStandard.trim())) {
      setCustomStandards([...customStandards, newStandard.trim()]);
      setNewStandard('');
    }
  };

  const removeCustomStandard = (standard: string) => {
    setCustomStandards(customStandards.filter(s => s !== standard));
  };

  const onSubmit = async (data: CreateProjectForm) => {
    if (!currentOrganization) {
      toast.error('Please select an organization first');
      return;
    }

    setIsLoading(true);

    try {
      // Combine selected and custom standards
      const allStandards = [...watchedStandards, ...customStandards];

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          standards: allStandards,
          organizationId: currentOrganization.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
      }

      toast.success('Project created successfully!');
      setCurrentProject(result.data);
      router.push('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !token || !currentOrganization) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Create New Project</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Set up a new FMEA project for your organization
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Project Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Project Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                className="input"
                placeholder="Enter project name"
                {...register('name', { required: 'Project name is required' })}
              />
              {errors.name && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                className="input min-h-[100px]"
                placeholder="Describe the purpose and scope of this FMEA project"
                {...register('description')}
              />
            </div>
          </div>

          {/* Asset Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Asset Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Asset Name *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter asset name"
                  {...register('assetName', { required: 'Asset name is required' })}
                />
                {errors.assetName && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.assetName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Asset ID
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter asset ID (optional)"
                  {...register('assetId')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Asset Type *
                </label>
                <select
                  className="input"
                  {...register('assetType', { required: 'Asset type is required' })}
                >
                  <option value="">Select asset type</option>
                  {ASSET_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.assetType && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.assetType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Criticality *
                </label>
                <select
                  className="input"
                  {...register('criticality', { required: 'Criticality is required' })}
                >
                  {CRITICALITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
                {errors.criticality && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.criticality.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Context *
              </label>
              <textarea
                className="input min-h-[100px]"
                placeholder="Describe the operational context, environment, and operating conditions"
                {...register('context', { required: 'Context is required' })}
              />
              {errors.context && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.context.message}</p>
              )}
            </div>
          </div>

          {/* Standards */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Standards & Templates</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                Select applicable standards
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {COMMON_STANDARDS.map((standard) => (
                  <label key={standard} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      value={standard}
                      className="rounded border-gray-300 dark:border-slate-600 text-accent focus:ring-accent"
                      {...register('standards')}
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-300">{standard}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Add custom standard
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newStandard}
                  onChange={(e) => setNewStandard(e.target.value)}
                  className="input flex-1"
                  placeholder="Enter custom standard"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomStandard())}
                />
                <button
                  type="button"
                  onClick={addCustomStandard}
                  className="btn-secondary btn-md"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {customStandards.length > 0 && (
                <div className="mt-3 space-y-2">
                  {customStandards.map((standard) => (
                    <div
                      key={standard}
                      className="flex items-center justify-between bg-gray-50 dark:bg-slate-900 px-3 py-2 rounded-md border border-gray-200 dark:border-slate-700"
                    >
                      <span className="text-sm text-gray-700 dark:text-slate-300">{standard}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomStandard(standard)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Additional Information (Optional)</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Asset History
              </label>
              <textarea
                className="input min-h-[100px]"
                placeholder="Previous failures, maintenance history, known issues..."
                {...register('history')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Configuration Details
              </label>
              <textarea
                className="input min-h-[100px]"
                placeholder="Technical specifications, design parameters, operating limits..."
                {...register('configuration')}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary btn-lg"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary btn-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner mr-2" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
