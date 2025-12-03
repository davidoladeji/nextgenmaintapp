'use client';

import { Tool } from '@/types';
import { AlertTriangle, Wrench, BarChart3, DollarSign, Clock } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface ToolCardProps {
  tool: Tool;
  onLaunch: (tool: Tool) => void;
}

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  AlertTriangle,
  Wrench,
  BarChart3,
  DollarSign,
};

export default function ToolCard({ tool, onLaunch }: ToolCardProps) {
  const IconComponent = iconMap[tool.icon] || AlertTriangle;

  return (
    <button
      onClick={() => onLaunch(tool)}
      disabled={tool.coming_soon}
      className="group relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md hover:scale-105 transition-all duration-200 text-left w-full disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      {/* Coming Soon Badge */}
      {tool.coming_soon && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center space-x-1 text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-700">
            <Clock className="w-3 h-3" />
            <span>Soon</span>
          </span>
        </div>
      )}

      {/* Icon */}
      <div className="flex flex-col items-center justify-center mb-3">
        <div className={`p-3 rounded-lg mb-2 ${
          tool.coming_soon ? 'bg-gray-100 dark:bg-slate-700' : 'bg-primary-50 dark:bg-primary-900/30 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50'
        } transition-colors`}>
          <IconComponent className={`w-8 h-8 ${
            tool.coming_soon ? 'text-gray-400 dark:text-slate-500' : 'text-primary-600 dark:text-primary-400'
          }`} />
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 text-center">
          {tool.name}
        </h3>
      </div>

      {/* Description on hover */}
      <div className="text-xs text-gray-600 dark:text-slate-400 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 line-clamp-2">
        {tool.description}
      </div>
    </button>
  );
}
