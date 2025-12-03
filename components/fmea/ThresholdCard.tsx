'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ThresholdCardProps {
  id: number;
  label: string;
  min: number;
  max: number;
  color: string;
  onUpdate: (key: string, value: any) => void;
  onDelete: () => void;
  onColorClick: () => void;
  hasValidationError?: boolean;
  validationMessage?: string;
  isDraggable?: boolean;
}

// Color helpers
const namedColors: Record<string, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  teal: '#14b8a6',
  indigo: '#6366f1',
  gray: '#9ca3af',
};

const getColorHex = (color: string) => {
  return color?.startsWith('#') ? color : (namedColors[color] ?? namedColors.gray);
};

export default function ThresholdCard({
  id,
  label,
  min,
  max,
  color,
  onUpdate,
  onDelete,
  onColorClick,
  hasValidationError = false,
  validationMessage = '',
  isDraggable = true,
}: ThresholdCardProps) {
  const colorHex = getColorHex(color);

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-md ${
        hasValidationError
          ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
          : 'border-gray-200 dark:border-slate-700'
      }`}
    >
      {/* Color indicator bar on the left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: colorHex }}
      />

      <div className="pl-4 pr-4 py-4">
        <div className="flex items-start gap-3">
          {/* Drag handle (optional) */}
          {isDraggable && (
            <div className="flex-shrink-0 cursor-grab active:cursor-grabbing pt-2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">
              <GripVertical className="h-5 w-5" />
            </div>
          )}

          <div className="flex-1 space-y-4">
            {/* Header row with label and color */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Threshold Label
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline-block ml-1 h-3 w-3 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>The name of this risk category (e.g., "Low", "Medium", "High", "Critical")</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Input
                  value={label}
                  onChange={(e) => onUpdate('label', e.target.value)}
                  className="h-10 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600"
                  placeholder="e.g., Medium"
                />
              </div>

              <div className="sm:w-40">
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Color
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline-block ml-1 h-3 w-3 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Color used in dashboards, charts, and FMEA tables</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Button
                  variant="outline"
                  onClick={onColorClick}
                  className="w-full h-10 justify-start gap-2 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600"
                >
                  <div
                    className="w-5 h-5 rounded border border-gray-300 dark:border-slate-600 flex-shrink-0"
                    style={{ backgroundColor: colorHex }}
                  />
                  <span className="text-sm truncate">{color}</span>
                </Button>
              </div>
            </div>

            {/* RPN Range inputs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Min RPN
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline-block ml-1 h-3 w-3 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Minimum Risk Priority Number for this threshold. Must be continuous with adjacent thresholds.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Input
                  type="number"
                  min={1}
                  value={min}
                  onChange={(e) => onUpdate('min', Number(e.target.value))}
                  className="h-10 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Max RPN
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline-block ml-1 h-3 w-3 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Maximum Risk Priority Number for this threshold. Must be continuous with adjacent thresholds.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <Input
                  type="number"
                  min={min}
                  value={max}
                  onChange={(e) => onUpdate('max', Number(e.target.value))}
                  className="h-10 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600"
                />
              </div>
            </div>

            {/* Visual range indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
                <span>RPN Range: {min} - {max}</span>
                <span className="font-medium">{max - min + 1} values</span>
              </div>
              <div className="relative h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-full transition-all"
                  style={{
                    backgroundColor: colorHex,
                    width: '100%',
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>

            {/* Validation error message */}
            {hasValidationError && validationMessage && (
              <div className="rounded-md bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                <p className="text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{validationMessage}</span>
                </p>
              </div>
            )}
          </div>

          {/* Delete button */}
          <div className="flex-shrink-0 pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Delete this threshold</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </Card>
  );
}
