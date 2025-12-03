import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getUserFromToken } from '@/lib/auth';
import { readDatabase, writeDatabase } from '@/lib/database-simple';
import { APIResponse, FailureMode, Cause, Effect, Control } from '@/types';
import { randomUUID } from 'crypto';
import { canViewProject, canEditProject } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as APIResponse,
        { status: 401 }
      );
    }

    const projectId = params.id;

    // Check if user can view this project (via org membership or direct access)
    if (!canViewProject(user, projectId)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' } as APIResponse,
        { status: 403 }
      );
    }

    const db = readDatabase();
    const project = db.projects.find((p: any) => p.id === projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' } as APIResponse,
        { status: 404 }
      );
    }

    const failureModes = db.failureModes.filter((fm: FailureMode) => fm.project_id === projectId);

    // Get related data for each failure mode
    const failureModesWithDetails = failureModes.map((fm: FailureMode) => {
        const causes = db.causes.filter((c: any) => c.failure_mode_id === fm.id);
        const effects = db.effects.filter((e: any) => e.failure_mode_id === fm.id);
        const controls = db.controls.filter((c: any) => c.failure_mode_id === fm.id);
        const actions = db.actions.filter((a: any) => a.failure_mode_id === fm.id);

        // Calculate RPN (Risk Priority Number)
        let maxRPN = 0;
        let maxSeverity = 0;
        let maxOccurrence = 0;
        let maxDetection = 0;

        if (causes.length > 0 && effects.length > 0) {
          for (const cause of causes) {
            for (const effect of effects) {
              // Use detection from controls, or default to 10 if no controls
              const detectionScore = controls.length > 0 
                ? Math.min(...controls.map((c: any) => c.detection))
                : 10;
              
              const rpn = effect.severity * cause.occurrence * detectionScore;
              if (rpn > maxRPN) {
                maxRPN = rpn;
                maxSeverity = effect.severity;
                maxOccurrence = cause.occurrence;
                maxDetection = detectionScore;
              }
            }
          }
        }

        return {
          ...fm,
          causes,
          effects,
          controls,
          actions,
          maxRPN,
          maxSeverity,
          maxOccurrence,
          maxDetection,
          causesCount: causes.length,
          effectsCount: effects.length,
          controlsCount: controls.length,
          actionsCount: actions.length,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: failureModesWithDetails,
      } as APIResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get failure modes error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch failure modes',
      } as APIResponse,
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as APIResponse,
        { status: 401 }
      );
    }

    const projectId = params.id;
    const body = await request.json();
    const { processStep, failureMode, causes, effects, controls } = body;

    // Check if user can edit this project
    if (!canEditProject(user, projectId)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' } as APIResponse,
        { status: 403 }
      );
    }

    const db = readDatabase();
    const project = db.projects.find((p: any) => p.id === projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' } as APIResponse,
        { status: 404 }
      );
    }

    if (!processStep || !failureMode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Process step and failure mode are required',
        } as APIResponse,
        { status: 400 }
      );
    }

    // Create failure mode
    const failureModeId = randomUUID();
    const now = new Date().toISOString();

    const newFailureMode: FailureMode = {
      id: failureModeId,
      project_id: projectId,
      component_id: '', // Will be set later when components are added
      process_step: processStep,
      failure_mode: failureMode,
      status: 'active',
      created_at: now,
      updated_at: now
    };

    db.failureModes.push(newFailureMode);

    // Create causes
    if (causes && Array.isArray(causes)) {
      for (const cause of causes) {
        if (cause.description && cause.occurrence) {
          db.causes.push({
            id: randomUUID(),
            failure_mode_id: failureModeId,
            description: cause.description,
            occurrence: cause.occurrence,
            created_at: now,
            updated_at: now
          });
        }
      }
    }

    // Create effects
    if (effects && Array.isArray(effects)) {
      for (const effect of effects) {
        if (effect.description && effect.severity) {
          db.effects.push({
            id: randomUUID(),
            failure_mode_id: failureModeId,
            description: effect.description,
            severity: effect.severity,
            created_at: now,
            updated_at: now
          });
        }
      }
    }

    writeDatabase(db);

    // Create controls
    if (controls && Array.isArray(controls)) {
      for (const control of controls) {
        if (control.description && control.type && control.detection) {
          db.controls.push({
            id: randomUUID(),
            failure_mode_id: failureModeId,
            type: control.type,
            description: control.description,
            detection: control.detection,
            effectiveness: control.effectiveness || 5,
            created_at: now,
            updated_at: now
          });
        }
      }
    }

    writeDatabase(db);

    // Fetch the created failure mode with all details
    const createdCauses = db.causes.filter((c: Cause) => c.failure_mode_id === failureModeId);
    const createdEffects = db.effects.filter((e: Effect) => e.failure_mode_id === failureModeId);
    const createdControls = db.controls.filter((c: Control) => c.failure_mode_id === failureModeId);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newFailureMode,
          causes: createdCauses,
          effects: createdEffects,
          controls: createdControls,
          actions: [],
        },
        message: 'Failure mode created successfully',
      } as APIResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Create failure mode error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create failure mode',
      } as APIResponse,
      { status: 500 }
    );
  }
}