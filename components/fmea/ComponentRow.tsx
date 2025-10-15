'use client';

import { Component, FailureMode } from '@/types';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import RPNBadge from './RPNBadge';

interface ComponentRowProps {
  component: Component;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAddFailureMode: () => void;
  children?: React.ReactNode;
}

/**
 * ComponentRow Component (Level 1)
 * Represents the top-level component in the FMEA hierarchy
 *
 * Display Format:
 * ▶ COMPONENT: [Name] | Function: [Summary] | [# FM] | Highest RPN: [Value] | [+ Failure Mode]
 */
export default function ComponentRow({
  component,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onAddFailureMode,
  children
}: ComponentRowProps) {
  const failureModesCount = component.failureModes?.length || 0;

  // Calculate highest RPN from all failure modes
  const calculateHighestRPN = (): number => {
    if (!component.failureModes || component.failureModes.length === 0) return 0;

    let maxRPN = 0;
    component.failureModes.forEach(fm => {
      if (fm.causes && fm.effects && fm.causes.length > 0 && fm.effects.length > 0) {
        fm.causes.forEach(cause => {
          fm.effects.forEach(effect => {
            const detection = fm.controls?.length
              ? Math.min(...fm.controls.map(c => c.detection))
              : 10;
            const rpn = effect.severity * cause.occurrence * detection;
            if (rpn > maxRPN) maxRPN = rpn;
          });
        });
      }
    });

    return maxRPN;
  };

  const highestRPN = calculateHighestRPN();

  return (
    <div
      className={`bg-white rounded-lg border transition-all duration-200 mb-2 overflow-hidden ${
        isSelected
          ? 'border-blue-500 shadow-md'
          : 'border-gray-300 shadow-sm hover:border-gray-400'
      }`}
    >
      {/* Component Header */}
      <div
        className={`px-6 py-3 cursor-pointer select-none transition-colors duration-200 ${
          isExpanded ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
        }`}
        onClick={() => {
          onToggle();
          onSelect();
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Expand/Collapse Button */}
            <button
              className="text-gray-600 hover:text-gray-900 transition-colors p-1 rounded hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>

            {/* Component Info */}
            <div className="flex-1 flex items-center space-x-4 flex-wrap">
              <h3 className="text-base font-semibold text-gray-900">
                COMPONENT: {component.name}
              </h3>

              {component.function && (
                <span className="text-sm text-gray-600">
                  | Function: <span className="text-gray-900">{component.function}</span>
                </span>
              )}

              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                {failureModesCount} FM{failureModesCount !== 1 ? 's' : ''}
              </span>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Highest RPN:</span>
                <RPNBadge rpn={highestRPN} showLabel={false} size="sm" />
              </div>
            </div>

            {/* Add Failure Mode Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
                onAddFailureMode();
              }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Failure Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content - Failure Modes */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          {failureModesCount === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500 mb-3 text-sm">No failure modes in this component yet</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                  onAddFailureMode();
                }}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Failure Mode</span>
              </button>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
