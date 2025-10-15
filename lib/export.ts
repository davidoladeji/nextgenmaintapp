// @ts-ignore
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Project, FailureMode, DashboardMetrics, ChartData } from '@/types';

// Export to PDF
export function exportToPDF(
  project: Project,
  failureModes: FailureMode[],
  metrics?: DashboardMetrics,
  chartData?: ChartData
) {
  const doc = new jsPDF();
  let yPosition = 20;
  const lineHeight = 10;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // Helper function to add new page if needed
  const checkPageBreak = (additionalHeight: number = lineHeight) => {
    if (yPosition + additionalHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFont(undefined, 'normal');
    }
    
    const lines = doc.splitTextToSize(text, 170);
    lines.forEach((line: string) => {
      checkPageBreak();
      doc.text(line, 20, yPosition);
      yPosition += lineHeight;
    });
  };

  // Title
  addText('FMEA Analysis Report', 18, true);
  yPosition += 10;

  // Project Information
  addText('Project Information', 14, true);
  addText(`Project Name: ${project.name}`);
  addText(`Asset: ${project.asset?.name} (${project.asset?.type})`);
  addText(`Criticality: ${project.asset?.criticality}`);
  addText(`Generated: ${new Date().toLocaleDateString()}`);
  yPosition += 10;

  // Metrics Summary (if available)
  if (metrics) {
    addText('Executive Summary', 14, true);
    addText(`Total Failure Modes: ${metrics.totalFailureModes}`);
    addText(`High Risk Modes (RPN ≥ 200): ${metrics.highRiskModes}`);
    addText(`Critical Modes (RPN ≥ 300): ${metrics.criticalModes}`);
    addText(`Average RPN: ${metrics.averageRPN}`);
    addText(`Open Actions: ${metrics.openActions}`);
    addText(`Completed Actions: ${metrics.completedActions}`);
    yPosition += 10;
  }

  // Failure Modes Details
  addText('Failure Modes Analysis', 14, true);
  
  failureModes.forEach((fm, index) => {
    checkPageBreak(50); // Reserve space for failure mode section
    
    addText(`${index + 1}. Failure Mode: ${fm.failure_mode}`, 12, true);
    addText(`Process Step: ${fm.process_step}`);
    addText(`Status: ${fm.status}`);
    
    // Calculate RPN for this failure mode
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
    addText(`RPN: ${maxRPN}`);
    
    // Causes
    if (fm.causes && fm.causes.length > 0) {
      addText('Causes:', 10, true);
      fm.causes.forEach(cause => {
        addText(`  • ${cause.description} (Occurrence: ${cause.occurrence})`);
      });
    }
    
    // Effects
    if (fm.effects && fm.effects.length > 0) {
      addText('Effects:', 10, true);
      fm.effects.forEach(effect => {
        addText(`  • ${effect.description} (Severity: ${effect.severity})`);
      });
    }
    
    // Controls
    if (fm.controls && fm.controls.length > 0) {
      addText('Controls:', 10, true);
      fm.controls.forEach(control => {
        addText(`  • ${control.type}: ${control.description} (Detection: ${control.detection})`);
      });
    }
    
    // Actions
    if (fm.actions && fm.actions.length > 0) {
      addText('Actions:', 10, true);
      fm.actions.forEach(action => {
        addText(`  • ${action.description} (Owner: ${action.owner}, Status: ${action.status})`);
      });
    }
    
    yPosition += 5;
  });

  // Generate filename
  const filename = `FMEA_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Save the PDF
  doc.save(filename);
}

// Export to Excel
export function exportToExcel(
  project: Project,
  failureModes: FailureMode[],
  metrics?: DashboardMetrics,
  chartData?: ChartData
) {
  const workbook = XLSX.utils.book_new();

  // Project Info Sheet
  const projectData = [
    ['Project Information'],
    ['Project Name', project.name],
    ['Asset Name', project.asset?.name || ''],
    ['Asset Type', project.asset?.type || ''],
    ['Asset ID', project.asset?.assetId || ''],
    ['Criticality', project.asset?.criticality || ''],
    ['Context', project.asset?.context || ''],
    ['Generated Date', new Date().toLocaleDateString()],
    [''],
    ['Summary'],
    ['Total Failure Modes', metrics?.totalFailureModes || failureModes.length],
    ['High Risk Modes', metrics?.highRiskModes || 0],
    ['Critical Modes', metrics?.criticalModes || 0],
    ['Average RPN', metrics?.averageRPN || 0],
    ['Open Actions', metrics?.openActions || 0],
    ['Completed Actions', metrics?.completedActions || 0]
  ];
  
  const projectSheet = XLSX.utils.aoa_to_sheet(projectData);
  XLSX.utils.book_append_sheet(workbook, projectSheet, 'Project Info');

  // Failure Modes Summary Sheet
  const summaryData = [
    ['ID', 'Process Step', 'Failure Mode', 'Status', 'Max RPN', 'Causes Count', 'Effects Count', 'Controls Count', 'Actions Count', 'Created Date']
  ];

  failureModes.forEach(fm => {
    // Calculate max RPN
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

    summaryData.push([
      fm.id,
      fm.process_step,
      fm.failure_mode,
      fm.status,
      maxRPN,
      fm.causes?.length || 0,
      fm.effects?.length || 0,
      fm.controls?.length || 0,
      fm.actions?.length || 0,
      new Date(fm.created_at).toLocaleDateString()
    ]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Failure Modes Summary');

  // Detailed FMEA Sheet
  const detailedData = [
    ['Failure Mode ID', 'Process Step', 'Failure Mode', 'Type', 'Item', 'Description', 'Value', 'Status', 'Owner', 'Due Date']
  ];

  failureModes.forEach(fm => {
    // Add causes
    if (fm.causes && fm.causes.length > 0) {
      fm.causes.forEach(cause => {
        detailedData.push([
          fm.id,
          fm.process_step,
          fm.failure_mode,
          'Cause',
          'Description',
          cause.description,
          cause.occurrence,
          '',
          '',
          ''
        ]);
      });
    }

    // Add effects
    if (fm.effects && fm.effects.length > 0) {
      fm.effects.forEach(effect => {
        detailedData.push([
          fm.id,
          fm.process_step,
          fm.failure_mode,
          'Effect',
          'Description',
          effect.description,
          effect.severity,
          '',
          '',
          ''
        ]);
      });
    }

    // Add controls
    if (fm.controls && fm.controls.length > 0) {
      fm.controls.forEach(control => {
        detailedData.push([
          fm.id,
          fm.process_step,
          fm.failure_mode,
          'Control',
          control.type,
          control.description,
          control.detection,
          '',
          '',
          ''
        ]);
      });
    }

    // Add actions
    if (fm.actions && fm.actions.length > 0) {
      fm.actions.forEach(action => {
        detailedData.push([
          fm.id,
          fm.process_step,
          fm.failure_mode,
          'Action',
          'Description',
          action.description,
          '',
          action.status,
          action.owner,
          action.dueDate || ''
        ]);
      });
    }
  });

  const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
  XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed FMEA');

  // Risk Distribution Sheet (if chart data available)
  if (chartData?.riskDistribution) {
    const riskData = [
      ['Risk Level', 'Count', 'Percentage']
    ];
    
    chartData.riskDistribution.forEach(item => {
      riskData.push([item.range, item.count, `${item.percentage}%`]);
    });

    const riskSheet = XLSX.utils.aoa_to_sheet(riskData);
    XLSX.utils.book_append_sheet(workbook, riskSheet, 'Risk Distribution');
  }

  // Action Status Sheet (if chart data available)
  if (chartData?.actionStatus) {
    const actionData = [
      ['Status', 'Count', 'Percentage']
    ];
    
    chartData.actionStatus.forEach(item => {
      actionData.push([item.status, item.count, `${item.percentage}%`]);
    });

    const actionSheet = XLSX.utils.aoa_to_sheet(actionData);
    XLSX.utils.book_append_sheet(workbook, actionSheet, 'Action Status');
  }

  // Generate filename
  const filename = `FMEA_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // Save the Excel file
  XLSX.writeFile(workbook, filename);
}

// Export configuration options
export interface ExportOptions {
  includeMetrics: boolean;
  includeCharts: boolean;
  includeSummary: boolean;
  format: 'pdf' | 'excel';
  filterByRPN?: number;
  filterByStatus?: string[];
}

// Main export function
export async function exportFMEA(
  project: Project,
  failureModes: FailureMode[],
  options: ExportOptions,
  metrics?: DashboardMetrics,
  chartData?: ChartData
) {
  // Apply filters if specified
  let filteredFailureModes = [...failureModes];
  
  if (options.filterByRPN) {
    filteredFailureModes = filteredFailureModes.filter(fm => {
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
      return maxRPN >= options.filterByRPN!;
    });
  }

  if (options.filterByStatus && options.filterByStatus.length > 0) {
    filteredFailureModes = filteredFailureModes.filter(fm => 
      options.filterByStatus!.includes(fm.status)
    );
  }

  // Export based on format
  if (options.format === 'pdf') {
    exportToPDF(
      project,
      filteredFailureModes,
      options.includeMetrics ? metrics : undefined,
      options.includeCharts ? chartData : undefined
    );
  } else {
    exportToExcel(
      project,
      filteredFailureModes,
      options.includeMetrics ? metrics : undefined,
      options.includeCharts ? chartData : undefined
    );
  }
}