'use client';

import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
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

  // Prepare data for Pareto chart
  const data = failureModes
    .map((fm) => ({
      name: fm.failure_mode.length > 30 ? fm.failure_mode.substring(0, 30) + '...' : fm.failure_mode,
      fullName: fm.failure_mode,
      rpn: calculateMaxRPN(fm),
      failureMode: fm,
    }))
    .filter((d) => d.rpn > 0)
    .sort((a, b) => b.rpn - a.rpn)
    .slice(0, 10); // Top 10

  // Calculate cumulative percentage
  const totalRPN = data.reduce((sum, item) => sum + item.rpn, 0);
  let cumulativeRPN = 0;

  const chartData = data.map((item) => {
    cumulativeRPN += item.rpn;
    const cumulativePercent = (cumulativeRPN / totalRPN) * 100;
    return {
      ...item,
      cumulativePercent: Math.round(cumulativePercent * 10) / 10,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.fullName}</p>
          <div className="text-sm text-gray-700 space-y-1">
            <div><span className="font-medium">Pre-RPN:</span> {data.rpn}</div>
            <div><span className="font-medium">Contribution:</span> {((data.rpn / totalRPN) * 100).toFixed(1)}%</div>
            <div><span className="font-medium">Cumulative:</span> {data.cumulativePercent}%</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pareto Chart</h3>
          <p className="text-sm text-gray-600">Top 10 failure modes by RPN with cumulative percentage</p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-8 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-600">RPN</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span className="text-gray-600">Cumulative %</span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-96 flex items-center justify-center text-gray-500">
          No failure modes with RPN data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={120}
              tick={{ fontSize: 11 }}
              interval={0}
            />
            <YAxis
              yAxisId="left"
              label={{ value: 'RPN', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              label={{ value: 'Cumulative %', angle: 90, position: 'insideRight' }}
              tick={{ fontSize: 12 }}
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
              onClick={(data) => onBarClick?.(data.failureMode.id)}
              cursor="pointer"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulativePercent"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Cumulative %"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 font-semibold text-xs mt-0.5">💡</div>
          <div className="text-xs text-blue-800">
            <span className="font-semibold">Pareto Principle:</span> Focus mitigation efforts on the top failure modes that contribute to ~80% of total risk (cumulative RPN).
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        Click on bars to filter Smart Table
      </div>
    </div>
  );
}
