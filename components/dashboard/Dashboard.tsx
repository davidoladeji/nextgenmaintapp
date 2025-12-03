'use client';

import { useEffect, useState } from 'react';
import { useAuth, useProject, useOrganization, useUI } from '@/lib/store';
import ToolDashboard from '../tools/ToolDashboard';
import ProjectSelector from '../project/ProjectSelector';
import FMEABuilder from '../fmea/FMEABuilder';
import { Project } from '@/types';

export default function Dashboard() {
  const { token } = useAuth();
  const { currentProject, projects, setProjects, setCurrentProject } = useProject();
  const { currentOrganization } = useOrganization();
  const { currentView, setCurrentView } = useUI();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      if (currentOrganization) {
        loadProjects();
      } else {
        // No organization selected yet, stop loading
        setLoading(false);
      }
    }
  }, [token, currentOrganization]);

  const loadProjects = async () => {
    if (!currentOrganization) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/projects?organizationId=${currentOrganization.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setProjects(result.data);
      } else {
        console.error('Failed to load projects:', result.error);
        setProjects([]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setCurrentProject(project);
    setCurrentView('workspace');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="spinner mb-4 mx-auto" />
          <p className="text-gray-600 dark:text-slate-400">Loading your projects...</p>
        </div>
      </div>
    );
  }

  // Determine what to show based on currentView and currentProject
  const renderContent = () => {
    // If a project is selected, always show workspace
    if (currentProject) {
      return <FMEABuilder project={currentProject} />;
    }

    // No project selected - show based on currentView
    switch (currentView) {
      case 'projects':
        return (
          <div className="max-w-7xl mx-auto p-8">
            <button
              onClick={() => setCurrentView('tools')}
              className="mb-6 text-sm text-accent hover:text-accent/80 dark:hover:text-accent/80 font-medium flex items-center space-x-1"
            >
              <span>←</span>
              <span>Back to Tools</span>
            </button>
            <ProjectSelector
              projects={projects}
              onProjectSelect={handleProjectSelect}
              onRefresh={loadProjects}
            />
          </div>
        );

      case 'tools':
      default:
        return (
          <div className="p-8">
            <ToolDashboard
              projects={projects}
              onProjectSelect={handleProjectSelect}
              onRefresh={loadProjects}
            />
          </div>
        );
    }
  };

  return (
    <div className="w-full" data-tour="main-content">
      {renderContent()}
    </div>
  );
}