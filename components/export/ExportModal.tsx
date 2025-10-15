'use client';

import { useState } from 'react';
import { Project, FailureMode, DashboardMetrics, ChartData } from '@/types';
import { exportFMEA, ExportOptions } from '@/lib/export';
import { X, Download, FileText, FileSpreadsheet, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  failureModes: FailureMode[];
  metrics?: DashboardMetrics;
  chartData?: ChartData;
}

export default function ExportModal({
  isOpen,
  onClose,
  project,
  failureModes,
  metrics,
  chartData
}: ExportModalProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeMetrics: true,
    includeCharts: true,
    includeSummary: true,
    filterByRPN: undefined,
    filterByStatus: []
  });

  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.loading('Generating export...', { id: 'export' });

      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      await exportFMEA(project, failureModes, exportOptions, metrics, chartData);
      
      toast.success(`${exportOptions.format.toUpperCase()} exported successfully!`, { id: 'export' });
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.', { id: 'export' });
    } finally {
      setIsExporting(false);
    }
  };

  const filteredCount = exportOptions.filterByRPN 
    ? failureModes.filter(fm => {
        // Calculate max RPN for filtering
        let maxRPN = 0;
        if (fm.causes && fm.effects && fm.causes.length > 0 && fm.effects.length > 0) {
          for (const cause of fm.causes) {
            for (const effect of fm.effects) {
              const detection = fm.controls && fm.controls.length > 0 
                ? Math.min(...fm.controls.map(c => c.detection))
                : 10;
              const rpn = effect.severity * cause.occurrence * detection;
              if (rpn > maxRPN) maxRPN = rpn;
            }
          }
        }
        return maxRPN >= exportOptions.filterByRPN!;
      }).length
    : failureModes.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Download className="w-6 h-6 text-primary-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Export FMEA</h2>
              <p className="text-sm text-gray-600 mt-1">
                Export your FMEA analysis in PDF or Excel format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExportOptions({...exportOptions, format: 'pdf'})}
                className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-3 transition-colors ${
                  exportOptions.format === 'pdf'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">PDF Report</div>
                  <div className="text-xs text-gray-500">Formatted document</div>
                </div>
              </button>
              
              <button
                onClick={() => setExportOptions({...exportOptions, format: 'excel'})}
                className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-3 transition-colors ${
                  exportOptions.format === 'excel'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-medium">Excel Workbook</div>
                  <div className="text-xs text-gray-500">Structured data</div>
                </div>
              </button>
            </div>
          </div>

          {/* Content Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Include Content
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSummary}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includeSummary: e.target.checked
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">Project summary and basic information</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetrics}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includeMetrics: e.target.checked
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">Dashboard metrics and statistics</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeCharts}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    includeCharts: e.target.checked
                  })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700">Chart data and risk distribution</span>
              </label>
            </div>
          </div>

          {/* Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Filters (Optional)
            </label>
            
            {/* RPN Filter */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">
                Minimum RPN Threshold
              </label>
              <select
                value={exportOptions.filterByRPN || ''}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  filterByRPN: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="input text-sm"
              >
                <option value="">All failure modes</option>
                <option value="50">RPN ≥ 50 (Medium risk and above)</option>
                <option value="100">RPN ≥ 100 (High risk and above)</option>
                <option value="200">RPN ≥ 200 (Critical risk only)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Failure Mode Status
              </label>
              <div className="space-y-2">
                {['active', 'closed', 'on-hold'].map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.filterByStatus?.includes(status) || exportOptions.filterByStatus?.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExportOptions({
                            ...exportOptions,
                            filterByStatus: exportOptions.filterByStatus?.length === 0 
                              ? [status]
                              : [...(exportOptions.filterByStatus || []), status]
                          });
                        } else {
                          setExportOptions({
                            ...exportOptions,
                            filterByStatus: exportOptions.filterByStatus?.filter(s => s !== status) || []
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Export Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Export Preview</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Project: <span className="font-medium">{project.name}</span></div>
              <div>Failure Modes: <span className="font-medium">{filteredCount} of {failureModes.length}</span></div>
              <div>Format: <span className="font-medium">{exportOptions.format.toUpperCase()}</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || failureModes.length === 0}
            className="btn-primary"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {exportOptions.format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}