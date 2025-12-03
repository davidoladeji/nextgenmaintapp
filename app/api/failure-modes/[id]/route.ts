import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { queries } from '@/lib/database-simple';
import { APIResponse } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req, user) => {
    try {
      const failureModeId = params.id;
      const body = await req.json();
      const { failure_mode, owner } = body;

      if (!failure_mode?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failure mode name is required',
          } as APIResponse,
          { status: 400 }
        );
      }

      queries.updateFailureMode.run(failureModeId, failure_mode.trim(), owner || null);

      const updatedFailureMode = queries.getFailureModeById.get(failureModeId);

      return NextResponse.json(
        {
          success: true,
          data: updatedFailureMode,
        } as APIResponse,
        { status: 200 }
      );
    } catch (error) {
      console.error('Update failure mode error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update failure mode',
        } as APIResponse,
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req, user) => {
    try {
      const failureModeId = params.id;

      // Verify failure mode exists
      const failureMode = queries.getFailureModeById.get(failureModeId);
      if (!failureMode) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failure mode not found',
          } as APIResponse,
          { status: 404 }
        );
      }

      // Delete failure mode and all related data (cascading)
      queries.deleteFailureMode.run(failureModeId);

      return NextResponse.json(
        {
          success: true,
          message: 'Failure mode deleted successfully',
        } as APIResponse,
        { status: 200 }
      );
    } catch (error) {
      console.error('Error deleting failure mode:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete failure mode',
        } as APIResponse,
        { status: 500 }
      );
    }
  })(request);
}
