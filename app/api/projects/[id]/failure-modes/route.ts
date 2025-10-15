import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getUserFromToken } from '@/lib/auth';
import { queries } from '@/lib/database-simple';
import { APIResponse } from '@/types';
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

    const project = queries.getProjectById.get(projectId) as any;
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' } as APIResponse,
        { status: 404 }
      );
    }

    const failureModes = queries.getFailureModesByProjectId.all(projectId);

    // Get related data for each failure mode
    const failureModesWithDetails = failureModes.map((fm: any) => {
        const causes = queries.getCausesByFailureModeId.all(fm.id);
        const effects = queries.getEffectsByFailureModeId.all(fm.id);
        const controls = queries.getControlsByFailureModeId.all(fm.id);
        const actions = queries.getActionsByFailureModeId.all(fm.id);

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

    const project = queries.getProjectById.get(projectId) as any;
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
    queries.createFailureMode.run(
      failureModeId,
      projectId,
      processStep,
      failureMode
    );

    // Create causes
    if (causes && Array.isArray(causes)) {
      for (const cause of causes) {
        if (cause.description && cause.occurrence) {
          queries.createCause.run(
            randomUUID(),
            failureModeId,
            cause.description,
            cause.occurrence
          );
        }
      }
    }

    // Create effects
    if (effects && Array.isArray(effects)) {
      for (const effect of effects) {
        if (effect.description && effect.severity) {
          queries.createEffect.run(
            randomUUID(),
            failureModeId,
            effect.description,
            effect.severity
          );
        }
      }
    }

    // Create controls
    if (controls && Array.isArray(controls)) {
      for (const control of controls) {
        if (control.description && control.type && control.detection) {
          queries.createControl.run(
            randomUUID(),
            failureModeId,
            control.type,
            control.description,
            control.detection,
            control.effectiveness || 5
          );
        }
      }
    }

    // Fetch the created failure mode with all details
    const createdFailureMode = queries.getFailureModeById.get(failureModeId);
    const createdCauses = queries.getCausesByFailureModeId.all(failureModeId);
    const createdEffects = queries.getEffectsByFailureModeId.all(failureModeId);
    const createdControls = queries.getControlsByFailureModeId.all(failureModeId);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...createdFailureMode,
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