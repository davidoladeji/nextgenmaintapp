import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { queries } from '@/lib/database-simple';
import { APIResponse, Component } from '@/types';

// GET /api/components/[id] - Get a specific component
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req, user) => {
    try {
      const componentId = params.id;
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

      // Get failure modes for this component
      const failureModes = queries.getFailureModesByComponentId.all(componentId);

      return NextResponse.json(
        {
          success: true,
          data: { ...component, failureModes },
        } as APIResponse<Component>,
        { status: 200 }
      );
    } catch (error) {
      console.error('Get component error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch component',
        } as APIResponse,
        { status: 500 }
      );
    }
  })(request);
}

// PUT /api/components/[id] - Update a component
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req, user) => {
    try {
      const componentId = params.id;
      const body = await req.json();
      const { name, description } = body;

      if (!name?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Component name is required',
          } as APIResponse,
          { status: 400 }
        );
      }

      queries.updateComponent.run(componentId, name.trim(), description?.trim() || null);

      const updatedComponent = queries.getComponentById.get(componentId);

      return NextResponse.json(
        {
          success: true,
          data: updatedComponent,
        } as APIResponse<Component>,
        { status: 200 }
      );
    } catch (error) {
      console.error('Update component error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update component',
        } as APIResponse,
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/components/[id] - Delete a component
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req, user) => {
    try {
      const componentId = params.id;

      queries.deleteComponent.run(componentId);

      return NextResponse.json(
        {
          success: true,
          message: 'Component deleted successfully',
        } as APIResponse,
        { status: 200 }
      );
    } catch (error) {
      console.error('Delete component error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete component',
        } as APIResponse,
        { status: 500 }
      );
    }
  })(request);
}
