import { create } from 'zustand';

export interface CriticalityThreshold {
  id: number;
  label: string;
  min: number;
  max: number;
  color: string;
}

interface RiskSettingsState {
  // Matrix configuration
  matrixSize: number;
  scaleType: '1-10' | '1-5';

  // Criticality thresholds (RPN bands)
  thresholds: CriticalityThreshold[];

  // Loading state
  isLoading: boolean;
  currentProjectId: string | null;

  // Actions
  setMatrixSize: (size: number) => void;
  setScaleType: (type: '1-10' | '1-5') => void;
  setThresholds: (thresholds: CriticalityThreshold[]) => void;
  updateThreshold: (id: number, updates: Partial<CriticalityThreshold>) => void;

  // API actions
  loadFromProject: (projectId: string) => Promise<void>;
  saveToProject: (projectId: string) => Promise<void>;

  // Helper functions
  getRPNColor: (rpn: number) => string;
  getRPNLabel: (rpn: number) => string;
}

// Default thresholds (SAE J1739)
const defaultThresholds: CriticalityThreshold[] = [
  { id: 1, label: 'Low', min: 1, max: 69, color: 'green' },
  { id: 2, label: 'Medium', min: 70, max: 99, color: 'yellow' },
  { id: 3, label: 'High', min: 100, max: 150, color: 'orange' },
  { id: 4, label: 'Critical', min: 151, max: 1000, color: 'red' },
];

// Color mapping
const namedColors: Record<string, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  teal: '#14b8a6',
  indigo: '#6366f1',
  gray: '#9ca3af',
};

export const useRiskSettings = create<RiskSettingsState>()((set, get) => ({
  // Initial state
  matrixSize: 12,
  scaleType: '1-10',
  thresholds: Array.isArray(defaultThresholds) ? defaultThresholds : [],
  isLoading: false,
  currentProjectId: null,

  // Actions
  setMatrixSize: (size) => set({ matrixSize: size }),
  setScaleType: (type) => set({ scaleType: type }),
  setThresholds: (thresholds) =>
    set({ thresholds: Array.isArray(thresholds) ? thresholds : [] }),
  updateThreshold: (id, updates) =>
    set((state) => ({
      thresholds: state.thresholds.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
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

      if (data.riskMatrix && data.thresholds) {
        set({
          matrixSize: data.riskMatrix.matrixSize,
          scaleType: data.riskMatrix.scaleType,
          thresholds: data.thresholds,
          currentProjectId: projectId,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error loading risk settings:', error);
      set({ isLoading: false });
    }
  },

  saveToProject: async (projectId: string) => {
    try {
      const { matrixSize, scaleType, thresholds } = get();
      const token = localStorage.getItem('auth-token');

      const response = await fetch(`/api/projects/${projectId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          riskMatrix: {
            matrixSize,
            scaleType,
            detBaseline: 5,
            preset: matrixSize === 12 ? '12x12' : matrixSize === 10 ? 'SAE J1739' : 'Custom',
          },
          thresholds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save project settings');
      }

      set({ currentProjectId: projectId });
    } catch (error) {
      console.error('Error saving risk settings:', error);
      throw error;
    }
  },

  // Helper functions
  getRPNColor: (rpn: number) => {
    const { thresholds } = get();
    const threshold = thresholds.find(
      (t) => rpn >= t.min && rpn <= t.max
    );
    if (!threshold) return namedColors.gray;

    // Return hex color if it starts with #, otherwise map from named colors
    return threshold.color.startsWith('#')
      ? threshold.color
      : namedColors[threshold.color] || namedColors.gray;
  },

  getRPNLabel: (rpn: number) => {
    const { thresholds } = get();
    const threshold = thresholds.find(
      (t) => rpn >= t.min && rpn <= t.max
    );
    return threshold?.label || 'Unknown';
  },
}));
