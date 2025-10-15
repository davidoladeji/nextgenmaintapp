'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Component } from '@/types';

interface MetricsToolbarProps {
  totalRPN: number;
  componentsAnalyzed: number;
  mitigationsClosedPercent: number;
  openActions: number;
  failureModesAssessed: number;
  highRiskItems: number;
  avgRPNReduction: number;
  highestRPN: number;
  components: Component[];
  selectedComponents: string[];
  selectedRiskLevel: string;
  onComponentFilterChange: (componentIds: string[]) => void;
  onRiskLevelFilterChange: (level: string) => void;
}

export default function MetricsToolbar({
  totalRPN,
  componentsAnalyzed,
  mitigationsClosedPercent,
  openActions,
  failureModesAssessed,
  highRiskItems,
  avgRPNReduction,
  highestRPN,
  components,
  selectedComponents,
  selectedRiskLevel,
  onComponentFilterChange,
  onRiskLevelFilterChange,
}: MetricsToolbarProps) {
  const [showComponentFilter, setShowComponentFilter] = useState(false);
  const [showRiskFilter, setShowRiskFilter] = useState(false);

  const riskLevels = [
    { value: 'all', label: 'All Risks', range: 'All' },
    { value: 'critical', label: 'Critical', range: '>150' },
    { value: 'high', label: 'High', range: '100-150' },
    { value: 'medium', label: 'Medium', range: '70-99' },
    { value: 'low', label: 'Low', range: '<70' },
  ];

  const toggleComponent = (componentId: string) => {
    if (selectedComponents.includes(componentId)) {
      onComponentFilterChange(selectedComponents.filter(id => id !== componentId));
    } else {
      onComponentFilterChange([...selectedComponents, componentId]);
    }
  };

  const clearFilters = () => {
    onComponentFilterChange([]);
    onRiskLevelFilterChange('all');
  };

  const hasActiveFilters = selectedComponents.length > 0 || selectedRiskLevel !== 'all';

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Metrics Row */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {/* Total RPN */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Total RPN</div>
            <div className="text-2xl font-bold text-gray-900">{totalRPN.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Sum of pre-mitigation RPN</div>
          </div>

          {/* Components Analyzed */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Components</div>
            <div className="text-2xl font-bold text-blue-600">{componentsAnalyzed}</div>
            <div className="text-xs text-gray-500 mt-1">Components analyzed</div>
          </div>

          {/* Mitigations Closed */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Mitigations</div>
            <div className="text-2xl font-bold text-green-600">{mitigationsClosedPercent}%</div>
            <div className="text-xs text-gray-500 mt-1">Closed mitigations</div>
          </div>

          {/* Open Actions */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Open Actions</div>
            <div className="text-2xl font-bold text-yellow-600">{openActions}</div>
            <div className="text-xs text-gray-500 mt-1">Open & Overdue</div>
          </div>

          {/* Failure Modes Assessed */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Failure Modes</div>
            <div className="text-2xl font-bold text-purple-600">{failureModesAssessed}</div>
            <div className="text-xs text-gray-500 mt-1">Total assessed</div>
          </div>

          {/* High-Risk Items */}
          <div className="bg-red-50 rounded-lg px-4 py-3 border border-red-200 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="text-xs font-semibold text-red-700 uppercase mb-1">High Risk</div>
            <div className="text-2xl font-bold text-red-600">{highRiskItems}</div>
            <div className="text-xs text-red-600 mt-1">RPN &gt; 150</div>
          </div>

          {/* Avg RPN Reduction */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Avg Reduction</div>
            <div className="text-2xl font-bold text-green-600">{avgRPNReduction}%</div>
            <div className="text-xs text-gray-500 mt-1">RPN improvement</div>
          </div>

          {/* Highest RPN */}
          <div className="bg-orange-50 rounded-lg px-4 py-3 border border-orange-200 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="text-xs font-semibold text-orange-700 uppercase mb-1">Highest RPN</div>
            <div className="text-2xl font-bold text-orange-600">{highestRPN}</div>
            <div className="text-xs text-orange-600 mt-1">Max pre-RPN</div>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>

            {/* Component Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowComponentFilter(!showComponentFilter);
                  setShowRiskFilter(false);
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Component
                {selectedComponents.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {selectedComponents.length}
                  </span>
                )}
              </button>

              {showComponentFilter && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  <div className="p-2">
                    {components.map((component) => (
                      <label
                        key={component.id}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedComponents.includes(component.id)}
                          onChange={() => toggleComponent(component.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-900">{component.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Risk Level Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowRiskFilter(!showRiskFilter);
                  setShowComponentFilter(false);
                }}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Risk Level
                {selectedRiskLevel !== 'all' && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                    {riskLevels.find(r => r.value === selectedRiskLevel)?.label}
                  </span>
                )}
              </button>

              {showRiskFilter && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    {riskLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => {
                          onRiskLevelFilterChange(level.value);
                          setShowRiskFilter(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-50 ${
                          selectedRiskLevel === level.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'
                        }`}
                      >
                        <div>{level.label}</div>
                        <div className="text-xs text-gray-500">{level.range}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Filters & Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex items-center flex-wrap gap-2 mt-3">
            {selectedComponents.map((componentId) => {
              const component = components.find(c => c.id === componentId);
              return component ? (
                <div
                  key={componentId}
                  className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                >
                  <span>Component: {component.name}</span>
                  <button
                    onClick={() => toggleComponent(componentId)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : null;
            })}

            {selectedRiskLevel !== 'all' && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                <span>Risk: {riskLevels.find(r => r.value === selectedRiskLevel)?.label}</span>
                <button
                  onClick={() => onRiskLevelFilterChange('all')}
                  className="hover:bg-orange-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
