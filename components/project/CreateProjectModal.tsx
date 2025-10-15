'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, useOrganization } from '@/lib/store';
import { CreateProjectForm, Project } from '@/types';

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

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

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const { token } = useAuth();
  const { currentOrganization } = useOrganization();
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
          organizationId: currentOrganization.id, // Include organization ID
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
      }

      toast.success('Project created successfully!');
      onSuccess(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Project Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Project Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                className="input"
                placeholder="Enter project name"
                {...register('name', { required: 'Project name is required' })}
              />
              {errors.name && (
                <p className="text-danger-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Describe the purpose and scope of this FMEA project"
                {...register('description')}
              />
            </div>
          </div>

          {/* Asset Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Asset Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter asset name"
                  {...register('assetName', { required: 'Asset name is required' })}
                />
                {errors.assetName && (
                  <p className="text-danger-600 text-sm mt-1">{errors.assetName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <p className="text-danger-600 text-sm mt-1">{errors.assetType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Criticality *
                </label>
                <select
                  className="input"
                  {...register('criticality', { required: 'Criticality is required' })}
                >
                  {CRITICALITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.criticality && (
                  <p className="text-danger-600 text-sm mt-1">{errors.criticality.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Context *
              </label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Describe the operational context, environment, and operating conditions"
                {...register('context', { required: 'Context is required' })}
              />
              {errors.context && (
                <p className="text-danger-600 text-sm mt-1">{errors.context.message}</p>
              )}
            </div>
          </div>

          {/* Standards */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Standards & Templates</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select applicable standards
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_STANDARDS.map((standard) => (
                  <label key={standard} className="flex items-center">
                    <input
                      type="checkbox"
                      value={standard}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      {...register('standards')}
                    />
                    <span className="ml-2 text-sm text-gray-700">{standard}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <div className="mt-2 space-y-1">
                  {customStandards.map((standard) => (
                    <div
                      key={standard}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                    >
                      <span className="text-sm text-gray-700">{standard}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomStandard(standard)}
                        className="text-danger-600 hover:text-danger-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Optional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset History
              </label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Previous failures, maintenance history, known issues..."
                {...register('history')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Configuration Details
              </label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Technical specifications, design parameters, operating limits..."
                {...register('configuration')}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary btn-md"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary btn-md"
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
    </div>
  );
}