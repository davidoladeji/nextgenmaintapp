'use client';

import { useEffect, useState } from 'react';
import { useAuth, useProject, useUI, useOrganization } from '@/lib/store';
import Sidebar from './Sidebar';
import ToolDashboard from '../tools/ToolDashboard';
import FMEABuilder from '../fmea/FMEABuilder';
import AIPanel from '../ai/AIPanel';
import Header from './Header';
import OnboardingGuide from '../onboarding/OnboardingGuide';
import { Project } from '@/types';

export default function Dashboard() {
  const { user, token } = useAuth();
  const { currentProject, projects, setProjects, setCurrentProject } = useProject();
  const { currentOrganization } = useOrganization();
  const { sidebarCollapsed } = useUI();
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4 mx-auto" />
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 flex-shrink-0`}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1">
          {/* Content Area - No longer constrained by AI panel */}
          <div className="w-full" data-tour="main-content">
            {!currentProject ? (
              <div className="p-8">
                <ToolDashboard
                  projects={projects}
                  onProjectSelect={handleProjectSelect}
                  onRefresh={loadProjects}
                />
              </div>
            ) : (
              <FMEABuilder project={currentProject} />
            )}
          </div>
        </main>
        
        {/* Floating AI Chat Widget */}
        <AIPanel />
        
        {/* Onboarding Guide */}
        <OnboardingGuide />
      </div>
    </div>
  );
}