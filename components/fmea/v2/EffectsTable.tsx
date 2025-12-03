'use client';

import { useState } from 'react';
import { useFMEAStore } from '@/lib/stores/fmea-store';
import { useRPNCalculation } from '@/lib/hooks/useRPNCalculation';
import { RPNBadge } from './RPNBadge';
import type { Effect } from '@/lib/types/fmea';

interface EffectsTableProps {
  failureModeId: string;
}

export function EffectsTable({ failureModeId }: EffectsTableProps) {
  const { components, updateEffect } = useFMEAStore();
  const { formatRPN } = useRPNCalculation();

  // Find the failure mode and its effects
  const failureMode = components
    .flatMap((c) => c.failureModes)
    .find((fm) => fm.id === failureModeId);

  if (!failureMode) return null;

  const effects = failureMode.effects;

  if (effects.length === 0) {
    return (
      <div className="ml-12 mt-2 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg text-sm text-gray-600 dark:text-slate-400">
        No effects added yet. Click "+ Effect" to add one.
      </div>
    );
  }

  return (
    <div className="ml-12 mt-2">
      {/* Horizontal scroll container - CRITICAL for preventing page extension */}
      <div className="w-full overflow-x-auto overflow-y-visible rounded-lg border border-gray-200 dark:border-slate-700">
        <table className="min-w-full border-collapse bg-white dark:bg-slate-800">
          <thead className="bg-gray-100 dark:bg-slate-700 sticky top-0 z-10">
            <tr>
              {/* Pre-Mitigation Section */}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[200px]">
                Effects
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[60px]">
                SEV
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[180px]">
                Potential Cause
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[60px]">
                OCC
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[180px]">
                Current Design
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[60px]">
                DET
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[180px]">
                Justification (Pre)
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[120px]">
                RPN (Pre)
              </th>

              {/* Post-Mitigation Section */}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[200px]">
                Recommended Actions
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[180px]">
                Justification (Post)
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[150px]">
                Responsible
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[200px]">
                Action Taken & Completion Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[60px]">
                SEV (Post)
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[60px]">
                OCC (Post)
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[60px]">
                DET (Post)
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[120px]">
                RPN (Post)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800">
            {effects.map((effect, index) => (
              <EffectRow
                key={effect.id}
                effect={effect}
                isEven={index % 2 === 0}
                onUpdate={(updates) => updateEffect(effect.id, updates)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface EffectRowProps {
  effect: Effect;
  isEven: boolean;
  onUpdate: (updates: Partial<Effect>) => void;
}

function EffectRow({ effect, isEven, onUpdate }: EffectRowProps) {
  const { formatRPN } = useRPNCalculation();

  const rpnPreFormatted = formatRPN(effect.sev, effect.occ, effect.det);
  const rpnPostFormatted = formatRPN(effect.sevPost, effect.occPost, effect.detPost);

  return (
    <tr
      className={`
        border-b border-gray-200 dark:border-slate-700
        hover:bg-gray-50 dark:hover:bg-slate-700
        transition-colors
        ${isEven ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-800/50'}
      `}
    >
      {/* Pre-Mitigation Fields */}
      <EditableCell
        value={effect.effects}
        onSave={(value) => onUpdate({ effects: value })}
      />
      <NumberCell
        value={effect.sev}
        min={1}
        max={10}
        onSave={(value) => onUpdate({ sev: value })}
      />
      <EditableCell
        value={effect.potentialCause}
        onSave={(value) => onUpdate({ potentialCause: value })}
      />
      <NumberCell
        value={effect.occ}
        min={1}
        max={10}
        onSave={(value) => onUpdate({ occ: value })}
      />
      <EditableCell
        value={effect.currentDesign}
        onSave={(value) => onUpdate({ currentDesign: value })}
      />
      <NumberCell
        value={effect.det}
        min={1}
        max={10}
        onSave={(value) => onUpdate({ det: value })}
      />
      <EditableCell
        value={effect.justificationPre}
        onSave={(value) => onUpdate({ justificationPre: value })}
      />
      <td className="px-4 py-3 text-sm">
        <RPNBadge
          value={effect.rpnPre}
          showLabel={true}
          showTooltip={true}
          formula={rpnPreFormatted.formula}
        />
      </td>

      {/* Post-Mitigation Fields */}
      <EditableCell
        value={effect.recommendedActions}
        onSave={(value) => onUpdate({ recommendedActions: value })}
      />
      <EditableCell
        value={effect.justificationPost}
        onSave={(value) => onUpdate({ justificationPost: value })}
      />
      <EditableCell
        value={effect.responsible}
        onSave={(value) => onUpdate({ responsible: value })}
      />
      <EditableCell
        value={effect.actionTaken}
        onSave={(value) => onUpdate({ actionTaken: value })}
      />
      <NumberCell
        value={effect.sevPost}
        min={1}
        max={10}
        onSave={(value) => onUpdate({ sevPost: value })}
      />
      <NumberCell
        value={effect.occPost}
        min={1}
        max={10}
        onSave={(value) => onUpdate({ occPost: value })}
      />
      <NumberCell
        value={effect.detPost}
        min={1}
        max={10}
        onSave={(value) => onUpdate({ detPost: value })}
      />
      <td className="px-4 py-3 text-sm">
        <RPNBadge
          value={effect.rpnPost}
          showLabel={true}
          showTooltip={true}
          formula={rpnPostFormatted.formula}
        />
      </td>
    </tr>
  );
}

// Editable cell component for text fields
interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
}

function EditableCell({ value, onSave }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue !== value) {
      // Save immediately and synchronously
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Use setTimeout to ensure the save happens even if parent unmounts
    // This ensures the blur handler completes before component cleanup
    const target = e.relatedTarget as HTMLElement;

    // If clicking on a tab button or any button that might cause unmount, save immediately
    if (target && (target.closest('button') || target.closest('[role="tab"]'))) {
      // Save synchronously before tab switch
      if (editValue !== value) {
        onSave(editValue);
      }
      setIsEditing(false);
    } else {
      handleSave();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <td className="px-4 py-3">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
        />
      </td>
    );
  }

  return (
    <td
      className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
      onClick={() => setIsEditing(true)}
    >
      {value || <span className="text-gray-400 dark:text-slate-500 italic">Click to edit</span>}
    </td>
  );
}

// Number cell component for SEV, OCC, DET fields
interface NumberCellProps {
  value: number;
  min: number;
  max: number;
  onSave: (value: number) => void;
}

function NumberCell({ value, min, max, onSave }: NumberCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleSave = () => {
    const numValue = parseInt(editValue, 10);
    if (!isNaN(numValue) && numValue >= min && numValue <= max && numValue !== value) {
      // Save immediately and synchronously
      onSave(numValue);
    }
    setIsEditing(false);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Use setTimeout to ensure the save happens even if parent unmounts
    // This ensures the blur handler completes before component cleanup
    const target = e.relatedTarget as HTMLElement;

    // If clicking on a tab button or any button that might cause unmount, save immediately
    if (target && (target.closest('button') || target.closest('[role="tab"]'))) {
      // Save synchronously before tab switch
      const numValue = parseInt(editValue, 10);
      if (!isNaN(numValue) && numValue >= min && numValue <= max && numValue !== value) {
        onSave(numValue);
      }
      setIsEditing(false);
    } else {
      handleSave();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <td className="px-4 py-3">
        <input
          type="number"
          min={min}
          max={max}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-16 px-2 py-1 text-sm text-center border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
        />
      </td>
    );
  }

  return (
    <td
      className="px-4 py-3 text-sm text-center font-semibold text-gray-900 dark:text-slate-100 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
      onClick={() => setIsEditing(true)}
    >
      {value}
    </td>
  );
}
