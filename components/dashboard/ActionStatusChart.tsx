'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartData } from '@/types';

interface ActionStatusChartProps {
  data: ChartData['actionStatus'];
}

const COLORS = {
  'Open': '#f59e0b',
  'In Progress': '#3b82f6', 
  'Completed': '#10b981',
  'Cancelled': '#6b7280'
};

export default function ActionStatusChart({ data }: ActionStatusChartProps) {
  const chartData = data.filter(item => item.count > 0);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Status Distribution</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No actions defined
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.status}</p>
          <p className="text-sm text-gray-600">Count: {data.count}</p>
          <p className="text-sm text-gray-600">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Action Status Distribution</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentage }) => `${percentage}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend with clear one-glance text */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-900">
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[entry.status as keyof typeof COLORS] }}
              />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{entry.status}</span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}