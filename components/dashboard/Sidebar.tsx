'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
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
  Share2,
  Shield,
  Building,
  LayoutDashboard
} from 'lucide-react';
import { useUI, useProject, useOrganization, useAuth } from '@/lib/store';
import { isSuperAdmin } from '@/lib/permissions-client';
import OrganizationSwitcher from '../organization/OrganizationSwitcher';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const { sidebarCollapsed, setAiChatMinimized, setCurrentView, currentView } = useUI();
  const { currentProject, failureModes, projects, setCurrentProject } = useProject();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState({});

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
    router.push(`/projects/${currentProject.id}/failure-modes/new`);
  };

  const handleAIAction = (prompt: string) => {
    setAiChatMinimized(false);
    // The AI panel will handle the prompt
  };

  const handleBackToProjects = () => {
    setCurrentProject(null);
    setCurrentView('projects');
  };

  const handleDashboardClick = () => {
    setCurrentProject(null);
    setCurrentView('tools');
    router.push('/'); // Ensure consistent navigation
  };

  if (sidebarCollapsed) {
    return (
      <div className="w-16 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 h-full">
        <div className="p-3 space-y-2">
          {currentProject && (
            <button
              onClick={handleBackToProjects}
              className="w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Back to Projects"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400 mx-auto" />
            </button>
          )}
          <button
            onClick={handleCreateFailureMode}
            className="w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            title="Add Failure Mode"
          >
            <Plus className="w-5 h-5 text-gray-600 dark:text-slate-400 mx-auto" />
          </button>
          <button
            onClick={() => handleAIAction('Suggest failure modes for this asset')}
            className="w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            title="AI Suggestions"
          >
            <Sparkles className="w-5 h-5 text-accent mx-auto" />
          </button>
          <button
            className="w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            title="Search"
          >
            <Search className="w-5 h-5 text-gray-600 dark:text-slate-400 mx-auto" />
          </button>
          <button
            className="w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            title="Filter"
          >
            <Filter className="w-5 h-5 text-gray-600 dark:text-slate-400 mx-auto" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 h-full" data-tour="sidebar">
      {/* Organization Switcher - Always at top */}
      <OrganizationSwitcher />

      {/* Dashboard Button - Persistent across all views */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-200 dark:border-slate-700">
        <button
          onClick={handleDashboardClick}
          className={`w-full flex items-center justify-start space-x-3 px-4 py-3 rounded-lg transition-all ${
            !currentProject && currentView === 'tools'
              ? 'bg-accent text-white shadow-md'
              : 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </button>
      </div>

      {/* Context-Aware Content */}
      {!currentProject ? (
        /* ORGANIZATION DASHBOARD VIEW - No Project Selected */
        <div className="p-4 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Organization Dashboard</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {currentOrganization?.name || 'Select or create an organization'}
            </p>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/projects/new')}
                className="btn-primary btn-md w-full justify-start"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </button>
            </div>
          </div>

          {/* Recent Projects */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">Recent Projects</h3>
              <div className="space-y-2">
                {projects.slice(0, 5).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setCurrentProject(project)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600"
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-slate-100 truncate">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{project.description}</div>
                    )}
                  </button>
                ))}
                {projects.length > 5 && (
                  <div className="text-xs text-gray-500 dark:text-slate-400 text-center pt-2">
                    +{projects.length - 5} more projects
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Organization Stats */}
          {currentOrganization && (
            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">Organization Overview</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-slate-400">Total Projects</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">{projects.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-slate-400">In Progress</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">
                    {projects.filter(p => p.status === 'in-progress').length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Superadmin Section */}
          {user && isSuperAdmin(user) && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
              <div className="mb-3 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-medium text-accent">Platform Admin</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full flex items-center justify-start space-x-2 px-3 py-2 bg-accent/10 border border-accent rounded-lg hover:shadow-md transition-all"
                >
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-accent">Admin Dashboard</span>
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
          <div className={user && isSuperAdmin(user) ? 'border-t border-gray-200 dark:border-slate-700 pt-6' : ''}>
            <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">Organization</h3>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Project Workspace</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 truncate">{currentProject.name}</p>
          </div>

          {/* Back to Projects Button */}
          <div className="border-b border-gray-200 dark:border-slate-700 pb-4">
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
          <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">Project</h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push(`/projects/${currentProject.id}/share`)}
              className="btn-secondary btn-sm w-full justify-start"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Project
            </button>
            <button
              onClick={() => router.push(`/projects/${currentProject.id}/settings`)}
              className="btn-secondary btn-sm w-full justify-start"
            >
              <Settings className="w-4 h-4 mr-2" />
              Project Settings
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}