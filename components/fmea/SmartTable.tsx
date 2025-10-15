'use client';

import { useState } from 'react';
import { Component, FailureMode, Project, AISuggestion } from '@/types';
import { Plus, Sparkles, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/store';
import AISuggestionsModal from '../ai/AISuggestionsModal';
import ComponentRow from './ComponentRow';
import FailureModeRow from './FailureModeRow';
import EffectsTable from './EffectsTable';

interface SmartTableProps {
  components: Component[];
  project: Project;
  onRefresh: () => void;
  onFailureModeClick: (failureMode: FailureMode) => void;
}

export default function SmartTable({
  components,
  project,
  onRefresh,
  onFailureModeClick,
}: SmartTableProps) {
  const { token } = useAuth();

  // Hierarchy state
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [expandedFailureModes, setExpandedFailureModes] = useState<Set<string>>(new Set());

  // Selection state for context-sensitive buttons
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [selectedFailureMode, setSelectedFailureMode] = useState<string | null>(null);

  // Modal states
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [showAddFailureMode, setShowAddFailureMode] = useState(false);
  const [showAddEffect, setShowAddEffect] = useState(false);

  // Form data
  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentFunction, setNewComponentFunction] = useState('');
  const [newFailureModeName, setNewFailureModeName] = useState('');
  const [newEffectDescription, setNewEffectDescription] = useState('');
  const [newEffectSeverity, setNewEffectSeverity] = useState('5');

  // AI Suggestions state
  const [showAISuggestionsModal, setShowAISuggestionsModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Toggle functions
  const toggleComponent = (componentId: string) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId);
    } else {
      newExpanded.add(componentId);
    }
    setExpandedComponents(newExpanded);
  };

  const toggleFailureMode = (failureModeId: string) => {
    const newExpanded = new Set(expandedFailureModes);
    if (newExpanded.has(failureModeId)) {
      newExpanded.delete(failureModeId);
    } else {
      newExpanded.add(failureModeId);
    }
    setExpandedFailureModes(newExpanded);
  };

  // Selection handlers
  const handleComponentSelect = (componentId: string) => {
    setSelectedComponent(componentId);
    setSelectedFailureMode(null);
  };

  const handleFailureModeSelect = (failureModeId: string) => {
    setSelectedFailureMode(failureModeId);
  };

  // Add Component
  const handleAddComponent = async () => {
    if (!newComponentName.trim()) {
      toast.error('Please enter a component name');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}/components`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newComponentName.trim(),
          description: null,
          function: newComponentFunction.trim() || null
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Component added successfully');
        setNewComponentName('');
        setNewComponentFunction('');
        setShowAddComponent(false);
        onRefresh();

        // TODO: Trigger AI suggestions for failure modes
      } else {
        toast.error(result.error || 'Failed to add component');
      }
    } catch (error) {
      console.error('Error adding component:', error);
      toast.error('Failed to add component');
    }
  };

  // Add Failure Mode
  const handleAddFailureMode = async () => {
    if (!selectedComponent) {
      toast.error('Please select a component first');
      return;
    }

    if (!newFailureModeName.trim()) {
      toast.error('Please enter a failure mode description');
      return;
    }

    try {
      const response = await fetch(`/api/components/${selectedComponent}/failure-modes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          failureMode: newFailureModeName.trim(),
          processStep: ''
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Failure mode added successfully');
        setNewFailureModeName('');
        setShowAddFailureMode(false);
        onRefresh();

        // TODO: Trigger AI suggestions for causes/effects
      } else {
        toast.error(result.error || 'Failed to add failure mode');
      }
    } catch (error) {
      console.error('Error adding failure mode:', error);
      toast.error('Failed to add failure mode');
    }
  };

  // Add Effect
  const handleAddEffect = async () => {
    if (!selectedFailureMode) {
      toast.error('Please select a failure mode first');
      return;
    }

    if (!newEffectDescription.trim()) {
      toast.error('Please enter an effect description');
      return;
    }

    try {
      const response = await fetch(`/api/failure-modes/${selectedFailureMode}/effects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: newEffectDescription.trim(),
          severity: parseInt(newEffectSeverity),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Effect added successfully');
        setNewEffectDescription('');
        setNewEffectSeverity('5');
        setShowAddEffect(false);
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to add effect');
      }
    } catch (error) {
      console.error('Error adding effect:', error);
      toast.error('Failed to add effect');
    }
  };

  // AI Suggest Failure Modes
  const handleAISuggestFailureModes = async () => {
    if (!selectedComponent) {
      toast.error('Please select a component first');
      return;
    }

    const component = components.find(c => c.id === selectedComponent);
    if (!component) return;

    setIsLoadingAI(true);
    setShowAISuggestionsModal(true);

    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'failure-modes',
          context: {
            asset: project.asset,
            component: component,
            existingData: {
              failureModes: component.failureModes || [],
              causes: [],
              effects: [],
            },
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAiSuggestion(result.data);
      } else {
        toast.error(result.error || 'Failed to get AI suggestions');
        setShowAISuggestionsModal(false);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast.error('Failed to get AI suggestions');
      setShowAISuggestionsModal(false);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Accept AI Suggestions
  const handleAcceptAISuggestions = async (selectedSuggestions: Array<{ text: string; reasoning: string }>) => {
    if (!selectedComponent) return;

    try {
      for (const suggestion of selectedSuggestions) {
        await fetch(`/api/components/${selectedComponent}/failure-modes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            failureMode: suggestion.text,
            processStep: ''
          }),
        });
      }

      toast.success(`Added ${selectedSuggestions.length} failure mode(s) successfully`);
      onRefresh();
    } catch (error) {
      console.error('Error adding AI suggestions:', error);
      toast.error('Failed to add some suggestions');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Smart Table</h3>
            <p className="text-sm text-gray-600 mt-1">
              Component-based FMEA analysis for {project.asset?.name}
            </p>
          </div>

          {/* Context-Sensitive Quick Add Buttons */}
          <div className="flex items-center space-x-3">
            {/* Add Component - Always Available */}
            <button
              onClick={() => setShowAddComponent(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Component</span>
            </button>

            {/* Add Failure Mode - Only when Component selected */}
            {selectedComponent && !selectedFailureMode && (
              <>
                <button
                  onClick={() => setShowAddFailureMode(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors shadow-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Failure Mode</span>
                </button>

                <button
                  onClick={handleAISuggestFailureModes}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Suggest</span>
                </button>
              </>
            )}

            {/* Add Effect - Only when Failure Mode selected */}
            {selectedFailureMode && (
              <button
                onClick={() => setShowAddEffect(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Effect</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Content - 3 Level Hierarchy */}
      <div className="flex-1 overflow-auto p-6">
        {components.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <AlertTriangle className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No components yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start building your FMEA by adding the first component. Components group related failure modes together.
            </p>
            <button
              onClick={() => setShowAddComponent(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Add First Component</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {components.map((component) => {
              const isExpanded = expandedComponents.has(component.id);
              const isSelected = selectedComponent === component.id;

              return (
                <ComponentRow
                  key={component.id}
                  component={component}
                  isExpanded={isExpanded}
                  isSelected={isSelected}
                  onToggle={() => toggleComponent(component.id)}
                  onSelect={() => handleComponentSelect(component.id)}
                  onAddFailureMode={() => {
                    handleComponentSelect(component.id);
                    setShowAddFailureMode(true);
                  }}
                >
                  {/* Level 2: Failure Modes */}
                  <div className="space-y-3">
                    {component.failureModes?.map((failureMode) => {
                      const isFMExpanded = expandedFailureModes.has(failureMode.id);
                      const isFMSelected = selectedFailureMode === failureMode.id;

                      return (
                        <FailureModeRow
                          key={failureMode.id}
                          failureMode={failureMode}
                          isExpanded={isFMExpanded}
                          isSelected={isFMSelected}
                          onToggle={() => toggleFailureMode(failureMode.id)}
                          onSelect={() => {
                            handleComponentSelect(component.id);
                            handleFailureModeSelect(failureMode.id);
                          }}
                          onAddEffect={() => {
                            handleComponentSelect(component.id);
                            handleFailureModeSelect(failureMode.id);
                            setShowAddEffect(true);
                          }}
                        >
                          {/* Level 3: Effects Table */}
                          <EffectsTable
                            failureMode={failureMode}
                            onRefresh={onRefresh}
                          />
                        </FailureModeRow>
                      );
                    })}
                  </div>
                </ComponentRow>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Component Modal */}
      {showAddComponent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Component</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Component Name
                </label>
                <input
                  type="text"
                  value={newComponentName}
                  onChange={(e) => setNewComponentName(e.target.value)}
                  placeholder="e.g., Drive Train, Hydraulics, Gearbox"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      handleAddComponent();
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Function (Optional)
                </label>
                <input
                  type="text"
                  value={newComponentFunction}
                  onChange={(e) => setNewComponentFunction(e.target.value)}
                  placeholder="e.g., Deliver Torque, Transfer Pressure"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddComponent(false);
                  setNewComponentName('');
                  setNewComponentFunction('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComponent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Add Component
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Failure Mode Modal */}
      {showAddFailureMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Failure Mode</h3>
            <p className="text-sm text-gray-600 mb-4">
              Adding to: <strong>{components.find(c => c.id === selectedComponent)?.name}</strong>
            </p>
            <textarea
              value={newFailureModeName}
              onChange={(e) => setNewFailureModeName(e.target.value)}
              placeholder="e.g., Seal Leakage, Pump Cavitation, Bearing Overheat"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 resize-none text-gray-900 placeholder:text-gray-500"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddFailureMode(false);
                  setNewFailureModeName('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFailureMode}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
              >
                Add Failure Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Effect Modal */}
      {showAddEffect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Effect</h3>
            <p className="text-sm text-gray-600 mb-4">
              Adding to: <strong>
                {components
                  .flatMap(c => c.failureModes || [])
                  .find(fm => fm.id === selectedFailureMode)?.failure_mode}
              </strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effect Description
                </label>
                <textarea
                  value={newEffectDescription}
                  onChange={(e) => setNewEffectDescription(e.target.value)}
                  placeholder="e.g., Equipment downtime, Safety hazard, Environmental impact"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-gray-900 placeholder:text-gray-500"
                  rows={3}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity (1-10)
                  <span className="text-xs text-gray-500 ml-2">1=No Effect, 10=Hazardous</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newEffectSeverity}
                  onChange={(e) => setNewEffectSeverity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddEffect(false);
                  setNewEffectDescription('');
                  setNewEffectSeverity('5');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEffect}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Add Effect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Modal */}
      <AISuggestionsModal
        isOpen={showAISuggestionsModal}
        onClose={() => {
          setShowAISuggestionsModal(false);
          setAiSuggestion(null);
        }}
        suggestion={aiSuggestion}
        onAccept={handleAcceptAISuggestions}
        isLoading={isLoadingAI}
      />
    </div>
  );
}
