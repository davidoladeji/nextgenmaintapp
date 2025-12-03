'use client';

import { useState } from 'react';
import { Plus, Folder, Calendar, User, AlertCircle, RefreshCw, Trash2, Download, Pencil } from 'lucide-react';
import { Project, CreateProjectForm } from '@/types';
import CreateProjectModal from './CreateProjectModal';
import ProjectSettingsModal from './ProjectSettingsModal';
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
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Your Projects</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
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
          <Folder className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-slate-100 mb-2">
            No projects yet
          </h3>
          <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
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
              {/* Action Buttons */}
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProject(project);
                  }}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                  title="Edit project"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                  disabled={deletingProjectId === project.id}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors disabled:opacity-50"
                  title="Delete project"
                >
                  {deletingProjectId === project.id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2 pr-10">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-gray-600 dark:text-slate-400 text-sm line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Asset Info */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                  Asset Information
                </h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-slate-400">
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
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                          : project.asset.criticality === 'high'
                          ? 'bg-accent/10 text-accent'
                          : project.asset.criticality === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
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
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {project.failureModes?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">Failure Modes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {project.failureModes?.reduce(
                      (acc, fm) => acc + (fm.actions?.length || 0),
                      0
                    ) || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">Actions</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-slate-400 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate((project as any).updated_at)}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  project.status === 'in-progress'
                    ? 'bg-accent/10 text-accent'
                    : project.status === 'completed'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-accent/10 text-accent'
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

      {/* Edit Project Settings Modal */}
      {editingProject && (
        <ProjectSettingsModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onUpdate={(updatedProject) => {
            setEditingProject(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}