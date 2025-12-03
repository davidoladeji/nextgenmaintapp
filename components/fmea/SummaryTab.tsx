'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { FileText, TrendingUp, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { Project, Component, FailureMode, DashboardMetrics, ChartData } from '@/types';
import { useAuth } from '@/lib/store';
import { useProjectSettings } from '@/lib/stores/projectSettingsStore';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportToPDF, exportToExcel } from '@/lib/export';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Dynamically import dashboard charts for preview thumbnails only
const HeatMapChart = dynamic(() => import('@/components/dashboard/HeatMapChart'), { ssr: false });
const ParetoChart = dynamic(() => import('@/components/dashboard/ParetoChart'), { ssr: false });
const RisksBubbleChart = dynamic(() => import('@/components/dashboard/RisksBubbleChart'), { ssr: false });

interface SummaryTabProps {
  project: Project;
}

// Utility component for toggle rows
function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-700 dark:text-slate-300">{label}</label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

// Chart preview component with actual mini widget
function ChartPreview({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-48 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-gray-50 dark:bg-slate-900 px-3 py-2 border-b border-gray-200 dark:border-slate-700">
        <div className="text-xs font-medium text-gray-700 dark:text-slate-300">{label}</div>
      </div>
      <div className="p-2 h-40 bg-white dark:bg-slate-800">
        {children}
      </div>
    </div>
  );
}

export default function SummaryTab({ project }: SummaryTabProps) {
  const { token } = useAuth();

  // Get available standards from project settings (configured in Setup tab)
  const { standards: availableStandards } = useProjectSettings();

  const [components, setComponents] = useState<Component[]>([]);
  const [failureModes, setFailureModes] = useState<FailureMode[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  // Export controls state
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeActions, setIncludeActions] = useState(true);
  const [includeCompliance, setIncludeCompliance] = useState(true);
  const [includeSmartTable, setIncludeSmartTable] = useState(true);
  const [includeReasoning, setIncludeReasoning] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
  const [threshold, setThreshold] = useState<'all' | '>150'>('all');

  // Metadata
  const [owner, setOwner] = useState('Platform Superadmin');
  // Selected standards for this export (subset of availableStandards)
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [asset, setAsset] = useState(project.description || 'FTSA (Compressor) – High criticality');

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Chart refs for preview thumbnails only
  const heatMapRef = useRef<HTMLDivElement>(null);
  const paretoRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = async () => {
    try {
      const [componentsRes, failureModesRes, metricsRes] = await Promise.all([
        fetch(`/api/projects/${project.id}/components`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/projects/${project.id}/failure-modes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/projects/${project.id}/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const componentsData = await componentsRes.json();
      const failureModesData = await failureModesRes.json();
      const metricsData = await metricsRes.json();

      if (componentsData.success) {
        setComponents(componentsData.data);
      }
      if (failureModesData.success) {
        setFailureModes(failureModesData.data);
      }
      if (metricsData.success) {
        setMetrics(metricsData.data.metrics);
        setChartData(metricsData.data.chartData);
      }
    } catch (error) {
      console.error('Failed to load summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMaxRPN = (failureMode: FailureMode) => {
    if (!failureMode.causes?.length || !failureMode.effects?.length) return 0;

    let maxRPN = 0;
    for (const cause of failureMode.causes) {
      for (const effect of failureMode.effects) {
        const detection = failureMode.controls?.length
          ? Math.min(...failureMode.controls.map(c => c.detection))
          : 10;
        const rpn = effect.severity * cause.occurrence * detection;
        maxRPN = Math.max(maxRPN, rpn);
      }
    }
    return maxRPN;
  };

  // Calculate summary metrics
  const totalComponents = components.length;
  const totalFailureModes = failureModes.length;

  const rpnValues = failureModes.map(fm => calculateMaxRPN(fm));
  const totalRPN = rpnValues.reduce((sum, rpn) => sum + rpn, 0);
  const avgRPN = totalFailureModes > 0 ? Math.round(totalRPN / totalFailureModes) : 0;
  const highestRPN = Math.max(...rpnValues, 0);

  const criticalRisks = failureModes.filter(fm => calculateMaxRPN(fm) > 150).length;
  const highRisks = failureModes.filter(fm => {
    const rpn = calculateMaxRPN(fm);
    return rpn > 100 && rpn <= 150;
  }).length;

  // Count actions
  let totalActions = 0;
  let openActions = 0;
  let completedActions = 0;

  failureModes.forEach(fm => {
    if (fm.actions) {
      fm.actions.forEach(action => {
        totalActions++;
        if (action.status === 'completed') {
          completedActions++;
        } else {
          openActions++;
        }
      });
    }
  });

  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // Find top risks (all, then filter/slice based on controls)
  const allTopRisks = failureModes
    .map(fm => ({
      failureMode: fm,
      rpn: calculateMaxRPN(fm),
      component: components.find(c => c.id === fm.component_id),
    }))
    .sort((a, b) => b.rpn - a.rpn);

  // Apply threshold filter
  const filteredTopRisks = useMemo(() => {
    return threshold === '>150'
      ? allTopRisks.filter(r => r.rpn > 150)
      : allTopRisks;
  }, [allTopRisks, threshold]);

  const topRisks = filteredTopRisks.slice(0, 5);

  // Validation calculations
  const validationIssues = useMemo(() => {
    let missingDet = 0;
    let effectsNoControls = 0;
    let actionsNoOwners = 0;

    failureModes.forEach(fm => {
      // Check for missing DET values
      if (fm.controls?.length === 0 || !fm.controls) {
        missingDet++;
      }
      // Check for effects without controls
      if ((fm.effects?.length ?? 0) > 0 && (!fm.controls || fm.controls.length === 0)) {
        effectsNoControls++;
      }
      // Check for actions without owners
      if (fm.actions) {
        fm.actions.forEach(action => {
          if (!action.owner || action.owner.trim() === '') {
            actionsNoOwners++;
          }
        });
      }
    });

    return { missingDet, effectsNoControls, actionsNoOwners };
  }, [failureModes]);

  // Export handler
  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.loading('Preparing export...');

      // Apply threshold filter
      let exportFailureModes = [...failureModes];
      if (threshold === '>150') {
        exportFailureModes = filteredTopRisks.map(r => r.failureMode);
      }

      // Calculate metrics for export
      const metrics = {
        totalFailureModes: exportFailureModes.length,
        highRiskModes: exportFailureModes.filter(fm => calculateMaxRPN(fm) >= 200).length,
        criticalModes: exportFailureModes.filter(fm => calculateMaxRPN(fm) >= 300).length,
        averageRPN: avgRPN,
        openActions,
        completedActions
      };

      // Create enhanced project object with asset info
      const projectWithAsset = {
        ...project,
        asset: project.asset || {
          name: asset,
          type: 'Compressor',
          assetId: 'N/A',
          criticality: 'high' as const,
          context: owner
        }
      };

      // Charts will be generated from data in the PDF export function
      // No need for screen capture anymore

      // Prepare export metadata
      const exportMetadata = {
        includeCompliance,
        includeActions,
        standards: selectedStandards,
        owner,
        openActions,
        completionRate
      };

      // Call the appropriate export function
      if (format === 'pdf') {
        toast.dismiss();
        toast.loading('Generating PDF with charts...');

        // Call API route for server-side PDF generation with charts
        const response = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            project: projectWithAsset,
            failureModes: exportFailureModes,
            metrics,
            chartData,
            components,
            exportMetadata,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'PDF generation failed');
        }

        // Download the PDF file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FMEA_${projectWithAsset.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.dismiss();
        toast.success('PDF exported successfully!');
      } else {
        toast.dismiss();
        toast.loading('Generating Excel...');
        exportToExcel(projectWithAsset, exportFailureModes, metrics, undefined, components);
        toast.dismiss();
        toast.success('Excel exported successfully!');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.dismiss();
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-slate-400">Loading summary...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Sidebar - Export Controls */}
      <div className="lg:col-span-4 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Export Preview</h2>

        {/* Controls Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3">
          <ToggleRow label="Include Dashboard Charts" value={includeCharts} onChange={setIncludeCharts} />
          <ToggleRow label="Include Action List" value={includeActions} onChange={setIncludeActions} />
          <ToggleRow label="Include Compliance References" value={includeCompliance} onChange={setIncludeCompliance} />
          <ToggleRow label="Include Smart Table Snapshot" value={includeSmartTable} onChange={setIncludeSmartTable} />
          <ToggleRow label="Include AI Reasoning Notes (Phase 2)" value={includeReasoning} onChange={setIncludeReasoning} />

          {/* Threshold */}
          <div className="pt-2">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Filter Threshold</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                variant={threshold === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setThreshold('all')}
              >
                Export All
              </Button>
              <Button
                variant={threshold === '>150' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setThreshold('>150')}
              >
                Only RPN &gt; 150
              </Button>
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Output Format</label>
            <div className="mt-2 flex gap-2">
              <Button
                variant={format === 'pdf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('pdf')}
              >
                PDF
              </Button>
              <Button
                variant={format === 'xlsx' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormat('xlsx')}
              >
                Excel
              </Button>
            </div>
          </div>

          {/* Metadata inputs */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Asset</label>
              <Input value={asset} onChange={(e) => setAsset(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Prepared By</label>
                <Input value={owner} onChange={(e) => setOwner(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                  Standards (multiple allowed) - From Setup Tab
                </label>
                <div className="space-y-1.5">
                  {availableStandards.length > 0 ? (
                    availableStandards.map((std) => (
                      <label key={std} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStandards.includes(std)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStandards([...selectedStandards, std]);
                            } else {
                              setSelectedStandards(selectedStandards.filter(s => s !== std));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        <span className="text-sm text-gray-700 dark:text-slate-300">{std}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-slate-500 italic">
                      No standards configured. Go to Setup tab to select standards.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={loadData}>
              Refresh Preview
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>

        {/* Validation Snapshot Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Validation Snapshot</h3>
          </div>
          <div className="p-5 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-3 w-3 rounded-full ${
                validationIssues.actionsNoOwners || validationIssues.missingDet || validationIssues.effectsNoControls
                  ? 'bg-yellow-500'
                  : 'bg-emerald-500'
              }`} />
              <span className="text-gray-700 dark:text-slate-300">
                {validationIssues.actionsNoOwners || validationIssues.missingDet || validationIssues.effectsNoControls
                  ? 'Issues detected – review before export'
                  : 'All checks passed'}
              </span>
            </div>
            <ul className="list-disc ml-5 text-gray-600 dark:text-slate-400">
              <li>Missing DET values: {validationIssues.missingDet}</li>
              <li>Effects without controls: {validationIssues.effectsNoControls}</li>
              <li>Open actions without owners: {validationIssues.actionsNoOwners}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Preview Pane */}
      <div className="lg:col-span-8">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6 space-y-6">
          {/* Metadata Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Executive Summary Report</h1>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Asset: {asset}</p>
              <p className="text-xs text-gray-500 dark:text-slate-500">Standards: {selectedStandards.join(', ') || 'None selected'} • Owner: {owner}</p>
            </div>
            <Badge variant="secondary" className="text-xs">{format.toUpperCase()} Preview</Badge>
          </div>

          {/* Gradient Executive Summary Card */}
          <div className="rounded-2xl p-6 bg-accent text-white shadow-xl">
            <div className="text-lg font-semibold mb-4">Executive Summary Snapshot</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                <div className="text-xs opacity-80 mb-1">Components</div>
                <div className="text-2xl font-bold">{totalComponents}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                <div className="text-xs opacity-80 mb-1">Failure Modes</div>
                <div className="text-2xl font-bold">{totalFailureModes}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                <div className="text-xs opacity-80 mb-1">Avg RPN</div>
                <div className="text-2xl font-bold">{avgRPN}</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                <div className="text-xs opacity-80 mb-1">Actions Complete</div>
                <div className="text-2xl font-bold">{completionRate}%</div>
              </div>
            </div>
          </div>

          {/* Three Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-transparent rounded-lg border border-red-200 dark:border-red-700 p-4">
              <div className="text-xs uppercase text-gray-500 dark:text-slate-400">Highest Risk</div>
              <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{highestRPN}</div>
            </div>
            <div className="bg-transparent rounded-lg border border-gray-200 dark:border-slate-700 p-4">
              <div className="text-xs uppercase text-gray-500 dark:text-slate-400">Open Actions</div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{openActions}</div>
            </div>
            <div className="bg-transparent rounded-lg border border-gray-200 dark:border-slate-700 p-4">
              <div className="text-xs uppercase text-gray-500 dark:text-slate-400">Progress</div>
              <div className="mt-2">
                <Progress value={completionRate} className="h-2" />
                <div className="text-right text-xs text-gray-500 dark:text-slate-400 mt-1">{completionRate}% complete</div>
              </div>
            </div>
          </div>

          {/* Top Risks Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100">Top Risks</h3>
              {threshold === '>150' && (
                <Badge variant="outline" className="text-xs">Filtered: RPN &gt; 150</Badge>
              )}
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-900">
                  <tr className="text-left">
                    <th className="p-3 text-gray-700 dark:text-slate-300">Failure Mode</th>
                    <th className="p-3 text-gray-700 dark:text-slate-300">Component</th>
                    <th className="p-3 text-gray-700 dark:text-slate-300">SEV</th>
                    <th className="p-3 text-gray-700 dark:text-slate-300">OCC</th>
                    <th className="p-3 text-gray-700 dark:text-slate-300">DET</th>
                    <th className="p-3 text-gray-700 dark:text-slate-300">RPN</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTopRisks.slice(0, 10).map((r) => (
                    <tr key={r.failureMode.id} className="border-t border-gray-200 dark:border-slate-700">
                      <td className="p-3 text-gray-900 dark:text-slate-100">{r.failureMode.failure_mode}</td>
                      <td className="p-3 text-gray-600 dark:text-slate-400">{r.component?.name || 'N/A'}</td>
                      <td className="p-3 text-gray-900 dark:text-slate-100">
                        {r.failureMode.effects?.[0]?.severity || '-'}
                      </td>
                      <td className="p-3 text-gray-900 dark:text-slate-100">
                        {r.failureMode.causes?.[0]?.occurrence || '-'}
                      </td>
                      <td className="p-3 text-gray-900 dark:text-slate-100">
                        {r.failureMode.controls?.[0]?.detection || '-'}
                      </td>
                      <td className="p-3 font-medium text-gray-900 dark:text-slate-100">{r.rpn}</td>
                    </tr>
                  ))}
                  {filteredTopRisks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500 dark:text-slate-400">
                        No rows match the selected threshold.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart Previews - Actual Mini Widgets */}
          {includeCharts && components.length > 0 && failureModes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ChartPreview label="RPN Heatmap">
                <div ref={heatMapRef} className="scale-75 origin-top-left w-[133%] h-[133%]">
                  <HeatMapChart components={components.slice(0, 2)} />
                </div>
              </ChartPreview>
              <ChartPreview label="Top Risks (Pareto)">
                <div ref={paretoRef} className="scale-75 origin-top-left w-[133%] h-[133%]">
                  <ParetoChart failureModes={failureModes.slice(0, 5)} />
                </div>
              </ChartPreview>
              <ChartPreview label="Risk Bubble Chart">
                <div ref={bubbleRef} className="scale-75 origin-top-left w-[133%] h-[133%]">
                  <RisksBubbleChart failureModes={failureModes.slice(0, 10).map(fm => ({ ...fm, component: components.find(c => c.id === fm.component_id) }))} />
                </div>
              </ChartPreview>
            </div>
          )}

          {/* Smart Table Snapshot */}
          {includeSmartTable && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Smart Table Snapshot</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                Rendered as a compact preview for context. Full Smart Table is included in the actual export even when not on screen.
              </p>
              <div className="rounded-xl border border-gray-200 dark:border-slate-700 max-h-72 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-900">
                    <tr className="text-left">
                      <th className="p-3 text-gray-700 dark:text-slate-300">Component</th>
                      <th className="p-3 text-gray-700 dark:text-slate-300">Failure Mode</th>
                      <th className="p-3 text-gray-700 dark:text-slate-300"># Effects</th>
                      <th className="p-3 text-gray-700 dark:text-slate-300">RPN (Pre)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTopRisks.map((r) => (
                      <tr key={r.failureMode.id} className="border-t border-gray-200 dark:border-slate-700">
                        <td className="p-3 text-gray-900 dark:text-slate-100">{r.component?.name || 'N/A'}</td>
                        <td className="p-3 text-gray-900 dark:text-slate-100">{r.failureMode.failure_mode}</td>
                        <td className="p-3 text-gray-900 dark:text-slate-100">{r.failureMode.effects?.length || 0}</td>
                        <td className="p-3 text-gray-900 dark:text-slate-100">{r.rpn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Compliance & Action List */}
          {(includeCompliance || includeActions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {includeCompliance && (
                <div className="bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Compliance References</h4>
                  <div className="text-sm text-gray-700 dark:text-slate-300 space-y-1">
                    {selectedStandards.length > 0 ? (
                      selectedStandards.map((std) => (
                        <div key={std}>• {std}</div>
                      ))
                    ) : (
                      <div className="text-gray-500 dark:text-slate-500 italic">No standards selected</div>
                    )}
                    <div>• Company Methodology v1.2</div>
                    <div>• Audit Trail ID: DEMO-12345</div>
                  </div>
                </div>
              )}
              {includeActions && (
                <div className="bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Action List (Summary)</h4>
                  <div className="text-sm text-gray-700 dark:text-slate-300 space-y-1">
                    <div>Open actions: {openActions}</div>
                    <div>Completed: {completionRate}%</div>
                    <div>Overdue: 0</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div>Prepared by: {owner}</div>
            <div>{new Date().toLocaleString()}</div>
            <div>Generated by NextGenMaint – AI-Assisted FMEA Builder</div>
          </div>
        </div>
      </div>

    </div>
  );
}
