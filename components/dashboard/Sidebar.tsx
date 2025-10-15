'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  FolderOpen,
  Upload,
  FileText,
  Share2,
  Shield,
  Building
} from 'lucide-react';
import { useUI, useProject, useOrganization, useAuth } from '@/lib/store';
import { isSuperAdmin } from '@/lib/permissions-client';
import CreateFailureModeModal from '../fmea/CreateFailureModeModal';
import CreateProjectModal from '../project/CreateProjectModal';
import ShareProjectModal from '../project/ShareProjectModal';
import ProjectSettingsModal from '../project/ProjectSettingsModal';
import OrganizationSwitcher from '../organization/OrganizationSwitcher';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const { sidebarCollapsed, setAiChatMinimized } = useUI();
  const { currentProject, failureModes, projects, setCurrentProject } = useProject();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState({});
  const [showCreateFailureModeModal, setShowCreateFailureModeModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showShareProjectModal, setShowShareProjectModal] = useState(false);
  const [showProjectSettingsModal, setShowProjectSettingsModal] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCreateFailureMode = () => {
    if (!currentProject) {
      toast.error('Please select a project first');
      return;
    }
    setShowCreateFailureModeModal(true);
  };

  const handleAIAction = (prompt: string) => {
    setAiChatMinimized(false);
    // The AI panel will handle the prompt
  };

  const handleRefreshData = () => {
    // Reload failure modes
    window.location.reload();
  };

  const handleBackToProjects = () => {
    setCurrentProject(null);
  };

  if (sidebarCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 h-screen">
        <div className="p-3 space-y-2">
          {currentProject && (
            <button
              onClick={handleBackToProjects}
              className="w-full p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Back to Projects"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 mx-auto" />
            </button>
          )}
          <button
            onClick={handleCreateFailureMode}
            className="w-full p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Add Failure Mode"
          >
            <Plus className="w-5 h-5 text-gray-600 mx-auto" />
          </button>
          <button
            onClick={() => handleAIAction('Suggest failure modes for this asset')}
            className="w-full p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="AI Suggestions"
          >
            <Sparkles className="w-5 h-5 text-purple-600 mx-auto" />
          </button>
          <button
            className="w-full p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Search"
          >
            <Search className="w-5 h-5 text-gray-600 mx-auto" />
          </button>
          <button
            className="w-full p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Filter"
          >
            <Filter className="w-5 h-5 text-gray-600 mx-auto" />
          </button>
          <button
            className="w-full p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Export"
          >
            <Download className="w-5 h-5 text-gray-600 mx-auto" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto" data-tour="sidebar">
      {/* Organization Switcher - Always at top */}
      <OrganizationSwitcher />

      {/* Context-Aware Content */}
      {!currentProject ? (
        /* ORGANIZATION DASHBOARD VIEW - No Project Selected */
        <div className="p-4 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Organization Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              {currentOrganization?.name || 'Select or create an organization'}
            </p>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowCreateProjectModal(true)}
                className="btn-primary btn-md w-full justify-start"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </button>
              <button
                onClick={() => router.push('/import')}
                className="btn-secondary btn-sm w-full justify-start"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import from Excel
              </button>
              <button
                onClick={() => router.push('/templates')}
                className="btn-secondary btn-sm w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Browse Templates
              </button>
            </div>
          </div>

          {/* Recent Projects */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Projects</h3>
              <div className="space-y-2">
                {projects.slice(0, 5).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setCurrentProject(project)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    <div className="font-medium text-sm text-gray-900 truncate">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">{project.description}</div>
                    )}
                  </button>
                ))}
                {projects.length > 5 && (
                  <div className="text-xs text-gray-500 text-center pt-2">
                    +{projects.length - 5} more projects
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Organization Stats */}
          {currentOrganization && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Organization Overview</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Projects</span>
                  <span className="font-semibold text-gray-900">{projects.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-semibold text-gray-900">
                    {projects.filter(p => p.status === 'in-progress').length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Superadmin Section */}
          {user && isSuperAdmin(user) && (
            <div className="border-t border-gray-200 pt-6">
              <div className="mb-3 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-monday-purple" />
                <h3 className="text-sm font-medium text-monday-purple">Platform Admin</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full flex items-center justify-start space-x-2 px-3 py-2 bg-gradient-to-r from-monday-purple/10 to-monday-pink/10 border border-monday-purple/30 rounded-lg hover:shadow-md transition-all"
                >
                  <Shield className="w-4 h-4 text-monday-purple" />
                  <span className="text-sm font-medium text-monday-purple">Admin Dashboard</span>
                </button>
                <button
                  onClick={() => router.push('/admin/organizations')}
                  className="btn-secondary btn-sm w-full justify-start"
                >
                  <Building className="w-4 h-4 mr-2" />
                  All Organizations
                </button>
                <button
                  onClick={() => router.push('/admin/users')}
                  className="btn-secondary btn-sm w-full justify-start"
                >
                  <Users className="w-4 h-4 mr-2" />
                  All Users
                </button>
              </div>
            </div>
          )}

          {/* Organization Management (for admins) */}
          <div className={user && isSuperAdmin(user) ? 'border-t border-gray-200 pt-6' : ''}>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Organization</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/teams')}
                className="btn-secondary btn-sm w-full justify-start"
              >
                <Users className="w-4 h-4 mr-2" />
                Team Members
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="btn-secondary btn-sm w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* PROJECT WORKSPACE VIEW - Project Selected */
        <div className="p-4 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Project Workspace</h2>
            <p className="text-sm text-gray-500 mt-1 truncate">{currentProject.name}</p>
          </div>

          {/* Back to Projects Button */}
          <div className="border-b border-gray-200 pb-4">
            <button
              onClick={handleBackToProjects}
              className="btn-secondary btn-md w-full justify-start"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </button>
          </div>

        {/* Project Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Project</h3>
          <div className="space-y-2">
            <button
              onClick={() => setShowShareProjectModal(true)}
              className="btn-secondary btn-sm w-full justify-start"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Project
            </button>
            <button
              onClick={() => setShowProjectSettingsModal(true)}
              className="btn-secondary btn-sm w-full justify-start"
            >
              <Settings className="w-4 h-4 mr-2" />
              Project Settings
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Modals */}
      {showCreateFailureModeModal && currentProject && (
        <CreateFailureModeModal
          project={currentProject}
          onClose={() => setShowCreateFailureModeModal(false)}
          onSuccess={() => {
            setShowCreateFailureModeModal(false);
            handleRefreshData();
          }}
        />
      )}

      {showCreateProjectModal && (
        <CreateProjectModal
          onClose={() => setShowCreateProjectModal(false)}
          onSuccess={(project) => {
            setShowCreateProjectModal(false);
            setCurrentProject(project);
          }}
        />
      )}

      {showShareProjectModal && currentProject && (
        <ShareProjectModal
          project={currentProject}
          onClose={() => setShowShareProjectModal(false)}
        />
      )}

      {showProjectSettingsModal && currentProject && (
        <ProjectSettingsModal
          project={currentProject}
          onClose={() => setShowProjectSettingsModal(false)}
          onUpdate={(updatedProject) => {
            setCurrentProject(updatedProject);
          }}
        />
      )}
    </div>
  );
}