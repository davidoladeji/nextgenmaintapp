'use client';

import { FailureMode, Effect, Cause } from '@/types';
import { useState } from 'react';
import RPNBadge from './RPNBadge';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';

interface EffectsTableProps {
  failureMode: FailureMode;
  onRefresh: () => void;
}

/**
 * EffectsTable Component (Level 3)
 * Full FMEA table with all 16 columns for detailed effect tracking
 *
 * Columns:
 * 1. Effects
 * 2. SEV
 * 3. Potential Cause
 * 4. OCC
 * 5. Current Design
 * 6. DET
 * 7. Justification (Pre)
 * 8. RPN (Pre)
 * 9. Recommended Actions
 * 10. Justification (Post)
 * 11. Responsible
 * 12. Action Taken & Completion Date
 * 13. SEV (Post)
 * 14. OCC (Post)
 * 15. DET (Post)
 * 16. RPN (Post)
 */
export default function EffectsTable({ failureMode, onRefresh }: EffectsTableProps) {
  const { token } = useAuth();
  const [editingEffectId, setEditingEffectId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Effect>>({});

  const handleStartEdit = (effect: Effect) => {
    setEditingEffectId(effect.id);
    setEditData({
      description: effect.description,
      severity: effect.severity,
      potential_cause: effect.potential_cause || '',
      current_design: effect.current_design || '',
      justification_pre: effect.justification_pre || '',
      justification_post: effect.justification_post || '',
      responsible: effect.responsible || '',
      action_taken: effect.action_taken || '',
      completion_date: effect.completion_date || '',
      severity_post: effect.severity_post || undefined,
      occurrence_post: effect.occurrence_post || undefined,
      detection_post: effect.detection_post || undefined,
    });
  };

  const handleSaveEdit = async (effectId: string) => {
    if (!editData.description?.trim()) {
      toast.error('Effect description is required');
      return;
    }

    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/effects/${effectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Effect updated successfully');
        setEditingEffectId(null);
        setEditData({});
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to update effect');
      }
    } catch (error) {
      console.error('Error updating effect:', error);
      toast.error('Failed to update effect');
    }
  };

  const handleCancelEdit = () => {
    setEditingEffectId(null);
    setEditData({});
  };

  const calculateRPNPre = (effect: Effect, cause: Cause | undefined): number => {
    if (!cause) return 0;
    const detection = failureMode.controls?.length
      ? Math.min(...failureMode.controls.map(c => c.detection))
      : 10;
    return effect.severity * cause.occurrence * detection;
  };

  const calculateRPNPost = (effect: Effect): number => {
    if (!effect.severity_post || !effect.occurrence_post || !effect.detection_post) return 0;
    return effect.severity_post * effect.occurrence_post * effect.detection_post;
  };

  // Get first cause for reference (in full FMEA, each effect can relate to specific causes)
  const firstCause = failureMode.causes?.[0];
  const firstControl = failureMode.controls?.[0];
  const firstAction = failureMode.actions?.[0];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide border-r border-gray-600 min-w-[200px]">
              Effects
            </th>
            <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide border-r border-gray-600 w-16">
              SEV
            </th>
            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide border-r border-gray-600 min-w-[180px]">
              Potential Cause
            </th>
            <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide border-r border-gray-600 w-16">
              OCC
            </th>
            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide border-r border-gray-600 min-w-[180px]">
              Current Design
            </th>
            <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide border-r border-gray-600 w-16">
              DET
            </th>
            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide border-r border-gray-600 min-w-[150px]">
              Justification (Pre)
            </th>
            <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide border-r-2 border-orange-400 w-24 bg-orange-800">
              RPN (Pre)
            </th>
            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide border-r border-gray-600 min-w-[200px]">
              Recommended Actions
            </th>
            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide border-r border-gray-600 min-w-[150px]">
              Justification (Post)
            </th>
            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide border-r border-gray-600 min-w-[120px]">
              Responsible
            </th>
            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide border-r border-gray-600 min-w-[180px]">
              Action Taken & Date
            </th>
            <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide border-r border-gray-600 w-16">
              SEV (Post)
            </th>
            <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide border-r border-gray-600 w-16">
              OCC (Post)
            </th>
            <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide border-r border-gray-600 w-16">
              DET (Post)
            </th>
            <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide w-24 bg-green-800">
              RPN (Post)
            </th>
          </tr>
        </thead>
        <tbody>
          {failureMode.effects && failureMode.effects.length > 0 ? (
            failureMode.effects.map((effect) => {
              const isEditing = editingEffectId === effect.id;
              const rpnPre = calculateRPNPre(effect, firstCause);
              const rpnPost = calculateRPNPost(effect);

              if (isEditing) {
                // Edit Mode - Inline form
                return (
                  <tr key={effect.id} className="border-b-2 border-blue-500 bg-blue-50">
                    <td colSpan={16} className="px-4 py-4">
                      <div className="grid grid-cols-4 gap-4">
                        {/* Row 1: Effect Description & SEV */}
                        <div className="col-span-3">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Effect Description</label>
                          <textarea
                            value={editData.description || ''}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">SEV (1-10)</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={editData.severity || 1}
                            onChange={(e) => setEditData({ ...editData, severity: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>

                        {/* Row 2: Potential Cause, Current Design, Justification Pre */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Potential Cause</label>
                          <input
                            type="text"
                            value={editData.potential_cause || ''}
                            onChange={(e) => setEditData({ ...editData, potential_cause: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Link to cause"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Current Design</label>
                          <input
                            type="text"
                            value={editData.current_design || ''}
                            onChange={(e) => setEditData({ ...editData, current_design: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Justification (Pre)</label>
                          <input
                            type="text"
                            value={editData.justification_pre || ''}
                            onChange={(e) => setEditData({ ...editData, justification_pre: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>

                        {/* Row 3: Post-mitigation fields */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Justification (Post)</label>
                          <input
                            type="text"
                            value={editData.justification_post || ''}
                            onChange={(e) => setEditData({ ...editData, justification_post: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Responsible</label>
                          <input
                            type="text"
                            value={editData.responsible || ''}
                            onChange={(e) => setEditData({ ...editData, responsible: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Action Taken</label>
                          <input
                            type="text"
                            value={editData.action_taken || ''}
                            onChange={(e) => setEditData({ ...editData, action_taken: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Completion Date</label>
                          <input
                            type="date"
                            value={editData.completion_date || ''}
                            onChange={(e) => setEditData({ ...editData, completion_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>

                        {/* Row 4: Post ratings */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">SEV (Post)</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={editData.severity_post || ''}
                            onChange={(e) => setEditData({ ...editData, severity_post: parseInt(e.target.value) || undefined })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="1-10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">OCC (Post)</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={editData.occurrence_post || ''}
                            onChange={(e) => setEditData({ ...editData, occurrence_post: parseInt(e.target.value) || undefined })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="1-10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">DET (Post)</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={editData.detection_post || ''}
                            onChange={(e) => setEditData({ ...editData, detection_post: parseInt(e.target.value) || undefined })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="1-10"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="col-span-4 flex justify-end space-x-3 pt-2">
                          <button
                            onClick={() => handleSaveEdit(effect.id)}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }

              // Read Mode - Display row
              return (
                <tr
                  key={effect.id}
                  onClick={() => handleStartEdit(effect)}
                  className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  {/* 1. Effects */}
                  <td className="px-3 py-3 text-gray-900 border-r border-gray-200">{effect.description}</td>

                  {/* 2. SEV */}
                  <td className="px-2 py-3 text-center font-bold text-gray-900 border-r border-gray-200">{effect.severity}</td>

                  {/* 3. Potential Cause */}
                  <td className="px-3 py-3 text-gray-700 border-r border-gray-200">
                    {effect.potential_cause || firstCause?.description || '-'}
                  </td>

                  {/* 4. OCC */}
                  <td className="px-2 py-3 text-center font-bold text-gray-900 border-r border-gray-200">
                    {firstCause?.occurrence || '-'}
                  </td>

                  {/* 5. Current Design */}
                  <td className="px-3 py-3 text-gray-700 border-r border-gray-200">
                    {effect.current_design || firstControl?.description || 'No Control'}
                  </td>

                  {/* 6. DET */}
                  <td className="px-2 py-3 text-center font-bold text-gray-900 border-r border-gray-200">
                    {firstControl?.detection || 10}
                  </td>

                  {/* 7. Justification (Pre) */}
                  <td className="px-3 py-3 text-gray-600 text-xs italic border-r border-gray-200">
                    {effect.justification_pre || '-'}
                  </td>

                  {/* 8. RPN (Pre) */}
                  <td className="px-2 py-3 text-center bg-orange-50 border-r-2 border-orange-200">
                    <RPNBadge rpn={rpnPre} showLabel={false} size="sm" />
                  </td>

                  {/* 9. Recommended Actions */}
                  <td className="px-3 py-3 text-gray-700 border-r border-gray-200">
                    {firstAction?.description || '-'}
                  </td>

                  {/* 10. Justification (Post) */}
                  <td className="px-3 py-3 text-gray-600 text-xs italic border-r border-gray-200">
                    {effect.justification_post || '-'}
                  </td>

                  {/* 11. Responsible */}
                  <td className="px-3 py-3 text-gray-700 border-r border-gray-200">
                    {effect.responsible || firstAction?.owner || '-'}
                  </td>

                  {/* 12. Action Taken & Date */}
                  <td className="px-3 py-3 text-gray-700 text-xs border-r border-gray-200">
                    {effect.action_taken || firstAction?.actionTaken || '-'}
                    {effect.completion_date && (
                      <div className="text-gray-500 mt-1">{new Date(effect.completion_date).toLocaleDateString()}</div>
                    )}
                  </td>

                  {/* 13. SEV (Post) */}
                  <td className="px-2 py-3 text-center text-gray-700 border-r border-gray-200">
                    {effect.severity_post || '-'}
                  </td>

                  {/* 14. OCC (Post) */}
                  <td className="px-2 py-3 text-center text-gray-700 border-r border-gray-200">
                    {effect.occurrence_post || '-'}
                  </td>

                  {/* 15. DET (Post) */}
                  <td className="px-2 py-3 text-center text-gray-700 border-r border-gray-200">
                    {effect.detection_post || '-'}
                  </td>

                  {/* 16. RPN (Post) */}
                  <td className="px-2 py-3 text-center bg-green-50">
                    {rpnPost > 0 ? (
                      <RPNBadge rpn={rpnPost} showLabel={false} size="sm" />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={16} className="px-4 py-12 text-center text-gray-500 italic">
                No effects added yet. Click the row above to add an effect to this failure mode.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
