import { create } from 'zustand';

interface ProjectSettingsState {
  // Standards & Templates
  standards: string[];

  // Loading state
  isLoading: boolean;
  currentProjectId: string | null;

  // Actions
  setStandards: (standards: string[]) => void;
  addStandard: (standard: string) => void;
  removeStandard: (standard: string) => void;

  // API actions
  loadFromProject: (projectId: string) => Promise<void>;
  saveToProject: (projectId: string) => Promise<void>;
}

// Default standards list
const defaultStandards: string[] = ['SAE J1739'];

export const useProjectSettings = create<ProjectSettingsState>()((set, get) => ({
  // Initial state
  standards: defaultStandards,
  isLoading: false,
  currentProjectId: null,

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

  // API actions
  loadFromProject: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/projects/${projectId}/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load project settings');
      }

      const { data } = await response.json();

      if (data.standards) {
        set({
          standards: data.standards,
          currentProjectId: projectId,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error loading project settings:', error);
      set({ isLoading: false });
    }
  },

  saveToProject: async (projectId: string) => {
    try {
      const { standards } = get();
      const token = localStorage.getItem('auth-token');

      const response = await fetch(`/api/projects/${projectId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          standards,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save project settings');
      }

      set({ currentProjectId: projectId });
    } catch (error) {
      console.error('Error saving project settings:', error);
      throw error;
    }
  },
}));
