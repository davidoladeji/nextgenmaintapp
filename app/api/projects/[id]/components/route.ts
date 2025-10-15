import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { queries, generateId } from '@/lib/database-simple';
import { APIResponse, Component } from '@/types';

// GET /api/projects/[id]/components - Get all components for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req, user) => {
    try {
      const projectId = params.id;

      // Get components
      const components = queries.getComponentsByProjectId.all(projectId);

      // Get failure modes for each component
      const componentsWithFailureModes = components.map((component: any) => {
        const failureModes = queries.getFailureModesByComponentId.all(component.id);

        // Get causes, effects, controls, actions for each failure mode
        const failureModesWithDetails = failureModes.map((fm: any) => {
          const causes = queries.getCausesByFailureModeId.all(fm.id);
          const effects = queries.getEffectsByFailureModeId.all(fm.id);
          const controls = queries.getControlsByFailureModeId.all(fm.id);
          const actions = queries.getActionsByFailureModeId.all(fm.id);

          return {
            ...fm,
            causes,
            effects,
            controls,
            actions,
          };
        });

        return {
          ...component,
          failureModes: failureModesWithDetails,
        };
      });

      return NextResponse.json(
        {
          success: true,
          data: componentsWithFailureModes,
        } as APIResponse<Component[]>,
        { status: 200 }
      );
    } catch (error) {
      console.error('Get components error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch components',
        } as APIResponse,
        { status: 500 }
      );
    }
  })(request);
}

// POST /api/projects/[id]/components - Create a new component
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req, user) => {
    try {
      const projectId = params.id;
      const body = await req.json();
      const { name, description, function: functionField } = body;

      if (!name?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Component name is required',
          } as APIResponse,
          { status: 400 }
        );
      }

      // Get existing components to determine order
      const existingComponents = queries.getComponentsByProjectId.all(projectId);
      const order = existingComponents.length;

      const componentId = generateId();
      queries.createComponent.run(
        componentId,
        projectId,
        name.trim(),
        description?.trim() || null,
        order,
        functionField?.trim() || null
      );

      const component = queries.getComponentById.get(componentId);

      return NextResponse.json(
        {
          success: true,
          data: { ...component, failureModes: [] },
        } as APIResponse<Component>,
        { status: 201 }
      );
    } catch (error) {
      console.error('Create component error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create component',
        } as APIResponse,
        { status: 500 }
      );
    }
  })(request);
}
