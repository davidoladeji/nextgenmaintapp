import fs from 'fs';
import path from 'path';

// Simple JSON-based database for development
const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'fmea-data.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize empty database if it doesn't exist
if (!fs.existsSync(dbPath)) {
  const initialData = {
    users: [],
    sessions: [],
    organizations: [],
    organization_members: [],
    organization_invitations: [],
    projects: [],
    project_members: [],
    project_guest_links: [],
    tools: [],
    assets: [],
    components: [],
    failureModes: [],
    causes: [],
    effects: [],
    controls: [],
    actions: []
  };
  fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
}

// Read database
export function readDatabase() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data);

    // Ensure all arrays exist for backward compatibility
    if (!parsed.components) {
      parsed.components = [];
    }
    if (!parsed.organizations) {
      parsed.organizations = [];
    }
    if (!parsed.organization_members) {
      parsed.organization_members = [];
    }
    if (!parsed.organization_invitations) {
      parsed.organization_invitations = [];
    }
    if (!parsed.project_members) {
      parsed.project_members = [];
    }
    if (!parsed.project_guest_links) {
      parsed.project_guest_links = [];
    }
    if (!parsed.tools) {
      parsed.tools = [];
    }

    return parsed;
  } catch (error) {
    console.error('Error reading database:', error);
    return {
      users: [],
      sessions: [],
      organizations: [],
      organization_members: [],
      organization_invitations: [],
      projects: [],
      project_members: [],
      project_guest_links: [],
      tools: [],
      assets: [],
      components: [],
      failureModes: [],
      causes: [],
      effects: [],
      controls: [],
      actions: []
    };
  }
}

// Write database
export function writeDatabase(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
  }
}

// Helper function to generate IDs
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Simplified queries object for compatibility
export const queries = {
  // User queries
  createUser: {
    run: (id: string, email: string, name: string, passwordHash: string, role: string) => {
      const db = readDatabase();
      db.users.push({
        id,
        email,
        name,
        password_hash: passwordHash,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      writeDatabase(db);
    }
  },
  
  getUserByEmail: {
    get: (email: string) => {
      const db = readDatabase();
      return db.users.find((user: any) => user.email === email);
    }
  },
  
  getUserById: {
    get: (id: string) => {
      const db = readDatabase();
      return db.users.find((user: any) => user.id === id);
    }
  },

  // Session queries
  createSession: {
    run: (id: string, userId: string, token: string, expiresAt: string) => {
      const db = readDatabase();
      db.sessions.push({
        id,
        user_id: userId,
        token,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      });
      writeDatabase(db);
    }
  },
  
  getSessionByToken: {
    get: (token: string) => {
      const db = readDatabase();
      const session = db.sessions.find((s: any) => s.token === token && new Date(s.expires_at) > new Date());
      if (session) {
        const user = db.users.find((u: any) => u.id === session.user_id);
        return { ...session, ...user };
      }
      return null;
    }
  },
  
  deleteSession: {
    run: (token: string) => {
      const db = readDatabase();
      db.sessions = db.sessions.filter((s: any) => s.token !== token);
      writeDatabase(db);
    }
  },

  // Project queries
  createProject: {
    run: (id: string, name: string, description: string, assetId: string, userId: string, organizationId?: string) => {
      const db = readDatabase();
      db.projects.push({
        id,
        name,
        description,
        asset_id: assetId,
        user_id: userId,
        created_by: userId,
        organization_id: organizationId || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      writeDatabase(db);
    }
  },
  
  getProjectsByOrganizationId: {
    all: (organizationId: string) => {
      const db = readDatabase();
      return db.projects
        .filter((p: any) => p.organization_id === organizationId && p.status !== 'approved')
        .map((p: any) => {
          let asset = db.assets.find((a: any) => a.id === p.asset_id);
          // Parse standards if it's a JSON string
          if (asset && typeof asset.standards === 'string') {
            try {
              asset = { ...asset, standards: JSON.parse(asset.standards) };
            } catch (e) {
              asset = { ...asset, standards: [] };
            }
          }
          // Ensure standards is always an array
          if (asset && !Array.isArray(asset.standards)) {
            asset = { ...asset, standards: [] };
          }
          return { ...p, asset };
        })
        .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
  },

  getProjectsByUserId: {
    all: (userId: string) => {
      const db = readDatabase();
      return db.projects
        .filter((p: any) => p.user_id === userId && p.status !== 'approved')
        .map((p: any) => {
          let asset = db.assets.find((a: any) => a.id === p.asset_id);
          // Parse standards if it's a JSON string
          if (asset && typeof asset.standards === 'string') {
            try {
              asset = { ...asset, standards: JSON.parse(asset.standards) };
            } catch (e) {
              asset = { ...asset, standards: [] };
            }
          }
          // Ensure standards is always an array
          if (asset && !Array.isArray(asset.standards)) {
            asset = { ...asset, standards: [] };
          }
          return { ...p, asset };
        })
        .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
  },

  getProjectById: {
    get: (id: string) => {
      const db = readDatabase();
      const project = db.projects.find((p: any) => p.id === id);
      if (project) {
        let asset = db.assets.find((a: any) => a.id === project.asset_id);
        // Parse standards if it's a JSON string
        if (asset && typeof asset.standards === 'string') {
          try {
            asset = { ...asset, standards: JSON.parse(asset.standards) };
          } catch (e) {
            asset = { ...asset, standards: [] };
          }
        }
        // Ensure standards is always an array
        if (asset && !Array.isArray(asset.standards)) {
          asset = { ...asset, standards: [] };
        }
        return { ...project, asset };
      }
      return null;
    }
  },

  // Asset queries
  createAsset: {
    run: (id: string, name: string, assetId: string, type: string, context: string, criticality: string, standards: string, history: string, configuration: string) => {
      const db = readDatabase();
      db.assets.push({
        id,
        name,
        asset_id: assetId,
        type,
        context,
        criticality,
        standards,
        history,
        configuration,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      writeDatabase(db);
    }
  },

  // Component queries
  createComponent: {
    run: (id: string, projectId: string, name: string, description: string | null, order: number, functionField?: string | null) => {
      const db = readDatabase();
      db.components.push({
        id,
        project_id: projectId,
        name,
        description,
        function: functionField || null,
        order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      writeDatabase(db);
    }
  },

  getComponentsByProjectId: {
    all: (projectId: string) => {
      const db = readDatabase();
      return db.components
        .filter((c: any) => c.project_id === projectId)
        .sort((a: any, b: any) => a.order - b.order);
    }
  },

  getComponentById: {
    get: (id: string) => {
      const db = readDatabase();
      return db.components.find((c: any) => c.id === id);
    }
  },

  updateComponent: {
    run: (id: string, name: string, description: string | null, functionField?: string | null) => {
      const db = readDatabase();
      const componentIndex = db.components.findIndex((c: any) => c.id === id);
      if (componentIndex !== -1) {
        db.components[componentIndex] = {
          ...db.components[componentIndex],
          name,
          description,
          function: functionField !== undefined ? functionField : db.components[componentIndex].function,
          updated_at: new Date().toISOString()
        };
        writeDatabase(db);
      }
    }
  },

  deleteComponent: {
    run: (id: string) => {
      const db = readDatabase();
      db.components = db.components.filter((c: any) => c.id !== id);
      // Also delete all failure modes associated with this component
      db.failureModes = db.failureModes.filter((fm: any) => fm.component_id !== id);
      writeDatabase(db);
    }
  },

  // Failure mode queries
  createFailureMode: {
    run: (id: string, projectId: string, componentId: string, processStep: string, failureMode: string) => {
      const db = readDatabase();
      db.failureModes.push({
        id,
        project_id: projectId,
        component_id: componentId,
        process_step: processStep,
        failure_mode: failureMode,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      writeDatabase(db);
    }
  },
  
  getFailureModesByProjectId: {
    all: (projectId: string) => {
      const db = readDatabase();
      return db.failureModes
        .filter((fm: any) => fm.project_id === projectId)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  getFailureModesByComponentId: {
    all: (componentId: string) => {
      const db = readDatabase();
      return db.failureModes
        .filter((fm: any) => fm.component_id === componentId)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },
  
  getFailureModeById: {
    get: (id: string) => {
      const db = readDatabase();
      return db.failureModes.find((fm: any) => fm.id === id);
    }
  },

  deleteFailureMode: {
    run: (id: string) => {
      const db = readDatabase();
      // Delete the failure mode
      db.failureModes = db.failureModes.filter((fm: any) => fm.id !== id);
      // Delete all related data (cascading deletion)
      db.causes = db.causes.filter((c: any) => c.failure_mode_id !== id);
      db.effects = db.effects.filter((e: any) => e.failure_mode_id !== id);
      db.controls = db.controls.filter((ctrl: any) => ctrl.failure_mode_id !== id);
      db.actions = db.actions.filter((a: any) => a.failure_mode_id !== id);
      writeDatabase(db);
    }
  },

  deleteProject: {
    run: (id: string) => {
      const db = readDatabase();

      // Get all failure mode IDs for this project (both direct and via components)
      const failureModeIds = db.failureModes
        .filter((fm: any) => fm.project_id === id || fm.component_id)
        .map((fm: any) => fm.id);

      // Get all component IDs for this project
      const componentIds = db.components
        .filter((c: any) => c.project_id === id)
        .map((c: any) => c.id);

      // Delete all causes, effects, controls, and actions linked to failure modes
      db.causes = db.causes.filter((c: any) => !failureModeIds.includes(c.failure_mode_id));
      db.effects = db.effects.filter((e: any) => !failureModeIds.includes(e.failure_mode_id));
      db.controls = db.controls.filter((ctrl: any) => !failureModeIds.includes(ctrl.failure_mode_id));
      db.actions = db.actions.filter((a: any) => !failureModeIds.includes(a.failure_mode_id));

      // Delete all failure modes (both direct and via components)
      db.failureModes = db.failureModes.filter((fm: any) =>
        fm.project_id !== id && !componentIds.includes(fm.component_id)
      );

      // Delete all components for this project
      db.components = db.components.filter((c: any) => c.project_id !== id);

      // Delete the asset linked to this project
      const project = db.projects.find((p: any) => p.id === id);
      if (project) {
        db.assets = db.assets.filter((a: any) => a.id !== project.asset_id);
      }

      // Delete the project itself
      db.projects = db.projects.filter((p: any) => p.id !== id);

      writeDatabase(db);
    }
  },

  // Cause queries
  createCause: {
    run: (id: string, failureModeId: string, description: string, occurrence: number) => {
      const db = readDatabase();
      db.causes.push({
        id,
        failure_mode_id: failureModeId,
        description,
        occurrence,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      writeDatabase(db);
    }
  },
  
  getCausesByFailureModeId: {
    all: (failureModeId: string) => {
      const db = readDatabase();
      return db.causes
        .filter((c: any) => c.failure_mode_id === failureModeId)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
  },

  // Effect queries
  createEffect: {
    run: (id: string, failureModeId: string, description: string, severity: number) => {
      const db = readDatabase();
      db.effects.push({
        id,
        failure_mode_id: failureModeId,
        description,
        severity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      writeDatabase(db);
    }
  },
  
  getEffectsByFailureModeId: {
    all: (failureModeId: string) => {
      const db = readDatabase();
      return db.effects
        .filter((e: any) => e.failure_mode_id === failureModeId)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
  },

  // Control queries
  createControl: {
    run: (id: string, failureModeId: string, type: string, description: string, detection: number, effectiveness: number) => {
      const db = readDatabase();
      db.controls.push({
        id,
        failure_mode_id: failureModeId,
        type,
        description,
        detection,
        effectiveness,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      writeDatabase(db);
    }
  },
  
  getControlsByFailureModeId: {
    all: (failureModeId: string) => {
      const db = readDatabase();
      return db.controls
        .filter((c: any) => c.failure_mode_id === failureModeId)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
  },

  // Action queries
  createAction: {
    run: (id: string, failureModeId: string, description: string, owner: string, dueDate: string) => {
      const db = readDatabase();
      db.actions.push({
        id,
        failure_mode_id: failureModeId,
        description,
        owner,
        due_date: dueDate,
        status: 'open',
        action_taken: null,
        post_action_severity: null,
        post_action_occurrence: null,
        post_action_detection: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      writeDatabase(db);
    }
  },
  
  getActionsByFailureModeId: {
    all: (failureModeId: string) => {
      const db = readDatabase();
      return db.actions
        .filter((a: any) => a.failure_mode_id === failureModeId)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
  },
  
  updateActionStatus: {
    run: (id: string, status: string, actionTaken: string, postActionSeverity: number, postActionOccurrence: number, postActionDetection: number) => {
      const db = readDatabase();
      const actionIndex = db.actions.findIndex((a: any) => a.id === id);
      if (actionIndex !== -1) {
        db.actions[actionIndex] = {
          ...db.actions[actionIndex],
          status,
          action_taken: actionTaken,
          post_action_severity: postActionSeverity,
          post_action_occurrence: postActionOccurrence,
          post_action_detection: postActionDetection,
          updated_at: new Date().toISOString()
        };
        writeDatabase(db);
      }
    }
  },

  // Dashboard queries
  getDashboardMetrics: {
    get: (projectId: string) => {
      const db = readDatabase();
      const failureModes = db.failureModes.filter((fm: any) => fm.project_id === projectId);
      const causes = db.causes.filter((c: any) => failureModes.some((fm: any) => fm.id === c.failure_mode_id));
      const effects = db.effects.filter((e: any) => failureModes.some((fm: any) => fm.id === e.failure_mode_id));
      const controls = db.controls.filter((c: any) => failureModes.some((fm: any) => fm.id === c.failure_mode_id));
      const actions = db.actions.filter((a: any) => failureModes.some((fm: any) => fm.id === a.failure_mode_id));

      const highRiskCount = failureModes.filter((fm: any) => {
        const fmCauses = causes.filter((c: any) => c.failure_mode_id === fm.id);
        const fmEffects = effects.filter((e: any) => e.failure_mode_id === fm.id);
        const fmControls = controls.filter((c: any) => c.failure_mode_id === fm.id);
        
        if (fmCauses.length === 0 || fmEffects.length === 0) return false;
        
        const maxRPN = Math.max(...fmCauses.flatMap((cause: any) => 
          fmEffects.map((effect: any) => {
            const detection = fmControls.length > 0 ? Math.min(...fmControls.map((c: any) => c.detection)) : 10;
            return effect.severity * cause.occurrence * detection;
          })
        ));
        
        return maxRPN >= 200;
      }).length;

      return {
        total_failure_modes: failureModes.length,
        high_risk_modes: highRiskCount,
        open_actions: actions.filter((a: any) => a.status === 'open' || a.status === 'in-progress').length,
        completed_actions: actions.filter((a: any) => a.status === 'completed').length,
        average_rpn: 125 // Placeholder
      };
    }
  }
};

console.log('Simple JSON database initialized at:', dbPath);