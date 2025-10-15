import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/database-simple';
import { getUserFromToken } from '@/lib/auth';
import { canManageOrganization, isSuperAdmin, isOrganizationMember } from '@/lib/permissions';

/**
 * GET /api/organizations/[id]
 * Get organization details
 * Accessible by organization members and superadmin
 */
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

    const { id: organizationId } = params;
    const db = readDatabase();

    const organization = db.organizations.find((org: any) => org.id === organizationId);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user has access (member or superadmin)
    if (!isSuperAdmin(user) && !isOrganizationMember(user.id, organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get member count
    const memberCount = db.organization_members.filter(
      (m: any) => m.organization_id === organizationId
    ).length;

    // Get project count
    const projectCount = db.projects.filter(
      (p: any) => p.organization_id === organizationId
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        ...organization,
        member_count: memberCount,
        project_count: projectCount,
      },
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[id]
 * Update organization details
 * Requires org_admin or superadmin
 */
export async function PATCH(
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

    const { id: organizationId } = params;

    // Check permissions
    if (!isSuperAdmin(user) && !canManageOrganization(user, organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, logo_url, settings } = body;

    const db = readDatabase();
    const orgIndex = db.organizations.findIndex((org: any) => org.id === organizationId);

    if (orgIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Update organization
    const updatedOrg = {
      ...db.organizations[orgIndex],
      ...(name && { name }),
      ...(logo_url !== undefined && { logo_url }),
      ...(settings && { settings: { ...db.organizations[orgIndex].settings, ...settings } }),
      updated_at: new Date().toISOString(),
    };

    db.organizations[orgIndex] = updatedOrg;
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: updatedOrg,
      message: 'Organization updated successfully',
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]
 * Delete organization (and all associated data)
 * Requires org_admin or superadmin
 * WARNING: This is destructive and deletes all projects, members, etc.
 */
export async function DELETE(
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

    const { id: organizationId } = params;

    // Check permissions
    if (!isSuperAdmin(user) && !canManageOrganization(user, organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const db = readDatabase();

    // Remove organization
    db.organizations = db.organizations.filter((org: any) => org.id !== organizationId);

    // Remove all organization members
    db.organization_members = db.organization_members.filter(
      (m: any) => m.organization_id !== organizationId
    );

    // Remove all invitations
    db.organization_invitations = db.organization_invitations.filter(
      (inv: any) => inv.organization_id !== organizationId
    );

    // Remove all projects (and cascade delete)
    const projectIds = db.projects
      .filter((p: any) => p.organization_id === organizationId)
      .map((p: any) => p.id);

    db.projects = db.projects.filter((p: any) => p.organization_id !== organizationId);

    // Cascade delete: components, failure modes, causes, effects, controls, actions
    projectIds.forEach((projectId: string) => {
      db.components = db.components.filter((c: any) => c.project_id !== projectId);

      const failureModeIds = db.failureModes
        .filter((fm: any) => fm.project_id === projectId)
        .map((fm: any) => fm.id);

      db.failureModes = db.failureModes.filter((fm: any) => fm.project_id !== projectId);

      failureModeIds.forEach((fmId: string) => {
        db.causes = db.causes.filter((c: any) => c.failure_mode_id !== fmId);
        db.effects = db.effects.filter((e: any) => e.failure_mode_id !== fmId);
        db.controls = db.controls.filter((ctrl: any) => ctrl.failure_mode_id !== fmId);
        db.actions = db.actions.filter((a: any) => a.failure_mode_id !== fmId);
      });
    });

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Organization and all associated data deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
