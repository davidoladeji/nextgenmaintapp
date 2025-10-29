'use client';
// @ts-nocheck

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/store';
import { Project, FailureModeForm } from '@/types';
import AIInputField from '../common/AIInputField';

interface CreateFailureModeModalProps {
  project: Project;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateFailureModeModal({ 
  project, 
  onClose, 
  onSuccess 
}: CreateFailureModeModalProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
  } = useForm<FailureModeForm>({
    defaultValues: {
      causes: [{ description: '', occurrence: 5 }],
      effects: [{
        description: '',
        severity: 5,
        potential_cause: '',
        current_design: '',
        justification_pre: '',
        justification_post: '',
        responsible: '',
        action_taken: '',
        completion_date: '',
        severity_post: 5,
        occurrence_post: 5,
        detection_post: 5,
      }],
      controls: [],
    },
  });

  const {
    fields: causeFields,
    append: appendCause,
    remove: removeCause,
  } = useFieldArray({
    control,
    name: 'causes',
  });

  const {
    fields: effectFields,
    append: appendEffect,
    remove: removeEffect,
  } = useFieldArray({
    control,
    name: 'effects',
  });

  const {
    fields: controlFields,
    append: appendControl,
    remove: removeControl,
  } = useFieldArray({
    control,
    name: 'controls',
  });

  const watchedFailureMode = watch('failureMode');
  const watchedProcessStep = watch('processStep');

  const onSubmit = async (data: FailureModeForm) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/projects/${project.id}/failure-modes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create failure mode');
      }

      toast.success('Failure mode created successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create failure mode');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestCauses = async () => {
    if (!watchedFailureMode || !watchedProcessStep) {
      toast.error('Please fill in Process Step and Failure Mode first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'causes',
          context: {
            asset: project.asset,
            failureMode: {
              failureMode: watchedFailureMode,
              processStep: watchedProcessStep,
            },
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Clear existing causes and add AI suggestions
        setValue('causes', result.data.suggestions.map((s: any) => ({
          description: s.text,
          occurrence: 5, // Default value
        })));
        toast.success('AI suggestions added!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error('AI suggestions temporarily unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  const suggestEffects = async () => {
    if (!watchedFailureMode || !watchedProcessStep) {
      toast.error('Please fill in Process Step and Failure Mode first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'effects',
          context: {
            asset: project.asset,
            failureMode: {
              failureMode: watchedFailureMode,
              processStep: watchedProcessStep,
            },
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Clear existing effects and add AI suggestions
        setValue('effects', result.data.suggestions.map((s: any) => ({
          description: s.text,
          severity: 5, // Default value
        })));
        toast.success('AI suggestions added!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error('AI suggestions temporarily unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Add New Failure Mode</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Process Step *
              </label>
              <Controller
                name="processStep"
                control={control}
                rules={{ required: 'Process step is required' }}
                render={({ field }) => (
                  <AIInputField
                    value={field.value || ''}
                    onChange={field.onChange}
                    type="text"
                    placeholder="e.g., Startup, Operation, Shutdown"
                    token={token || undefined}
                    aiContext={{
                      type: 'processStep',
                      asset: project.asset,
                    }}
                  />
                )}
              />
              {errors.processStep && (
                <p className="text-danger-600 text-sm mt-1">{errors.processStep.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Failure Mode *
              </label>
              <Controller
                name="failureMode"
                control={control}
                rules={{ required: 'Failure mode is required' }}
                render={({ field }) => (
                  <AIInputField
                    value={field.value || ''}
                    onChange={field.onChange}
                    type="text"
                    placeholder="e.g., Pump fails to start"
                    token={token || undefined}
                    aiContext={{
                      type: 'failureMode',
                      asset: project.asset,
                      processStep: watchedProcessStep,
                    }}
                  />
                )}
              />
              {errors.failureMode && (
                <p className="text-danger-600 text-sm mt-1">{errors.failureMode.message}</p>
              )}
            </div>
          </div>

          {/* Causes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">Causes</h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={suggestCauses}
                  disabled={aiLoading}
                  className="btn-secondary btn-sm"
                >
                  {aiLoading ? (
                    <div className="spinner mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                  )}
                  AI Suggest
                </button>
                <button
                  type="button"
                  onClick={() => appendCause({ description: '', occurrence: 5 })}
                  className="btn-secondary btn-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Cause
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {causeFields.map((field, index) => (
                <div key={field.id} className="flex space-x-3">
                  <div className="flex-1">
                    <Controller
                      name={`causes.${index}.description`}
                      control={control}
                      rules={{ required: 'Cause description is required' }}
                      render={({ field }) => (
                        <AIInputField
                          value={field.value || ''}
                          onChange={field.onChange}
                          type="text"
                          placeholder="Describe the root cause..."
                          token={token || undefined}
                          aiContext={{
                            type: 'cause',
                            asset: project.asset,
                            failureMode: {
                              failureMode: watchedFailureMode,
                              processStep: watchedProcessStep,
                            },
                          }}
                        />
                      )}
                    />
                    {errors.causes?.[index]?.description && (
                      <p className="text-danger-600 text-sm mt-1">
                        {errors.causes[index]?.description?.message}
                      </p>
                    )}
                  </div>
                  <div className="w-24">
                    <select
                      className="input"
                      {...register(`causes.${index}.occurrence`, {
                        required: true,
                        valueAsNumber: true,
                      })}
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Occurrence</div>
                  </div>
                  {causeFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCause(index)}
                      className="p-2 text-danger-600 hover:bg-danger-50 dark:hover:bg-red-900/30 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Effects */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">Effects</h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={suggestEffects}
                  disabled={aiLoading}
                  className="btn-secondary btn-sm"
                >
                  {aiLoading ? (
                    <div className="spinner mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                  )}
                  AI Suggest
                </button>
                <button
                  type="button"
                  onClick={() => appendEffect({
                    description: '',
                    severity: 5,
                    potential_cause: '',
                    current_design: '',
                    justification_pre: '',
                    justification_post: '',
                    responsible: '',
                    action_taken: '',
                    completion_date: '',
                    severity_post: 5,
                    occurrence_post: 5,
                    detection_post: 5,
                  })}
                  className="btn-secondary btn-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Effect
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {effectFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-900">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-slate-100">Effect #{index + 1}</h4>
                    {effectFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEffect(index)}
                        className="p-1 text-danger-600 hover:bg-danger-50 dark:hover:bg-red-900/30 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Effect Description */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Effect Description *
                    </label>
                    <Controller
                      name={`effects.${index}.description`}
                      control={control}
                      rules={{ required: 'Effect description is required' }}
                      render={({ field }) => (
                        <AIInputField
                          value={field.value || ''}
                          onChange={field.onChange}
                          type="text"
                          placeholder="Describe the effect/consequence..."
                          token={token || undefined}
                          aiContext={{
                            type: 'effect',
                            asset: project.asset,
                            failureMode: {
                              failureMode: watchedFailureMode,
                              processStep: watchedProcessStep,
                            },
                          }}
                        />
                      )}
                    />
                    {errors.effects?.[index]?.description && (
                      <p className="text-danger-600 text-sm mt-1">
                        {errors.effects[index]?.description?.message}
                      </p>
                    )}
                  </div>

                  {/* Pre-Mitigation Section */}
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h5 className="font-medium text-sm text-blue-900 dark:text-blue-300 mb-3">Pre-Mitigation Assessment</h5>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Severity (SEV) *
                        </label>
                        <select
                          className="input text-sm"
                          {...register(`effects.${index}.severity`, {
                            required: true,
                            valueAsNumber: true,
                          })}
                        >
                          {[...Array(10)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Occurrence (OCC)
                        </label>
                        <select
                          className="input text-sm"
                          {...register(`effects.${index}.occurrence_post`, {
                            valueAsNumber: true,
                          })}
                        >
                          {[...Array(10)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Detection (DET)
                        </label>
                        <select
                          className="input text-sm"
                          {...register(`effects.${index}.detection_post`, {
                            valueAsNumber: true,
                          })}
                        >
                          {[...Array(10)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Potential Cause
                        </label>
                        <input
                          type="text"
                          className="input text-sm"
                          placeholder="What could cause this effect?"
                          {...register(`effects.${index}.potential_cause`)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Current Design Controls
                        </label>
                        <input
                          type="text"
                          className="input text-sm"
                          placeholder="Existing controls or mitigations..."
                          {...register(`effects.${index}.current_design`)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Justification (Pre-Mitigation)
                        </label>
                        <textarea
                          rows={2}
                          className="input text-sm"
                          placeholder="Justify the pre-mitigation ratings..."
                          {...register(`effects.${index}.justification_pre`)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Post-Mitigation Section */}
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h5 className="font-medium text-sm text-green-900 dark:text-green-300 mb-3">Post-Mitigation Actions</h5>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Severity (Post)
                        </label>
                        <select
                          className="input text-sm"
                          {...register(`effects.${index}.severity_post`, {
                            valueAsNumber: true,
                          })}
                        >
                          {[...Array(10)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Occurrence (Post)
                        </label>
                        <select
                          className="input text-sm"
                          {...register(`effects.${index}.occurrence_post`, {
                            valueAsNumber: true,
                          })}
                        >
                          {[...Array(10)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Detection (Post)
                        </label>
                        <select
                          className="input text-sm"
                          {...register(`effects.${index}.detection_post`, {
                            valueAsNumber: true,
                          })}
                        >
                          {[...Array(10)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Responsible Person/Team
                        </label>
                        <input
                          type="text"
                          className="input text-sm"
                          placeholder="Who is responsible?"
                          {...register(`effects.${index}.responsible`)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Action Taken
                        </label>
                        <textarea
                          rows={2}
                          className="input text-sm"
                          placeholder="Describe action taken..."
                          {...register(`effects.${index}.action_taken`)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Completion Date
                        </label>
                        <input
                          type="date"
                          className="input text-sm"
                          {...register(`effects.${index}.completion_date`)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Justification (Post-Mitigation)
                        </label>
                        <textarea
                          rows={2}
                          className="input text-sm"
                          placeholder="Justify the post-mitigation ratings..."
                          {...register(`effects.${index}.justification_post`)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">Controls (Optional)</h3>
              <button
                type="button"
                onClick={() => appendControl({ 
                  type: 'prevention', 
                  description: '', 
                  detection: 5, 
                  effectiveness: 5 
                })}
                className="btn-secondary btn-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Control
              </button>
            </div>

            <div className="space-y-3">
              {controlFields.map((field, index) => (
                <div key={field.id} className="space-y-2 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex space-x-3">
                    <div className="w-32">
                      <select
                        className="input"
                        {...register(`controls.${index}.type`)}
                      >
                        <option value="prevention">Prevention</option>
                        <option value="detection">Detection</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <Controller
                        name={`controls.${index}.description`}
                        control={control}
                        render={({ field }) => (
                          <AIInputField
                            value={field.value || ''}
                            onChange={field.onChange}
                            type="text"
                            placeholder="Describe the control measure..."
                            token={token || undefined}
                            aiContext={{
                              type: 'control',
                              asset: project.asset,
                              failureMode: {
                                failureMode: watchedFailureMode,
                                processStep: watchedProcessStep,
                              },
                            }}
                          />
                        )}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeControl(index)}
                      className="p-2 text-danger-600 hover:bg-danger-50 dark:hover:bg-red-900/30 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex space-x-3">
                    <div className="w-32">
                      <select
                        className="input"
                        {...register(`controls.${index}.detection`, {
                          valueAsNumber: true,
                        })}
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Detection</div>
                    </div>
                    <div className="w-32">
                      <select
                        className="input"
                        {...register(`controls.${index}.effectiveness`, {
                          valueAsNumber: true,
                        })}
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Effectiveness</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary btn-md"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary btn-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner mr-2" />
                  Creating...
                </>
              ) : (
                'Create Failure Mode'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}