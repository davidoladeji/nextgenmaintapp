import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { queries, generateId } from '@/lib/database-simple';
import { APIResponse, FailureMode } from '@/types';

// POST /api/components/[id]/failure-modes - Create a failure mode within a component
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req, user) => {
    try {
      const componentId = params.id;
      const body = await req.json();
      const { failureMode, processStep } = body;

      if (!failureMode?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failure mode description is required',
          } as APIResponse,
          { status: 400 }
        );
      }

      // Get the component to find the project ID
      const component = queries.getComponentById.get(componentId);

      if (!component) {
        return NextResponse.json(
          {
            success: false,
            error: 'Component not found',
          } as APIResponse,
          { status: 404 }
        );
      }

      const failureModeId = generateId();
      queries.createFailureMode.run(
        failureModeId,
        component.project_id,
        componentId,
        processStep?.trim() || '',
        failureMode.trim()
      );

      const newFailureMode = queries.getFailureModeById.get(failureModeId);

      return NextResponse.json(
        {
          success: true,
          data: {
            ...newFailureMode,
            causes: [],
            effects: [],
            controls: [],
            actions: [],
          },
        } as APIResponse<FailureMode>,
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
  })(request);
}
