'use client';

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartData } from '@/types';

interface RPNHeatmapChartProps {
  data: ChartData['rpnHeatmap'];
}

export default function RPNHeatmapChart({ data }: RPNHeatmapChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">RPN Risk Matrix</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No failure modes with calculated risk levels
        </div>
      </div>
    );
  }

  const getPointColor = (rpn: number) => {
    if (rpn >= 300) return '#dc2626'; // Critical - Dark Red
    if (rpn >= 200) return '#ea580c'; // High - Dark Orange
    if (rpn >= 100) return '#d97706'; // Medium - Dark Yellow
    if (rpn >= 50) return '#ca8a04';  // Medium-Low - Gold
    return '#059669'; // Low - Green
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <div className="space-y-1">
            <p className="font-medium text-gray-900">RPN: {data.rpn}</p>
            <p className="text-sm text-gray-600">Severity: {data.severity}</p>
            <p className="text-sm text-gray-600">Occurrence: {data.occurrence}</p>
            <p className="text-sm text-gray-600">Detection: {data.detection}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">RPN Risk Matrix</h3>
      <p className="text-sm text-gray-600 mb-4">
        Scatter plot showing relationship between Severity (X) and Occurrence (Y). Point size represents Detection difficulty.
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 60,
              left: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              type="number" 
              dataKey="severity" 
              name="Severity"
              domain={[0, 10]}
              stroke="#6b7280"
              fontSize={12}
              label={{ value: 'Severity', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle' } }}
            />
            <YAxis 
              type="number" 
              dataKey="occurrence" 
              name="Occurrence"
              domain={[0, 10]}
              stroke="#6b7280"
              fontSize={12}
              label={{ value: 'Occurrence', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            />
            <ZAxis 
              type="number" 
              dataKey="detection" 
              range={[50, 400]}
              name="Detection"
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Failure Modes" data={data} fill="#8884d8">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getPointColor(entry.rpn)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-600 mr-2"></div>
          <span className="text-gray-600">Low Risk (1-49)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-600 mr-2"></div>
          <span className="text-gray-600">Medium Risk (50-99)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-600 mr-2"></div>
          <span className="text-gray-600">High Risk (100-199)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
          <span className="text-gray-600">Critical Risk (200+)</span>
        </div>
      </div>
    </div>
  );
}