'use client';

import { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';

interface Suggestion {
  text: string;
  occurrence?: number;
  severity?: number;
  detection?: number;
  type?: 'prevention' | 'detection';
  effectiveness?: number;
  confidence?: number;
  reasoning?: string;
}

interface AISuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (selectedSuggestions: Suggestion[]) => void;
  suggestions: Suggestion[];
  title: string;
  type: 'causes' | 'effects' | 'controls' | 'actions';
  isLoading?: boolean;
}

export default function AISuggestionModal({
  isOpen,
  onClose,
  onAccept,
  suggestions,
  title,
  type,
  isLoading = false,
}: AISuggestionModalProps) {
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
    new Set(suggestions.map((_, i) => i)) // All selected by default
  );

  if (!isOpen) return null;

  const toggleSelection = (index: number) => {
    const newSet = new Set(selectedIndexes);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedIndexes(newSet);
  };

  const handleSelectAll = () => {
    setSelectedIndexes(new Set(suggestions.map((_, i) => i)));
  };

  const handleDeselectAll = () => {
    setSelectedIndexes(new Set());
  };

  const handleAccept = () => {
    const selected = suggestions.filter((_, i) => selectedIndexes.has(i));
    onAccept(selected);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <Sparkles className="w-6 h-6 text-accent mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-300">AI is generating suggestions...</p>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-slate-300">No suggestions available.</p>
            </div>
          ) : (
            <>
              {/* Selection Controls */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {selectedIndexes.size} of {suggestions.length} selected
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300 dark:text-slate-600">|</span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 font-medium"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Suggestions List */}
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedIndexes.has(index)
                        ? 'border-accent bg-accent/10'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                    onClick={() => toggleSelection(index)}
                  >
                    <div className="flex items-start">
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 mt-0.5 mr-3 flex items-center justify-center ${
                          selectedIndexes.has(index)
                            ? 'border-accent bg-accent'
                            : 'border-gray-300 dark:border-slate-600'
                        }`}
                      >
                        {selectedIndexes.has(index) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">
                          {suggestion.text}
                        </p>

                        {/* Additional metadata */}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-2">
                          {suggestion.occurrence && (
                            <span className="bg-accent/10 text-accent px-2 py-1 rounded">
                              Occurrence: {suggestion.occurrence}
                            </span>
                          )}
                          {suggestion.severity && (
                            <span className="bg-accent/10 text-accent px-2 py-1 rounded">
                              Severity: {suggestion.severity}
                            </span>
                          )}
                          {suggestion.detection && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                              Detection: {suggestion.detection}
                            </span>
                          )}
                          {suggestion.type && (
                            <span className="bg-accent/10 text-accent px-2 py-1 rounded capitalize">
                              {suggestion.type}
                            </span>
                          )}
                          {suggestion.confidence && (
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              Confidence: {Math.round(suggestion.confidence * 100)}%
                            </span>
                          )}
                        </div>

                        {/* Reasoning */}
                        {suggestion.reasoning && (
                          <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 italic">
                            {suggestion.reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={selectedIndexes.size === 0 || isLoading}
            className="btn-primary"
          >
            Add {selectedIndexes.size} {type}
          </button>
        </div>
      </div>
    </div>
  );
}
