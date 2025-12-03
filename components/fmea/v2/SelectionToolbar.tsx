'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Info, Edit2, User, Copy, Trash2, X } from 'lucide-react';

interface SelectedItem {
  type: 'component' | 'failureMode' | 'effect';
  id: string;
  data: any;
}

interface SelectionToolbarProps {
  selectedItem: SelectedItem | null;
  onClear: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onEditOwner?: () => void;
}

export function SelectionToolbar({
  selectedItem,
  onClear,
  onEdit,
  onDuplicate,
  onDelete,
  onEditOwner
}: SelectionToolbarProps) {
  const getItemLabel = () => {
    if (!selectedItem) return '';
    switch (selectedItem.type) {
      case 'component': return 'Component';
      case 'failureMode': return 'Failure Mode';
      case 'effect': return 'Effect';
    }
  };

  return (
    <AnimatePresence>
      {selectedItem && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="selection-toolbar fixed bottom-4 left-[340px] bg-accent dark:bg-accent shadow-2xl z-50 rounded-xl border border-white/10 max-w-4xl w-auto min-w-[600px]"
        >
          <div className="px-8 py-4">
            <div className="flex items-center justify-between gap-8">
              {/* Left: Info */}
              <div className="flex items-center gap-3 text-white">
                <Info className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">
                  1 {getItemLabel()} selected
                </span>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                {/* Edit Button (for Components and Failure Modes only - Effects use inline editing) */}
                {(selectedItem.type === 'component' || selectedItem.type === 'failureMode') && (
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}

                {/* Edit Owner Button (for Failure Modes only) */}
                {selectedItem.type === 'failureMode' && (
                  <button
                    onClick={onEditOwner}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <User className="w-4 h-4" />
                    Edit Owner
                  </button>
                )}

                {/* Duplicate Button */}
                <button
                  onClick={onDuplicate}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>

                {/* Delete Button - Red (universal standard) */}
                <button
                  onClick={onDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>

                {/* Divider */}
                <div className="w-px h-8 bg-white/20 mx-2" />

                {/* Close Button */}
                <button
                  onClick={onClear}
                  className="p-2 hover:bg-white/10 text-white rounded-lg transition-colors"
                  title="Clear selection (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
