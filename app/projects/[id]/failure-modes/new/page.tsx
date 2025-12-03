'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react';
import { useAuth, useProject } from '@/lib/store';
import { Project, CreateFailureModeInput } from '@/types';
import toast from 'react-hot-toast';
import AIInputField from '@/components/common/AIInputField';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function NewFailureModePage() {
  const router = useRouter();
  const params = useParams();
  const { token, user, isInitializing } = useAuth();
  const { currentProject } = useProject();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const projectId = params.id as string;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateFailureModeInput>({
    defaultValues: {
      processStep: '',
      failureMode: '',
      causes: [{ description: '', occurrence: 5 }],
      effects: [
        {
          description: '',
          severity: 5,
          potential_cause: '',
          current_design: '',
          design_verification: '',
          design_validation: '',
          responsible: '',
          action_taken: '',
          completion_date: null,
          post_mitigation_severity: null,
          post_mitigation_occurrence: null,
          post_mitigation_detection: null,
        },
      ],
      controls: [{ description: '', type: 'prevention', detection: 5, effectiveness: 5 }],
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

  const watchedProcessStep = watch('processStep');
  const watchedFailureMode = watch('failureMode');

  useEffect(() => {
    // Wait for auth initialization
    if (isInitializing) {
      return;
    }

    if (!user || !token) {
      router.push('/');
      return;
    }

    loadProject();
  }, [user, token, isInitializing, projectId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        setProject(result.data);
      } else {
        toast.error('Failed to load project');
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const suggestCauses = async () => {
    if (!watchedFailureMode || !project) {
      toast.error('Please enter a failure mode first');
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
            processStep: watchedProcessStep,
            failureMode: watchedFailureMode,
          },
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const suggestions = result.data.causes || [];
        if (suggestions.length > 0) {
          // Replace existing causes with suggestions
          setValue('causes', suggestions.map((s: any) => ({
            description: s.description,
            occurrence: s.occurrence || 5,
          })));
          toast.success(`Added ${suggestions.length} AI-suggested causes`);
        }
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast.error('Failed to get AI suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const suggestEffects = async () => {
    if (!watchedFailureMode || !project) {
      toast.error('Please enter a failure mode first');
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
            processStep: watchedProcessStep,
            failureMode: watchedFailureMode,
          },
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const suggestions = result.data.effects || [];
        if (suggestions.length > 0) {
          // Replace existing effects with suggestions
          setValue('effects', suggestions.map((s: any) => ({
            description: s.description,
            severity: s.severity || 5,
            potential_cause: '',
            current_design: '',
            design_verification: '',
            design_validation: '',
            responsible: '',
            action_taken: '',
            completion_date: null,
            post_mitigation_severity: null,
            post_mitigation_occurrence: null,
            post_mitigation_detection: null,
          })));
          toast.success(`Added ${suggestions.length} AI-suggested effects`);
        }
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast.error('Failed to get AI suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const autoFillEntireForm = async () => {
    if (!project) {
      toast.error('Project not loaded');
      return;
    }

    setAiLoading(true);
    try {
      // Fill process step if empty
      const currentProcessStep = watch('processStep');
      if (!currentProcessStep || currentProcessStep.trim() === '') {
        setValue('processStep', 'Operation');
      }

      // Fill failure mode if empty
      const currentFailureMode = watch('failureMode');
      if (!currentFailureMode || currentFailureMode.trim() === '') {
        const fmResponse = await fetch('/api/ai/duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'failureMode',
            originalName: 'Equipment Failure',
            context: {
              componentName: project.asset || project.name,
            },
          }),
        });

        const fmResult = await fmResponse.json();
        if (fmResult.success && fmResult.data?.name) {
          setValue('failureMode', fmResult.data.name);
        }
      }

      // Add causes if none exist
      const currentCauses = watch('causes');
      if (!currentCauses || currentCauses.length === 0) {
        await suggestCauses();
      }

      // Add effects if none exist
      const currentEffects = watch('effects');
      if (!currentEffects || currentEffects.length === 0) {
        await suggestEffects();
      }

      // Add controls if none exist
      const currentControls = watch('controls');
      if (!currentControls || currentControls.length === 0) {
        const controlsResponse = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'controls',
            context: {
              asset: project.asset,
              failureMode: {
                failureMode: watch('failureMode') || 'Equipment Failure',
                processStep: watch('processStep') || 'Operation',
              },
            },
          }),
        });

        const controlsResult = await controlsResponse.json();
        if (controlsResult.success && controlsResult.data?.suggestions) {
          const controls = controlsResult.data.suggestions.slice(0, 2).map((s: any) => ({
            description: s.text,
            type: 'prevention',
            detection: 5,
            effectiveness: 5,
          }));
          setValue('controls', controls);
        }
      }

      toast.success('Entire form auto-filled with AI suggestions!');
    } catch (error) {
      console.error('Error auto-filling form:', error);
      toast.error('Failed to auto-fill form');
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (data: CreateFailureModeInput) => {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/failure-modes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Failure mode created successfully!');
        router.push(`/`);
      } else {
        toast.error(result.error || 'Failed to create failure mode');
      }
    } catch (error) {
      console.error('Error creating failure mode:', error);
      toast.error('Failed to create failure mode');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="spinner mb-4 mx-auto" />
            <p className="text-gray-600 dark:text-slate-400">Loading project...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Add New Failure Mode</h1>
              <p className="text-gray-600 dark:text-slate-400 mt-2">{project.name}</p>
            </div>
            <button
              type="button"
              onClick={autoFillEntireForm}
              disabled={aiLoading || submitting}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors font-medium shadow-lg"
            >
              {aiLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Auto-filling Form...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Auto-fill Entire Form with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.processStep.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.failureMode.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Causes */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Causes</h2>
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
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">
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
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Effects */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Effects</h2>
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
                  onClick={() =>
                    appendEffect({
                      description: '',
                      severity: 5,
                      potential_cause: '',
                      current_design: '',
                      design_verification: '',
                      design_validation: '',
                      responsible: '',
                      action_taken: '',
                      completion_date: null,
                      post_mitigation_severity: null,
                      post_mitigation_occurrence: null,
                      post_mitigation_detection: null,
                    })
                  }
                  className="btn-secondary btn-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Effect
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {effectFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
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
                            placeholder="Describe the effect..."
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
                        <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                          {errors.effects[index]?.description?.message}
                        </p>
                      )}
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                        Severity *
                      </label>
                      <select
                        className="input"
                        {...register(`effects.${index}.severity`, {
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
                    </div>
                    {effectFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEffect(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md h-fit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                        Potential Cause
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Link to potential cause..."
                        {...register(`effects.${index}.potential_cause`)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                        Current Design Controls
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Current design controls..."
                        {...register(`effects.${index}.current_design`)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                        Design Verification
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Verification method..."
                        {...register(`effects.${index}.design_verification`)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                        Design Validation
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Validation method..."
                        {...register(`effects.${index}.design_validation`)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                        Responsible
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Responsible person/team..."
                        {...register(`effects.${index}.responsible`)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                        Action Taken
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Actions taken..."
                        {...register(`effects.${index}.action_taken`)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Controls</h2>
              <button
                type="button"
                onClick={() => appendControl({ description: '', type: 'prevention', detection: 5, effectiveness: 5 })}
                className="btn-secondary btn-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Control
              </button>
            </div>

            <div className="space-y-3">
              {controlFields.map((field, index) => (
                <div key={field.id} className="flex space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      className="input"
                      placeholder="Describe the control..."
                      {...register(`controls.${index}.description`, {
                        required: 'Control description is required',
                      })}
                    />
                    {errors.controls?.[index]?.description && (
                      <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                        {errors.controls[index]?.description?.message}
                      </p>
                    )}
                  </div>
                  <div className="w-32">
                    <select className="input" {...register(`controls.${index}.type`)}>
                      <option value="prevention">Prevention</option>
                      <option value="detection">Detection</option>
                    </select>
                  </div>
                  <div className="w-24">
                    <select
                      className="input"
                      {...register(`controls.${index}.detection`, {
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
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Detection</div>
                  </div>
                  <div className="w-24">
                    <select
                      className="input"
                      {...register(`controls.${index}.effectiveness`, {
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
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Effectiveness</div>
                  </div>
                  {controlFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeControl(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pb-8">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="btn-secondary btn-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary btn-lg"
              disabled={submitting}
            >
              {submitting ? (
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
    </DashboardLayout>
  );
}
