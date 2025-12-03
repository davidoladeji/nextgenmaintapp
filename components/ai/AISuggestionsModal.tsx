'use client';

import { useState } from 'react';
import { X, Sparkles, Check, Loader2, Info } from 'lucide-react';
import { AISuggestion } from '@/types';
import toast from 'react-hot-toast';

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: AISuggestion | null;
  onAccept: (selectedSuggestions: Array<{ text: string; reasoning: string }>) => void;
  isLoading?: boolean;
}

export default function AISuggestionsModal({
  isOpen,
  onClose,
  suggestion,
  onAccept,
  isLoading = false,
}: AISuggestionsModalProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleToggle = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleSelectAll = () => {
    if (!suggestion?.suggestions) return;

    if (selectedSuggestions.size === suggestion.suggestions.length) {
      setSelectedSuggestions(new Set());
    } else {
      setSelectedSuggestions(new Set(suggestion.suggestions.map((_, idx) => idx)));
    }
  };

  const handleAccept = () => {
    if (!suggestion?.suggestions) return;

    const selected = Array.from(selectedSuggestions)
      .map(idx => suggestion.suggestions[idx])
      .filter(Boolean);

    if (selected.length === 0) {
      toast.error('Please select at least one suggestion');
      return;
    }

    onAccept(selected);
    setSelectedSuggestions(new Set());
    onClose();
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'failure-mode': 'Failure Modes',
      'cause': 'Causes',
      'effect': 'Effects',
      'control': 'Controls',
      'action': 'Actions',
    };
    return labels[type] || type;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-accent/10 to-accent/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                AI Suggestions: {suggestion ? getTypeLabel(suggestion.type) : 'Loading...'}
              </h3>
              {suggestion?.context && (
                <p className="text-sm text-gray-600 dark:text-slate-400">{suggestion.context}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
              <p className="text-gray-600 dark:text-slate-300">Generating AI suggestions...</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">This may take a few moments</p>
            </div>
          ) : suggestion?.suggestions && suggestion.suggestions.length > 0 ? (
            <>
              {/* Info Banner */}
              <div className="mb-4 p-4 bg-accent/10 border border-accent rounded-lg flex items-start space-x-3">
                <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-slate-300">
                    Review the AI-generated suggestions below. Select the ones you want to add and click "Add Selected".
                    You can edit them after they're added.
                  </p>
                </div>
              </div>

              {/* Select All */}
              <div className="mb-4 flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-700">
                <button
                  onClick={handleSelectAll}
                  className="text-sm font-medium text-accent hover:text-accent hover:underline"
                >
                  {selectedSuggestions.size === suggestion.suggestions.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  {selectedSuggestions.size} of {suggestion.suggestions.length} selected
                </span>
              </div>

              {/* Suggestions List */}
              <div className="space-y-3">
                {suggestion.suggestions.map((item, index) => {
                  const isSelected = selectedSuggestions.has(index);

                  return (
                    <div
                      key={index}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/10 shadow-md'
                          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-sm'
                      }`}
                      onClick={() => handleToggle(index)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Checkbox */}
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-accent border-accent'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-gray-900 dark:text-slate-100 flex-1">{item.text}</p>
                            <span
                              className={`ml-3 flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(
                                item.confidence
                              )}`}
                            >
                              {Math.round(item.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{item.reasoning}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-gray-400 dark:text-slate-500" />
              </div>
              <p className="text-gray-600 dark:text-slate-300 mb-2">No suggestions available</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">The AI couldn't generate suggestions for this context.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && suggestion?.suggestions && suggestion.suggestions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex items-center justify-between rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={selectedSuggestions.size === 0}
              className="px-6 py-2 bg-accent hover:bg-accent disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow-md disabled:shadow-none flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>
                Add Selected ({selectedSuggestions.size})
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
