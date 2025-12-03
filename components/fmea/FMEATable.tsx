'use client';

import { useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import { FailureMode, Project } from '@/types';
import { Plus, RefreshCw, ChevronRight, AlertTriangle } from 'lucide-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import CreateFailureModeModal from './CreateFailureModeModal';

interface FMEATableProps {
  failureModes: FailureMode[];
  onRowClick: (failureMode: FailureMode) => void;
  onRefresh: () => void;
  project: Project;
}

export default function FMEATable({ 
  failureModes, 
  onRowClick, 
  onRefresh, 
  project 
}: FMEATableProps) {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  // Custom cell renderers
  const StatusRenderer = (params: any) => {
    const status = params.value;
    const colorMap = {
      active: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[status as keyof typeof colorMap]}`}>
        {status}
      </span>
    );
  };

  const RPNRenderer = (params: any) => {
    const rpn = params.value || 0;
    let colorClass = 'text-gray-900';
    
    if (rpn >= 200) {
      colorClass = 'text-red-600 font-bold';
    } else if (rpn >= 100) {
      colorClass = 'text-orange-600 font-semibold';
    } else if (rpn >= 50) {
      colorClass = 'text-yellow-600';
    } else {
      colorClass = 'text-green-600';
    }

    return (
      <div className="flex items-center justify-between">
        <span className={colorClass}>{rpn}</span>
        {rpn >= 200 && <AlertTriangle className="w-4 h-4 text-red-600" />}
      </div>
    );
  };

  const ExpandRenderer = () => {
    return (
      <div className="flex items-center justify-center">
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    );
  };

  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: '',
      field: 'expand',
      width: 50,
      cellRenderer: ExpandRenderer,
      sortable: false,
      filter: false,
      resizable: false,
    },
    {
      headerName: 'Process Step',
      field: 'processStep',
      width: 200,
      filter: 'agTextColumnFilter',
      cellStyle: { fontWeight: 500 } as any,
    },
    {
      headerName: 'Failure Mode',
      field: 'failureMode',
      width: 300,
      filter: 'agTextColumnFilter',
      tooltipField: 'failureMode',
    },
    {
      headerName: 'Causes',
      field: 'causesCount',
      width: 80,
      type: 'numericColumn',
      cellStyle: { textAlign: 'center' } as any,
    },
    {
      headerName: 'Effects',
      field: 'effectsCount',
      width: 80,
      type: 'numericColumn',
      cellStyle: { textAlign: 'center' } as any,
    },
    {
      headerName: 'SEV',
      field: 'maxSeverity',
      width: 70,
      type: 'numericColumn',
      cellStyle: { textAlign: 'center', fontWeight: 600 } as any,
      tooltipValueGetter: () => 'Severity (1-10): Impact of failure',
    },
    {
      headerName: 'OCC',
      field: 'maxOccurrence',
      width: 70,
      type: 'numericColumn',
      cellStyle: { textAlign: 'center', fontWeight: 600 } as any,
      tooltipValueGetter: () => 'Occurrence (1-10): Likelihood of failure',
    },
    {
      headerName: 'DET',
      field: 'maxDetection',
      width: 70,
      type: 'numericColumn',
      cellStyle: { textAlign: 'center', fontWeight: 600 } as any,
      tooltipValueGetter: () => 'Detection (1-10): Ability to detect failure',
    },
    {
      headerName: 'RPN',
      field: 'maxRPN',
      width: 100,
      type: 'numericColumn',
      cellRenderer: RPNRenderer,
      sort: 'desc',
      tooltipValueGetter: () => 'Risk Priority Number (SEV × OCC × DET)',
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 100,
      cellRenderer: StatusRenderer,
      filter: 'agSetColumnFilter',
    },
  ], []);

  // Transform failure modes for AG Grid
  const rowData = useMemo(() => {
    return failureModes.map((fm: any) => ({
      ...fm,
      maxRPN: fm.maxRPN || 0,
      maxSeverity: fm.maxSeverity || 0,
      maxOccurrence: fm.maxOccurrence || 0,
      maxDetection: fm.maxDetection || 10,
      causesCount: fm.causesCount || 0,
      effectsCount: fm.effectsCount || 0,
    }));
  }, [failureModes]);

  const defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  const onRowClicked = (event: any) => {
    onRowClick(event.data);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900">
              FMEA Analysis
            </h3>
            <span className="text-sm text-gray-500">
              {failureModes.length} failure modes
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              className="btn-secondary btn-sm"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary btn-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Failure Mode
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 ag-theme-alpine">
        {failureModes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No failure modes yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Start building your FMEA by adding the first failure mode. 
                Our AI assistant can help suggest potential failure modes.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary btn-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Failure Mode
              </button>
            </div>
          </div>
        ) : (
          <AgGridReact
            columnDefs={columnDefs}
            rowData={rowData}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onRowClicked={onRowClicked}
            animateRows={true}
            enableCellTextSelection={true}
            rowSelection="single"
            suppressRowClickSelection={false}
            rowHeight={56}
            headerHeight={48}
            getRowStyle={(params) => {
              if (params.data.maxRPN >= 200) {
                return { background: '#fef2f2' } as any; // Light red background for high risk
              }
              if (params.data.maxRPN >= 100) {
                return { background: '#fffbeb' } as any; // Light yellow background for medium risk
              }
              return undefined;
            }}
          />
        )}
      </div>

      {/* Create Failure Mode Modal */}
      {showCreateModal && (
        <CreateFailureModeModal
          project={project}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}