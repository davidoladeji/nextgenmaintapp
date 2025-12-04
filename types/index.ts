// Core FMEA Types
export interface Component {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  function?: string | null; // Component function/purpose (e.g., "Deliver Torque", "Transfer pressure")
  order: number;
  created_at: string;
  updated_at: string;
  failureModes?: FailureMode[];
}

export interface FailureMode {
  id: string;
  project_id: string;
  component_id: string;
  process_step: string; // Kept for backward compatibility
  failure_mode: string;
  status: 'active' | 'closed' | 'on-hold';
  created_at: string;
  updated_at: string;
  causes?: Cause[];
  effects?: Effect[];
  controls?: Control[];
  actions?: Action[];
}

export interface Cause {
  id: string;
  failure_mode_id: string;
  description: string;
  occurrence: number; // 1-10
  created_at: string;
  updated_at: string;
}

export interface Effect {
  id: string;
  failure_mode_id: string;
  description: string;
  severity: number; // 1-10
  potential_cause?: string; // Link to which cause this effect relates to
  current_design?: string; // Current design controls or mitigation
  justification_pre?: string; // Justification for pre-mitigation ratings
  justification_post?: string; // Justification for post-mitigation ratings
  responsible?: string; // Person responsible for actions
  action_status?: string; // Action status: Not Started, In Progress, Done
  action_taken?: string; // Description of action taken (deprecated)
  completion_date?: string; // Date when action was completed (deprecated)
  severity_post?: number; // Post-mitigation severity (1-10)
  occurrence_post?: number; // Post-mitigation occurrence (1-10)
  detection_post?: number; // Post-mitigation detection (1-10)
  created_at: string;
  updated_at: string;
}

export interface Control {
  id: string;
  failure_mode_id: string;
  type: 'prevention' | 'detection';
  description: string;
  detection: number; // 1-10
  effectiveness: number; // 1-10
  created_at: string;
  updated_at: string;
}

export interface Action {
  id: string;
  failure_mode_id: string;
  description: string;
  owner: string;
  dueDate: string | null;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  actionTaken: string | null;
  postActionSeverity: number | null;
  postActionOccurrence: number | null;
  postActionDetection: number | null;
  created_at: string;
  updated_at: string;
}

// Risk Calculation
export interface RiskCalculation {
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number; // Severity * Occurrence * Detection
}

// Project & Asset Types
export interface CriticalityThreshold {
  id: number;
  label: string;
  min: number;
  max: number;
  color: string;
}

export interface ProjectSettings {
  // Risk Matrix Configuration
  riskMatrix: {
    matrixSize: number;
    scaleType: '1-10' | '1-5';
    detBaseline: number;
    preset: string; // 'SAE J1739', '5x5', '6x6', '10x10', '12x12', 'Custom'
  };

  // Criticality Thresholds
  thresholds: CriticalityThreshold[];

  // Standards
  standards: string[];

  // Scale Descriptions
  descriptions: {
    severity: { [key: number]: string };
    occurrence: { [key: number]: string };
    detection: { [key: number]: string };
  };
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  assetId: string;
  userId: string; // Deprecated - use created_by
  created_by: string; // User ID of project creator
  organization_id: string; // Organization this project belongs to
  tool_id?: string; // Tool this project belongs to (defaults to 'fmea')
  status: 'in-progress' | 'completed' | 'approved';
  settings?: ProjectSettings; // Project-specific FMEA settings
  createdAt: Date;
  updatedAt: Date;
  created_at: string;
  updated_at: string;
  asset: Asset;
  components?: Component[];
  failureModes: FailureMode[]; // Kept for backward compatibility
}

export interface Asset {
  id: string;
  name: string;
  assetId: string;
  type: string;
  context: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  standards: string[];
  history: string | null;
  configuration: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Organization & Multi-Tenancy
export interface Organization {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  logo_url?: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  max_users: number;
  max_projects: number;
  settings?: OrganizationSettings;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  default_rpn_thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
  allowed_standards?: string[];
  branding?: {
    primary_color?: string;
    logo_url?: string;
  };
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'org_admin' | 'project_manager' | 'editor' | 'viewer';
  invited_by: string; // User ID who sent invitation
  joined_at: string;
  last_active_at?: string;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'org_admin' | 'project_manager' | 'editor' | 'viewer';
  invited_by: string;
  invitation_token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  added_by: string;
  added_at: string;
  last_accessed_at?: string;
}

export interface ProjectGuestLink {
  id: string;
  project_id: string;
  token: string;
  created_by: string;
  expires_at: string;
  max_uses?: number;
  current_uses: number;
  created_at: string;
}

// User & Authentication
export interface UserPreferences {
  current_organization_id?: string;
  onboarding_completed: boolean;
  theme?: 'light' | 'dark' | 'system';
}

export interface User {
  id: string;
  email: string;
  name: string;
  is_superadmin: boolean; // Platform-wide admin
  avatar_url?: string;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  // Legacy field for backward compatibility
  role?: 'standard' | 'admin';
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// AI Configuration
export interface AIConfig {
  level: 'limited' | 'medium' | 'full';
  autoSuggest: boolean;
  requireConfirmation: boolean;
}

// Risk Scoring Configuration
export interface RiskScale {
  value: number;
  description: string;
  color: string;
}

export interface RiskConfig {
  severityScale: RiskScale[];
  occurrenceScale: RiskScale[];
  detectionScale: RiskScale[];
  rpnThresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

// Export Configuration
export interface ExportConfig {
  includeMetadata: boolean;
  includeCharts: boolean;
  includeSummary: boolean;
  filterBy: {
    rpnThreshold?: number;
    status?: string[];
    owner?: string[];
  };
}

// Dashboard Types
export interface DashboardMetrics {
  totalFailureModes: number;
  highRiskModes: number;
  openActions: number;
  completedActions: number;
  averageRPN: number;
  criticalModes: number;
}

export interface ChartData {
  rpnHeatmap: Array<{
    severity: number;
    occurrence: number;
    detection: number;
    count: number;
    rpn: number;
  }>;
  topRisks: Array<{
    failureMode: string;
    rpn: number;
    severity: number;
    occurrence: number;
    detection: number;
  }>;
  riskDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  actionStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface CreateProjectForm {
  name: string;
  description: string;
  assetName: string;
  assetId: string;
  assetType: string;
  context: string;
  criticality: Asset['criticality'];
  standards: string[];
  history?: string;
  configuration?: string;
}

export interface FailureModeForm {
  processStep: string;
  failureMode: string;
  causes: Array<{
    description: string;
    occurrence: number;
  }>;
  effects: Array<{
    description: string;
    severity: number;
  }>;
  controls: Array<{
    type: 'prevention' | 'detection';
    description: string;
    detection: number;
    effectiveness: number;
  }>;
}

// AI Types
export interface AIPromptContext {
  asset: Asset;
  failureMode?: Partial<FailureMode>;
  cause?: Partial<Cause>;
  effect?: Partial<Effect>;
  existingData?: {
    failureModes: FailureMode[];
    causes: Cause[];
    effects: Effect[];
  };
}

export interface AISuggestion {
  type: 'failure-mode' | 'cause' | 'effect' | 'control' | 'action';
  suggestions: Array<{
    text: string;
    confidence: number;
    reasoning: string;
  }>;
  context: string;
}

// Multi-Tool Platform Types
export interface Tool {
  id: string;
  name: string;
  description: string;
  problem: string;
  solution: string;
  icon: string; // Lucide icon name
  route: string; // e.g., '/tools/fmea'
  is_active: boolean;
  coming_soon: boolean;
  created_at: string;
}

// Platform Settings Types
export interface PlanConfig {
  maxUsers: number;
  maxProjects: number;
  maxStorageGB: number;
  featuresEnabled: string[];
  price: number;
  aiRequestsPerMonth: number;
}

export interface PlatformSettings {
  // Branding & Theme
  branding: {
    accentColor: string;
    accentColorDark: string;
    accentColorHover: string;
    accentColorDarkHover: string;
    logoUrl?: string;
    faviconUrl?: string;
    platformName: string;
    companyName: string;
  };

  // Feature Flags
  features: {
    aiAssistant: boolean;
    multiOrganization: boolean;
    guestLinks: boolean;
    dataExport: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    advancedAnalytics: boolean;
    auditLogs: boolean;
  };

  // Plan Limits
  planLimits: {
    free: PlanConfig;
    starter: PlanConfig;
    professional: PlanConfig;
    enterprise: PlanConfig;
  };

  // Email & Notifications
  email: {
    fromName: string;
    fromEmail: string;
    smtpHost?: string;
    smtpPort?: number;
    enableNotifications: boolean;
    notificationTypes: {
      invitations: boolean;
      actionReminders: boolean;
      weeklyDigest: boolean;
      securityAlerts: boolean;
    };
  };

  // Security & Authentication
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requireMFA: boolean;
    allowedDomains?: string[];
    maxLoginAttempts: number;
    ipWhitelist?: string[];
  };

  // AI Configuration
  ai: {
    provider: 'openai' | 'anthropic' | 'azure';
    model: string;
    maxTokens: number;
    temperature: number;
    enableAutoSuggestions: boolean;
    rateLimitPerUser: number;
  };

  // Storage & Data
  storage: {
    maxFileSize: number;
    maxStoragePerOrg: number;
    allowedFileTypes: string[];
    dataRetention: number;
    autoBackup: boolean;
  };

  // Maintenance & System
  system: {
    maintenanceMode: boolean;
    maintenanceMessage?: string;
    registrationOpen: boolean;
    defaultTimezone: string;
    dateFormat: string;
    currency: string;
  };
}