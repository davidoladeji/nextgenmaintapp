// Core FMEA Entity Types

export interface Effect {
  id: string;
  failureModeId: string;

  // Pre-Mitigation fields
  effects: string; // Effect description
  sev: number; // Severity (1-10)
  potentialCause: string;
  occ: number; // Occurrence (1-10)
  currentDesign: string; // Current design controls
  det: number; // Detection (1-10)
  justificationPre: string;
  rpnPre: number; // Auto-calculated: sev × occ × det

  // Post-Mitigation fields
  recommendedActions: string;
  justificationPost: string;
  responsible: string;
  actionStatus: 'Not Started' | 'In Progress' | 'Done';
  sevPost: number;
  occPost: number;
  detPost: number;
  rpnPost: number; // Auto-calculated: sevPost × occPost × detPost

  createdAt: Date;
  updatedAt: Date;
}

export interface FailureMode {
  id: string;
  componentId: string;
  name: string; // e.g., "Seal Leakage", "Rod damage"
  owner: string; // Assigned owner name
  effects: Effect[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Component {
  id: string;
  name: string; // e.g., "Drive Train", "Hydraulics"
  function: string; // Component function description
  failureModes: FailureMode[];
  createdAt: Date;
  updatedAt: Date;
}

// UI State Types

export interface ExpandedState {
  components: Set<string>; // Component IDs that are expanded
  failureModes: Set<string>; // Failure Mode IDs that are expanded
}

export interface SelectedState {
  componentId: string | null;
  failureModeId: string | null;
}

// View Model Types (computed properties)

export interface ComponentViewModel extends Component {
  failureModeCount: number;
  highestRPN: number; // Max of all effect RPNs (pre)
}

export interface FailureModeViewModel extends FailureMode {
  effectCount: number;
  rpnPre: number; // Highest RPN from effects (pre)
  rpnPost: number; // Highest RPN from effects (post)
}

// Input Types for CRUD Operations

export type CreateComponentInput = Omit<Component, 'id' | 'createdAt' | 'updatedAt' | 'failureModes'>;
export type UpdateComponentInput = Partial<Omit<Component, 'id' | 'failureModes' | 'createdAt' | 'updatedAt'>>;

export type CreateFailureModeInput = Omit<FailureMode, 'id' | 'componentId' | 'createdAt' | 'updatedAt' | 'effects'>;
export type UpdateFailureModeInput = Partial<Omit<FailureMode, 'id' | 'componentId' | 'effects' | 'createdAt' | 'updatedAt'>>;

export type CreateEffectInput = Omit<Effect, 'id' | 'failureModeId' | 'createdAt' | 'updatedAt' | 'rpnPre' | 'rpnPost'>;
export type UpdateEffectInput = Partial<Omit<Effect, 'id' | 'failureModeId' | 'createdAt' | 'updatedAt' | 'rpnPre' | 'rpnPost'>>;

// RPN Risk Levels

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface RiskLevelConfig {
  level: RiskLevel;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  threshold: number;
}

// Criticality Thresholds (can be customized in Setup tab)

export interface CriticalityThresholds {
  critical: number; // Default: 150
  high: number; // Default: 100
  medium: number; // Default: 70
}
