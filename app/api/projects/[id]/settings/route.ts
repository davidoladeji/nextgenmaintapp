import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/database-simple';
import { getUserFromToken } from '@/lib/auth';
import { canEditProject } from '@/lib/permissions';
import { ProjectSettings } from '@/types';

// GET /api/projects/[id]/settings - Get project settings
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = params.id;
    const db = readDatabase();

    // Find project
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const hasPermission = canEditProject(user.id, projectId, db);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to access this project' },
        { status: 403 }
      );
    }

    // Return settings with defaults if not set
    const settings = project.settings || getDefaultSettings();

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching project settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project settings' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/settings - Update project settings
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = params.id;
    const body = await request.json();

    const db = readDatabase();

    // Find project
    const projectIndex = db.projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const hasPermission = canEditProject(user.id, projectId, db);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to edit this project' },
        { status: 403 }
      );
    }

    // Validate settings structure
    if (!isValidProjectSettings(body)) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings structure' },
        { status: 400 }
      );
    }

    // Merge settings (deep merge to preserve existing values)
    const currentSettings = db.projects[projectIndex].settings || getDefaultSettings();
    const updatedSettings = deepMergeSettings(currentSettings, body);

    // Update project
    db.projects[projectIndex] = {
      ...db.projects[projectIndex],
      settings: updatedSettings,
      updated_at: new Date().toISOString(),
    };

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Project settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating project settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project settings' },
      { status: 500 }
    );
  }
}

// Helper: Get default settings
function getDefaultSettings(): ProjectSettings {
  return {
    riskMatrix: {
      matrixSize: 12,
      scaleType: '1-10',
      detBaseline: 5,
      preset: 'SAE J1739',
    },
    thresholds: [
      { id: 1, label: 'Low', min: 1, max: 69, color: 'green' },
      { id: 2, label: 'Medium', min: 70, max: 99, color: 'yellow' },
      { id: 3, label: 'High', min: 100, max: 150, color: 'orange' },
      { id: 4, label: 'Critical', min: 151, max: 1000, color: 'red' },
    ],
    standards: ['SAE J1739'],
    descriptions: {
      severity: {
        1: 'No effect',
        2: 'Very minor',
        3: 'Minor',
        4: 'Very low',
        5: 'Low',
        6: 'Moderate',
        7: 'High',
        8: 'Very high',
        9: 'Hazardous',
        10: 'Catastrophic',
      },
      occurrence: {
        1: 'Very rare',
        2: 'Rare',
        3: 'Unlikely',
        4: 'Low',
        5: 'Moderate',
        6: 'Moderately high',
        7: 'High',
        8: 'Very high',
        9: 'Extremely high',
        10: 'Certain',
      },
      detection: {
        1: 'Certain detection',
        2: 'Very high',
        3: 'High',
        4: 'Moderately high',
        5: 'Moderate',
        6: 'Low',
        7: 'Very low',
        8: 'Remote',
        9: 'Very remote',
        10: 'Cannot detect',
      },
    },
  };
}

// Helper: Validate settings structure
function isValidProjectSettings(settings: any): boolean {
  if (!settings || typeof settings !== 'object') return false;

  // Check riskMatrix
  if (!settings.riskMatrix || typeof settings.riskMatrix !== 'object') return false;
  if (typeof settings.riskMatrix.matrixSize !== 'number') return false;
  if (!['1-10', '1-5'].includes(settings.riskMatrix.scaleType)) return false;

  // Check thresholds
  if (!Array.isArray(settings.thresholds)) return false;

  // Check standards
  if (!Array.isArray(settings.standards)) return false;

  return true;
}

// Helper: Deep merge settings
function deepMergeSettings(target: ProjectSettings, source: Partial<ProjectSettings>): ProjectSettings {
  const result = { ...target };

  if (source.riskMatrix) {
    result.riskMatrix = { ...target.riskMatrix, ...source.riskMatrix };
  }

  if (source.thresholds) {
    result.thresholds = source.thresholds;
  }

  if (source.standards) {
    result.standards = source.standards;
  }

  if (source.descriptions) {
    result.descriptions = {
      severity: { ...target.descriptions.severity, ...source.descriptions.severity },
      occurrence: { ...target.descriptions.occurrence, ...source.descriptions.occurrence },
      detection: { ...target.descriptions.detection, ...source.descriptions.detection },
    };
  }

  return result;
}
