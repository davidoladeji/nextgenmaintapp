// @ts-ignore
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Project, FailureMode, DashboardMetrics, ChartData, Component } from '@/types';
import {
  generateHeatMapChart,
  generateBubbleChart,
  generateTopRisksChart,
  generateRiskDistributionChart,
  generateParetoChart,
  generateTopMitigationsChart,
  generateActionStatusChart,
} from './chart-generator';

// Chart Images type (deprecated - keeping for compatibility)
export interface ChartImages {
  heatMap?: string;
  pareto?: string;
  bubble?: string;
  topRisks?: string;
  riskDistribution?: string;
  topMitigations?: string;
  effectsWithoutControl?: string;
  actionStatus?: string;
  metricsToolbar?: string;
}

// Additional export options
export interface ExportMetadata {
  includeCompliance?: boolean;
  includeActions?: boolean;
  standards?: string[];
  owner?: string;
  openActions?: number;
  completionRate?: number;
}

// Export to PDF - now generates charts from data instead of screen captures
export async function exportToPDF(
  project: Project,
  failureModes: FailureMode[],
  metrics?: DashboardMetrics,
  chartData?: ChartData,
  components?: Component[],
  chartImages?: ChartImages, // Deprecated parameter - kept for compatibility
  exportMetadata?: ExportMetadata
) {
  // Start with portrait for summary pages
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let y = 20;

  // Define colors (using exact tailwind colors from preview)
  const colors = {
    accent: [99, 102, 241] as const, // Indigo-500 for executive summary
    red: [220, 38, 38] as const, // Red-600
    gray900: [17, 24, 39] as const,
    gray700: [55, 65, 81] as const,
    gray500: [107, 114, 128] as const,
    gray200: [229, 231, 235] as const,
    gray50: [249, 250, 251] as const,
    white: [255, 255, 255] as const
  };

  // Helper: Calculate RPN for a failure mode
  const calculateMaxRPN = (fm: FailureMode) => {
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
    return maxRPN;
  };

  // Helper: Find component for failure mode
  const findComponent = (fm: FailureMode) => {
    if (!components) return { name: 'Component' };
    return components.find(c => c.id === fm.component_id) || { name: 'Component' };
  };

  // Calculate metrics if not provided
  const totalComponents = metrics?.totalFailureModes || failureModes.length;
  const totalFailureModes = failureModes.length;
  const avgRPN = metrics?.averageRPN || 0;
  const openActions = metrics?.openActions || 0;
  const completedActions = metrics?.completedActions || 0;
  const totalActions = openActions + completedActions;
  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  const highestRPN = Math.max(...failureModes.map(calculateMaxRPN), 0);

  // Sort failure modes by RPN (descending)
  const sortedFailureModes = [...failureModes]
    .map(fm => ({ failureMode: fm, rpn: calculateMaxRPN(fm), component: findComponent(fm) }))
    .sort((a, b) => b.rpn - a.rpn)
    .slice(0, 10);

  // --- HEADER SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...colors.gray900);
  doc.text('Executive Summary Report', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...colors.gray700);
  doc.text(`Asset: ${project.asset?.name || 'N/A'}`, 20, y);
  y += 5;

  doc.setFontSize(9);
  doc.setTextColor(...colors.gray500);
  const standards = project.asset?.context || 'IEC 60812 (FMEA)';
  const owner = project.asset?.assetId || 'N/A';
  doc.text(`Standards: ${standards} • Owner: ${owner}`, 20, y);
  y += 10;

  // --- EXECUTIVE SUMMARY SNAPSHOT (Solid Accent Color) ---
  const summaryBoxY = y;
  const summaryBoxHeight = 40;

  // Draw solid accent background
  doc.setFillColor(...colors.accent);
  doc.rect(20, summaryBoxY, pageWidth - 40, summaryBoxHeight, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...colors.white);
  doc.text('Executive Summary Snapshot', 25, summaryBoxY + 8);

  // 4 metric boxes
  const boxWidth = (pageWidth - 50) / 4;
  const boxHeight = 22;
  const boxY = summaryBoxY + 14;
  const boxSpacing = 2;

  const summaryMetrics = [
    { label: 'Components', value: totalComponents.toString() },
    { label: 'Failure Modes', value: totalFailureModes.toString() },
    { label: 'Avg RPN', value: avgRPN.toString() },
    { label: 'Actions Complete', value: `${completionRate}%` }
  ];

  summaryMetrics.forEach((metric, i) => {
    const boxX = 25 + i * (boxWidth + boxSpacing);

    // Draw semi-transparent white box with border
    doc.setDrawColor(255, 255, 255, 0.2);
    doc.setFillColor(255, 255, 255, 0.15);
    doc.roundedRect(boxX, boxY, boxWidth - boxSpacing, boxHeight, 2, 2, 'FD');

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255, 0.8);
    doc.text(metric.label, boxX + 3, boxY + 5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...colors.white);
    doc.text(metric.value, boxX + 3, boxY + 15);
  });

  y = summaryBoxY + summaryBoxHeight + 12;

  // --- THREE METRIC CARDS ---
  const cardWidth = (pageWidth - 50) / 3;
  const cardHeight = 22;
  const cardSpacing = 3;

  // Card 1: Highest Risk (red border)
  doc.setDrawColor(...colors.red);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, y, cardWidth - cardSpacing, cardHeight, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray500);
  doc.text('HIGHEST RISK', 24, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...colors.red);
  doc.text(highestRPN.toString(), 24, y + 16);

  // Card 2: Open Actions (gray border)
  doc.setDrawColor(...colors.gray200);
  doc.roundedRect(20 + cardWidth, y, cardWidth - cardSpacing, cardHeight, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray500);
  doc.text('OPEN ACTIONS', 24 + cardWidth, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...colors.gray900);
  doc.text(openActions.toString(), 24 + cardWidth, y + 16);

  // Card 3: Progress (gray border)
  doc.setDrawColor(...colors.gray200);
  doc.roundedRect(20 + cardWidth * 2, y, cardWidth - cardSpacing, cardHeight, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.gray500);
  doc.text('PROGRESS', 24 + cardWidth * 2, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...colors.gray900);
  doc.text(`${completionRate}%`, 24 + cardWidth * 2, y + 16);

  y += cardHeight + 12;

  // --- TOP RISKS TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...colors.gray900);
  doc.text('Top Risks', 20, y);
  y += 8;

  // Table header
  const tableX = 20;
  const tableWidth = pageWidth - 40;
  const colWidths = [60, 40, 15, 15, 15, 20];
  const rowHeight = 8;

  // Header background
  doc.setFillColor(...colors.gray50);
  doc.rect(tableX, y, tableWidth, rowHeight, 'F');

  // Header border
  doc.setDrawColor(...colors.gray200);
  doc.setLineWidth(0.3);
  doc.rect(tableX, y, tableWidth, rowHeight, 'D');

  // Header text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...colors.gray700);
  const headers = ['Failure Mode', 'Component', 'SEV', 'OCC', 'DET', 'RPN'];
  let colX = tableX + 3;
  headers.forEach((header, i) => {
    doc.text(header, colX, y + 6);
    colX += colWidths[i];
  });

  y += rowHeight;

  // Table rows
  sortedFailureModes.forEach((row, idx) => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    // Row border
    doc.setDrawColor(...colors.gray200);
    doc.rect(tableX, y, tableWidth, rowHeight, 'D');

    // Row data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.gray900);

    const fm = row.failureMode;
    const sev = fm.effects?.[0]?.severity || '-';
    const occ = fm.causes?.[0]?.occurrence || '-';
    const det = fm.controls?.[0]?.detection || '-';

    colX = tableX + 3;

    // Truncate failure mode if too long
    const fmText = fm.failure_mode.length > 30 ? fm.failure_mode.substring(0, 27) + '...' : fm.failure_mode;
    doc.text(fmText, colX, y + 6);
    colX += colWidths[0];

    doc.setTextColor(...colors.gray700);
    doc.text(row.component?.name || 'N/A', colX, y + 6);
    colX += colWidths[1];

    doc.setTextColor(...colors.gray900);
    doc.text(sev.toString(), colX, y + 6);
    colX += colWidths[2];

    doc.text(occ.toString(), colX, y + 6);
    colX += colWidths[3];

    doc.text(det.toString(), colX, y + 6);
    colX += colWidths[4];

    doc.setFont('helvetica', 'bold');
    doc.text(row.rpn.toString(), colX, y + 6);

    y += rowHeight;
  });

  // --- DASHBOARD CHARTS SECTION ---
  // Generate charts from data and add them to PDF
  console.log('=== CHART GENERATION DEBUG ===');
  console.log('Components:', components?.length || 0);
  console.log('Failure Modes:', failureModes?.length || 0);
  console.log('First component:', components?.[0] ? { id: components[0].id, name: components[0].name, hasFailureModes: !!components[0].failureModes } : 'none');

  if (components && components.length > 0 && failureModes.length > 0) {
    console.log('✓ Starting chart generation...');
    try {
      // Heat Map - Portrait
      console.log('Generating heat map chart...');
      const heatMapBuffer = await generateHeatMapChart(components, failureModes);
      console.log('✓ Heat map generated, buffer size:', heatMapBuffer.length);

      doc.addPage('portrait');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...colors.gray900);
      doc.text('Heat Map', 20, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.gray700);
      doc.text('Component failure modes by risk level', 20, 27);

      const heatMapImage = `data:image/png;base64,${heatMapBuffer.toString('base64')}`;
      // Calculate dimensions to maintain aspect ratio (1200x800 = 3:2)
      const chartAspectRatio = 1200 / 800; // 1.5
      const availableWidth = pageWidth - 40;
      const availableHeight = pageHeight - 70;
      let imgWidth = availableWidth;
      let imgHeight = imgWidth / chartAspectRatio;

      // If height exceeds available space, scale by height instead
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight * chartAspectRatio;
      }

      // Center the image
      const imgX = 20 + (availableWidth - imgWidth) / 2;
      doc.addImage(heatMapImage, 'PNG', imgX, 35, imgWidth, imgHeight);
      console.log('✓ Heat map added to PDF');

      // Risk Bubble Chart - Portrait
      const bubbleBuffer = await generateBubbleChart(failureModes);
      doc.addPage('portrait');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...colors.gray900);
      doc.text('Risk Bubble Chart', 20, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.gray700);
      doc.text('Severity vs Occurrence with RPN magnitude', 20, 27);

      const bubbleImage = `data:image/png;base64,${bubbleBuffer.toString('base64')}`;
      // Recalculate for new page
      imgWidth = availableWidth;
      imgHeight = imgWidth / chartAspectRatio;
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight * chartAspectRatio;
      }
      const bubbleImgX = 20 + (availableWidth - imgWidth) / 2;
      doc.addImage(bubbleImage, 'PNG', bubbleImgX, 35, imgWidth, imgHeight);

      // Top Risks Chart - Landscape (if chartData available)
      if (chartData && chartData.topRisks && chartData.topRisks.length > 0) {
        const topRisksBuffer = await generateTopRisksChart(chartData.topRisks);
        doc.addPage('landscape');
        const landscapeWidth = doc.internal.pageSize.width;
        const landscapeHeight = doc.internal.pageSize.height;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...colors.gray900);
        doc.text('Top 10 Risks', 20, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.gray700);
        doc.text('Highest RPN failure modes', 20, 27);

        const topRisksImage = `data:image/png;base64,${topRisksBuffer.toString('base64')}`;
        // Calculate for landscape orientation
        const lAvailableWidth = landscapeWidth - 40;
        const lAvailableHeight = landscapeHeight - 70;
        let lImgWidth = lAvailableWidth;
        let lImgHeight = lImgWidth / chartAspectRatio;
        if (lImgHeight > lAvailableHeight) {
          lImgHeight = lAvailableHeight;
          lImgWidth = lImgHeight * chartAspectRatio;
        }
        const topRisksImgX = 20 + (lAvailableWidth - lImgWidth) / 2;
        doc.addImage(topRisksImage, 'PNG', topRisksImgX, 35, lImgWidth, lImgHeight);
      }

      // Risk Distribution - Portrait
      const riskDistBuffer = await generateRiskDistributionChart(failureModes);
      doc.addPage('portrait');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...colors.gray900);
      doc.text('Risk Distribution', 20, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.gray700);
      doc.text('Severity, Occurrence, and Detection distributions', 20, 27);

      const riskDistImage = `data:image/png;base64,${riskDistBuffer.toString('base64')}`;
      // Recalculate for new portrait page
      imgWidth = availableWidth;
      imgHeight = imgWidth / chartAspectRatio;
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight * chartAspectRatio;
      }
      const riskDistImgX = 20 + (availableWidth - imgWidth) / 2;
      doc.addImage(riskDistImage, 'PNG', riskDistImgX, 35, imgWidth, imgHeight);

      // Pareto Chart - Landscape
      const paretoBuffer = await generateParetoChart(failureModes);
      doc.addPage('landscape');
      const landscapeWidth = doc.internal.pageSize.width;
      const landscapeHeight = doc.internal.pageSize.height;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...colors.gray900);
      doc.text('Pareto Analysis', 20, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.gray700);
      doc.text('Cumulative risk contribution by failure mode', 20, 27);

      const paretoImage = `data:image/png;base64,${paretoBuffer.toString('base64')}`;
      // Calculate for landscape orientation
      let pAvailableWidth = landscapeWidth - 40;
      let pAvailableHeight = landscapeHeight - 70;
      let pImgWidth = pAvailableWidth;
      let pImgHeight = pImgWidth / chartAspectRatio;
      if (pImgHeight > pAvailableHeight) {
        pImgHeight = pAvailableHeight;
        pImgWidth = pImgHeight * chartAspectRatio;
      }
      const paretoImgX = 20 + (pAvailableWidth - pImgWidth) / 2;
      doc.addImage(paretoImage, 'PNG', paretoImgX, 35, pImgWidth, pImgHeight);

      // Top Mitigations - Landscape
      const mitigationsBuffer = await generateTopMitigationsChart(failureModes);
      doc.addPage('landscape');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...colors.gray900);
      doc.text('Top-Performing Mitigations', 20, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.gray700);
      doc.text('Actions with highest RPN reduction', 20, 27);

      const mitigationsImage = `data:image/png;base64,${mitigationsBuffer.toString('base64')}`;
      // Calculate for landscape orientation
      let mAvailableWidth = landscapeWidth - 40;
      let mAvailableHeight = landscapeHeight - 70;
      let mImgWidth = mAvailableWidth;
      let mImgHeight = mImgWidth / chartAspectRatio;
      if (mImgHeight > mAvailableHeight) {
        mImgHeight = mAvailableHeight;
        mImgWidth = mImgHeight * chartAspectRatio;
      }
      const mitigationsImgX = 20 + (mAvailableWidth - mImgWidth) / 2;
      doc.addImage(mitigationsImage, 'PNG', mitigationsImgX, 35, mImgWidth, mImgHeight);

      // Action Status - Portrait (if chartData available)
      if (chartData && chartData.actionStatus && chartData.actionStatus.length > 0) {
        const actionStatusBuffer = await generateActionStatusChart(chartData.actionStatus);
        doc.addPage('portrait');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...colors.gray900);
        doc.text('Action Status Distribution', 20, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.gray700);
        doc.text('Current status of mitigation actions', 20, 27);

        const actionStatusImage = `data:image/png;base64,${actionStatusBuffer.toString('base64')}`;
        // Recalculate for new portrait page
        imgWidth = availableWidth;
        imgHeight = imgWidth / chartAspectRatio;
        if (imgHeight > availableHeight) {
          imgHeight = availableHeight;
          imgWidth = imgHeight * chartAspectRatio;
        }
        const actionStatusImgX = 20 + (availableWidth - imgWidth) / 2;
        doc.addImage(actionStatusImage, 'PNG', actionStatusImgX, 35, imgWidth, imgHeight);
      }
      console.log('✓ All charts generated successfully');
    } catch (error) {
      console.error('✗ Failed to generate charts:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      // Continue with PDF generation without charts
    }
  } else {
    console.log('✗ Skipping chart generation - conditions not met');
  }

  // Helper function to add footer to any page
  const addFooter = (yPos: number, pageW: number, isLandscape: boolean = false) => {
    if (!exportMetadata) return yPos;

    const footerY = isLandscape ? (doc.internal.pageSize.height - 10) : (pageHeight - 10);

    // Border line
    doc.setDrawColor(...colors.gray200);
    doc.setLineWidth(0.3);
    doc.line(20, footerY - 3, pageW - 20, footerY - 3);

    // Footer content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...colors.gray500);

    // Left: Prepared by
    const preparedBy = exportMetadata.owner || 'Platform Superadmin';
    doc.text(`Prepared by: ${preparedBy}`, 20, footerY);

    // Center: Date/time
    const dateTime = new Date().toLocaleString();
    const centerX = pageW / 2;
    doc.text(dateTime, centerX, footerY, { align: 'center' });

    // Right: Generator
    doc.text('Generated by NextGenMaint – AI-Assisted FMEA Builder', pageW - 20, footerY, { align: 'right' });

    return footerY + 5;
  };

  // Add footer to first portrait page
  y = addFooter(y, pageWidth);

  // Add Smart Table in Landscape orientation (if components provided)
  if (components && components.length > 0) {
    doc.addPage('a4', 'landscape');
    const landscapeWidth = doc.internal.pageSize.width;
    const landscapeHeight = doc.internal.pageSize.height;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...colors.gray900);
    doc.text('Full Smart Table (Expanded)', 20, 20);

    // Table setup for landscape
    const tableY = 30;
    const colWidths = [25, 30, 20, 35, 15, 15, 15, 15, 20]; // Adjusted for landscape
    const headers = [
      'Component',
      'Failure Mode',
      'Owner',
      'Effect',
      'SEV',
      'OCC',
      'DET',
      'RPN',
      'Action Status'
    ];

    // Header row
    doc.setFillColor(...colors.gray50);
    doc.rect(20, tableY, landscapeWidth - 40, 8, 'F');
    doc.setDrawColor(...colors.gray200);
    doc.rect(20, tableY, landscapeWidth - 40, 8, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.gray700);
    let colX = 23;
    headers.forEach((header, i) => {
      const maxWidth = colWidths[i] - 4;
      const lines = doc.splitTextToSize(header, maxWidth);
      doc.text(lines, colX, tableY + 5);
      colX += colWidths[i];
    });

    let tableRowY = tableY + 8;

    // Populate rows
    components.forEach((component) => {
      if (component.failureModes && component.failureModes.length > 0) {
        component.failureModes.forEach((fm) => {
          if (fm.effects && fm.effects.length > 0) {
            fm.effects.forEach((effect) => {
              // Check if we need a new page (leave space for footer)
              if (tableRowY > landscapeHeight - 30) {
                // Add footer to current landscape page before moving to next
                addFooter(landscapeHeight - 15, landscapeWidth, true);
                doc.addPage('a4', 'landscape');
                tableRowY = 20;
              }

              // Row border
              doc.setDrawColor(...colors.gray200);
              doc.rect(20, tableRowY, landscapeWidth - 40, 8, 'D');

              // Row data
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7);
              doc.setTextColor(...colors.gray900);

              const rpnPre = effect.severity * (effect.occurrence || 5) * (effect.detection || 5);
              const actionStatus = (effect as any).action_status || 'Not Started';

              const rowData = [
                component.name,
                fm.failure_mode,
                fm.owner || '',
                effect.description,
                effect.severity.toString(),
                (effect.occurrence || 5).toString(),
                (effect.detection || 5).toString(),
                rpnPre.toString(),
                actionStatus
              ];

              colX = 23;
              rowData.forEach((data, i) => {
                const maxWidth = colWidths[i] - 4;
                const lines = doc.splitTextToSize(data, maxWidth);
                doc.text(lines[0] || '', colX, tableRowY + 5);
                colX += colWidths[i];
              });

              tableRowY += 8;
            });
          }
        });
      }
    });

    // Add footer to last landscape page
    addFooter(landscapeHeight - 15, landscapeWidth, true);
  }

  // --- COMPLIANCE & ACTION LIST SECTION (After Smart Table) ---
  if (exportMetadata && (exportMetadata.includeCompliance || exportMetadata.includeActions)) {
    // Add new portrait page for Compliance & Actions
    doc.addPage('a4', 'portrait');
    let portraitY = 20;

    const boxWidth = (pageWidth - 50) / 2; // Two columns
    const boxHeight = 50;
    const boxSpacing = 5;

    // Compliance References (Left)
    if (exportMetadata.includeCompliance && exportMetadata.standards) {
      const boxX = 20;

      // Border and background
      doc.setDrawColor(...colors.gray200);
      doc.setFillColor(...colors.gray50);
      doc.roundedRect(boxX, portraitY, boxWidth - boxSpacing, boxHeight, 2, 2, 'FD');

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...colors.gray900);
      doc.text('Compliance References', boxX + 4, portraitY + 6);

      // Standards list
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...colors.gray700);
      let yOffset = portraitY + 12;

      exportMetadata.standards.forEach((standard) => {
        doc.text(`• ${standard}`, boxX + 4, yOffset);
        yOffset += 5;
      });

      // Additional items
      doc.text('• Company Methodology v1.2', boxX + 4, yOffset);
      yOffset += 5;
      doc.text('• Audit Trail ID: DEMO-12345', boxX + 4, yOffset);
    }

    // Action List Summary (Right)
    if (exportMetadata.includeActions) {
      const boxX = 20 + boxWidth;

      // Border and background
      doc.setDrawColor(...colors.gray200);
      doc.setFillColor(...colors.gray50);
      doc.roundedRect(boxX, portraitY, boxWidth - boxSpacing, boxHeight, 2, 2, 'FD');

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...colors.gray900);
      doc.text('Action List (Summary)', boxX + 4, portraitY + 6);

      // Action stats
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...colors.gray700);
      let yOffset = portraitY + 12;

      doc.text(`Open actions: ${exportMetadata.openActions || 0}`, boxX + 4, yOffset);
      yOffset += 5;
      doc.text(`Completed: ${exportMetadata.completionRate || 0}%`, boxX + 4, yOffset);
      yOffset += 5;
      doc.text('Overdue: 0', boxX + 4, yOffset);
    }

    portraitY += boxHeight + 10;

    // Add footer to this page
    addFooter(portraitY, pageWidth);
  }

  // Return the PDF document for server-side or client-side handling
  // When called from API route, the route will extract the buffer
  // When called from client, it will save directly
  if (typeof window === 'undefined') {
    // Server-side: return doc for API route to handle
    return doc;
  } else {
    // Client-side: save directly (legacy support)
    const filename = `FMEA_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    return doc;
  }
}

// Export to Excel
export function exportToExcel(
  project: Project,
  failureModes: FailureMode[],
  metrics?: DashboardMetrics,
  chartData?: ChartData,
  components?: Component[]
) {
  const workbook = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const executiveData = [
    ['EXECUTIVE SUMMARY REPORT'],
    [''],
    ['Project:', project.name],
    ['Asset:', project.asset?.name || 'N/A'],
    ['Generated:', new Date().toLocaleString()],
    ['Prepared By:', project.asset?.context || 'N/A'],
    [''],
    ['KEY METRICS'],
    ['Total Components:', components?.length || 0],
    ['Total Failure Modes:', failureModes.length],
    ['Average RPN:', metrics?.averageRPN || 0],
    ['High Risk Modes (>150):', metrics?.highRiskModes || 0],
    ['Critical Modes (>200):', metrics?.criticalModes || 0],
    ['Open Actions:', metrics?.openActions || 0],
    ['Completed Actions:', metrics?.completedActions || 0],
    ['Completion Rate:', metrics?.completedActions && metrics?.openActions
      ? `${Math.round((metrics.completedActions / (metrics.completedActions + metrics.openActions)) * 100)}%`
      : '0%'
    ]
  ];

  const executiveSheet = XLSX.utils.aoa_to_sheet(executiveData);
  XLSX.utils.book_append_sheet(workbook, executiveSheet, 'Executive Summary');

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
      maxRPN.toString(),
      (fm.causes?.length || 0).toString(),
      (fm.effects?.length || 0).toString(),
      (fm.controls?.length || 0).toString(),
      (fm.actions?.length || 0).toString(),
      new Date(fm.created_at).toLocaleDateString()
    ]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Failure Modes Summary');

  // 2. Full Smart Table Sheet (Expanded Hierarchy)
  const smartTableData = [
    [
      'Component',
      'Component Function',
      'Failure Mode',
      'Failure Mode Owner',
      'Effect Description',
      'Severity (Pre)',
      'Potential Cause',
      'Occurrence (Pre)',
      'Current Design Controls',
      'Detection (Pre)',
      'Justification (Pre)',
      'RPN (Pre)',
      'Recommended Actions',
      'Justification (Post)',
      'Responsible',
      'Action Status',
      'Severity (Post)',
      'Occurrence (Post)',
      'Detection (Post)',
      'RPN (Post)'
    ]
  ];

  // Populate Smart Table with full hierarchy
  if (components && components.length > 0) {
    components.forEach(component => {
      if (component.failureModes && component.failureModes.length > 0) {
        component.failureModes.forEach(fm => {
          if (fm.effects && fm.effects.length > 0) {
            fm.effects.forEach(effect => {
              smartTableData.push([
                component.name,
                component.function || '',
                fm.failure_mode,
                fm.owner || '',
                effect.description,
                effect.severity,
                effect.potential_cause || '',
                effect.occurrence || 5,
                effect.current_design || '',
                effect.detection || 5,
                effect.justification_pre || '',
                effect.severity * (effect.occurrence || 5) * (effect.detection || 5),
                effect.recommended_actions || '',
                effect.justification_post || '',
                effect.responsible || '',
                effect.action_status || 'Not Started',
                effect.severity_post || effect.severity,
                effect.occurrence_post || (effect.occurrence || 5),
                effect.detection_post || (effect.detection || 5),
                (effect.severity_post || effect.severity) *
                  (effect.occurrence_post || (effect.occurrence || 5)) *
                  (effect.detection_post || (effect.detection || 5))
              ]);
            });
          }
        });
      }
    });
  }

  const smartTableSheet = XLSX.utils.aoa_to_sheet(smartTableData);
  // Set column widths for better readability
  smartTableSheet['!cols'] = [
    { wch: 20 }, // Component
    { wch: 25 }, // Component Function
    { wch: 30 }, // Failure Mode
    { wch: 15 }, // Owner
    { wch: 35 }, // Effect Description
    { wch: 10 }, // SEV Pre
    { wch: 35 }, // Potential Cause
    { wch: 10 }, // OCC Pre
    { wch: 30 }, // Current Design
    { wch: 10 }, // DET Pre
    { wch: 30 }, // Justification Pre
    { wch: 10 }, // RPN Pre
    { wch: 35 }, // Recommended Actions
    { wch: 30 }, // Justification Post
    { wch: 15 }, // Responsible
    { wch: 15 }, // Action Status
    { wch: 10 }, // SEV Post
    { wch: 10 }, // OCC Post
    { wch: 10 }, // DET Post
    { wch: 10 }  // RPN Post
  ];
  XLSX.utils.book_append_sheet(workbook, smartTableSheet, 'Smart Table (Full)');

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
          cause.occurrence.toString(),
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
          effect.severity.toString(),
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
          control.detection.toString(),
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

  // 3. Dashboard Metrics Sheet
  const metricsData = [
    ['DASHBOARD METRICS'],
    [''],
    ['Risk Distribution'],
    ['Risk Level', 'Count', 'Percentage']
  ];

  if (chartData?.riskDistribution) {
    chartData.riskDistribution.forEach(item => {
      metricsData.push([item.range, item.count, `${item.percentage}%`]);
    });
  }

  metricsData.push([''], ['Action Status Distribution'], ['Status', 'Count', 'Percentage']);

  if (chartData?.actionStatus) {
    chartData.actionStatus.forEach(item => {
      metricsData.push([item.status, item.count, `${item.percentage}%`]);
    });
  }

  metricsData.push([''], ['Top 10 Risks by RPN']);
  metricsData.push(['Rank', 'Failure Mode', 'Component', 'RPN']);

  const topRisks = failureModes
    .map(fm => {
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
      return { fm, rpn: maxRPN };
    })
    .sort((a, b) => b.rpn - a.rpn)
    .slice(0, 10);

  topRisks.forEach((item, idx) => {
    const component = components?.find(c => c.id === item.fm.component_id);
    metricsData.push([
      idx + 1,
      item.fm.failure_mode,
      component?.name || 'N/A',
      item.rpn
    ]);
  });

  const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
  XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Dashboard Metrics');

  // 4. Action Tracking Sheet
  const actionTrackingData = [
    ['ACTION TRACKING'],
    [''],
    ['Failure Mode', 'Component', 'Effect', 'Recommended Action', 'Responsible', 'Action Status', 'RPN (Pre)', 'RPN (Post)', 'Risk Reduction']
  ];

  if (components && components.length > 0) {
    components.forEach(component => {
      if (component.failureModes && component.failureModes.length > 0) {
        component.failureModes.forEach(fm => {
          if (fm.effects && fm.effects.length > 0) {
            fm.effects.forEach(effect => {
              const rpnPre = effect.severity * (effect.occurrence || 5) * (effect.detection || 5);
              const rpnPost = (effect.severity_post || effect.severity) *
                (effect.occurrence_post || (effect.occurrence || 5)) *
                (effect.detection_post || (effect.detection || 5));
              const riskReduction = rpnPre - rpnPost;

              if (effect.recommended_actions && effect.recommended_actions.trim()) {
                actionTrackingData.push([
                  fm.failure_mode,
                  component.name,
                  effect.description,
                  effect.recommended_actions,
                  effect.responsible || 'Unassigned',
                  effect.action_status || 'Not Started',
                  rpnPre,
                  rpnPost,
                  riskReduction
                ]);
              }
            });
          }
        });
      }
    });
  }

  const actionTrackingSheet = XLSX.utils.aoa_to_sheet(actionTrackingData);
  actionTrackingSheet['!cols'] = [
    { wch: 30 }, // Failure Mode
    { wch: 20 }, // Component
    { wch: 35 }, // Effect
    { wch: 40 }, // Recommended Action
    { wch: 15 }, // Responsible
    { wch: 15 }, // Action Status
    { wch: 10 }, // RPN Pre
    { wch: 10 }, // RPN Post
    { wch: 15 }  // Risk Reduction
  ];
  XLSX.utils.book_append_sheet(workbook, actionTrackingSheet, 'Action Tracking');

  // Risk Distribution Sheet (if chart data available)
  if (chartData?.riskDistribution) {
    const riskData = [
      ['Risk Level', 'Count', 'Percentage']
    ];
    
    chartData.riskDistribution.forEach(item => {
      riskData.push([item.range, item.count.toString(), `${item.percentage}%`]);
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
      actionData.push([item.status, item.count.toString(), `${item.percentage}%`]);
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