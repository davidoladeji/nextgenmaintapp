import { create } from 'zustand';
import { AuthUser } from './auth';
import { Project, FailureMode, AIConfig, Organization, OrganizationMember, PlatformSettings } from '@/types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

interface OrganizationState {
  currentOrganization: Organization | null;
  organizations: Organization[];
  members: OrganizationMember[];
  isLoading: boolean;
  setCurrentOrganization: (organization: Organization | null) => void;
  setOrganizations: (organizations: Organization[]) => void;
  setMembers: (members: OrganizationMember[]) => void;
  setLoading: (loading: boolean) => void;
}

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  failureModes: FailureMode[];
  isLoading: boolean;
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  setFailureModes: (failureModes: FailureMode[]) => void;
  setLoading: (loading: boolean) => void;
  addFailureMode: (failureMode: FailureMode) => void;
  updateFailureMode: (id: string, updates: Partial<FailureMode>) => void;
  removeFailureMode: (id: string) => void;
}

interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  hasCompletedOnboarding: boolean;
  skipStep?: number;
}

interface UIState {
  sidebarCollapsed: boolean;
  aiChatMinimized: boolean;
  aiChatPosition: { x: number; y: number };
  selectedFailureModeId: string | null;
  aiConfig: AIConfig;
  onboarding: OnboardingState;
  currentView: 'tools' | 'projects' | 'workspace';
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAiChatMinimized: (minimized: boolean) => void;
  setAiChatPosition: (position: { x: number; y: number }) => void;
  setSelectedFailureModeId: (id: string | null) => void;
  setAiConfig: (config: AIConfig) => void;
  setOnboardingActive: (active: boolean) => void;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
  setCurrentView: (view: 'tools' | 'projects' | 'workspace') => void;
}

interface PlatformSettingsState {
  settings: PlatformSettings | null;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<PlatformSettings>) => Promise<void>;
  setSettings: (settings: PlatformSettings) => void;
}

// Auth Store
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitializing: true,
  login: (user, token) => {
    localStorage.setItem('auth-token', token);
    set({ user, token, isInitializing: false });
  },
  logout: () => {
    localStorage.removeItem('auth-token');
    set({ user: null, token: null, isInitializing: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));

// Organization Store
export const useOrganizationStore = create<OrganizationState>((set) => ({
  currentOrganization: null,
  organizations: [],
  members: [],
  isLoading: false,
  setCurrentOrganization: (currentOrganization) => {
    set({ currentOrganization });
    // Persist to localStorage
    if (typeof window !== 'undefined' && currentOrganization) {
      localStorage.setItem('current-organization-id', currentOrganization.id);
    }
  },
  setOrganizations: (organizations) => set({ organizations }),
  setMembers: (members) => set({ members }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Project Store
export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  projects: [],
  failureModes: [],
  isLoading: false,
  setCurrentProject: (currentProject) => set({ currentProject }),
  setProjects: (projects) => set({ projects }),
  setFailureModes: (failureModes) => set({ failureModes }),
  setLoading: (isLoading) => set({ isLoading }),
  addFailureMode: (failureMode) => {
    const { failureModes } = get();
    set({ failureModes: [...failureModes, failureMode] });
  },
  updateFailureMode: (id, updates) => {
    const { failureModes } = get();
    set({
      failureModes: failureModes.map((fm) =>
        fm.id === id ? { ...fm, ...updates } : fm
      ),
    });
  },
  removeFailureMode: (id) => {
    const { failureModes } = get();
    set({
      failureModes: failureModes.filter((fm) => fm.id !== id),
    });
  },
}));

// UI Store
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  aiChatMinimized: true,
  aiChatPosition: { x: 20, y: 50 }, // 20px from right, 50px from bottom - reasonable position
  selectedFailureModeId: null,
  aiConfig: {
    level: 'medium',
    autoSuggest: true,
    requireConfirmation: true,
  },
  onboarding: {
    isActive: false,
    currentStep: 0,
    hasCompletedOnboarding: false,
  },
  currentView: 'tools',
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setAiChatMinimized: (aiChatMinimized) => set({ aiChatMinimized }),
  setAiChatPosition: (aiChatPosition) => set({ aiChatPosition }),
  setSelectedFailureModeId: (selectedFailureModeId) => set({ selectedFailureModeId }),
  setAiConfig: (aiConfig) => set({ aiConfig }),
  setOnboardingActive: (active) => set((state) => ({
    onboarding: { ...state.onboarding, isActive: active }
  })),
  setOnboardingStep: (step) => set((state) => ({
    onboarding: { ...state.onboarding, currentStep: step }
  })),
  completeOnboarding: () => set((state) => ({
    onboarding: { ...state.onboarding, isActive: false, hasCompletedOnboarding: true }
  })),
  restartOnboarding: () => set((state) => ({
    onboarding: { ...state.onboarding, isActive: true, currentStep: 0 }
  })),
  setCurrentView: (currentView) => set({ currentView }),
}));

// Initialize auth from localStorage
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('auth-token');
  if (token) {
    // Validate token on app start
    fetch('/api/auth/validate', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          useAuthStore.getState().login(data.data.user, token);
        } else {
          localStorage.removeItem('auth-token');
          useAuthStore.setState({ isInitializing: false });
        }
      })
      .catch(() => {
        localStorage.removeItem('auth-token');
        useAuthStore.setState({ isInitializing: false });
      });
  } else {
    // No token in localStorage, stop initializing
    useAuthStore.setState({ isInitializing: false });
  }
}

// Platform Settings Store
export const usePlatformSettingsStore = create<PlatformSettingsState>((set, get) => ({
  settings: null,
  isLoading: false,
  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/platform/settings');
      const data = await response.json();
      if (data.success && data.data) {
        set({ settings: data.data, isLoading: false });
        // Apply accent color to document
        if (data.data.branding?.accentColor) {
          applyAccentColor(
            data.data.branding.accentColor,
            data.data.branding.accentColorDark,
            data.data.branding.accentColorHover || data.data.branding.accentColor,
            data.data.branding.accentColorDarkHover || data.data.branding.accentColorDark
          );
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load platform settings:', error);
      set({ isLoading: false });
    }
  },
  updateSettings: async (updates) => {
    const currentSettings = get().settings;
    if (!currentSettings) return;

    set({ isLoading: true });
    try {
      const response = await fetch('/api/platform/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success && data.data) {
        set({ settings: data.data, isLoading: false });
        // Apply accent color immediately
        if (data.data.branding?.accentColor) {
          applyAccentColor(
            data.data.branding.accentColor,
            data.data.branding.accentColorDark,
            data.data.branding.accentColorHover || data.data.branding.accentColor,
            data.data.branding.accentColorDarkHover || data.data.branding.accentColorDark
          );
        }
      } else {
        set({ isLoading: false });
        throw new Error(data.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update platform settings:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  setSettings: (settings) => set({ settings }),
}));

// Helper function to apply accent color
function applyAccentColor(
  lightColor: string,
  darkColor: string,
  lightHover: string,
  darkHover: string
) {
  const root = document.documentElement;

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const lightRgb = hexToRgb(lightColor);
  const darkRgb = hexToRgb(darkColor);
  const lightHoverRgb = hexToRgb(lightHover);
  const darkHoverRgb = hexToRgb(darkHover);

  if (lightRgb) {
    root.style.setProperty('--accent-light', `${lightRgb.r} ${lightRgb.g} ${lightRgb.b}`);
  }
  if (darkRgb) {
    root.style.setProperty('--accent-dark', `${darkRgb.r} ${darkRgb.g} ${darkRgb.b}`);
  }
  if (lightHoverRgb) {
    root.style.setProperty('--accent-hover-light', `${lightHoverRgb.r} ${lightHoverRgb.g} ${lightHoverRgb.b}`);
  }
  if (darkHoverRgb) {
    root.style.setProperty('--accent-hover-dark', `${darkHoverRgb.r} ${darkHoverRgb.g} ${darkHoverRgb.b}`);
  }
}

// Utility functions
export const useAuth = () => {
  const { user, token, isLoading, isInitializing, login, logout, setLoading } = useAuthStore();
  return { user, token, isLoading, isInitializing, login, logout, setLoading };
};

export const useOrganization = () => {
  const {
    currentOrganization,
    organizations,
    members,
    isLoading,
    setCurrentOrganization,
    setOrganizations,
    setMembers,
    setLoading,
  } = useOrganizationStore();

  return {
    currentOrganization,
    organizations,
    members,
    isLoading,
    setCurrentOrganization,
    setOrganizations,
    setMembers,
    setLoading,
  };
};

export const useProject = () => {
  const {
    currentProject,
    projects,
    failureModes,
    isLoading,
    setCurrentProject,
    setProjects,
    setFailureModes,
    setLoading,
    addFailureMode,
    updateFailureMode,
    removeFailureMode,
  } = useProjectStore();

  return {
    currentProject,
    projects,
    failureModes,
    isLoading,
    setCurrentProject,
    setProjects,
    setFailureModes,
    setLoading,
    addFailureMode,
    updateFailureMode,
    removeFailureMode,
  };
};

export const useUI = () => {
  const {
    sidebarCollapsed,
    aiChatMinimized,
    aiChatPosition,
    selectedFailureModeId,
    aiConfig,
    onboarding,
    currentView,
    setSidebarCollapsed,
    setAiChatMinimized,
    setAiChatPosition,
    setSelectedFailureModeId,
    setAiConfig,
    setOnboardingActive,
    setOnboardingStep,
    completeOnboarding,
    restartOnboarding,
    setCurrentView,
  } = useUIStore();

  return {
    sidebarCollapsed,
    aiChatMinimized,
    aiChatPosition,
    selectedFailureModeId,
    aiConfig,
    onboarding,
    currentView,
    setSidebarCollapsed,
    setAiChatMinimized,
    setAiChatPosition,
    setSelectedFailureModeId,
    setAiConfig,
    setOnboardingActive,
    setOnboardingStep,
    completeOnboarding,
    restartOnboarding,
    setCurrentView,
  };
};

export const usePlatformSettings = () => {
  const { settings, isLoading, loadSettings, updateSettings, setSettings } = usePlatformSettingsStore();
  return { settings, isLoading, loadSettings, updateSettings, setSettings };
};