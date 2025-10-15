'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/store';
import { Project, DashboardMetrics, ChartData, Component, FailureMode } from '@/types';
import MetricsCards from './MetricsCards';
import MetricsToolbar from './MetricsToolbar';
import HeatMapChart from './HeatMapChart';
import RisksBubbleChart from './RisksBubbleChart';
import ParetoChart from './ParetoChart';
import TopMitigationsChart from './TopMitigationsChart';
import EffectsWithoutControlTable from './EffectsWithoutControlTable';
import RiskDistributionChart from './RiskDistributionChart';
import TopRisksChart from './TopRisksChart';
import ActionStatusChart from './ActionStatusChart';
import RPNHeatmapChart from './RPNHeatmapChart';
import { BarChart3, RefreshCw, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardOverviewProps {
  project: Project;
  onExport?: () => void;
}

export default function DashboardOverview({ project, onExport }: DashboardOverviewProps) {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState<Component[]>([]);
  const [failureModes, setFailureModes] = useState<FailureMode[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [selectedFailureModes, setSelectedFailureModes] = useState<string[]>([]);
  const [clickedElement, setClickedElement] = useState<{ type: string; id: string } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [project.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load metrics, components, and failure modes in parallel
      const [metricsRes, componentsRes, failureModesRes] = await Promise.all([
        fetch(`/api/projects/${project.id}/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/projects/${project.id}/components`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/projects/${project.id}/failure-modes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [metricsData, componentsData, failureModesData] = await Promise.all([
        metricsRes.json(),
        componentsRes.json(),
        failureModesRes.json(),
      ]);

      if (metricsData.success) {
        setMetrics(metricsData.data.metrics);
        setChartData(metricsData.data.chartData);
      } else {
        toast.error('Failed to load dashboard metrics');
      }

      if (componentsData.success) {
        setComponents(componentsData.data || []);
      }

      if (failureModesData.success) {
        setFailureModes(failureModesData.data || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3" />
              Dashboard Overview
            </h1>
            <p className="text-gray-600 mt-1">
              Analytics and insights for {project.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="spinner mb-4 mx-auto" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics || !chartData) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3" />
              Dashboard Overview
            </h1>
            <p className="text-gray-600 mt-1">
              Analytics and insights for {project.name}
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="btn-secondary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </button>
        </div>
        
        <div className="flex items-center justify-center h-64 text-gray-500">
          Failed to load dashboard data
        </div>
      </div>
    );
  }

  // Filter data based on selections
  const getFilteredComponents = () => {
    let filtered = components;

    if (selectedComponents.length > 0) {
      filtered = filtered.filter(c => selectedComponents.includes(c.id));
    }

    return filtered;
  };

  const getFilteredFailureModes = () => {
    let filtered = failureModes;

    // Filter by selected components
    if (selectedComponents.length > 0) {
      filtered = filtered.filter(fm => selectedComponents.includes(fm.component_id));
    }

    // Filter by selected failure modes
    if (selectedFailureModes.length > 0) {
      filtered = filtered.filter(fm => selectedFailureModes.includes(fm.id));
    }

    // Filter by risk level
    if (selectedRiskLevel !== 'all') {
      const rpnThresholds: { [key: string]: [number, number] } = {
        'high': [200, Infinity],
        'medium': [100, 200],
        'low': [0, 100],
      };
      const [min, max] = rpnThresholds[selectedRiskLevel] || [0, Infinity];
      filtered = filtered.filter(fm => {
        const rpn = (fm as any).maxRPN || 0;
        return rpn >= min && rpn < max;
      });
    }

    return filtered;
  };

  // Cross-filtering handlers
  const handleHeatMapClick = (componentId: string, failureModeId?: string) => {
    if (failureModeId) {
      setSelectedFailureModes([failureModeId]);
      setClickedElement({ type: 'failureMode', id: failureModeId });
    } else {
      setSelectedComponents([componentId]);
      setClickedElement({ type: 'component', id: componentId });
    }
  };

  const handleBubbleClick = (failureModeId: string) => {
    setSelectedFailureModes([failureModeId]);
    setClickedElement({ type: 'failureMode', id: failureModeId });
  };

  const handleParetoBarClick = (failureModeId: string) => {
    setSelectedFailureModes([failureModeId]);
    setClickedElement({ type: 'failureMode', id: failureModeId });
  };

  const handleMitigationClick = (failureModeId: string) => {
    setSelectedFailureModes([failureModeId]);
    setClickedElement({ type: 'failureMode', id: failureModeId });
  };

  const handleTopRiskClick = (failureModeId: string) => {
    setSelectedFailureModes([failureModeId]);
    setClickedElement({ type: 'failureMode', id: failureModeId });
  };

  const handleClearFilters = () => {
    setSelectedComponents([]);
    setSelectedFailureModes([]);
    setSelectedRiskLevel('all');
    setClickedElement(null);
  };

  const filteredComponents = getFilteredComponents();
  const filteredFailureModes = getFilteredFailureModes();

  // Calculate enhanced metrics based on current data (filtered or unfiltered)
  const calculateEnhancedMetrics = (fms: FailureMode[], comps: Component[]) => {
    if (!fms.length || !comps.length) {
      return {
        totalRPN: 0,
        componentsAnalyzed: 0,
        mitigationsClosedPercent: 0,
        openActions: 0,
        failureModesAssessed: 0,
        highRiskItems: 0,
        avgRPNReduction: 0,
        highestRPN: 0,
      };
    }

    // Calculate metrics from failure modes
    const rpnValues = fms.map(fm => (fm as any).maxRPN || 0);
    const totalRPN = rpnValues.reduce((sum, rpn) => sum + rpn, 0);
    const highRiskItems = fms.filter(fm => (fm as any).maxRPN >= 200).length;
    const highestRPN = Math.max(...rpnValues, 0);

    // Count actions
    let openActions = 0;
    let completedActions = 0;
    fms.forEach(fm => {
      if (fm.actions) {
        fm.actions.forEach(action => {
          if (action.status === 'open' || action.status === 'in-progress') {
            openActions++;
          } else if (action.status === 'completed') {
            completedActions++;
          }
        });
      }
    });

    const totalActions = openActions + completedActions;
    const mitigationsClosedPercent = totalActions > 0
      ? Math.round((completedActions / totalActions) * 100)
      : 0;

    return {
      totalRPN,
      componentsAnalyzed: comps.length,
      mitigationsClosedPercent,
      openActions,
      failureModesAssessed: fms.length,
      highRiskItems,
      avgRPNReduction: 0, // Will be calculated from post-action data
      highestRPN,
    };
  };

  const enhancedMetrics = calculateEnhancedMetrics(filteredFailureModes, filteredComponents);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Enhanced Metrics Toolbar */}
      <MetricsToolbar
        {...enhancedMetrics}
        components={components}
        selectedComponents={selectedComponents}
        selectedRiskLevel={selectedRiskLevel}
        onComponentFilterChange={setSelectedComponents}
        onRiskLevelFilterChange={setSelectedRiskLevel}
      />

      <div className="p-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3" />
              Dashboard Overview
            </h1>
            <p className="text-gray-600 mt-1">
              Analytics and insights for {project.name}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {onExport && (
              <button
                onClick={onExport}
                className="btn-secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            )}
            <button
              onClick={loadDashboardData}
              className="btn-secondary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedComponents.length > 0 || selectedFailureModes.length > 0 || clickedElement) && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-900">Active Filters:</span>
                {clickedElement && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {clickedElement.type === 'component' ? 'Component Selected' : 'Failure Mode Selected'}
                  </span>
                )}
                {selectedComponents.length > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {selectedComponents.length} Component{selectedComponents.length > 1 ? 's' : ''}
                  </span>
                )}
                {selectedFailureModes.length > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {selectedFailureModes.length} Failure Mode{selectedFailureModes.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Grid Layout for New Charts */}
        <div className="space-y-6">
          {/* Row 1: Heat Map and Bubble Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HeatMapChart
              components={filteredComponents}
              onFilterClick={handleHeatMapClick}
            />
            <RisksBubbleChart
              failureModes={filteredFailureModes}
              onBubbleClick={handleBubbleClick}
            />
          </div>

          {/* Row 2: Top 10 Risks Bar and Risk Breakdown Donuts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopRisksChart
              data={chartData?.topRisks || []}
              onBarClick={handleTopRiskClick}
            />
            <div className="grid grid-cols-3 gap-4">
              <RiskDistributionChart data={chartData?.riskDistribution || []} />
            </div>
          </div>

          {/* Row 3: Pareto Chart - Full Width */}
          <ParetoChart
            failureModes={filteredFailureModes}
            onBarClick={handleParetoBarClick}
          />

          {/* Row 4: Top Mitigations and Effects Without Control */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopMitigationsChart
              failureModes={filteredFailureModes}
              onBarClick={handleMitigationClick}
            />
            <EffectsWithoutControlTable failureModes={filteredFailureModes} />
          </div>

          {/* Row 5: Action Status - if needed */}
          <ActionStatusChart data={chartData?.actionStatus || []} />
        </div>

        {/* Summary Insights */}
        {metrics && metrics.totalFailureModes > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Key Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="text-blue-800">
                <strong>{Math.round((metrics.highRiskModes / metrics.totalFailureModes) * 100)}%</strong> of failure modes are high risk (RPN ≥ 200)
              </div>
              <div className="text-blue-800">
                <strong>{Math.round((metrics.completedActions / Math.max(metrics.completedActions + metrics.openActions, 1)) * 100)}%</strong> of actions have been completed
              </div>
              <div className="text-blue-800">
                Average RPN is <strong>{metrics.averageRPN}</strong> across all failure modes
              </div>
              <div className="text-blue-800">
                <strong>{components.length}</strong> components analyzed with <strong>{failureModes.length}</strong> failure modes
              </div>
              <div className="text-blue-800">
                Highest RPN: <strong className="text-red-600">{enhancedMetrics.highestRPN}</strong>
              </div>
              <div className="text-blue-800">
                <strong>{enhancedMetrics.mitigationsClosedPercent}%</strong> of mitigations completed
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}