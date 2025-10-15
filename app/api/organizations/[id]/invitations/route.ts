import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase, generateId } from '@/lib/database-simple';
import { getUserFromToken } from '@/lib/auth';
import { canInviteToOrganization, isSuperAdmin, isOrganizationMember, canAddMoreUsers } from '@/lib/permissions';
import { OrganizationInvitation } from '@/types';

/**
 * GET /api/organizations/[id]/invitations
 * List all pending invitations for an organization
 * Accessible by org_admin and superadmin
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

    // Check permissions
    if (!isSuperAdmin(user) && !canInviteToOrganization(user, organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const db = readDatabase();

    // Get pending invitations
    const invitations = db.organization_invitations
      .filter((inv: any) => inv.organization_id === organizationId)
      .map((inv: any) => {
        const inviter = db.users.find((u: any) => u.id === inv.invited_by);
        return {
          ...inv,
          invited_by_user: inviter ? {
            id: inviter.id,
            name: inviter.name,
            email: inviter.email,
          } : null,
        };
      });

    return NextResponse.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/invitations
 * Send invitation to join organization
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
    const { email, role = 'viewer' } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const db = readDatabase();

    // Check if organization exists
    const organization = db.organizations.find((org: any) => org.id === organizationId);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingUser = db.users.find((u: any) => u.email === email);
    if (existingUser) {
      const existingMember = db.organization_members.find(
        (m: any) => m.user_id === existingUser.id && m.organization_id === organizationId
      );

      if (existingMember) {
        return NextResponse.json(
          { success: false, error: 'User is already a member of this organization' },
          { status: 409 }
        );
      }
    }

    // Check if pending invitation already exists
    const existingInvitation = db.organization_invitations.find(
      (inv: any) =>
        inv.email === email &&
        inv.organization_id === organizationId &&
        inv.status === 'pending'
    );

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: 'Pending invitation already exists for this email' },
        { status: 409 }
      );
    }

    // Create invitation
    const invitationToken = generateId() + generateId(); // Extra long token for security
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation: OrganizationInvitation = {
      id: generateId(),
      organization_id: organizationId,
      email,
      role,
      invited_by: user.id,
      invitation_token: invitationToken,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
    };

    db.organization_invitations.push(invitation);
    writeDatabase(db);

    // TODO: Send email notification (Phase 1.5)
    // For now, just return the invitation link
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3030'}/invite/${invitationToken}`;

    return NextResponse.json({
      success: true,
      data: {
        ...invitation,
        invitation_link: invitationLink,
      },
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/invitations/[invitationId]
 * Cancel pending invitation
 * Requires org_admin or superadmin
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
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: 'invitationId parameter required' },
        { status: 400 }
      );
    }

    // Check permissions
    if (!isSuperAdmin(user) && !canInviteToOrganization(user, organizationId)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const db = readDatabase();

    // Find and cancel invitation
    const invitationIndex = db.organization_invitations.findIndex(
      (inv: any) => inv.id === invitationId && inv.organization_id === organizationId
    );

    if (invitationIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Mark as cancelled instead of deleting (for audit trail)
    db.organization_invitations[invitationIndex].status = 'cancelled';
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
}
