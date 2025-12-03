'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FailureMode } from '@/types';

interface RiskDistributionChartProps {
  type: 'severity' | 'occurrence' | 'detection';
  failureModes: FailureMode[];
  title: string;
  inline?: boolean;
}

const COLORS = {
  'Low (1-3)': '#10b981',      // Green
  'Medium (4-7)': '#f59e0b',   // Yellow/Orange
  'High (8-10)': '#ef4444'     // Red
};

export default function RiskDistributionChart({ type, failureModes, title, inline = false }: RiskDistributionChartProps) {
  // Extract values based on type
  const extractValues = (): number[] => {
    const values: number[] = [];

    failureModes.forEach(fm => {
      if (type === 'severity' && fm.effects) {
        fm.effects.forEach(effect => values.push(effect.severity));
      } else if (type === 'occurrence' && fm.causes) {
        fm.causes.forEach(cause => values.push(cause.occurrence));
      } else if (type === 'detection' && fm.controls) {
        fm.controls.forEach(control => values.push(control.detection));
      }
    });

    return values;
  };

  const values = extractValues();

  // Group values into ranges
  const lowCount = values.filter(v => v >= 1 && v <= 3).length;
  const mediumCount = values.filter(v => v >= 4 && v <= 7).length;
  const highCount = values.filter(v => v >= 8 && v <= 10).length;
  const totalCount = lowCount + mediumCount + highCount;

  // Create chart data
  const chartData = [
    { range: 'Low (1-3)', count: lowCount, percentage: totalCount > 0 ? ((lowCount / totalCount) * 100).toFixed(1) : 0 },
    { range: 'Medium (4-7)', count: mediumCount, percentage: totalCount > 0 ? ((mediumCount / totalCount) * 100).toFixed(1) : 0 },
    { range: 'High (8-10)', count: highCount, percentage: totalCount > 0 ? ((highCount / totalCount) * 100).toFixed(1) : 0 },
  ].filter(item => item.count > 0);

  if (chartData.length === 0) {
    const content = (
      <>
        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
        <p className="text-xs text-gray-600 dark:text-slate-400 mb-4">Distribution</p>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-slate-400 text-sm">
          No data available
        </div>
      </>
    );

    return inline ? (
      <div>{content}</div>
    ) : (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
        {content}
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-slate-100 text-sm">{data.range}</p>
          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">Count: {data.count}</p>
          <p className="text-xs text-gray-600 dark:text-slate-400">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${percentage}%`}
      </text>
    );
  };

  // Chart content (shared between inline and standalone modes)
  const chartContent = (
    <>
      <div className="mb-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
        <p className="text-xs text-gray-600 dark:text-slate-400">Distribution</p>
      </div>

      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              innerRadius={50}
              outerRadius={85}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.range as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{totalCount}</div>
          <div className="text-xs text-gray-600 dark:text-slate-400">Total</div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 space-y-1">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[entry.range as keyof typeof COLORS] }}
              />
              <span className="text-gray-700 dark:text-slate-300">{entry.range}</span>
            </div>
            <span className="text-gray-600 dark:text-slate-400 font-medium">{entry.count}</span>
          </div>
        ))}
      </div>
    </>
  );

  return inline ? (
    <div className="flex flex-col">{chartContent}</div>
  ) : (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
      {chartContent}
    </div>
  );
}
