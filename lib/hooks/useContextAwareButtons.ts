import { useFMEAStore } from '../stores/fmea-store';

export interface ContextAwareButtonStates {
  canAddComponent: boolean;
  canAddFailureMode: boolean;
  canAddEffect: boolean;

  // Tooltip messages
  componentTooltip: string;
  failureModeTooltip: string;
  effectTooltip: string;
}

export const useContextAwareButtons = (): ContextAwareButtonStates => {
  const selectedState = useFMEAStore((state) => state.selectedState);

  const canAddComponent = true; // Always enabled
  const canAddFailureMode = selectedState.componentId !== null;
  const canAddEffect = selectedState.failureModeId !== null;

  return {
    canAddComponent,
    canAddFailureMode,
    canAddEffect,

    componentTooltip: 'Add a new component to the FMEA',
    failureModeTooltip: canAddFailureMode
      ? 'Add a new failure mode to the selected component'
      : 'Select a component first to add a failure mode',
    effectTooltip: canAddEffect
      ? 'Add a new effect to the selected failure mode'
      : 'Select a failure mode first to add an effect',
  };
};
