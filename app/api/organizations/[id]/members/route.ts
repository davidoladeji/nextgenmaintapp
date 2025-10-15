import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase, generateId } from '@/lib/database-simple';
import { getUserFromToken } from '@/lib/auth';
import {
  canManageOrganization,
  canInviteToOrganization,
  isSuperAdmin,
  isOrganizationMember,
  canAddMoreUsers,
  canRemoveOrganizationMember,
} from '@/lib/permissions';
import { OrganizationMember } from '@/types';

/**
 * GET /api/organizations/[id]/members
 * List all members of an organization
 * Accessible by organization members
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

    // Check if user has access
    if (!isSuperAdmin(user) && !isOrganizationMember(user.id, organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const db = readDatabase();

    // Get all members
    const members = db.organization_members
      .filter((m: any) => m.organization_id === organizationId)
      .map((member: any) => {
        // Attach user details
        const memberUser = db.users.find((u: any) => u.id === member.user_id);
        const inviter = db.users.find((u: any) => u.id === member.invited_by);

        return {
          ...member,
          user: memberUser ? {
            id: memberUser.id,
            name: memberUser.name,
            email: memberUser.email,
            avatar_url: memberUser.avatar_url,
          } : null,
          invited_by_user: inviter ? {
            id: inviter.id,
            name: inviter.name,
          } : null,
        };
      });

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/members
 * Add existing user to organization (not via invitation)
 * Requires org_admin or superadmin
 */
export async function POST(
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
    if (!isSuperAdmin(user) && !canInviteToOrganization(user, organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check user limit
    if (!canAddMoreUsers(organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Organization has reached maximum user limit' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { user_id, role = 'viewer' } = body;

    if (!user_id || !role) {
      return NextResponse.json(
        { success: false, error: 'user_id and role are required' },
        { status: 400 }
      );
    }

    const db = readDatabase();

    // Check if user exists
    const targetUser = db.users.find((u: any) => u.id === user_id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = db.organization_members.find(
      (m: any) => m.user_id === user_id && m.organization_id === organizationId
    );

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'User is already a member' },
        { status: 409 }
      );
    }

    // Add member
    const membership: OrganizationMember = {
      id: generateId(),
      organization_id: organizationId,
      user_id,
      role,
      invited_by: user.id,
      joined_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };

    db.organization_members.push(membership);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: membership,
      message: 'Member added successfully',
    });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add member' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[id]/members
 * Update member role
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
    const { member_id, role } = body;

    if (!member_id || !role) {
      return NextResponse.json(
        { success: false, error: 'member_id and role are required' },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const memberIndex = db.organization_members.findIndex(
      (m: any) => m.id === member_id && m.organization_id === organizationId
    );

    if (memberIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Update role
    db.organization_members[memberIndex].role = role;
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: db.organization_members[memberIndex],
      message: 'Member role updated successfully',
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/members/[userId]
 * Remove member from organization
 * Requires org_admin or superadmin
 * Cannot remove yourself as last admin
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
    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('userId');

    if (!userIdToRemove) {
      return NextResponse.json(
        { success: false, error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const db = readDatabase();

    // Find the membership record
    const membership = db.organization_members.find(
      (m: any) => m.user_id === userIdToRemove && m.organization_id === organizationId
    );

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (!isSuperAdmin(user) && !canRemoveOrganizationMember(user, organizationId, membership.id)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Prevent removing last org_admin
    const adminCount = db.organization_members.filter(
      (m: any) => m.organization_id === organizationId && m.role === 'org_admin'
    ).length;

    if (membership.role === 'org_admin' && adminCount === 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove the last organization admin' },
        { status: 400 }
      );
    }

    // Remove member
    db.organization_members = db.organization_members.filter(
      (m: any) => !(m.user_id === userIdToRemove && m.organization_id === organizationId)
    );

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
