'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import AIInputField from '@/components/common/AIInputField';
import { useAuth } from '@/lib/store';

interface SimpleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  initialData: {
    name?: string;
    function?: string;
    owner?: string;
    effects?: string;
  };
  fields: Array<{
    key: string;
    label: string;
    type?: 'text' | 'textarea';
    required?: boolean;
  }>;
  itemType?: 'component' | 'failureMode' | 'effect';
  itemData?: any;
  isNewItem?: boolean; // Flag to indicate if this is a new item (not an edit)
}

export function SimpleEditModal({
  isOpen,
  onClose,
  onSave,
  title,
  initialData,
  fields,
  itemType,
  itemData,
  isNewItem = false,
}: SimpleEditModalProps) {
  const [formData, setFormData] = useState<any>(initialData);
  const { token } = useAuth();

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Get AI context based on field and item type
  const getAIContext = (fieldKey: string) => {
    // Disable AI suggestions when editing existing items (not creating new ones)
    if (!isNewItem) return undefined;

    if (!itemType || !token) return undefined;

    // For 'name' field -> map to appropriate AI type
    if (fieldKey === 'name') {
      if (itemType === 'component') {
        return {
          type: 'component' as const,
          asset: itemData
        };
      } else if (itemType === 'failureMode') {
        return {
          type: 'failureMode' as const,
          failureMode: itemData,
          asset: itemData.component || {} // Include parent component for context
        };
      }
    }

    // For 'function' field -> use processStep type for component function descriptions
    if (fieldKey === 'function') {
      return {
        type: 'processStep' as const,
        processStep: formData.name || '',
        asset: itemData
      };
    }

    // For 'effects' field -> use effect type (maps to duplicate endpoint)
    if (fieldKey === 'effects') {
      return {
        type: 'effect' as const,
        effect: itemData,
        failureMode: itemData.failureMode || {} // Include parent failure mode for context
      };
    }

    // For 'owner' field -> no AI suggestions
    return undefined;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {fields.map((field) => {
            const aiContext = getAIContext(field.key);

            return (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <AIInputField
                  value={formData[field.key] || ''}
                  onChange={(value) => setFormData({ ...formData, [field.key]: value })}
                  type={field.type || 'text'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
                  aiContext={aiContext}
                  token={token ?? undefined}
                  rows={field.type === 'textarea' ? 3 : undefined}
                />
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
