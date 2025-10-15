'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartData } from '@/types';

interface TopRisksChartProps {
  data: ChartData['topRisks'];
  onBarClick?: (failureModeId: string) => void;
}

export default function TopRisksChart({ data, onBarClick }: TopRisksChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Risk Failure Modes</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No failure modes with calculated risk levels
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">RPN: <span className="font-medium">{data.rpn}</span></p>
            <p className="text-sm text-gray-600">Severity: <span className="font-medium">{data.severity}</span></p>
            <p className="text-sm text-gray-600">Occurrence: <span className="font-medium">{data.occurrence}</span></p>
            <p className="text-sm text-gray-600">Detection: <span className="font-medium">{data.detection}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (rpn: number) => {
    if (rpn >= 300) return '#ef4444'; // Critical - Red
    if (rpn >= 200) return '#f97316'; // High - Orange  
    if (rpn >= 100) return '#f59e0b'; // Medium - Yellow
    return '#10b981'; // Low - Green
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Risk Failure Modes</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="failureMode" 
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
              stroke="#6b7280"
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="rpn"
              fill={(entry: any) => getBarColor(entry.rpn)}
              radius={[4, 4, 0, 0]}
              onClick={(data: any) => onBarClick?.(data.failureModeId)}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}