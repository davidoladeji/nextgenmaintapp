'use client';

import { useState } from 'react';
import { useFMEAStore } from '@/lib/stores/fmea-store';
import { ComponentRow } from './ComponentRow';

export function SmartTable() {
  const { components, addComponent, addFailureMode, addEffect } = useFMEAStore();

  // Modal states for adding new items
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showFailureModeModal, setShowFailureModeModal] = useState(false);
  const [showEffectModal, setShowEffectModal] = useState(false);

  const handleAddComponent = () => {
    setShowComponentModal(true);
  };

  const handleAddFailureMode = () => {
    setShowFailureModeModal(true);
  };

  const handleAddEffect = () => {
    setShowEffectModal(true);
  };

  return (
    <div className="w-full max-w-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Smart Table
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
          Build your FMEA with a hierarchical structure: Components → Failure Modes → Effects
        </p>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        {components.length === 0 ? (
          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 p-8 text-center">
            <p className="text-gray-600 dark:text-slate-400 mb-4">
              No components yet. Get started by adding your first component.
            </p>
            <button
              onClick={handleAddComponent}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition-colors"
            >
              + Add Component
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {components.map((component) => (
              <ComponentRow
                key={component.id}
                component={component}
                onAddFailureMode={handleAddFailureMode}
                onAddEffect={handleAddEffect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals - Simplified inline forms for now, can be enhanced later */}
      {showComponentModal && (
        <ComponentModal
          onClose={() => setShowComponentModal(false)}
          onSave={(data) => {
            addComponent(data);
            setShowComponentModal(false);
          }}
        />
      )}

      {showFailureModeModal && (
        <FailureModeModal
          onClose={() => setShowFailureModeModal(false)}
          onSave={(data) => {
            const selectedComponent = useFMEAStore.getState().selectedState.componentId;
            if (selectedComponent) {
              addFailureMode(selectedComponent, data);
            }
            setShowFailureModeModal(false);
          }}
        />
      )}

      {showEffectModal && (
        <EffectModal
          onClose={() => setShowEffectModal(false)}
          onSave={(data) => {
            const selectedFailureMode = useFMEAStore.getState().selectedState.failureModeId;
            if (selectedFailureMode) {
              addEffect(selectedFailureMode, data);
            }
            setShowEffectModal(false);
          }}
        />
      )}
    </div>
  );
}

// Simple Component Modal
interface ComponentModalProps {
  onClose: () => void;
  onSave: (data: { name: string; function: string }) => void;
}

function ComponentModal({ onClose, onSave }: ComponentModalProps) {
  const [name, setName] = useState('');
  const [functionDesc, setFunctionDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && functionDesc.trim()) {
      onSave({ name, function: functionDesc });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">Add Component</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Component Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              placeholder="e.g., Drive Train, Hydraulics"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Function
            </label>
            <textarea
              value={functionDesc}
              onChange={(e) => setFunctionDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              placeholder="Describe what this component does..."
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
            >
              Add Component
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Simple Failure Mode Modal
interface FailureModeModalProps {
  onClose: () => void;
  onSave: (data: { name: string; owner: string }) => void;
}

function FailureModeModal({ onClose, onSave }: FailureModeModalProps) {
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name, owner });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">Add Failure Mode</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Failure Mode Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              placeholder="e.g., Seal Leakage, Rod damage"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Owner
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              placeholder="e.g., John Smith"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
            >
              Add Failure Mode
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Simple Effect Modal
interface EffectModalProps {
  onClose: () => void;
  onSave: (data: {
    effects: string;
    sev: number;
    potentialCause: string;
    occ: number;
    currentDesign: string;
    det: number;
    justificationPre: string;
    recommendedActions: string;
    justificationPost: string;
    responsible: string;
    actionTaken: string;
    actionStatus: 'Not Started' | 'In Progress' | 'Done';
    completionDate: Date | null;
    sevPost: number;
    occPost: number;
    detPost: number;
  }) => void;
}

function EffectModal({ onClose, onSave }: EffectModalProps) {
  // Pre-mitigation fields
  const [effects, setEffects] = useState('');
  const [sev, setSev] = useState(5);
  const [potentialCause, setPotentialCause] = useState('');
  const [occ, setOcc] = useState(5);
  const [currentDesign, setCurrentDesign] = useState('');
  const [det, setDet] = useState(5);
  const [justificationPre, setJustificationPre] = useState('');

  // Post-mitigation fields
  const [recommendedActions, setRecommendedActions] = useState('');
  const [justificationPost, setJustificationPost] = useState('');
  const [responsible, setResponsible] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [actionStatus, setActionStatus] = useState<'Not Started' | 'In Progress' | 'Done'>('Not Started');
  const [sevPost, setSevPost] = useState(3);
  const [occPost, setOccPost] = useState(3);
  const [detPost, setDetPost] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (effects.trim() && potentialCause.trim() && currentDesign.trim()) {
      onSave({
        effects,
        sev,
        potentialCause,
        occ,
        currentDesign,
        det,
        justificationPre,
        recommendedActions,
        justificationPost,
        responsible,
        actionTaken,
        actionStatus,
        completionDate: null,
        sevPost,
        occPost,
        detPost,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-6xl m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">Add Effect</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pre-Mitigation Section */}
          <div className="border-b border-gray-200 dark:border-slate-700 pb-4">
            <h4 className="text-md font-semibold text-gray-800 dark:text-slate-200 mb-3">Pre-Mitigation</h4>

            <div className="grid grid-cols-3 gap-4">
              {/* Column 1: Effect Description & Severity */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Effect Description
                </label>
                <input
                  type="text"
                  value={effects}
                  onChange={(e) => setEffects(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="e.g., Safety hazard, Plant downtime"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Severity (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={sev}
                  onChange={(e) => setSev(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  required
                />
              </div>

              {/* Column 2: Potential Cause & Occurrence */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Potential Cause
                </label>
                <input
                  type="text"
                  value={potentialCause}
                  onChange={(e) => setPotentialCause(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="e.g., Worn seal, Age degradation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Occurrence (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={occ}
                  onChange={(e) => setOcc(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  required
                />
              </div>

              {/* Column 3: Current Design Controls & Detection */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Current Design Controls
                </label>
                <input
                  type="text"
                  value={currentDesign}
                  onChange={(e) => setCurrentDesign(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="e.g., Regular inspection, Visual checks"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Detection (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={det}
                  onChange={(e) => setDet(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  required
                />
              </div>

              {/* Justification (Pre) - Full width */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Justification (Pre-Mitigation)
                </label>
                <textarea
                  value={justificationPre}
                  onChange={(e) => setJustificationPre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Justification for pre-mitigation ratings..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Post-Mitigation Section */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 dark:text-slate-200 mb-3">Post-Mitigation</h4>

            <div className="grid grid-cols-3 gap-4">
              {/* Recommended Actions - Full width */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Recommended Actions
                </label>
                <textarea
                  value={recommendedActions}
                  onChange={(e) => setRecommendedActions(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Describe recommended corrective actions..."
                  rows={2}
                />
              </div>

              {/* Justification (Post) - Full width */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Justification (Post-Mitigation)
                </label>
                <textarea
                  value={justificationPost}
                  onChange={(e) => setJustificationPost(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Justification for post-mitigation ratings..."
                  rows={2}
                />
              </div>

              {/* Responsible & Action Taken */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Responsible
                </label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Person responsible"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Action Taken
                </label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Actions taken & completion date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Action Status
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value as 'Not Started' | 'In Progress' | 'Done')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              {/* Post-Mitigation Ratings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  SEV (Post)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={sevPost}
                  onChange={(e) => setSevPost(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  OCC (Post)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={occPost}
                  onChange={(e) => setOccPost(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  DET (Post)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={detPost}
                  onChange={(e) => setDetPost(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
            >
              Add Effect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
