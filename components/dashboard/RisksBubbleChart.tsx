'use client';

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { FailureMode, Component } from '@/types';

interface RisksBubbleChartProps {
  failureModes: (FailureMode & { component?: Component })[];
  onBubbleClick?: (failureModeId: string) => void;
}

export default function RisksBubbleChart({ failureModes, onBubbleClick }: RisksBubbleChartProps) {
  const calculateMaxRPN = (failureMode: FailureMode) => {
    if (!failureMode.causes?.length || !failureMode.effects?.length) return { rpn: 0, sev: 0, occ: 0, det: 10 };

    let maxRPN = 0;
    let maxSev = 0;
    let maxOcc = 0;
    let maxDet = 10;

    for (const cause of failureMode.causes) {
      for (const effect of failureMode.effects) {
        const detection = failureMode.controls?.length
          ? Math.min(...failureMode.controls.map(c => c.detection))
          : 10;
        const rpn = effect.severity * cause.occurrence * detection;

        if (rpn > maxRPN) {
          maxRPN = rpn;
          maxSev = effect.severity;
          maxOcc = cause.occurrence;
          maxDet = detection;
        }
      }
    }
    return { rpn: maxRPN, sev: maxSev, occ: maxOcc, det: maxDet };
  };

  // Prepare data for bubble chart
  const chartData = failureModes
    .map((fm) => {
      const { rpn, sev, occ, det } = calculateMaxRPN(fm);
      return {
        name: fm.failure_mode,
        x: occ, // Occurrence on X-axis
        y: sev, // Severity on Y-axis
        z: rpn, // RPN determines bubble size
        det,
        rpn,
        component: (fm as any).component?.name || 'Unknown',
        failureMode: fm,
      };
    })
    .filter((d) => d.rpn > 0)
    .sort((a, b) => b.rpn - a.rpn)
    .slice(0, 20); // Show top 20

  const getBubbleColor = (rpn: number) => {
    if (rpn > 150) return '#ef4444'; // red-500
    if (rpn > 100) return '#f97316'; // orange-500
    if (rpn > 70) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  };

  // Non-linear scale: compress 0-4 to 1 tile, spread 4-10 across remaining scale
  // Custom ticks for non-linear scale
  const customTicks = [0, 4, 5, 6, 7, 8, 9, 10];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{data.name}</p>
          <div className="text-sm text-gray-700 dark:text-slate-300 space-y-1">
            <div><span className="font-medium">Component:</span> {data.component}</div>
            <div><span className="font-medium">Pre-RPN:</span> {data.rpn}</div>
            <div className="flex items-center space-x-2 text-xs mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
              <span>SEV: {data.y}</span>
              <span>×</span>
              <span>OCC: {data.x}</span>
              <span>×</span>
              <span>DET: {data.det}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Risks Bubble Chart</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">Bubble size represents RPN magnitude</p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-slate-400">&lt;70</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-slate-400">70-99</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-slate-400">100-150</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-slate-400">&gt;150</span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-96 flex items-center justify-center text-gray-500 dark:text-slate-400">
          No failure modes with RPN data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={450}>
          <ScatterChart margin={{ top: 30, right: 30, bottom: 80, left: 80 }}>
            <XAxis
              type="number"
              dataKey="x"
              name="Occurrence"
              domain={[0, 10]}
              ticks={customTicks}
              label={{ value: 'Occurrence (OCC)', position: 'bottom', offset: 40, fill: '#6b7280' }}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              stroke="#6b7280"
              className="dark:stroke-slate-400"
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Severity"
              domain={[0, 10]}
              ticks={customTicks}
              label={{ value: 'Severity (SEV)', angle: -90, position: 'left', offset: 40, fill: '#6b7280' }}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              stroke="#6b7280"
              className="dark:stroke-slate-400"
            />
            <ZAxis type="number" dataKey="z" range={[100, 3000]} name="RPN" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter
              name="Failure Modes"
              data={chartData}
              onClick={(data) => onBubbleClick?.(data.failureMode.id)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBubbleColor(entry.rpn)} opacity={0.7} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 text-xs text-gray-500 dark:text-slate-400 text-center">
        Click on bubbles to filter Smart Table • Showing top 20 risks
      </div>
    </div>
  );
}
