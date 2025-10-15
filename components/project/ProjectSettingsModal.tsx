'use client';

import { useState } from 'react';
import { X, Settings, Save, Trash2 } from 'lucide-react';
import { useAuth, useProject } from '@/lib/store';
import { Project } from '@/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ProjectSettingsModalProps {
  project: Project;
  onClose: () => void;
  onUpdate?: (project: Project) => void;
}

export default function ProjectSettingsModal({ project, onClose, onUpdate }: ProjectSettingsModalProps) {
  const router = useRouter();
  const { token } = useAuth();
  const { setCurrentProject } = useProject();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Project updated successfully!');
        onUpdate?.(result.data);
        onClose();
      } else {
        toast.error(result.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Project deleted successfully');
        setCurrentProject(null);
        router.push('/');
        onClose();
      } else {
        toast.error(result.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-monday-purple to-monday-softPurple px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Project Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-purple"
              placeholder="Brief description of this FMEA project..."
            />
          </div>

          {/* Asset Info (Read-only) */}
          {project.asset && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Asset Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Asset Name:</span>
                  <span className="ml-2 font-medium text-gray-900">{project.asset.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium text-gray-900">{project.asset.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">Criticality:</span>
                  <span className="ml-2 font-medium text-gray-900 capitalize">{project.asset.criticality}</span>
                </div>
                <div>
                  <span className="text-gray-600">Context:</span>
                  <span className="ml-2 font-medium text-gray-900">{project.asset.context}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 mr-2 inline" />
              Delete Project
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !name.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  loading || !name.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-monday-purple to-monday-softPurple text-white hover:shadow-lg hover:scale-105'
                }`}
              >
                <Save className="w-4 h-4 mr-2 inline" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
