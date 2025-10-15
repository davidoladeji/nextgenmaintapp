'use client';

import { useEffect, useState } from 'react';
import { Project, FailureMode, Component } from '@/types';
import { useAuth, useProject } from '@/lib/store';
import SmartTable from './SmartTable';
import FailureModeCard from './FailureModeCard';
import DashboardOverview from '../dashboard/DashboardOverview';
import ExportModal from '../export/ExportModal';
import { LayoutGrid, RefreshCw, BarChart3, Download, List, Trash2, Settings, FileText } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'dashboard' | 'smart-table' | 'cards' | 'setup' | 'summary'>('smart-table');
  const [showExportModal, setShowExportModal] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [dashboardChartData, setDashboardChartData] = useState<any>(null);

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

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/metrics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setDashboardMetrics(result.data.metrics);
        setDashboardChartData(result.data.chartData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useEffect(() => {
    if (viewMode === 'dashboard' || showExportModal) {
      loadDashboardData();
    }
  }, [viewMode, showExportModal, project.id]);

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
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {project.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Asset: {project.asset?.name} ({project.asset?.type}) - {project.asset?.criticality} criticality
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                  viewMode === 'dashboard'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Dashboard View"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setViewMode('smart-table')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                  viewMode === 'smart-table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Smart Table View (Component-based)"
              >
                <List className="w-4 h-4" />
                <span>Smart Table</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
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
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
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
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="FMEA Setup & Configuration"
              >
                <Settings className="w-4 h-4" />
                <span>Setup</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={loadDashboardData}
                className="flex items-center space-x-1 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center space-x-1 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Export FMEA"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">Failure Modes</div>
              <div className="text-2xl font-bold text-gray-900">
                {failureModes.length}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">High Risk (RPN &gt; 200)</div>
              <div className="text-2xl font-bold text-danger-600">
                {failureModes.filter(fm => (fm as any).maxRPN > 200).length}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Open Actions</div>
              <div className="text-2xl font-bold text-warning-600">
                {failureModes.reduce((acc, fm) => 
                  acc + fm.actions.filter(a => a.status === 'open').length, 0
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
              onExport={() => setShowExportModal(true)}
            />
          </div>
        ) : viewMode === 'smart-table' ? (
          <div className="flex-1">
            <SmartTable
              components={components}
              project={project}
              onRefresh={() => {
                loadComponents();
                loadFailureModes();
              }}
              onFailureModeClick={handleRowClick}
            />
          </div>
        ) : viewMode === 'setup' ? (
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <SetupTab projectId={project.id} />
            </div>
          </div>
        ) : viewMode === 'summary' ? (
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <SummaryTab project={project} />
            </div>
          </div>
        ) : (
          /* Card Grid View */
          <div className="flex-1 p-6 overflow-y-auto">
            {failureModes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <LayoutGrid className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No failure modes yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first failure mode analysis.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {failureModes.map((failureMode) => (
                  <div key={failureMode.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-900 line-clamp-2">
                          {failureMode.failure_mode}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full ml-2">
                          {failureMode.process_step}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Causes:</span>
                          <span className="font-medium text-gray-900">{failureMode.causes?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Effects:</span>
                          <span className="font-medium text-gray-900">{failureMode.effects?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Controls:</span>
                          <span className="font-medium text-gray-900">{failureMode.controls?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Actions:</span>
                          <span className="font-medium text-gray-900">{failureMode.actions?.length || 0}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                        <button
                          onClick={() => handleRowClick(failureMode)}
                          className="flex-1 text-center text-primary-600 hover:text-primary-700 text-sm font-medium hover:bg-primary-50 py-2 rounded-md transition-colors"
                        >
                          View Details →
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFailureMode(failureMode.id);
                          }}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
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

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        project={project}
        failureModes={failureModes}
        metrics={dashboardMetrics}
        chartData={dashboardChartData}
      />
    </div>
  );
}