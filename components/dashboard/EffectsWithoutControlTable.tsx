'use client';

import { FailureMode, Component } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface EffectsWithoutControlTableProps {
  failureModes: (FailureMode & { component?: Component })[];
  onRowClick?: (failureMode: FailureMode) => void;
}

export default function EffectsWithoutControlTable({ failureModes, onRowClick }: EffectsWithoutControlTableProps) {
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

  // Find failure modes without controls or with "No Control" designation
  const failureModesWithoutControl = failureModes
    .filter((fm) => {
      // Check if there are no controls or controls are marked as ineffective
      const hasNoControls = !fm.controls || fm.controls.length === 0;
      const hasNoControlDesignation = fm.controls?.some(c =>
        c.description.toLowerCase().includes('no control') ||
        c.description.toLowerCase().includes('none')
      );
      return hasNoControls || hasNoControlDesignation;
    })
    .map((fm) => {
      const metrics = calculateMaxRPN(fm);
      return {
        failureMode: fm,
        component: (fm as any).component?.name || 'Unknown',
        ...metrics,
      };
    })
    .sort((a, b) => b.rpn - a.rpn)
    .slice(0, 5); // Top 5 gaps

  const getRPNColorClass = (rpn: number) => {
    if (rpn > 150) return 'bg-red-100 text-red-800 border-red-300';
    if (rpn > 100) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (rpn > 70) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getStatusBadge = (fm: FailureMode) => {
    if (!fm.actions || fm.actions.length === 0) {
      return <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">No Control</span>;
    }
    const openActions = fm.actions.filter(a => a.status === 'open' || a.status === 'in-progress');
    if (openActions.length > 0) {
      return <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">Actions Pending</span>;
    }
    return <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">Under Review</span>;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Top 5 Effects Without Control</h3>
            <p className="text-sm text-gray-600">Failure modes requiring immediate control implementation</p>
          </div>
        </div>
      </div>

      {failureModesWithoutControl.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-gray-900 mb-1">Great! All failure modes have controls</p>
            <p className="text-sm">Continue monitoring for new failure modes requiring controls</p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Component</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Failure Mode</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Effect</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">SEV</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">OCC</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">DET</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">RPN</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {failureModesWithoutControl.map((item, index) => (
                  <tr
                    key={index}
                    onClick={() => onRowClick?.(item.failureMode)}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{item.component}</td>
                    <td className="px-4 py-3 text-gray-700">{item.failureMode.failure_mode}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.failureMode.effects && item.failureMode.effects.length > 0
                        ? item.failureMode.effects[0].description
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{item.sev}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{item.occ}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{item.det}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${getRPNColorClass(item.rpn)}`}>
                        {item.rpn}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(item.failureMode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="text-red-600 font-semibold text-xs mt-0.5">⚠</div>
              <div className="text-xs text-red-800">
                <span className="font-semibold">Action Required:</span> These failure modes lack adequate controls, leaving them vulnerable.
                Implement prevention or detection controls to reduce OCC/DET and lower RPN.
              </div>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500 text-center">
            Click on rows to view details and add controls • Showing top 5 control gaps
          </div>
        </>
      )}
    </div>
  );
}
