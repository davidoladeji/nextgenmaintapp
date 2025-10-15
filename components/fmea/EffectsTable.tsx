'use client';

import { FailureMode, Effect, Cause } from '@/types';
import { useState } from 'react';
import RPNBadge from './RPNBadge';
import { useAuth } from '@/lib/store';
import toast from 'react-hot-toast';
import { Save, X } from 'lucide-react';

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

  const handleStartEdit = (effect: Effect, e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm border-collapse min-w-[2000px]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-700 text-white">
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
            <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide border-r-2 border-orange-400 w-24 bg-orange-700">
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
            <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide w-32 bg-green-700">
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
                // Edit Mode - Keep table structure with inputs in each cell
                return (
                  <tr key={effect.id} className="border-b-2 border-blue-400 bg-gray-50">
                    {/* 1. Effects */}
                    <td className="px-2 py-2 border-r border-gray-200">
                      <textarea
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                        placeholder="Effect description"
                      />
                    </td>

                    {/* 2. SEV */}
                    <td className="px-2 py-2 border-r border-gray-200">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editData.severity || 1}
                        onChange={(e) => setEditData({ ...editData, severity: parseInt(e.target.value) || 1 })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* 3. Potential Cause */}
                    <td className="px-2 py-2 border-r border-gray-200">
                      <input
                        type="text"
                        value={editData.potential_cause || ''}
                        onChange={(e) => setEditData({ ...editData, potential_cause: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Cause"
                      />
                    </td>

                    {/* 4. OCC (read-only from cause) */}
                    <td className="px-2 py-2 text-center text-gray-500 border-r border-gray-200 text-xs">
                      {firstCause?.occurrence || '-'}
                    </td>

                    {/* 5. Current Design */}
                    <td className="px-2 py-2 border-r border-gray-200">
                      <input
                        type="text"
                        value={editData.current_design || ''}
                        onChange={(e) => setEditData({ ...editData, current_design: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Control"
                      />
                    </td>

                    {/* 6. DET (read-only from control) */}
                    <td className="px-2 py-2 text-center text-gray-500 border-r border-gray-200 text-xs">
                      {firstControl?.detection || 10}
                    </td>

                    {/* 7. Justification (Pre) */}
                    <td className="px-2 py-2 border-r border-gray-200">
                      <input
                        type="text"
                        value={editData.justification_pre || ''}
                        onChange={(e) => setEditData({ ...editData, justification_pre: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Justification"
                      />
                    </td>

                    {/* 8. RPN (Pre) - calculated */}
                    <td className="px-2 py-2 text-center bg-orange-50 border-r-2 border-orange-200">
                      <RPNBadge rpn={calculateRPNPre(effect, firstCause)} showLabel={false} size="sm" />
                    </td>

                    {/* 9. Recommended Actions (read-only from actions) */}
                    <td className="px-2 py-2 text-gray-500 text-xs border-r border-gray-200">
                      {firstAction?.description || '-'}
                    </td>

                    {/* 10. Justification (Post) */}
                    <td className="px-2 py-2 border-r border-gray-200">
                      <input
                        type="text"
                        value={editData.justification_post || ''}
                        onChange={(e) => setEditData({ ...editData, justification_post: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Justification"
                      />
                    </td>

                    {/* 11. Responsible */}
                    <td className="px-2 py-2 border-r border-gray-200">
                      <input
                        type="text"
                        value={editData.responsible || ''}
                        onChange={(e) => setEditData({ ...editData, responsible: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Owner"
                      />
                    </td>

                    {/* 12. Action Taken & Date */}
                    <td className="px-2 py-2 border-r border-gray-200">
                      <input
                        type="text"
                        value={editData.action_taken || ''}
                        onChange={(e) => setEditData({ ...editData, action_taken: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs mb-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Action"
                      />
                      <input
                        type="date"
                        value={editData.completion_date || ''}
                        onChange={(e) => setEditData({ ...editData, completion_date: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* 13. SEV (Post) */}
                    <td className="px-2 py-2 border-r border-gray-200">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editData.severity_post || ''}
                        onChange={(e) => setEditData({ ...editData, severity_post: parseInt(e.target.value) || undefined })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="1-10"
                      />
                    </td>

                    {/* 14. OCC (Post) */}
                    <td className="px-2 py-2 border-r border-gray-200">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editData.occurrence_post || ''}
                        onChange={(e) => setEditData({ ...editData, occurrence_post: parseInt(e.target.value) || undefined })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="1-10"
                      />
                    </td>

                    {/* 15. DET (Post) */}
                    <td className="px-2 py-2 border-r border-gray-200">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editData.detection_post || ''}
                        onChange={(e) => setEditData({ ...editData, detection_post: parseInt(e.target.value) || undefined })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="1-10"
                      />
                    </td>

                    {/* 16. RPN (Post) with action buttons */}
                    <td className="px-2 py-2 text-center bg-green-50">
                      <div className="flex flex-col items-center space-y-1">
                        {calculateRPNPost(effect) > 0 ? (
                          <RPNBadge rpn={calculateRPNPost(effect)} showLabel={false} size="sm" />
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleSaveEdit(effect.id)}
                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                            title="Save"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-xs"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
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
                  onDoubleClick={(e) => handleStartEdit(effect, e)}
                  className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
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
              <td colSpan={16} className="px-4 py-12 text-center text-gray-500 italic text-sm">
                No effects added yet. Double-click a row to edit.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
