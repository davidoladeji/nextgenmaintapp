import type { RiskLevel, CriticalityThresholds } from '../types/fmea';

// Default thresholds (can be customized in Setup tab)
const DEFAULT_THRESHOLDS: CriticalityThresholds = {
  critical: 150,
  high: 100,
  medium: 70,
};

export interface RPNColorConfig {
  level: RiskLevel;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  label: string;
}

export const useRPNCalculation = () => {
  // Get RPN risk level based on value
  const getRPNLevel = (rpn: number, thresholds: CriticalityThresholds = DEFAULT_THRESHOLDS): RiskLevel => {
    if (rpn >= thresholds.critical) return 'Critical';
    if (rpn >= thresholds.high) return 'High';
    if (rpn >= thresholds.medium) return 'Medium';
    return 'Low';
  };

  // Get color configuration for RPN badge
  const getRPNColor = (rpn: number, thresholds: CriticalityThresholds = DEFAULT_THRESHOLDS): RPNColorConfig => {
    const level = getRPNLevel(rpn, thresholds);

    switch (level) {
      case 'Critical':
        return {
          level,
          bgLight: 'bg-red-100',
          bgDark: 'dark:bg-red-900/30',
          textLight: 'text-red-800',
          textDark: 'dark:text-red-300',
          label: 'Critical',
        };
      case 'High':
        return {
          level,
          bgLight: 'bg-orange-100',
          bgDark: 'dark:bg-orange-900/30',
          textLight: 'text-orange-800',
          textDark: 'dark:text-orange-300',
          label: 'High',
        };
      case 'Medium':
        return {
          level,
          bgLight: 'bg-yellow-100',
          bgDark: 'dark:bg-yellow-900/30',
          textLight: 'text-yellow-800',
          textDark: 'dark:text-yellow-300',
          label: 'Medium',
        };
      case 'Low':
        return {
          level,
          bgLight: 'bg-green-100',
          bgDark: 'dark:bg-green-900/30',
          textLight: 'text-green-800',
          textDark: 'dark:text-green-300',
          label: 'Low',
        };
    }
  };

  // Calculate RPN from SEV, OCC, DET
  const calculateRPN = (sev: number, occ: number, det: number): number => {
    return sev * occ * det;
  };

  // Format RPN for display with tooltip
  const formatRPN = (sev: number, occ: number, det: number): { value: number; formula: string } => {
    const value = calculateRPN(sev, occ, det);
    const formula = `${sev} × ${occ} × ${det} = ${value}`;
    return { value, formula };
  };

  return {
    getRPNLevel,
    getRPNColor,
    calculateRPN,
    formatRPN,
  };
};
