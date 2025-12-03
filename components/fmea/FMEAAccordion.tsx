'use client';

import { useState } from 'react';
import { Component, FailureMode, Project } from '@/types';
import { ChevronDown, ChevronRight, Plus, Sparkles, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Collapsible from '@radix-ui/react-collapsible';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/store';
import RPNBadge from './RPNBadge';

interface FMEAAccordionProps {
  components: Component[];
  project: Project;
}

export default function FMEAAccordion({ components, project }: FMEAAccordionProps) {
  const { token } = useAuth();
  const [openComponents, setOpenComponents] = useState<Set<string>>(new Set());
  const [openFailureModes, setOpenFailureModes] = useState<Set<string>>(new Set());

  // Modal states
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [showAddFailureMode, setShowAddFailureMode] = useState(false);
  const [showAddEffect, setShowAddEffect] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedFailureModeId, setSelectedFailureModeId] = useState<string | null>(null);

  // Form data
  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentFunction, setNewComponentFunction] = useState('');
  const [newFailureModeName, setNewFailureModeName] = useState('');
  const [newEffectDescription, setNewEffectDescription] = useState('');
  const [newEffectSeverity, setNewEffectSeverity] = useState('5');

  const toggleComponent = (id: string) => {
    setOpenComponents(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleFailureMode = (id: string) => {
    setOpenFailureModes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
      } else {
        toast.error(result.error || 'Failed to add component');
      }
    } catch (error) {
      console.error('Error adding component:', error);
      toast.error('Failed to add component');
    }
  };

  const handleAddFailureMode = async () => {
    if (!selectedComponentId) return;
    if (!newFailureModeName.trim()) {
      toast.error('Please enter a failure mode description');
      return;
    }

    try {
      const response = await fetch(`/api/components/${selectedComponentId}/failure-modes`, {
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
      } else {
        toast.error(result.error || 'Failed to add failure mode');
      }
    } catch (error) {
      console.error('Error adding failure mode:', error);
      toast.error('Failed to add failure mode');
    }
  };

  const handleAddEffect = async () => {
    if (!selectedFailureModeId) return;
    if (!newEffectDescription.trim()) {
      toast.error('Please enter an effect description');
      return;
    }

    try {
      const response = await fetch(`/api/failure-modes/${selectedFailureModeId}/effects`, {
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
      } else {
        toast.error(result.error || 'Failed to add effect');
      }
    } catch (error) {
      console.error('Error adding effect:', error);
      toast.error('Failed to add effect');
    }
  };

  const handleDeleteEffect = async (failureModeId: string, effectId: string) => {
    if (!confirm('Are you sure you want to delete this effect?')) return;

    try {
      const response = await fetch(`/api/failure-modes/${failureModeId}/effects/${effectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Effect deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete effect');
      }
    } catch (error) {
      console.error('Error deleting effect:', error);
      toast.error('Failed to delete effect');
    }
  };

  return (
    <div className="space-y-4 p-6">
      {/* Add Component Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">FMEA Analysis</h2>
        <button
          onClick={() => setShowAddComponent(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Component
        </button>
      </div>

      {/* Components List */}
      {components.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-700"
        >
          <p className="text-gray-500 dark:text-slate-400 mb-4">No components yet. Add your first component to begin.</p>
          <button
            onClick={() => setShowAddComponent(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add First Component
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {components.map((component, idx) => (
            <Collapsible.Root
              key={component.id}
              open={openComponents.has(component.id)}
              onOpenChange={() => toggleComponent(component.id)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Component Header */}
                <div className="flex items-center gap-3 p-4 bg-accent/10">
                  <Collapsible.Trigger asChild>
                    <button className="p-1 hover:bg-accent/20 rounded transition-colors">
                      {openComponents.has(component.id) ? (
                        <ChevronDown className="w-5 h-5 text-accent" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-accent" />
                      )}
                    </button>
                  </Collapsible.Trigger>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">{component.name}</h3>
                    {component.function && (
                      <p className="text-sm text-gray-600 dark:text-slate-400">Function: {component.function}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-slate-400">
                      {component.failureModes?.length || 0} failure modes
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedComponentId(component.id);
                        setShowAddFailureMode(true);
                      }}
                      className="p-2 hover:bg-accent/20 rounded-lg transition-colors"
                      title="Add Failure Mode"
                    >
                      <Plus className="w-4 h-4 text-accent" />
                    </button>
                  </div>
                </div>

                {/* Failure Modes */}
                <Collapsible.Content>
                  <AnimatePresence>
                    {openComponents.has(component.id) && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-3">
                          {component.failureModes && component.failureModes.length > 0 ? (
                            component.failureModes.map((failureMode) => (
                              <Collapsible.Root
                                key={failureMode.id}
                                open={openFailureModes.has(failureMode.id)}
                                onOpenChange={() => toggleFailureMode(failureMode.id)}
                              >
                                <div className="bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                                  {/* Failure Mode Header */}
                                  <div className="flex items-center gap-3 p-3">
                                    <Collapsible.Trigger asChild>
                                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors">
                                        {openFailureModes.has(failureMode.id) ? (
                                          <ChevronDown className="w-4 h-4 text-accent" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-accent" />
                                        )}
                                      </button>
                                    </Collapsible.Trigger>

                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 dark:text-slate-100">{failureMode.failure_mode}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600 dark:text-slate-400">
                                        {failureMode.effects?.length || 0} effects
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedFailureModeId(failureMode.id);
                                          setShowAddEffect(true);
                                        }}
                                        className="p-1.5 hover:bg-accent/20 rounded transition-colors"
                                        title="Add Effect"
                                      >
                                        <Plus className="w-3.5 h-3.5 text-accent" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Effects */}
                                  <Collapsible.Content>
                                    <AnimatePresence>
                                      {openFailureModes.has(failureMode.id) && (
                                        <motion.div
                                          initial={{ height: 0 }}
                                          animate={{ height: 'auto' }}
                                          exit={{ height: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="px-3 pb-3 space-y-2">
                                            {failureMode.effects && failureMode.effects.length > 0 ? (
                                              failureMode.effects.map((effect) => (
                                                <motion.div
                                                  key={effect.id}
                                                  initial={{ opacity: 0, x: -10 }}
                                                  animate={{ opacity: 1, x: 0 }}
                                                  className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700"
                                                >
                                                  <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                      <p className="text-sm text-gray-900 dark:text-slate-100">{effect.description}</p>
                                                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 dark:text-slate-400">
                                                        <span>Severity: {effect.severity}</span>
                                                      </div>
                                                    </div>
                                                    <button
                                                      onClick={() => handleDeleteEffect(failureMode.id, effect.id)}
                                                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                                      title="Delete Effect"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                                    </button>
                                                  </div>
                                                </motion.div>
                                              ))
                                            ) : (
                                              <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-2">
                                                No effects yet. Click + to add one.
                                              </p>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </Collapsible.Content>
                                </div>
                              </Collapsible.Root>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">
                              No failure modes yet. Click + to add one.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Collapsible.Content>
              </motion.div>
            </Collapsible.Root>
          ))}
        </div>
      )}

      {/* Add Component Modal */}
      {showAddComponent && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Add New Component</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Component Name
                </label>
                <input
                  type="text"
                  value={newComponentName}
                  onChange={(e) => setNewComponentName(e.target.value)}
                  placeholder="e.g., Drive Train, Hydraulics"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Function (Optional)
                </label>
                <input
                  type="text"
                  value={newComponentFunction}
                  onChange={(e) => setNewComponentFunction(e.target.value)}
                  placeholder="e.g., Deliver Torque"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddComponent(false);
                  setNewComponentName('');
                  setNewComponentFunction('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComponent}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent hover:shadow-lg transition-all"
              >
                Add Component
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Failure Mode Modal */}
      {showAddFailureMode && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Add New Failure Mode</h3>
            <textarea
              value={newFailureModeName}
              onChange={(e) => setNewFailureModeName(e.target.value)}
              placeholder="e.g., Seal Leakage, Pump Cavitation"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddFailureMode(false);
                  setNewFailureModeName('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFailureMode}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent hover:shadow-lg transition-all"
              >
                Add Failure Mode
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Effect Modal */}
      {showAddEffect && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Add New Effect</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Effect Description
                </label>
                <textarea
                  value={newEffectDescription}
                  onChange={(e) => setNewEffectDescription(e.target.value)}
                  placeholder="e.g., Equipment downtime, Safety hazard"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  rows={3}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Severity (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newEffectSeverity}
                  onChange={(e) => setNewEffectSeverity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddEffect(false);
                  setNewEffectDescription('');
                  setNewEffectSeverity('5');
                }}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEffect}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent hover:shadow-lg transition-all"
              >
                Add Effect
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
