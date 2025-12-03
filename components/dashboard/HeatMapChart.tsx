'use client';

import { Component, FailureMode } from '@/types';
import { useRiskSettings } from '@/lib/stores/riskSettingsStore';

interface HeatMapChartProps {
  components: Component[];
  onFilterClick?: (componentId: string, failureModeId?: string) => void;
}

export default function HeatMapChart({ components, onFilterClick }: HeatMapChartProps) {
  const { getRPNColor: getGlobalRPNColor } = useRiskSettings();

  const getRPNColor = (rpn: number) => {
    const hexColor = getGlobalRPNColor(rpn);
    // Convert hex to Tailwind bg classes with hover states
    const colorMap: Record<string, string> = {
      '#22c55e': 'bg-green-500 hover:bg-green-600',
      '#eab308': 'bg-yellow-500 hover:bg-yellow-600',
      '#f97316': 'bg-orange-500 hover:bg-orange-600',
      '#ef4444': 'bg-red-500 hover:bg-red-600',
    };
    return colorMap[hexColor] || 'bg-gray-500 hover:bg-gray-600';
  };

  const getRPNTextColor = (rpn: number) => {
    const hexColor = getGlobalRPNColor(rpn);
    const colorMap: Record<string, string> = {
      '#22c55e': 'text-green-800',
      '#eab308': 'text-yellow-800',
      '#f97316': 'text-orange-800',
      '#ef4444': 'text-red-800',
    };
    return colorMap[hexColor] || 'text-gray-800';
  };

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

  // Show only top 4 components for better visualization
  const topComponents = components.slice(0, 4);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Heat Map</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">Component failure modes by risk level</p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-slate-400">&lt;70</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-600 dark:text-slate-400">70-99</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-600 dark:text-slate-400">100-150</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-slate-400">&gt;150</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {topComponents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            No components data available
          </div>
        ) : (
          topComponents.map((component) => (
            <div key={component.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{component.name}</h4>
                  {component.description && (
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">{component.description}</p>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400 ml-4">
                  {component.failureModes?.length || 0} FM{(component.failureModes?.length || 0) !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Failure Modes as colored tiles */}
              <div className="flex flex-wrap gap-2">
                {component.failureModes && component.failureModes.length > 0 ? (
                  component.failureModes.slice(0, 6).map((fm) => {
                    const rpn = calculateMaxRPN(fm);
                    return (
                      <button
                        key={fm.id}
                        onClick={() => onFilterClick?.(component.id, fm.id)}
                        className={`px-3 py-2 rounded text-white text-xs font-medium transition-all cursor-pointer ${getRPNColor(rpn)} relative group`}
                        title={`${fm.failure_mode} - RPN: ${rpn}`}
                      >
                        <div className="flex flex-col items-center">
                          <div className="font-bold">{rpn}</div>
                          <div className="text-[10px] opacity-90 max-w-[80px] truncate">{fm.failure_mode}</div>
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          <div className="font-semibold mb-1">{fm.failure_mode}</div>
                          <div>Component: {component.name}</div>
                          <div className={`font-bold ${getRPNTextColor(rpn)}`}>Pre-RPN: {rpn}</div>
                          {fm.causes && fm.causes[0] && (
                            <div className="mt-1 text-gray-300 text-[10px]">
                              SEV: {fm.effects?.[0]?.severity || '-'} ×
                              OCC: {fm.causes[0].occurrence} ×
                              DET: {fm.controls?.[0]?.detection || 10}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-xs text-gray-400 dark:text-slate-500 italic py-1">No failure modes</div>
                )}
                {component.failureModes && component.failureModes.length > 10 && (
                  <div className="px-3 py-2 rounded bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-medium">
                    +{component.failureModes.length - 10} more
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {components.length > 4 && (
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-slate-400">
          Showing top 4 of {components.length} components
        </div>
      )}
    </div>
  );
}
