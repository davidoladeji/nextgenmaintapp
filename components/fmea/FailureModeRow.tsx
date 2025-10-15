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
      className={`bg-white rounded-lg border transition-all duration-200 ${
        isSelected
          ? 'border-orange-500 shadow-md ring-2 ring-orange-200'
          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
      }`}
    >
      {/* Failure Mode Header */}
      <div
        className={`px-5 py-3 cursor-pointer select-none ${
          isExpanded ? 'bg-gradient-to-r from-orange-50 to-amber-50' : 'bg-white'
        } rounded-t-lg transition-colors duration-200`}
        onClick={() => {
          onToggle();
          onSelect();
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {/* Expand/Collapse Button */}
            <button
              className="text-gray-500 hover:text-gray-700 transition-colors p-0.5 rounded hover:bg-gray-100"
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

            {/* Failure Mode Info */}
            <div className="flex-1 grid grid-cols-12 gap-3 items-center">
              {/* Name - 4 columns */}
              <div className="col-span-4">
                <span className="text-sm font-semibold text-gray-900">
                  <span className="text-orange-600 mr-1">▶</span>
                  Failure Mode: <span className="text-orange-700">{failureMode.failure_mode}</span>
                </span>
              </div>

              {/* RPN (Pre) - 2 columns */}
              <div className="col-span-2 flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-600">RPN (Pre):</span>
                <RPNBadge rpn={rpnPre} showLabel={false} size="sm" />
              </div>

              {/* # Effects - 1 column */}
              <div className="col-span-1 text-center">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {effectsCount} Effect{effectsCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* RPN (Post) - 2 columns */}
              <div className="col-span-2 flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-600">RPN (Post):</span>
                {rpnPost > 0 ? (
                  <RPNBadge rpn={rpnPost} showLabel={false} size="sm" />
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </div>

              {/* Owner - 2 columns */}
              <div className="col-span-2">
                <span className="text-xs font-medium text-gray-600">Owner: </span>
                <span className="text-xs text-gray-900">{owner}</span>
              </div>

              {/* Add Effect Button - 1 column */}
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                    onAddEffect();
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-xs font-medium shadow-sm hover:shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Effect</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content - Effects Table */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white">
          {effectsCount === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500 mb-3 text-sm">No effects added yet</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                  onAddEffect();
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Effect</span>
              </button>
            </div>
          ) : (
            <div>
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
