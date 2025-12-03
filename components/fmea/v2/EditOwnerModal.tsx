'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface EditOwnerModalProps {
  itemType: 'component' | 'failureMode';
  itemName: string;
  currentOwner: string;
  onClose: () => void;
  onSave: (owner: string) => void;
}

export function EditOwnerModal({ itemType, itemName, currentOwner, onClose, onSave }: EditOwnerModalProps) {
  const [owner, setOwner] = useState(currentOwner);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (owner.trim()) {
      onSave(owner.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">
          Edit Owner
        </h3>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
            {itemType === 'component' ? 'Component' : 'Failure Mode'}:
          </p>
          <p className="text-base font-semibold text-gray-900 dark:text-slate-100">
            {itemName}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Owner
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g., John Smith"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
              Assign a person responsible for this {itemType === 'component' ? 'component' : 'failure mode'}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors font-medium"
            >
              Save Owner
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
