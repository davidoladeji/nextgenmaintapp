'use client';

import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { FailureMode } from '@/types';

interface ParetoChartProps {
  failureModes: FailureMode[];
  onBarClick?: (failureModeId: string) => void;
}

export default function ParetoChart({ failureModes, onBarClick }: ParetoChartProps) {
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

  // Prepare data with all failure modes sorted
  const allData = failureModes
    .map((fm) => ({
      name: fm.failure_mode.length > 30 ? fm.failure_mode.substring(0, 30) + '...' : fm.failure_mode,
      fullName: fm.failure_mode,
      rpn: calculateMaxRPN(fm),
      failureMode: fm,
    }))
    .filter((d) => d.rpn > 0)
    .sort((a, b) => b.rpn - a.rpn);

  // Take top 6 and aggregate the rest into "Others" to ensure Others bar is visible
  const topItems = allData.slice(0, 6);
  const remainingItems = allData.slice(6);

  // Calculate total RPN including all items
  const totalRPN = allData.reduce((sum, item) => sum + item.rpn, 0);

  // Create "Others" entry if there are remaining items
  const data = [...topItems];
  if (remainingItems.length > 0) {
    const othersRPN = remainingItems.reduce((sum, item) => sum + item.rpn, 0);
    data.push({
      name: `Others (${remainingItems.length})`,
      fullName: `${remainingItems.length} other failure modes`,
      rpn: othersRPN,
      failureMode: null as any,
      isOthers: true,
      count: remainingItems.length,
    } as any);
  }

  // Calculate cumulative percentage
  let cumulativeRPN = 0;
  const chartData = data.map((item) => {
    cumulativeRPN += item.rpn;
    const cumulativePercent = (cumulativeRPN / totalRPN) * 100;

    return {
      ...item,
      cumulativePercent: Math.round(cumulativePercent * 10) / 10,
    };
  });

  // Custom tick component for wrapped text labels
  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const words = payload.value.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    // Wrap text to max 15 chars per line
    words.forEach((word: string) => {
      if ((currentLine + word).length <= 15) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);

    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, i) => (
          <text
            key={i}
            x={0}
            y={i * 12}
            dy={8}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={10}
            className="dark:fill-slate-400"
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isOthers = data.isOthers;

      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-slate-100 mb-2">{data.fullName}</p>
          <div className="text-sm text-gray-700 dark:text-slate-300 space-y-1">
            <div><span className="font-medium">RPN:</span> {data.rpn}</div>
            <div><span className="font-medium">Contribution:</span> {((data.rpn / totalRPN) * 100).toFixed(1)}%</div>
            <div><span className="font-medium">Cumulative:</span> {data.cumulativePercent}%</div>
            {isOthers && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-600 text-xs text-gray-600 dark:text-slate-400">
                Aggregated {data.count} failure modes
              </div>
            )}
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Pareto Chart</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Top failure modes by RPN with cumulative percentage
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-8 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-600 dark:text-slate-400">RPN</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600 dark:text-slate-400">Cumulative %</span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-96 flex items-center justify-center text-gray-500 dark:text-slate-400">
          No failure modes with RPN data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
            <XAxis
              dataKey="name"
              height={100}
              tick={<CustomXAxisTick />}
              interval={0}
              stroke="#6b7280"
              className="dark:stroke-slate-400"
            />
            <YAxis
              yAxisId="left"
              label={{ value: 'RPN', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              className="dark:stroke-slate-400"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              label={{ value: 'Cumulative %', angle: 90, position: 'insideRight', fill: '#6b7280' }}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              className="dark:stroke-slate-400"
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            <Bar
              yAxisId="left"
              dataKey="rpn"
              fill="#f97316"
              name="RPN"
              onClick={(data) => !data.isOthers && onBarClick?.(data.failureMode.id)}
              cursor="pointer"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="natural"
              dataKey="cumulativePercent"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Cumulative %"
              dot={{ fill: '#3b82f6', r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 dark:text-blue-400 font-semibold text-xs mt-0.5">💡</div>
          <div className="text-xs text-blue-800 dark:text-blue-300">
            <span className="font-semibold">Pareto Principle (80/20 Rule):</span> The cumulative line shows which failure modes contribute most to total risk. Focus mitigation efforts where the curve rises steeply.
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 dark:text-slate-400 text-center">
        Click on individual failure mode bars to filter Smart Table
      </div>
    </div>
  );
}
