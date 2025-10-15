'use client';

import { FailureMode } from '@/types';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import RPNBadge from './RPNBadge';

interface FailureModeRowProps {
  failureMode: FailureMode;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAddEffect: () => void;
  children?: React.ReactNode;
}

/**
 * FailureModeRow Component (Level 2)
 * Represents a failure mode nested under a component
 *
 * Display Format:
 * ▶ Failure Mode: [Name] | RPN (Pre): [Value] | [# Effects] | RPN (Post): [Value] | Owner: [Name] | [+ Effect]
 */
export default function FailureModeRow({
  failureMode,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onAddEffect,
  children
}: FailureModeRowProps) {
  const effectsCount = failureMode.effects?.length || 0;

  // Calculate RPN (Pre-mitigation)
  const calculateRPNPre = (): number => {
    if (!failureMode.causes || !failureMode.effects ||
        failureMode.causes.length === 0 || failureMode.effects.length === 0) {
      return 0;
    }

    let maxRPN = 0;
    failureMode.causes.forEach(cause => {
      failureMode.effects?.forEach(effect => {
        const detection = failureMode.controls?.length
          ? Math.min(...failureMode.controls.map(c => c.detection))
          : 10;
        const rpn = effect.severity * cause.occurrence * detection;
        if (rpn > maxRPN) maxRPN = rpn;
      });
    });

    return maxRPN;
  };

  // Calculate RPN (Post-mitigation)
  const calculateRPNPost = (): number => {
    if (!failureMode.effects || failureMode.effects.length === 0) {
      return 0;
    }

    let maxRPN = 0;
    failureMode.effects.forEach(effect => {
      if (effect.severity_post && effect.occurrence_post && effect.detection_post) {
        const rpn = effect.severity_post * effect.occurrence_post * effect.detection_post;
        if (rpn > maxRPN) maxRPN = rpn;
      }
    });

    return maxRPN;
  };

  const rpnPre = calculateRPNPre();
  const rpnPost = calculateRPNPost();

  // Get owner from first action if available
  const owner = failureMode.actions && failureMode.actions.length > 0
    ? failureMode.actions[0].owner
    : '-';

  return (
    <div
      className={`bg-white rounded-md border transition-all duration-200 ${
        isSelected
          ? 'border-orange-500 shadow-sm'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      {/* Failure Mode Header */}
      <div
        className={`px-4 py-2.5 cursor-pointer select-none transition-colors duration-200 ${
          isExpanded ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
        }`}
        onClick={() => {
          onToggle();
          onSelect();
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {/* Expand/Collapse Button */}
            <button
              className="text-gray-600 hover:text-gray-900 transition-colors p-0.5 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Failure Mode Info - Grid Layout */}
            <div className="flex-1 grid grid-cols-12 gap-2 items-center text-sm">
              {/* Failure Mode Name */}
              <div className="col-span-4">
                <span className="font-medium text-gray-900">
                  Failure Mode: <span className="text-gray-700">{failureMode.failure_mode}</span>
                </span>
              </div>

              {/* RPN Pre */}
              <div className="col-span-2 flex items-center space-x-1">
                <span className="text-xs text-gray-600">RPN (Pre):</span>
                <RPNBadge rpn={rpnPre} showLabel={false} size="sm" />
              </div>

              {/* Effects Count */}
              <div className="col-span-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                  {effectsCount} Effect{effectsCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* RPN Post */}
              <div className="col-span-2 flex items-center space-x-1">
                <span className="text-xs text-gray-600">RPN (Post):</span>
                {rpnPost > 0 ? (
                  <RPNBadge rpn={rpnPost} showLabel={false} size="sm" />
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </div>

              {/* Owner */}
              <div className="col-span-2">
                <span className="text-xs text-gray-600">Owner: <span className="text-gray-900">{owner}</span></span>
              </div>
            </div>

            {/* Add Effect Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
                onAddEffect();
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Effect</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content - Effects Table */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {effectsCount === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-gray-500 mb-2 text-xs">No effects added to this failure mode yet</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                  onAddEffect();
                }}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Effect</span>
              </button>
            </div>
          ) : (
            <div>{children}</div>
          )}
        </div>
      )}
    </div>
  );
}
