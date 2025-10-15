'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FailureMode, Action } from '@/types';

interface TopMitigationsChartProps {
  failureModes: FailureMode[];
  onBarClick?: (failureModeId: string) => void;
}

export default function TopMitigationsChart({ failureModes, onBarClick }: TopMitigationsChartProps) {
  const calculateRPNPre = (failureMode: FailureMode) => {
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

  const calculateRPNPost = (action: Action) => {
    if (!action.postActionSeverity || !action.postActionOccurrence || !action.postActionDetection) {
      return null;
    }
    return action.postActionSeverity * action.postActionOccurrence * action.postActionDetection;
  };

  // Collect all actions with RPN reduction
  const mitigationsData: Array<{
    action: Action;
    failureMode: FailureMode;
    rpnPre: number;
    rpnPost: number;
    rpnReduction: number;
    component: string;
  }> = [];

  failureModes.forEach((fm) => {
    if (fm.actions && fm.actions.length > 0) {
      const rpnPre = calculateRPNPre(fm);
      fm.actions.forEach((action) => {
        const rpnPost = calculateRPNPost(action);
        if (rpnPost !== null && rpnPre > rpnPost) {
          mitigationsData.push({
            action,
            failureMode: fm,
            rpnPre,
            rpnPost,
            rpnReduction: rpnPre - rpnPost,
            component: (fm as any).component?.name || 'Unknown',
          });
        }
      });
    }
  });

  // Sort by RPN reduction and take top 10
  const topMitigations = mitigationsData
    .sort((a, b) => b.rpnReduction - a.rpnReduction)
    .slice(0, 10)
    .map((item) => ({
      ...item,
      name: item.action.description.length > 40
        ? item.action.description.substring(0, 40) + '...'
        : item.action.description,
      fullDescription: item.action.description,
    }));

  const getBarColor = (reduction: number) => {
    if (reduction > 100) return '#22c55e'; // green-500
    if (reduction > 50) return '#84cc16'; // lime-500
    return '#a3e635'; // lime-400
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg max-w-sm">
          <p className="font-semibold text-gray-900 mb-2">{data.fullDescription}</p>
          <div className="text-sm text-gray-700 space-y-1">
            <div><span className="font-medium">Component:</span> {data.component}</div>
            <div><span className="font-medium">Failure Mode:</span> {data.failureMode.failure_mode}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <span>RPN: <span className="font-semibold text-orange-600">{data.rpnPre}</span> → <span className="font-semibold text-green-600">{data.rpnPost}</span></span>
              <span className="ml-3 font-bold text-green-600">ΔRPN: {data.rpnReduction}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              <div><span className="font-medium">Owner:</span> {data.action.owner || 'Not assigned'}</div>
              <div><span className="font-medium">Status:</span> {data.action.status}</div>
            </div>
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
          <h3 className="text-lg font-semibold text-gray-900">Top-Performing Mitigations</h3>
          <p className="text-sm text-gray-600">Actions with highest RPN reduction (ΔRPN)</p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">ΔRPN &gt; 100</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-lime-500 rounded"></div>
            <span className="text-gray-600">ΔRPN 50-100</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-lime-400 rounded"></div>
            <span className="text-gray-600">ΔRPN &lt; 50</span>
          </div>
        </div>
      </div>

      {topMitigations.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="mb-2">No completed mitigations with post-action RPN data yet</p>
            <p className="text-sm">Add post-action SEV, OCC, and DET values to track mitigation effectiveness</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={topMitigations}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 200, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              label={{ value: 'RPN Reduction (ΔRPN)', position: 'bottom' }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={190}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
            <Bar
              dataKey="rpnReduction"
              onClick={(data) => onBarClick?.(data.failureMode.id)}
              cursor="pointer"
              radius={[0, 4, 4, 0]}
            >
              {topMitigations.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.rpnReduction)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <div className="text-green-600 font-semibold text-xs mt-0.5">✓</div>
          <div className="text-xs text-green-800">
            <span className="font-semibold">Effective Mitigations:</span> These actions achieved the greatest risk reduction. Consider applying similar strategies to other high-risk failure modes.
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        Click on bars to view action details • Showing top 10 mitigations
      </div>
    </div>
  );
}
