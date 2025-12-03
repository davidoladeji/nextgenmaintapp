'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useAuth, useProject } from '@/lib/store';
import { Project } from '@/types';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function ProjectSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const { token, user } = useAuth();
  const { setCurrentProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'in-progress' | 'completed' | 'approved'>('in-progress');

  const projectId = params.id as string;

  useEffect(() => {
    if (!user || !token) {
      router.push('/');
      return;
    }

    loadProject();
  }, [user, token, projectId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setProject(result.data);
        setName(result.data.name);
        setDescription(result.data.description || '');
        setStatus(result.data.status);
      } else {
        toast.error('Failed to load project');
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Project updated successfully!');
        setProject(result.data);
        setCurrentProject(result.data);
      } else {
        toast.error(result.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${project?.name}"? This action cannot be undone.`)) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Project deleted successfully');
        setCurrentProject(null);
        router.push('/');
      } else {
        toast.error(result.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="spinner mb-4 mx-auto" />
            <p className="text-gray-600 dark:text-slate-400">Loading project settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Project Settings</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Manage project details and configuration
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input"
                placeholder="Brief description of this FMEA project..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                Project Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'in-progress' | 'completed' | 'approved')}
                className="input"
              >
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>

          {/* Asset Information (Read-only) */}
          {project.asset && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Asset Information</h2>
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-slate-400">Asset Name:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{project.asset.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400">Type:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{project.asset.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400">Criticality:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-slate-100 capitalize">{project.asset.criticality}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400">Context:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-slate-100">{project.asset.context}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  Deleting a project will permanently remove all associated data
                </p>
              </div>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Project</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pb-8">
            <button
              onClick={() => router.back()}
              disabled={saving}
              className="btn-secondary btn-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="btn-primary btn-lg flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
