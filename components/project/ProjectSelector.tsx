'use client';

import { useState } from 'react';
import { Plus, Folder, Calendar, User, AlertCircle, RefreshCw, Trash2, Download } from 'lucide-react';
import { Project, CreateProjectForm } from '@/types';
import CreateProjectModal from './CreateProjectModal';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/store';

interface ProjectSelectorProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
  onRefresh: () => void;
}

export default function ProjectSelector({
  projects,
  onProjectSelect,
  onRefresh,
}: ProjectSelectorProps) {
  const { token } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteProject = async (projectId: string, projectName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    const confirmed = confirm(
      `⚠️ WARNING: Delete "${projectName}"?\n\n` +
      `This will permanently delete:\n` +
      `• The project\n` +
      `• All failure modes\n` +
      `• All causes, effects, controls, and actions\n` +
      `• All associated components and data\n\n` +
      `This action CANNOT be undone.`
    );

    if (!confirmed) return;

    setDeletingProjectId(projectId);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Project deleted successfully');
        onRefresh(); // Refresh the project list
      } else {
        toast.error(result.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setDeletingProjectId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
          <p className="text-gray-600 mt-2">
            Select a project to start working on FMEA analysis
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary btn-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No projects yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first FMEA project to get started with AI-assisted 
            failure mode analysis
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary btn-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="card hover:shadow-md transition-shadow cursor-pointer relative"
              onClick={() => onProjectSelect(project)}
            >
              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                disabled={deletingProjectId === project.id}
                className="absolute top-3 right-3 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                title="Delete project"
              >
                {deletingProjectId === project.id ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-10">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Asset Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Asset Information
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Name:</span> {project.asset.name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {project.asset.type}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Criticality:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.asset.criticality === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : project.asset.criticality === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : project.asset.criticality === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {project.asset.criticality}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {project.failureModes?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Failure Modes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {project.failureModes?.reduce(
                      (acc, fm) => acc + (fm.actions?.length || 0),
                      0
                    ) || 0}
                  </div>
                  <div className="text-xs text-gray-500">Actions</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate((project as any).updated_at)}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  project.status === 'in-progress'
                    ? 'bg-blue-100 text-blue-800'
                    : project.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {project.status === 'in-progress' ? 'In Progress' :
                   project.status === 'completed' ? 'Completed' : 'Approved'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(project) => {
            setShowCreateModal(false);
            onRefresh();
            onProjectSelect(project);
          }}
        />
      )}
    </div>
  );
}