import { FailureMode, Component, ChartData as DashboardChartData } from '@/types';

const width = 1200;
const height = 800;

// Lazy load chart renderer to avoid loading on client-side
let chartJSNodeCanvas: any = null;

async function getChartRenderer() {
  if (!chartJSNodeCanvas) {
    // Only import on server-side
    if (typeof window === 'undefined') {
      const { ChartJSNodeCanvas } = await import('chartjs-node-canvas');
      chartJSNodeCanvas = new ChartJSNodeCanvas({
        width,
        height,
        backgroundColour: 'white',
      });
    } else {
      throw new Error('Chart generation is only available on the server-side');
    }
  }
  return chartJSNodeCanvas;
}

// RPN color scheme matching dashboard
function getRPNColor(rpn: number): string {
  if (rpn > 150) return '#ef4444'; // red-500
  if (rpn >= 100) return '#f97316'; // orange-500
  if (rpn >= 70) return '#eab308'; // yellow-500
  return '#22c55e'; // green-500
}

// Calculate max RPN for a failure mode (PRE-mitigation)
function calculateMaxRPN(failureMode: FailureMode): number {
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
}

// Calculate POST-mitigation RPN from actions (matching bubble chart logic)
function calculatePostRPN(failureMode: FailureMode): { rpn: number; sev: number; occ: number; det: number } {
  if (!failureMode.actions || failureMode.actions.length === 0) {
    return { rpn: 0, sev: 0, occ: 0, det: 10 };
  }

  let maxRPN = 0;
  let maxSev = 0;
  let maxOcc = 0;
  let maxDet = 10;

  for (const action of failureMode.actions) {
    const sev = action.postActionSeverity || 0;
    const occ = action.postActionOccurrence || 0;
    const det = action.postActionDetection || 10;
    const rpn = sev * occ * det;

    if (rpn > maxRPN && sev > 0 && occ > 0) {
      maxRPN = rpn;
      maxSev = sev;
      maxOcc = occ;
      maxDet = det;
    }
  }
  return { rpn: maxRPN, sev: maxSev, occ: maxOcc, det: maxDet };
}

/**
 * Generate Heat Map chart image
 * Takes components and separate failureModes array, groups them together
 */
export async function generateHeatMapChart(components: Component[], allFailureModes?: FailureMode[]): Promise<Buffer> {
  const renderer = await getChartRenderer();

  // Prepare data for up to 4 components (matching dashboard display)
  const topComponents = components.slice(0, 4);

  // Create datasets - one for each component
  const datasets = topComponents.map((component) => {
    const componentFailureModes = allFailureModes
      ? allFailureModes.filter(fm => fm.component_id === component.id)
      : (component.failureModes || []);

    // Get up to 6 failure modes per component (matching dashboard)
    const fmData = componentFailureModes.slice(0, 6).map((fm) => {
      const rpn = calculateMaxRPN(fm);
      return {
        x: fm.failure_mode.length > 20 ? fm.failure_mode.substring(0, 20) + '...' : fm.failure_mode,
        y: rpn,
        rpn,
      };
    });

    return {
      label: component.name,
      data: fmData,
      backgroundColor: fmData.map(d => getRPNColor(d.rpn)),
      borderColor: '#ffffff',
      borderWidth: 2,
    };
  });

  const configuration: any = {
    type: 'bar',
    data: { datasets },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: 'Heat Map - Component Failure Modes by Risk Level',
          font: { size: 20, weight: 'bold' },
          padding: { bottom: 20 },
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: { size: 12 },
            padding: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return `${context.dataset.label}: RPN ${context.parsed.x}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'RPN (Risk Priority Number)',
            font: { size: 14 },
          },
          grid: {
            color: '#e5e7eb',
          },
        },
        y: {
          grid: {
            display: false,
          },
        },
      },
    },
  };

  return await renderer.renderToBuffer(configuration);
}

/**
 * Generate Risk Bubble Chart (POST-mitigation)
 * Matches dashboard bubble chart with POST-mitigation RPN
 */
export async function generateBubbleChart(failureModes: FailureMode[]): Promise<Buffer> {
  const renderer = await getChartRenderer();

  // Use POST-mitigation RPN (matching dashboard logic)
  const chartData = failureModes
    .map((fm) => {
      const postData = calculatePostRPN(fm);

      // Filter only Medium, High, Critical (RPN >= 70)
      if (postData.rpn < 70) return null;

      return {
        x: postData.occ,
        y: postData.sev,
        r: Math.sqrt(postData.rpn) * 1.5, // Scale bubble size
        label: fm.failure_mode.length > 30 ? fm.failure_mode.substring(0, 30) + '...' : fm.failure_mode,
        rpn: postData.rpn,
      };
    })
    .filter((d) => d !== null)
    .sort((a, b) => b!.rpn - a!.rpn)
    .slice(0, 20);

  // Create dataset with color-coded bubbles by RPN
  const bubbleDataset = {
    label: 'Failure Modes (POST-mitigation)',
    data: chartData,
    backgroundColor: chartData.map(d => {
      const color = getRPNColor(d!.rpn);
      // Add transparency
      return color + '99'; // 60% opacity
    }),
    borderColor: chartData.map(d => getRPNColor(d!.rpn)),
    borderWidth: 2,
  };

  const configuration: any = {
    type: 'bubble',
    data: {
      datasets: [bubbleDataset],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: 'Risk Bubble Chart - POST-Mitigation RPN',
          font: { size: 20, weight: 'bold' },
          padding: { bottom: 20 },
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const data = context.raw;
              return [
                data.label,
                `POST-RPN: ${data.rpn}`,
                `Severity: ${data.y}, Occurrence: ${data.x}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Occurrence (OCC)',
            font: { size: 14 },
          },
          min: 1.7,
          max: 10.3,
          ticks: {
            stepSize: 1,
            callback: function(value: any) {
              return value >= 2 && value <= 10 ? value : '';
            }
          },
          grid: {
            color: '#e5e7eb',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Severity (SEV)',
            font: { size: 14 },
          },
          min: 1.7,
          max: 10.3,
          ticks: {
            stepSize: 1,
            callback: function(value: any) {
              return value >= 2 && value <= 10 ? value : '';
            }
          },
          grid: {
            color: '#e5e7eb',
          },
        },
      },
    },
  };

  return await renderer.renderToBuffer(configuration);
}

/**
 * Generate Top Risks Bar Chart
 */
export async function generateTopRisksChart(chartData: DashboardChartData['topRisks']): Promise<Buffer> {
  const renderer = await getChartRenderer();

  // Truncate long failure mode names for better display
  const labels = chartData.map((r) =>
    r.failureMode.length > 40 ? r.failureMode.substring(0, 40) + '...' : r.failureMode
  );
  const rpnData = chartData.map((r) => r.rpn);

  const configuration: any = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'RPN',
          data: rpnData,
          backgroundColor: rpnData.map((rpn) => getRPNColor(rpn)),
          borderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: 'Top 10 Risks by RPN',
          font: { size: 20, weight: 'bold' },
          padding: { bottom: 20 },
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return `RPN: ${context.parsed.x}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'RPN (Risk Priority Number)',
            font: { size: 14 },
          },
          grid: {
            color: '#e5e7eb',
          },
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            font: { size: 11 },
          },
        },
      },
    },
  };

  return await renderer.renderToBuffer(configuration);
}

/**
 * Generate Risk Distribution Chart (SEV, OCC, DET)
 * Displays grouped bar chart showing distribution across severity, occurrence, and detection
 */
export async function generateRiskDistributionChart(failureModes: FailureMode[]): Promise<Buffer> {
  const renderer = await getChartRenderer();

  // Calculate distributions
  const sevCounts = [0, 0, 0]; // Low (1-3), Medium (4-7), High (8-10)
  const occCounts = [0, 0, 0];
  const detCounts = [0, 0, 0];

  failureModes.forEach((fm) => {
    if (fm.effects?.length) {
      const sev = fm.effects[0].severity;
      if (sev <= 3) sevCounts[0]++;
      else if (sev <= 7) sevCounts[1]++;
      else sevCounts[2]++;
    }

    if (fm.causes?.length) {
      const occ = fm.causes[0].occurrence;
      if (occ <= 3) occCounts[0]++;
      else if (occ <= 7) occCounts[1]++;
      else occCounts[2]++;
    }

    const det = fm.controls?.length
      ? Math.min(...fm.controls.map(c => c.detection))
      : 10;
    if (det <= 3) detCounts[0]++;
    else if (det <= 7) detCounts[1]++;
    else detCounts[2]++;
  });

  const configuration: any = {
    type: 'bar',
    data: {
      labels: ['Low (1-3)', 'Medium (4-7)', 'High (8-10)'],
      datasets: [
        {
          label: 'Severity',
          data: sevCounts,
          backgroundColor: '#ef4444',
          borderColor: '#ffffff',
          borderWidth: 1,
        },
        {
          label: 'Occurrence',
          data: occCounts,
          backgroundColor: '#f97316',
          borderColor: '#ffffff',
          borderWidth: 1,
        },
        {
          label: 'Detection',
          data: detCounts,
          backgroundColor: '#eab308',
          borderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: 'Risk Distribution - Severity, Occurrence, Detection',
          font: { size: 20, weight: 'bold' },
          padding: { bottom: 20 },
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: { size: 12 },
            padding: 15,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          title: {
            display: true,
            text: 'Count',
            font: { size: 14 },
          },
          grid: {
            color: '#e5e7eb',
          },
          beginAtZero: true,
        },
      },
    },
  };

  return await renderer.renderToBuffer(configuration);
}

/**
 * Generate Pareto Chart
 * Shows cumulative risk contribution with bars and line
 */
export async function generateParetoChart(failureModes: FailureMode[]): Promise<Buffer> {
  const renderer = await getChartRenderer();

  const sortedByRPN = failureModes
    .map((fm) => ({
      name: fm.failure_mode.length > 25 ? fm.failure_mode.substring(0, 25) + '...' : fm.failure_mode,
      rpn: calculateMaxRPN(fm),
    }))
    .filter(fm => fm.rpn > 0)
    .sort((a, b) => b.rpn - a.rpn)
    .slice(0, 10);

  const totalRPN = sortedByRPN.reduce((sum, fm) => sum + fm.rpn, 0);
  let cumulative = 0;
  const cumulativePercentages = sortedByRPN.map((fm) => {
    cumulative += fm.rpn;
    return (cumulative / totalRPN) * 100;
  });

  const configuration: any = {
    type: 'bar',
    data: {
      labels: sortedByRPN.map((fm) => fm.name),
      datasets: [
        {
          label: 'RPN',
          data: sortedByRPN.map((fm) => fm.rpn),
          backgroundColor: sortedByRPN.map(fm => getRPNColor(fm.rpn)),
          borderColor: '#ffffff',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Cumulative %',
          data: cumulativePercentages,
          type: 'line',
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: 'Pareto Analysis - Cumulative Risk Contribution',
          font: { size: 20, weight: 'bold' },
          padding: { bottom: 20 },
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: { size: 12 },
            padding: 15,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: { size: 10 },
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'RPN',
            font: { size: 14 },
          },
          grid: {
            color: '#e5e7eb',
          },
          beginAtZero: true,
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Cumulative %',
            font: { size: 14 },
          },
          max: 100,
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  };

  return await renderer.renderToBuffer(configuration as any);
}

/**
 * Generate Top Mitigations Chart
 * Shows actions with highest RPN reduction
 */
export async function generateTopMitigationsChart(failureModes: FailureMode[]): Promise<Buffer> {
  const renderer = await getChartRenderer();

  const mitigationsData: Array<{
    description: string;
    rpnReduction: number;
  }> = [];

  failureModes.forEach((fm) => {
    const rpnPre = calculateMaxRPN(fm);
    if (fm.actions && fm.actions.length > 0) {
      fm.actions.forEach((action) => {
        if (action.postActionSeverity && action.postActionOccurrence && action.postActionDetection) {
          const rpnPost =
            action.postActionSeverity * action.postActionOccurrence * action.postActionDetection;
          if (rpnPre > rpnPost) {
            const desc = action.description || 'Untitled Action';
            mitigationsData.push({
              description: desc.length > 35 ? desc.substring(0, 35) + '...' : desc,
              rpnReduction: rpnPre - rpnPost,
            });
          }
        }
      });
    }
  });

  const topMitigations = mitigationsData
    .sort((a, b) => b.rpnReduction - a.rpnReduction)
    .slice(0, 10);

  const configuration: any = {
    type: 'bar',
    data: {
      labels: topMitigations.map((m) => m.description),
      datasets: [
        {
          label: 'RPN Reduction',
          data: topMitigations.map((m) => m.rpnReduction),
          backgroundColor: topMitigations.map((m) => {
            if (m.rpnReduction > 100) return '#10b981'; // green-500
            if (m.rpnReduction > 50) return '#22c55e'; // green-500
            return '#6ee7b7'; // green-300
          }),
          borderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: 'Top-Performing Mitigations (RPN Reduction)',
          font: { size: 20, weight: 'bold' },
          padding: { bottom: 20 },
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return `RPN Reduction: ${context.parsed.x}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'RPN Reduction (ΔRPN)',
            font: { size: 14 },
          },
          grid: {
            color: '#e5e7eb',
          },
          beginAtZero: true,
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            font: { size: 10 },
          },
        },
      },
    },
  };

  return await renderer.renderToBuffer(configuration);
}

/**
 * Generate Action Status Donut Chart
 * Matches dashboard action status display
 */
export async function generateActionStatusChart(chartData: DashboardChartData['actionStatus']): Promise<Buffer> {
  const renderer = await getChartRenderer();

  const labels = chartData.map((s) => s.status);
  const counts = chartData.map((s) => s.count);
  const percentages = chartData.map((s) => s.percentage);

  // Match dashboard colors: Open (amber), In Progress (blue), Completed (green)
  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#6b7280'];

  const configuration: any = {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: 'Action Status Distribution',
          font: { size: 20, weight: 'bold' },
          padding: { bottom: 20 },
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: { size: 12 },
            padding: 15,
            generateLabels: function(chart: any) {
              const data = chart.data;
              return data.labels.map((label: string, i: number) => ({
                text: `${label}: ${counts[i]} (${percentages[i]}%)`,
                fillStyle: data.datasets[0].backgroundColor[i],
                hidden: false,
                index: i
              }));
            }
          },
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage = percentages[context.dataIndex] || 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
    },
  };

  return await renderer.renderToBuffer(configuration);
}

// Helper function to get consistent colors
function getColor(index: number): string {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];
  return colors[index % colors.length];
}
