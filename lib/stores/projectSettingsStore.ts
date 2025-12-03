import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectSettingsState {
  // Standards & Templates
  standards: string[];

  // Actions
  setStandards: (standards: string[]) => void;
  addStandard: (standard: string) => void;
  removeStandard: (standard: string) => void;
}

// Default standards list
const defaultStandards: string[] = ['SAE J1739'];

export const useProjectSettings = create<ProjectSettingsState>()(
  persist(
    (set) => ({
      // Initial state
      standards: defaultStandards,

      // Actions
      setStandards: (standards) => set({ standards }),

      addStandard: (standard) =>
        set((state) => ({
          standards: state.standards.includes(standard)
            ? state.standards
            : [...state.standards, standard],
        })),

      removeStandard: (standard) =>
        set((state) => ({
          standards: state.standards.filter((s) => s !== standard),
        })),
    }),
    {
      name: 'project-settings-storage',
      partialize: (state) => ({
        standards: Array.isArray(state.standards) ? state.standards : defaultStandards,
      }),
    }
  )
);
