'use client';

import { useState } from 'react';
import { Check, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
}

const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#9333EA' },
  { name: 'Green', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
];

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [customHex, setCustomHex] = useState(value);
  const [isValidHex, setIsValidHex] = useState(true);
  const [showVisualPicker, setShowVisualPicker] = useState(true);

  const validateHex = (hex: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  const handleCustomChange = (hex: string) => {
    setCustomHex(hex);
    const isValid = validateHex(hex);
    setIsValidHex(isValid);
    if (isValid) {
      onChange(hex);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
        {label}
      </label>

      {/* Live Preview */}
      <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <div
          className="w-12 h-12 rounded-lg border-2 border-white dark:border-slate-900 shadow-sm"
          style={{ backgroundColor: value }}
        />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Current Color</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">{value.toUpperCase()}</p>
        </div>
      </div>

      {/* Visual Color Picker */}
      <div>
        <button
          type="button"
          onClick={() => setShowVisualPicker(!showVisualPicker)}
          className="w-full flex items-center justify-between text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 hover:text-gray-900 dark:hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center">
            <Palette className="w-4 h-4 mr-1.5" />
            Visual Color Picker
          </span>
          {showVisualPicker ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showVisualPicker && (
          <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 mb-3">
            <HexColorPicker
              color={value}
              onChange={(newColor) => {
                onChange(newColor);
                setCustomHex(newColor);
                setIsValidHex(true);
              }}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Preset Colors */}
      <div>
        <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Preset Colors</p>
        <div className="grid grid-cols-7 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => {
                onChange(color.value);
                setCustomHex(color.value);
                setIsValidHex(true);
              }}
              className="relative group"
              title={color.name}
            >
              <div
                className="w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-md"
                style={{
                  backgroundColor: color.value,
                  borderColor: value === color.value ? '#000' : '#fff',
                }}
              />
              {value === color.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white drop-shadow-md" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Hex Input */}
      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2 block">
          Custom Hex Color
        </label>
        <input
          type="text"
          value={customHex}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="#3B82F6"
          className={`input w-full ${
            !isValidHex ? 'border-red-500 focus-visible:ring-red-500' : ''
          }`}
        />
        {!isValidHex && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Please enter a valid hex color (e.g., #3B82F6)
          </p>
        )}
      </div>
    </div>
  );
}
