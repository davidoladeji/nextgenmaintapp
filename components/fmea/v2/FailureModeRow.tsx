'use client';

import { ChevronRight, Plus } from 'lucide-react';
import { useFMEAStore } from '@/lib/stores/fmea-store';
import { RPNBadge } from './RPNBadge';
import { EffectsTable } from './EffectsTable';
import type { FailureMode } from '@/lib/types/fmea';

interface FailureModeRowProps {
  failureMode: FailureMode;
  onAddEffect: () => void;
}

export function FailureModeRow({ failureMode, onAddEffect }: FailureModeRowProps) {
  const {
    expandedState,
    toggleFailureModeExpanded,
    selectFailureMode,
    selectedState,
    getFailureModeViewModel,
  } = useFMEAStore();

  const isExpanded = expandedState.failureModes.has(failureMode.id);
  const isSelected = selectedState.failureModeId === failureMode.id;
  const viewModel = getFailureModeViewModel(failureMode.id);

  if (!viewModel) return null;

  const handleClick = () => {
    toggleFailureModeExpanded(failureMode.id);
    selectFailureMode(failureMode.id);
  };

  const handleAddEffect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectFailureMode(failureMode.id);
    onAddEffect();
  };

  return (
    <div className="ml-6 mb-2">
      {/* Failure Mode Header */}
      <div
        onClick={handleClick}
        className={`
          bg-gray-50 dark:bg-slate-700
          border border-gray-200 dark:border-slate-600
          rounded-lg
          p-3
          cursor-pointer
          transition-all duration-200
          hover:bg-gray-100 dark:hover:bg-slate-600
          hover:shadow-sm
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Expand/Collapse Icon */}
            <ChevronRight
              className={`
                w-5 h-5 flex-shrink-0 text-gray-600 dark:text-slate-400
                transition-transform duration-200
                ${isExpanded ? 'rotate-90' : ''}
              `}
            />

            {/* Failure Mode Name */}
            <span className="text-base font-semibold text-gray-900 dark:text-slate-100 truncate">
              Failure Mode: {viewModel.name}
            </span>

            {/* Separator */}
            <span className="text-gray-400 dark:text-slate-500">|</span>

            {/* RPN (Pre) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-slate-400">RPN (Pre):</span>
              <RPNBadge value={viewModel.rpnPre} showLabel={false} />
            </div>

            {/* Separator */}
            <span className="text-gray-400 dark:text-slate-500">|</span>

            {/* Effect Count */}
            <span className="text-sm text-gray-600 dark:text-slate-400">
              {viewModel.effectCount} {viewModel.effectCount === 1 ? 'Effect' : 'Effects'}
            </span>

            {/* Separator */}
            <span className="text-gray-400 dark:text-slate-500">|</span>

            {/* RPN (Post) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-slate-400">RPN (Post):</span>
              <RPNBadge value={viewModel.rpnPost} showLabel={false} />
            </div>

            {/* Separator */}
            <span className="text-gray-400 dark:text-slate-500">|</span>

            {/* Owner */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-slate-400">Owner:</span>
              <span className="text-sm text-gray-700 dark:text-slate-300">
                {viewModel.owner || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Add Effect Button */}
          <button
            onClick={handleAddEffect}
            className="
              flex items-center gap-1.5
              px-3 py-1.5
              text-sm font-medium
              text-white
              bg-orange-500 hover:bg-orange-600
              rounded-md
              transition-colors
              flex-shrink-0
              ml-4
            "
          >
            <Plus className="w-4 h-4" />
            Effect
          </button>
        </div>
      </div>

      {/* Expanded Content - Effects Table */}
      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <EffectsTable failureModeId={failureMode.id} />
        </div>
      )}
    </div>
  );
}
