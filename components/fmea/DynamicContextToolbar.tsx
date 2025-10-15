'use client';

import { Edit, Copy, Trash2, Sparkles } from 'lucide-react';

interface DynamicToolbarProps {
  type: 'cause' | 'effect' | 'control' | 'action';
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAISuggest?: () => void;
}

export default function DynamicContextToolbar({
  type,
  onEdit,
  onDuplicate,
  onDelete,
  onAISuggest
}: DynamicToolbarProps) {
  return (
    <>
      {/* Backdrop to capture outside clicks */}
      <div className="fixed inset-0 z-40" />

      {/* Toolbar */}
      <div
        className="fixed z-50 flex items-center gap-2 bg-white border border-gray-300 rounded-lg shadow-xl px-3 py-2 animate-slide-up"
        style={{
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        {/* Selection Count */}
        <div className="flex items-center gap-2 text-sm text-gray-700 mr-2">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
            1
          </div>
          <span className="font-medium capitalize">{type} selected</span>
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Edit Button */}
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-md text-sm font-medium text-gray-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>

        {/* Duplicate Button */}
        <button
          onClick={onDuplicate}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-md text-sm font-medium text-gray-700 transition-colors"
        >
          <Copy className="w-4 h-4" />
          <span>Duplicate</span>
        </button>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 rounded-md text-sm font-medium text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>

        {/* AI Suggest Button (optional) */}
        {onAISuggest && (
          <>
            <div className="h-6 w-px bg-gray-200" />
            <button
              onClick={onAISuggest}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-purple-50 rounded-md text-sm font-medium text-purple-600 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Suggest</span>
            </button>
          </>
        )}
      </div>
    </>
  );
}
