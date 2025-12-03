'use client';

import { useEffect, useState } from 'react';
import { Project, FailureMode, Component } from '@/types';
import { useAuth, useProject } from '@/lib/store';
import FMEAAccordion from './FMEAAccordion';
import { SmartTableIntegrated } from './v2/SmartTableIntegrated';
import FailureModeCard from './FailureModeCard';
import DashboardOverview from '../dashboard/DashboardOverview';
import { LayoutGrid, BarChart3, List, Trash2, Settings, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import SetupTab from './SetupTab';
import SummaryTab from './SummaryTab';

interface FMEABuilderProps {
  project: Project;
}

export default function FMEABuilder({ project }: FMEABuilderProps) {
  const { token } = useAuth();
  const {
    failureModes,
    setFailureModes,
    setLoading,
    isLoading,
    addFailureMode,
    updateFailureMode,
    removeFailureMode
  } = useProject();
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedFailureMode, setSelectedFailureMode] = useState<FailureMode | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'analysis' | 'cards' | 'setup' | 'summary'>('analysis');

  useEffect(() => {
    loadFailureModes();
    loadComponents();
  }, [project.id]);

  const loadComponents = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/components`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setComponents(result.data || []);
      } else {
        console.error('Failed to load components:', result.error);
      }
    } catch (error) {
      console.error('Failed to load components:', error);
    }
  };

  const loadFailureModes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/failure-modes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setFailureModes(result.data);
      } else {
        toast.error('Failed to load failure modes');
      }
    } catch (error) {
      console.error('Failed to load failure modes:', error);
      toast.error('Failed to load failure modes');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (failureMode: FailureMode) => {
    setSelectedFailureMode(failureMode);
  };

  const handleCloseCard = () => {
    setSelectedFailureMode(null);
  };

  const handleFailureModeUpdate = (updatedFailureMode: FailureMode) => {
    updateFailureMode(updatedFailureMode.id, updatedFailureMode);
    setSelectedFailureMode(updatedFailureMode);
  };

  const handleDeleteFailureMode = async (failureModeId: string) => {
    if (!confirm('Are you sure you want to delete this failure mode? This will also delete all related causes, effects, controls, and actions. This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/failure-modes/${failureModeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Failure mode deleted successfully');
        // Remove from local state
        removeFailureMode(failureModeId);
        // Close detail card if this failure mode was selected
        if (selectedFailureMode?.id === failureModeId) {
          setSelectedFailureMode(null);
        }
        // Refresh data
        loadFailureModes();
      } else {
        toast.error(result.error || 'Failed to delete failure mode');
      }
    } catch (error) {
      console.error('Error deleting failure mode:', error);
      toast.error('Failed to delete failure mode');
    }
  };


  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4 mx-auto" />
          <p className="text-gray-600">Loading FMEA data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Project Info */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
              {project.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Asset: {project.asset?.name} ({project.asset?.type}) - {project.asset?.criticality} criticality
            </p>
          </div>

          {/* Center: View Toggle Tabs */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === 'dashboard'
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100'
              }`}
              title="Dashboard View"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setViewMode('analysis')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === 'analysis'
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100'
              }`}
              title="Smart Table View"
            >
              <List className="w-4 h-4" />
              <span>Smart Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === 'summary'
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100'
              }`}
              title="Executive Summary"
            >
              <FileText className="w-4 h-4" />
              <span>Summary</span>
            </button>
            <button
              onClick={() => setViewMode('setup')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                viewMode === 'setup'
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100'
              }`}
              title="FMEA Setup & Configuration"
            >
              <Settings className="w-4 h-4" />
              <span>Setup</span>
            </button>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-slate-400">Failure Modes</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                {failureModes.length}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-slate-400">High Risk (RPN &gt; 200)</div>
              <div className="text-2xl font-bold text-danger-600 dark:text-red-400">
                {failureModes.filter(fm => (fm as any).maxRPN > 200).length}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-slate-400">Open Actions</div>
              <div className="text-2xl font-bold text-warning-600 dark:text-amber-500">
                {failureModes.reduce((acc, fm) =>
                  acc + (fm.actions?.filter((a: any) => a.status === 'open').length || 0), 0
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex relative">
        {viewMode === 'dashboard' ? (
          <div className="flex-1">
            <DashboardOverview
              project={project}
            />
          </div>
        ) : viewMode === 'analysis' ? (
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
            <SmartTableIntegrated
              project={project}
              components={components}
            />
          </div>
        ) : viewMode === 'setup' ? (
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto">
              <SetupTab projectId={project.id} />
            </div>
          </div>
        ) : viewMode === 'summary' ? (
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto">
              <SummaryTab project={project} />
            </div>
          </div>
        ) : (
          /* Card Grid View */
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-slate-900">
            {failureModes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-slate-500 mb-4">
                  <LayoutGrid className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">No failure modes yet</h3>
                <p className="text-gray-600 dark:text-slate-400 mb-4">Get started by creating your first failure mode analysis.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {failureModes.map((failureMode) => (
                  <div key={failureMode.id} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-900 dark:text-slate-100 line-clamp-2">
                          {failureMode.failure_mode}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-full ml-2">
                          {failureMode.process_step}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-slate-400">Causes:</span>
                          <span className="font-medium text-gray-900 dark:text-slate-100">{failureMode.causes?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-slate-400">Effects:</span>
                          <span className="font-medium text-gray-900 dark:text-slate-100">{failureMode.effects?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-slate-400">Controls:</span>
                          <span className="font-medium text-gray-900 dark:text-slate-100">{failureMode.controls?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-slate-400">Actions:</span>
                          <span className="font-medium text-gray-900 dark:text-slate-100">{failureMode.actions?.length || 0}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700 flex gap-2">
                        <button
                          onClick={() => handleRowClick(failureMode)}
                          className="flex-1 text-center text-primary-600 dark:text-amber-500 hover:text-primary-700 dark:hover:text-amber-400 text-sm font-medium hover:bg-primary-50 dark:hover:bg-slate-700 py-2 rounded-md transition-colors"
                        >
                          View Details →
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFailureMode(failureMode.id);
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete failure mode"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detailed Card View for Card Mode */}
        {viewMode === 'cards' && selectedFailureMode && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end animate-in fade-in duration-300"
            onClick={handleCloseCard}
          >
            <div 
              className="w-1/2 min-w-[600px] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <FailureModeCard
                failureMode={selectedFailureMode}
                project={project}
                onClose={handleCloseCard}
                onUpdate={handleFailureModeUpdate}
                onDelete={handleDeleteFailureMode}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}