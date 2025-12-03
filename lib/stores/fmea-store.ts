import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Component,
  FailureMode,
  Effect,
  ExpandedState,
  SelectedState,
  ComponentViewModel,
  FailureModeViewModel,
  CreateComponentInput,
  UpdateComponentInput,
  CreateFailureModeInput,
  UpdateFailureModeInput,
  CreateEffectInput,
  UpdateEffectInput,
} from '../types/fmea';

// Auto-calculation utilities
const calculateRPNPre = (effect: Effect): number => {
  return effect.sev * effect.occ * effect.det;
};

const calculateRPNPost = (effect: Effect): number => {
  return effect.sevPost * effect.occPost * effect.detPost;
};

interface FMEAStore {
  // Data
  components: Component[];

  // UI State
  expandedState: ExpandedState;
  selectedState: SelectedState;

  // Component Actions
  addComponent: (input: CreateComponentInput) => string;
  updateComponent: (id: string, updates: UpdateComponentInput) => void;
  deleteComponent: (id: string) => void;

  // Failure Mode Actions
  addFailureMode: (componentId: string, input: CreateFailureModeInput) => string;
  updateFailureMode: (id: string, updates: UpdateFailureModeInput) => void;
  deleteFailureMode: (id: string) => void;

  // Effect Actions
  addEffect: (failureModeId: string, input: CreateEffectInput) => string;
  updateEffect: (id: string, updates: UpdateEffectInput) => void;
  deleteEffect: (id: string) => void;

  // UI State Actions
  toggleComponentExpanded: (id: string) => void;
  toggleFailureModeExpanded: (id: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
  selectComponent: (id: string | null) => void;
  selectFailureMode: (id: string | null) => void;

  // Computed Selectors
  getComponentViewModel: (id: string) => ComponentViewModel | null;
  getFailureModeViewModel: (id: string) => FailureModeViewModel | null;
  findComponentByFailureModeId: (failureModeId: string) => Component | null;
  findFailureModeByEffectId: (effectId: string) => FailureMode | null;
}

export const useFMEAStore = create<FMEAStore>()(
  persist(
    (set, get) => ({
      // Initial State
      components: [],
      expandedState: {
        components: new Set<string>(),
        failureModes: new Set<string>(),
      },
      selectedState: {
        componentId: null,
        failureModeId: null,
      },

  // Component Actions
  addComponent: (input) => {
    const id = uuidv4();
    const newComponent: Component = {
      id,
      ...input,
      failureModes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      components: [...state.components, newComponent],
    }));

    return id;
  },

  updateComponent: (id, updates) => {
    set((state) => ({
      components: state.components.map((comp) =>
        comp.id === id
          ? { ...comp, ...updates, updatedAt: new Date() }
          : comp
      ),
    }));
  },

  deleteComponent: (id) => {
    set((state) => {
      // Also remove from expanded and selected state
      const newExpandedComponents = new Set(state.expandedState.components);
      newExpandedComponents.delete(id);

      return {
        components: state.components.filter((comp) => comp.id !== id),
        expandedState: {
          ...state.expandedState,
          components: newExpandedComponents,
        },
        selectedState: {
          ...state.selectedState,
          componentId: state.selectedState.componentId === id ? null : state.selectedState.componentId,
        },
      };
    });
  },

  // Failure Mode Actions
  addFailureMode: (componentId, input) => {
    const id = uuidv4();
    const newFailureMode: FailureMode = {
      id,
      componentId,
      ...input,
      effects: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      components: state.components.map((comp) =>
        comp.id === componentId
          ? {
              ...comp,
              failureModes: [...comp.failureModes, newFailureMode],
              updatedAt: new Date(),
            }
          : comp
      ),
    }));

    return id;
  },

  updateFailureMode: (id, updates) => {
    set((state) => ({
      components: state.components.map((comp) => ({
        ...comp,
        failureModes: comp.failureModes.map((fm) =>
          fm.id === id
            ? { ...fm, ...updates, updatedAt: new Date() }
            : fm
        ),
      })),
    }));
  },

  deleteFailureMode: (id) => {
    set((state) => {
      const newExpandedFailureModes = new Set(state.expandedState.failureModes);
      newExpandedFailureModes.delete(id);

      return {
        components: state.components.map((comp) => ({
          ...comp,
          failureModes: comp.failureModes.filter((fm) => fm.id !== id),
        })),
        expandedState: {
          ...state.expandedState,
          failureModes: newExpandedFailureModes,
        },
        selectedState: {
          ...state.selectedState,
          failureModeId: state.selectedState.failureModeId === id ? null : state.selectedState.failureModeId,
        },
      };
    });
  },

  // Effect Actions
  addEffect: (failureModeId, input) => {
    const id = uuidv4();

    // Calculate initial RPN values
    const rpnPre = input.sev * input.occ * input.det;
    const rpnPost = input.sevPost * input.occPost * input.detPost;

    const newEffect: Effect = {
      id,
      failureModeId,
      ...input,
      rpnPre,
      rpnPost,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      components: state.components.map((comp) => ({
        ...comp,
        failureModes: comp.failureModes.map((fm) =>
          fm.id === failureModeId
            ? {
                ...fm,
                effects: [...fm.effects, newEffect],
                updatedAt: new Date(),
              }
            : fm
        ),
      })),
    }));

    return id;
  },

  updateEffect: (id, updates) => {
    set((state) => ({
      components: state.components.map((comp) => ({
        ...comp,
        failureModes: comp.failureModes.map((fm) => ({
          ...fm,
          effects: fm.effects.map((effect) => {
            if (effect.id !== id) return effect;

            const updatedEffect = { ...effect, ...updates, updatedAt: new Date() };

            // Recalculate RPN if any SEV/OCC/DET changed
            if ('sev' in updates || 'occ' in updates || 'det' in updates) {
              updatedEffect.rpnPre = calculateRPNPre(updatedEffect);
            }
            if ('sevPost' in updates || 'occPost' in updates || 'detPost' in updates) {
              updatedEffect.rpnPost = calculateRPNPost(updatedEffect);
            }

            return updatedEffect;
          }),
        })),
      })),
    }));
  },

  deleteEffect: (id) => {
    set((state) => ({
      components: state.components.map((comp) => ({
        ...comp,
        failureModes: comp.failureModes.map((fm) => ({
          ...fm,
          effects: fm.effects.filter((effect) => effect.id !== id),
        })),
      })),
    }));
  },

  // UI State Actions
  toggleComponentExpanded: (id) => {
    set((state) => {
      const newExpandedComponents = new Set(state.expandedState.components);
      if (newExpandedComponents.has(id)) {
        newExpandedComponents.delete(id);
      } else {
        newExpandedComponents.add(id);
      }

      return {
        expandedState: {
          ...state.expandedState,
          components: newExpandedComponents,
        },
      };
    });
  },

  toggleFailureModeExpanded: (id) => {
    set((state) => {
      const newExpandedFailureModes = new Set(state.expandedState.failureModes);
      if (newExpandedFailureModes.has(id)) {
        newExpandedFailureModes.delete(id);
      } else {
        newExpandedFailureModes.add(id);
      }

      return {
        expandedState: {
          ...state.expandedState,
          failureModes: newExpandedFailureModes,
        },
      };
    });
  },

  collapseAll: () => {
    set({
      expandedState: {
        components: new Set<string>(),
        failureModes: new Set<string>(),
      },
    });
  },

  expandAll: () => {
    set((state) => {
      const allComponentIds = new Set(state.components.map((c) => c.id));
      const allFailureModeIds = new Set(
        state.components.flatMap((c) => c.failureModes.map((fm) => fm.id))
      );

      return {
        expandedState: {
          components: allComponentIds,
          failureModes: allFailureModeIds,
        },
      };
    });
  },

  selectComponent: (id) => {
    set((state) => ({
      selectedState: {
        ...state.selectedState,
        componentId: id,
        // Clear failure mode selection if component changes
        failureModeId: id !== state.selectedState.componentId ? null : state.selectedState.failureModeId,
      },
    }));
  },

  selectFailureMode: (id) => {
    set((state) => ({
      selectedState: {
        ...state.selectedState,
        failureModeId: id,
      },
    }));
  },

  // Computed Selectors
  getComponentViewModel: (id) => {
    const component = get().components.find((c) => c.id === id);
    if (!component) return null;

    const allEffects = component.failureModes.flatMap((fm) => fm.effects);
    const highestRPN = allEffects.length > 0
      ? Math.max(...allEffects.map((e) => e.rpnPre))
      : 0;

    return {
      ...component,
      failureModeCount: component.failureModes.length,
      highestRPN,
    };
  },

  getFailureModeViewModel: (id) => {
    const component = get().components.find((c) =>
      c.failureModes.some((fm) => fm.id === id)
    );
    if (!component) return null;

    const failureMode = component.failureModes.find((fm) => fm.id === id);
    if (!failureMode) return null;

    const rpnPre = failureMode.effects.length > 0
      ? Math.max(...failureMode.effects.map((e) => e.rpnPre))
      : 0;

    const rpnPost = failureMode.effects.length > 0
      ? Math.max(...failureMode.effects.map((e) => e.rpnPost))
      : 0;

    return {
      ...failureMode,
      effectCount: failureMode.effects.length,
      rpnPre,
      rpnPost,
    };
  },

  findComponentByFailureModeId: (failureModeId) => {
    return get().components.find((c) =>
      c.failureModes.some((fm) => fm.id === failureModeId)
    ) || null;
  },

  findFailureModeByEffectId: (effectId) => {
    for (const component of get().components) {
      const failureMode = component.failureModes.find((fm) =>
        fm.effects.some((e) => e.id === effectId)
      );
      if (failureMode) return failureMode;
    }
    return null;
  },
    }),
    {
      name: 'fmea-store',
      partialize: (state) => ({
        components: state.components,
        expandedState: {
          components: Array.from(state.expandedState.components),
          failureModes: Array.from(state.expandedState.failureModes),
        },
        selectedState: state.selectedState,
      }),
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          expandedState: {
            components: new Set(persistedState?.expandedState?.components || []),
            failureModes: new Set(persistedState?.expandedState?.failureModes || []),
          },
        };
      },
    }
  )
);
