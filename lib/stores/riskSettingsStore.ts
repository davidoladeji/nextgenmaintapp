import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  // Actions
  setMatrixSize: (size: number) => void;
  setScaleType: (type: '1-10' | '1-5') => void;
  setThresholds: (thresholds: CriticalityThreshold[]) => void;
  updateThreshold: (id: number, updates: Partial<CriticalityThreshold>) => void;

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
  gray: '#9ca3af',
};

export const useRiskSettings = create<RiskSettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      matrixSize: 10,
      scaleType: '1-10',
      thresholds: defaultThresholds,

      // Actions
      setMatrixSize: (size) => set({ matrixSize: size }),
      setScaleType: (type) => set({ scaleType: type }),
      setThresholds: (thresholds) => set({ thresholds }),
      updateThreshold: (id, updates) =>
        set((state) => ({
          thresholds: state.thresholds.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

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
    }),
    {
      name: 'risk-settings-storage',
    }
  )
);
