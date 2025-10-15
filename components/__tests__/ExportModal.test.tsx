import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportModal from '../export/ExportModal';
import { Project, FailureMode } from '@/types';

// Mock the export functions
jest.mock('@/lib/export', () => ({
  exportFMEA: jest.fn(() => Promise.resolve())
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  loading: jest.fn(),
  success: jest.fn(),
  error: jest.fn()
}));

describe('ExportModal', () => {
  const mockProject: Project = {
    id: '1',
    name: 'Test Project',
    description: 'Test Description',
    assetId: 'asset-1',
    userId: 'user-1',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    asset: {
      id: 'asset-1',
      name: 'Test Asset',
      assetId: 'TEST-001',
      type: 'Pump',
      context: 'Test context',
      criticality: 'high',
      standards: ['ISO 14224'],
      history: null,
      configuration: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    failureModes: []
  };

  const mockFailureModes: FailureMode[] = [
    {
      id: 'fm-1',
      project_id: '1',
      process_step: 'Operation',
      failure_mode: 'Pump fails to start',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      causes: [],
      effects: [],
      controls: [],
      actions: []
    }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    project: mockProject,
    failureModes: mockFailureModes
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<ExportModal {...defaultProps} />);
    
    expect(screen.getByText('Export FMEA')).toBeInTheDocument();
    expect(screen.getByText('Export your FMEA analysis in PDF or Excel format')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ExportModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Export FMEA')).not.toBeInTheDocument();
  });

  it('allows format selection', () => {
    render(<ExportModal {...defaultProps} />);
    
    const pdfButton = screen.getByText('PDF Report').closest('button');
    const excelButton = screen.getByText('Excel Workbook').closest('button');
    
    expect(pdfButton).toHaveClass('border-primary-500');
    expect(excelButton).not.toHaveClass('border-primary-500');
    
    fireEvent.click(excelButton!);
    
    expect(excelButton).toHaveClass('border-primary-500');
    expect(pdfButton).not.toHaveClass('border-primary-500');
  });

  it('toggles content options', () => {
    render(<ExportModal {...defaultProps} />);
    
    const metricsCheckbox = screen.getByRole('checkbox', { name: /dashboard metrics/i });
    
    expect(metricsCheckbox).toBeChecked();
    
    fireEvent.click(metricsCheckbox);
    
    expect(metricsCheckbox).not.toBeChecked();
  });

  it('shows export preview', () => {
    render(<ExportModal {...defaultProps} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('1 of 1')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('handles export button click', async () => {
    const { exportFMEA } = require('@/lib/export');
    const toast = require('react-hot-toast');
    
    render(<ExportModal {...defaultProps} />);
    
    const exportButton = screen.getByRole('button', { name: /export pdf/i });
    
    fireEvent.click(exportButton);
    
    expect(toast.loading).toHaveBeenCalledWith('Generating export...', { id: 'export' });
    
    await waitFor(() => {
      expect(exportFMEA).toHaveBeenCalledWith(
        mockProject,
        mockFailureModes,
        expect.objectContaining({
          format: 'pdf',
          includeMetrics: true,
          includeCharts: true,
          includeSummary: true
        }),
        undefined,
        undefined
      );
    });
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('PDF exported successfully!', { id: 'export' });
    });
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles export errors', async () => {
    const { exportFMEA } = require('@/lib/export');
    const toast = require('react-hot-toast');
    
    exportFMEA.mockRejectedValueOnce(new Error('Export failed'));
    
    render(<ExportModal {...defaultProps} />);
    
    const exportButton = screen.getByRole('button', { name: /export pdf/i });
    
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Export failed. Please try again.', { id: 'export' });
    });
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('closes when close button is clicked', () => {
    render(<ExportModal {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: '' }); // X button
    
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes when cancel button is clicked', () => {
    render(<ExportModal {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('disables export button when no failure modes', () => {
    render(<ExportModal {...defaultProps} failureModes={[]} />);
    
    const exportButton = screen.getByRole('button', { name: /export pdf/i });
    
    expect(exportButton).toBeDisabled();
  });

  it('applies RPN filter correctly', () => {
    render(<ExportModal {...defaultProps} />);
    
    const rpnSelect = screen.getByDisplayValue('All failure modes');
    
    fireEvent.change(rpnSelect, { target: { value: '100' } });
    
    // Should show filtered count in preview
    expect(screen.getByText('0 of 1')).toBeInTheDocument(); // No failure modes meet RPN >= 100
  });
});