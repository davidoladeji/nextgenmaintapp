import { useState } from 'react';
import toast from 'react-hot-toast';

interface AIAutoFillContext {
  project?: any;
  component?: any;
  failureMode?: any;
  processStep?: string;
  asset?: any;
}

interface AIAutoFillOptions {
  formType: 'component' | 'failureMode' | 'effect' | 'failureModeComplete';
  context: AIAutoFillContext;
  setValue: (field: string, value: any) => void;
  getValues: (field?: string | string[]) => any;
  token: string;
}

export function useAIAutoFill(options: AIAutoFillOptions) {
  const [isLoading, setIsLoading] = useState(false);

  const autoFill = async () => {
    const { formType, context, setValue, getValues, token } = options;

    setIsLoading(true);
    try {
      switch (formType) {
        case 'component':
          await autoFillComponent();
          break;
        case 'failureMode':
          await autoFillFailureMode();
          break;
        case 'effect':
          await autoFillEffect();
          break;
        case 'failureModeComplete':
          await autoFillCompleteForm();
          break;
        default:
          throw new Error('Unknown form type');
      }

      toast.success('Form auto-filled with AI suggestions!');
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast.error('Auto-fill failed. Please try again or fill manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const autoFillComponent = async () => {
    const { context, setValue, getValues, token } = options;
    const currentValues = getValues();

    // Only fill empty fields
    const fieldsToFill: string[] = [];
    if (!currentValues.name || currentValues.name.trim() === '') fieldsToFill.push('name');
    if (!currentValues.function || currentValues.function.trim() === '') fieldsToFill.push('function');

    if (fieldsToFill.length === 0) {
      toast.info('All fields are already filled');
      return;
    }

    // Get AI suggestion for component name
    if (fieldsToFill.includes('name')) {
      const nameResponse = await fetch('/api/ai/duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'component',
          originalName: 'New Component',
          context: {
            componentName: context.project?.asset || context.asset?.name,
          },
        }),
      });

      const nameResult = await nameResponse.json();
      if (nameResult.success && nameResult.data?.name) {
        setValue('name', nameResult.data.name);
      }
    }

    // Get AI suggestion for function
    if (fieldsToFill.includes('function')) {
      const functionResponse = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'general',
          context: {
            asset: context.project?.asset || context.asset,
            prompt: `Describe the function of a ${currentValues.name || 'component'} in an industrial asset`,
          },
        }),
      });

      const functionResult = await functionResponse.json();
      if (functionResult.success && functionResult.data?.suggestions?.[0]?.text) {
        setValue('function', functionResult.data.suggestions[0].text);
      }
    }
  };

  const autoFillFailureMode = async () => {
    const { context, setValue, getValues, token } = options;
    const currentValues = getValues();

    if (currentValues.name && currentValues.name.trim() !== '') {
      toast.info('Failure mode name is already filled');
      return;
    }

    const response = await fetch('/api/ai/duplicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'failureMode',
        originalName: 'New Failure Mode',
        context: {
          componentName: context.component?.name,
        },
      }),
    });

    const result = await response.json();
    if (result.success && result.data?.name) {
      setValue('name', result.data.name);
    }
  };

  const autoFillEffect = async () => {
    const { context, setValue, getValues, token } = options;
    const currentValues = getValues();

    // Determine which fields are empty
    const fieldsToFill: { [key: string]: boolean } = {
      effects: !currentValues.effects || currentValues.effects.trim() === '',
      potentialCause: !currentValues.potentialCause || currentValues.potentialCause.trim() === '',
      currentDesign: !currentValues.currentDesign || currentValues.currentDesign.trim() === '',
      recommendedActions: !currentValues.recommendedActions || currentValues.recommendedActions?.trim() === '',
      responsible: !currentValues.responsible || currentValues.responsible?.trim() === '',
    };

    const emptyCount = Object.values(fieldsToFill).filter(Boolean).length;
    if (emptyCount === 0) {
      toast.info('All text fields are already filled');
      return;
    }

    // Get AI suggestions for effects
    if (fieldsToFill.effects) {
      const effectsResponse = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'effects',
          context: {
            asset: context.project?.asset || context.asset,
            failureMode: {
              failureMode: context.failureMode?.name || context.failureMode?.failure_mode,
              processStep: context.processStep || context.failureMode?.process_step,
            },
          },
        }),
      });

      const effectsResult = await effectsResponse.json();
      if (effectsResult.success && effectsResult.data?.suggestions?.[0]?.text) {
        setValue('effects', effectsResult.data.suggestions[0].text);
        // Set default severity if not set
        if (!currentValues.sev) {
          setValue('sev', 5);
        }
      }
    }

    // Get AI suggestions for causes (potential cause field)
    if (fieldsToFill.potentialCause) {
      const causesResponse = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'causes',
          context: {
            asset: context.project?.asset || context.asset,
            failureMode: {
              failureMode: context.failureMode?.name || context.failureMode?.failure_mode,
              processStep: context.processStep || context.failureMode?.process_step,
            },
          },
        }),
      });

      const causesResult = await causesResponse.json();
      if (causesResult.success && causesResult.data?.suggestions?.[0]?.text) {
        setValue('potentialCause', causesResult.data.suggestions[0].text);
        // Set default occurrence if not set
        if (!currentValues.occ) {
          setValue('occ', 5);
        }
      }
    }

    // Get AI suggestions for controls (current design field)
    if (fieldsToFill.currentDesign) {
      const controlsResponse = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'controls',
          context: {
            asset: context.project?.asset || context.asset,
            failureMode: {
              failureMode: context.failureMode?.name || context.failureMode?.failure_mode,
              processStep: context.processStep || context.failureMode?.process_step,
            },
          },
        }),
      });

      const controlsResult = await controlsResponse.json();
      if (controlsResult.success && controlsResult.data?.suggestions?.[0]?.text) {
        setValue('currentDesign', controlsResult.data.suggestions[0].text);
        // Set default detection if not set
        if (!currentValues.det) {
          setValue('det', 5);
        }
      }
    }

    // Fill recommended actions with generic suggestion if empty
    if (fieldsToFill.recommendedActions && currentValues.effects) {
      setValue('recommendedActions', `Implement corrective measures to mitigate ${currentValues.effects.toLowerCase()}`);
    }

    // Fill responsible with default if empty
    if (fieldsToFill.responsible) {
      setValue('responsible', 'Maintenance Team');
    }

    // Set reasonable defaults for post-mitigation values if not set
    if (!currentValues.sevPost) setValue('sevPost', 3);
    if (!currentValues.occPost) setValue('occPost', 3);
    if (!currentValues.detPost) setValue('detPost', 3);
  };

  const autoFillCompleteForm = async () => {
    const { context, setValue, getValues, token } = options;
    const currentValues = getValues();

    // Fill process step if empty
    if (!currentValues.processStep || currentValues.processStep.trim() === '') {
      setValue('processStep', 'Operation');
    }

    // Fill failure mode if empty
    if (!currentValues.failureMode || currentValues.failureMode.trim() === '') {
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
            componentName: context.project?.asset || context.asset?.name,
          },
        }),
      });

      const fmResult = await fmResponse.json();
      if (fmResult.success && fmResult.data?.name) {
        setValue('failureMode', fmResult.data.name);
      }
    }

    // Add causes if none exist
    if (!currentValues.causes || currentValues.causes.length === 0) {
      const causesResponse = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'causes',
          context: {
            asset: context.project?.asset || context.asset,
            failureMode: {
              failureMode: currentValues.failureMode || 'Equipment Failure',
              processStep: currentValues.processStep || 'Operation',
            },
          },
        }),
      });

      const causesResult = await causesResponse.json();
      if (causesResult.success && causesResult.data?.suggestions) {
        const causes = causesResult.data.suggestions.slice(0, 3).map((s: any) => ({
          description: s.text,
          occurrence: 5,
        }));
        setValue('causes', causes);
      }
    }

    // Add effects if none exist
    if (!currentValues.effects || currentValues.effects.length === 0) {
      const effectsResponse = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'effects',
          context: {
            asset: context.project?.asset || context.asset,
            failureMode: {
              failureMode: currentValues.failureMode || 'Equipment Failure',
              processStep: currentValues.processStep || 'Operation',
            },
          },
        }),
      });

      const effectsResult = await effectsResponse.json();
      if (effectsResult.success && effectsResult.data?.suggestions) {
        const effects = effectsResult.data.suggestions.slice(0, 3).map((s: any) => ({
          description: s.text,
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
        }));
        setValue('effects', effects);
      }
    }

    // Add controls if none exist
    if (!currentValues.controls || currentValues.controls.length === 0) {
      const controlsResponse = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'controls',
          context: {
            asset: context.project?.asset || context.asset,
            failureMode: {
              failureMode: currentValues.failureMode || 'Equipment Failure',
              processStep: currentValues.processStep || 'Operation',
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
  };

  return { autoFill, isLoading };
}
