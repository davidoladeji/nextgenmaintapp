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
      className={`bg-white rounded-lg border-2 transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 shadow-lg'
          : 'border-gray-300 shadow-sm hover:border-gray-400 hover:shadow-md'
      }`}
    >
      {/* Component Header */}
      <div
        className={`px-6 py-4 cursor-pointer select-none ${
          isExpanded ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-white'
        } rounded-t-lg transition-colors duration-200`}
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
              <h3 className="text-lg font-bold text-gray-900">
                <span className="text-blue-600">▶</span> COMPONENT: {component.name}
              </h3>

              {component.function && (
                <span className="text-sm text-gray-700 font-medium">
                  | Function: <span className="text-blue-600">{component.function}</span>
                </span>
              )}

              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                {failureModesCount} Failure Mode{failureModesCount !== 1 ? 's' : ''}
              </span>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Highest RPN:</span>
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
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Failure Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content - Failure Modes */}
      {isExpanded && (
        <div className="border-t-2 border-gray-200 bg-gray-50">
          {failureModesCount === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500 mb-4 text-sm">No failure modes in this component yet</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                  onAddFailureMode();
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Failure Mode</span>
              </button>
            </div>
          ) : (
            <div className="p-4">
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
