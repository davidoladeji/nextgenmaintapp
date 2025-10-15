import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getUserFromToken } from '@/lib/auth';
import { queries } from '@/lib/database-simple';
import { APIResponse, CreateProjectForm } from '@/types';
import { randomUUID } from 'crypto';
import { isSuperAdmin, isOrganizationMember } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as APIResponse,
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId parameter required' } as APIResponse,
        { status: 400 }
      );
    }

    // Check access: superadmin can see all, otherwise must be org member
    if (!isSuperAdmin(user) && !isOrganizationMember(user.id, organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this organization' } as APIResponse,
        { status: 403 }
      );
    }

    const projects = queries.getProjectsByOrganizationId.all(organizationId);

    return NextResponse.json(
      {
        success: true,
        data: projects,
      } as APIResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch projects',
      } as APIResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, user) => {
    try {
      const body: any = await req.json();
      const {
        name,
        description,
        assetName,
        assetId,
        assetType,
        context,
        criticality,
        standards,
        history,
        configuration,
        organizationId,
      } = body;

      if (!name || !assetName || !assetType || !context) {
        return NextResponse.json(
          {
            success: false,
            error: 'Required fields: name, assetName, assetType, context',
          } as APIResponse,
          { status: 400 }
        );
      }

      if (!organizationId) {
        return NextResponse.json(
          {
            success: false,
            error: 'organizationId is required',
          } as APIResponse,
          { status: 400 }
        );
      }

      // Check if user can create projects in this organization
      if (!isSuperAdmin(user) && !isOrganizationMember(user.id, organizationId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied to this organization',
          } as APIResponse,
          { status: 403 }
        );
      }

      // Create asset first
      const assetUuid = randomUUID();
      queries.createAsset.run(
        assetUuid,
        assetName,
        assetId || assetName,
        assetType,
        context,
        criticality,
        JSON.stringify(standards || []),
        history || null,
        configuration || null
      );

      // Create project with organization_id
      const projectUuid = randomUUID();
      queries.createProject.run(
        projectUuid,
        name,
        description || null,
        assetUuid,
        user.id,
        organizationId  // Include organization ID
      );

      // Fetch the created project with asset data
      const project = queries.getProjectById.get(projectUuid);

      return NextResponse.json(
        {
          success: true,
          data: project,
          message: 'Project created successfully',
        } as APIResponse,
        { status: 201 }
      );
    } catch (error) {
      console.error('Create project error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create project',
        } as APIResponse,
        { status: 500 }
      );
    }
  })(request);
}