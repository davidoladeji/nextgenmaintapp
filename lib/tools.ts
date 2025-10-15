import { Tool } from '@/types';
import { readDatabase, writeDatabase, generateId } from './database-simple';

// Predefined tools configuration
export const PREDEFINED_TOOLS: Omit<Tool, 'id' | 'created_at'>[] = [
  {
    name: 'AI-Assisted FMEA Builder',
    description: 'Build comprehensive Failure Mode and Effects Analysis with AI assistance',
    problem: 'FMEAs are time-consuming, inconsistent, and difficult to start from scratch',
    solution: 'AI pre-fills effects, causes, severity levels, and provides a visual drag-drop interface with logic explanations to guide users',
    icon: 'AlertTriangle',
    route: '/tools/fmea',
    is_active: true,
    coming_soon: false,
  },
  {
    name: 'Basic Maintenance Strategy Generator',
    description: 'Convert failure modes into actionable maintenance tasks',
    problem: 'Engineers struggle to convert failure modes into actionable, risk-aligned maintenance tasks',
    solution: 'Automatically suggests preventive/corrective tasks based on FMEA output and asset criticality',
    icon: 'Wrench',
    route: '/tools/maintenance-strategy',
    is_active: true,
    coming_soon: true,
  },
  {
    name: 'Quick Pareto + Weibull Analysis',
    description: 'Visualize failure distributions and life models instantly',
    problem: 'Failure data is underused or hard to analyze; most engineers avoid statistical modelling',
    solution: 'Upload data and instantly see visualized failure distributions and life models, with AI-assisted interpretation',
    icon: 'BarChart3',
    route: '/tools/pareto-weibull',
    is_active: true,
    coming_soon: true,
  },
  {
    name: 'Early-Stage CBA Tool',
    description: 'Quick cost-benefit analysis for maintenance strategies',
    problem: 'Strategy proposals often lack simple financial justification, delaying approvals',
    solution: 'AI-guided tool helps estimate maintenance costs, failure costs, and ROI in minutes, supporting quicker, evidence-backed decisions',
    icon: 'DollarSign',
    route: '/tools/cba',
    is_active: true,
    coming_soon: true,
  },
];

/**
 * Get all tools from database
 */
export function getTools(): Tool[] {
  const db = readDatabase();
  return db.tools || [];
}

/**
 * Get a specific tool by ID
 */
export function getToolById(toolId: string): Tool | undefined {
  const tools = getTools();
  return tools.find((tool) => tool.id === toolId);
}

/**
 * Get all active tools (for display in UI)
 */
export function getActiveTools(): Tool[] {
  return getTools().filter((tool) => tool.is_active);
}

/**
 * Seed predefined tools if they don't exist
 * Returns the FMEA tool ID for reference
 */
export function seedPredefinedTools(): string {
  const db = readDatabase();

  // Check if tools already seeded
  if (db.tools && db.tools.length > 0) {
    const fmeaTool = db.tools.find((t: any) => t.route === '/tools/fmea');
    return fmeaTool?.id || '';
  }

  // Create predefined tools
  const now = new Date().toISOString();
  const tools: Tool[] = PREDEFINED_TOOLS.map((toolConfig) => ({
    id: generateId(),
    ...toolConfig,
    created_at: now,
  }));

  db.tools = tools;
  writeDatabase(db);

  console.log(`✅ Seeded ${tools.length} predefined tools`);

  // Return FMEA tool ID
  const fmeaTool = tools.find((t) => t.route === '/tools/fmea');
  return fmeaTool?.id || '';
}

/**
 * Migrate existing projects to FMEA tool
 * Should be called once after seeding tools
 */
export function migrateProjectsToTools() {
  const db = readDatabase();

  // Get FMEA tool ID
  const fmeaTool = db.tools?.find((t: any) => t.route === '/tools/fmea');
  if (!fmeaTool) {
    console.error('❌ FMEA tool not found - cannot migrate projects');
    return;
  }

  // Update all projects without tool_id
  let migratedCount = 0;
  db.projects = db.projects.map((project: any) => {
    if (!project.tool_id) {
      migratedCount++;
      return {
        ...project,
        tool_id: fmeaTool.id,
      };
    }
    return project;
  });

  if (migratedCount > 0) {
    writeDatabase(db);
    console.log(`✅ Migrated ${migratedCount} projects to FMEA tool`);
  }
}

/**
 * Initialize tools system - seed and migrate
 * Safe to call multiple times (idempotent)
 */
export function initializeToolsSystem() {
  const fmeaToolId = seedPredefinedTools();
  if (fmeaToolId) {
    migrateProjectsToTools();
  }
}

/**
 * Get projects for a specific tool
 */
export function getToolProjects(toolId: string, organizationId: string): any[] {
  const db = readDatabase();
  return db.projects.filter(
    (project: any) =>
      project.tool_id === toolId && project.organization_id === organizationId
  );
}
