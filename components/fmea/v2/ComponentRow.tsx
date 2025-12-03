'use client';

import { ChevronRight, Plus } from 'lucide-react';
import { useFMEAStore } from '@/lib/stores/fmea-store';
import { FailureModeRow } from './FailureModeRow';
import type { Component } from '@/lib/types/fmea';
import { useRiskSettings } from '@/lib/stores/riskSettingsStore';

interface ComponentRowProps {
  component: Component;
  onAddFailureMode: () => void;
  onAddEffect: () => void;
}

export function ComponentRow({ component, onAddFailureMode, onAddEffect }: ComponentRowProps) {
  const {
    expandedState,
    toggleComponentExpanded,
    selectComponent,
    selectedState,
    getComponentViewModel,
  } = useFMEAStore();

  const { getRPNColor } = useRiskSettings();

  const isExpanded = expandedState.components.has(component.id);
  const isSelected = selectedState.componentId === component.id;
  const viewModel = getComponentViewModel(component.id);

  if (!viewModel) return null;

  const handleClick = () => {
    toggleComponentExpanded(component.id);
    selectComponent(component.id);
  };

  const handleAddFailureMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectComponent(component.id);
    onAddFailureMode();
  };

  // Truncate function text if it's too long
  const truncateFunction = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="mb-3">
      {/* Component Header */}
      <div
        onClick={handleClick}
        className={`
          relative
          bg-white dark:bg-slate-800
          border border-gray-200 dark:border-slate-700
          rounded-lg
          shadow-sm hover:shadow-md
          p-4
          cursor-pointer
          transition-all duration-200
          overflow-hidden
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
          before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-orange-500
        `}
      >
        <div className="flex items-center justify-between pl-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Expand/Collapse Icon */}
            <ChevronRight
              className={`
                w-5 h-5 flex-shrink-0 text-gray-600 dark:text-slate-400
                transition-transform duration-200
                ${isExpanded ? 'rotate-90' : ''}
              `}
            />

            {/* Component Name */}
            <span className="text-lg font-bold text-gray-900 dark:text-slate-100">
              COMPONENT: {viewModel.name}
            </span>

            {/* Separator */}
            <span className="text-gray-400 dark:text-slate-500">|</span>

            {/* Function */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-gray-600 dark:text-slate-400">Function:</span>
              <span className="text-sm text-gray-700 dark:text-slate-300 truncate">
                {truncateFunction(viewModel.function)}
              </span>
            </div>

            {/* Separator */}
            <span className="text-gray-400 dark:text-slate-500">|</span>

            {/* Failure Mode Count */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="
                px-2 py-0.5
                text-xs font-semibold
                bg-blue-100 dark:bg-blue-900/30
                text-blue-800 dark:text-blue-300
                rounded-full
              ">
                {viewModel.failureModeCount}
              </span>
              <span className="text-sm text-gray-600 dark:text-slate-400">
                {viewModel.failureModeCount === 1 ? 'Failure Mode' : 'Failure Modes'}
              </span>
            </div>

            {/* Separator */}
            <span className="text-gray-400 dark:text-slate-500">|</span>

            {/* Highest RPN */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-gray-600 dark:text-slate-400">Highest RPN:</span>
              <span
                className="px-2.5 py-1 text-sm font-bold rounded-md"
                style={{
                  backgroundColor: `${getRPNColor(viewModel.highestRPN)}20`,
                  color: getRPNColor(viewModel.highestRPN),
                }}
              >
                {viewModel.highestRPN}
              </span>
            </div>
          </div>

          {/* Add Failure Mode Button */}
          <button
            onClick={handleAddFailureMode}
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
            Failure Mode
          </button>
        </div>
      </div>

      {/* Expanded Content - Failure Mode Rows */}
      {isExpanded && (
        <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
          {viewModel.failureModes.length === 0 ? (
            <div className="ml-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg text-sm text-gray-600 dark:text-slate-400">
              No failure modes added yet. Click "+ Failure Mode" to add one.
            </div>
          ) : (
            viewModel.failureModes.map((failureMode) => (
              <FailureModeRow
                key={failureMode.id}
                failureMode={failureMode}
                onAddEffect={onAddEffect}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
