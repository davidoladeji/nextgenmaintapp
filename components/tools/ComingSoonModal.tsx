'use client';

import { Tool } from '@/types';
import { X, Clock, Sparkles } from 'lucide-react';

interface ComingSoonModalProps {
  tool: Tool | null;
  onClose: () => void;
}

export default function ComingSoonModal({ tool, onClose }: ComingSoonModalProps) {
  if (!tool) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-accent/10 p-4 rounded-full">
            <Clock className="w-12 h-12 text-accent" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 text-center mb-2">
          Coming Soon!
        </h2>

        {/* Tool Name */}
        <p className="text-center text-gray-600 dark:text-slate-400 mb-4">
          <span className="font-semibold">{tool.name}</span> is currently under development
        </p>

        {/* Description */}
        <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-slate-300 mb-3">
            <span className="font-medium">What it will do:</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
            {tool.solution}
          </p>
        </div>

        {/* Encouragement */}
        <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-slate-400 mb-6">
          <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
          <p>
            We're working hard to bring you this powerful tool. Stay tuned for updates!
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
