'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check } from 'lucide-react';

interface ColorPickerPopoverProps {
  currentColor: string;
  onColorSelect: (color: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Predefined color swatches
const namedColors: { name: string; hex: string }[] = [
  { name: 'green', hex: '#22c55e' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'orange', hex: '#f97316' },
  { name: 'red', hex: '#ef4444' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'pink', hex: '#ec4899' },
  { name: 'teal', hex: '#14b8a6' },
  { name: 'indigo', hex: '#6366f1' },
  { name: 'gray', hex: '#9ca3af' },
];

const getColorHex = (color: string): string => {
  if (color.startsWith('#')) return color;
  const found = namedColors.find((c) => c.name === color);
  return found?.hex ?? '#9ca3af';
};

export default function ColorPickerPopover({
  currentColor,
  onColorSelect,
  open,
  onOpenChange,
}: ColorPickerPopoverProps) {
  const [customColor, setCustomColor] = useState(getColorHex(currentColor));
  const currentHex = getColorHex(currentColor);

  const handleNamedColorClick = (name: string, hex: string) => {
    onColorSelect(name);
    onOpenChange(false);
  };

  const handleCustomColorApply = () => {
    onColorSelect(customColor);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Color</DialogTitle>
          <DialogDescription>
            Select a predefined color or create a custom one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Named colors grid */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              Predefined Colors
            </h4>
            <div className="grid grid-cols-5 gap-3">
              {namedColors.map((color) => {
                const isSelected = currentHex === color.hex;
                return (
                  <button
                    key={color.name}
                    onClick={() => handleNamedColorClick(color.name, color.hex)}
                    className={`relative aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                      isSelected
                        ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-900 dark:ring-white'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-5 w-5 text-white drop-shadow-lg" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom color picker */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
              Custom Color
            </h4>
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#000000"
                  className="font-mono"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="h-10 w-20 rounded-md border border-gray-300 dark:border-slate-600 cursor-pointer"
                  />
                  <div
                    className="h-10 flex-1 rounded-md border border-gray-300 dark:border-slate-600"
                    style={{ backgroundColor: customColor }}
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={handleCustomColorApply}
              className="w-full mt-3"
              disabled={!/^#[0-9A-Fa-f]{6}$/i.test(customColor)}
            >
              Apply Custom Color
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
