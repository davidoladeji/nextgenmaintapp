'use client';

import { useEffect, useState } from 'react';
import { Tool, Project } from '@/types';
import { useAuth, useOrganization } from '@/lib/store';
import ToolCard from './ToolCard';
import ComingSoonModal from './ComingSoonModal';
import ProjectSelector from '../project/ProjectSelector';
import { Clock, AlertTriangle, Wrench, BarChart3, DollarSign } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  AlertTriangle,
  Wrench,
  BarChart3,
  DollarSign,
};

interface ToolDashboardProps {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
  onRefresh: () => void;
}

export default function ToolDashboard({
  projects,
  onProjectSelect,
  onRefresh,
}: ToolDashboardProps) {
  const { token } = useAuth();
  const { currentOrganization } = useOrganization();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState<Tool | null>(null);
  const [showFMEAProjects, setShowFMEAProjects] = useState(false);

  useEffect(() => {
    loadTools();
  }, [token]);

  const loadTools = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/tools', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setTools(result.data);
      } else {
        console.error('Failed to load tools:', result.error);
      }
    } catch (error) {
      console.error('Error loading tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToolLaunch = (tool: Tool) => {
    if (tool.coming_soon) {
      setShowComingSoon(tool);
    } else if (tool.route === '/tools/fmea') {
      // Show FMEA project selector
      setShowFMEAProjects(true);
    } else {
      // Future: Route to other tool pages
      console.log('Launching tool:', tool.name);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="spinner mb-4 mx-auto" />
          <p className="text-gray-600">Loading tools...</p>
        </div>
      </div>
    );
  }

  // If FMEA projects view is active, show project selector
  if (showFMEAProjects) {
    return (
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => setShowFMEAProjects(false)}
          className="mb-6 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
        >
          <span>←</span>
          <span>Back to Tools</span>
        </button>
        <ProjectSelector
          projects={projects}
          onProjectSelect={onProjectSelect}
          onRefresh={onRefresh}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to {currentOrganization?.name || 'Your Organization'}
        </h1>
        <p className="text-gray-600">
          Select a tool to get started with your reliability engineering workflow
        </p>
      </div>

      {/* Tools Grid */}
      <div className="mb-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Available Tools
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onLaunch={handleToolLaunch} />
          ))}
        </div>
      </div>

      {/* Recent Documents */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent documents
            </h2>
            <button
              onClick={() => setShowFMEAProjects(true)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.slice(0, 8).map((project) => {
              // Get tool info for the project
              const projectTool = tools.find(t => t.id === project.tool_id) || tools[0];
              const IconComponent = iconMap[projectTool?.icon] || AlertTriangle;

              return (
                <button
                  key={project.id}
                  onClick={() => onProjectSelect(project)}
                  className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-primary-400 hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-left"
                >
                  {/* Preview/Thumbnail area */}
                  <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-b border-gray-200">
                    <IconComponent className="w-12 h-12 text-gray-300" />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start space-x-2 mb-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-5 h-5 rounded bg-primary-100 flex items-center justify-center">
                          <IconComponent className="w-3 h-3 text-primary-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                          {project.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-2 truncate">
                      {projectTool?.name || 'FMEA'}
                    </p>

                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      <ComingSoonModal
        tool={showComingSoon}
        onClose={() => setShowComingSoon(null)}
      />
    </div>
  );
}
