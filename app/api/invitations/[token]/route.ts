import { NextRequest, NextResponse } from 'next/server';
import { readDatabase } from '@/lib/database-simple';
import { validateInvitationToken } from '@/lib/permissions';

/**
 * GET /api/invitations/[token]
 * Validate invitation token and return invitation details
 * Public endpoint (no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const validation = validateInvitationToken(token);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.reason,
          expired: validation.reason?.includes('expired'),
          already_accepted: validation.reason?.includes('accepted'),
        },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const invitation = validation.invitation;

    // Get organization details
    const organization = db.organizations.find(
      (org: any) => org.id === invitation.organization_id
    );

    // Get inviter details
    const inviter = db.users.find((u: any) => u.id === invitation.invited_by);

    // Check if email already has an account
    const existingUser = db.users.find((u: any) => u.email === invitation.email);

    return NextResponse.json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expires_at: invitation.expires_at,
          created_at: invitation.created_at,
        },
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          logo_url: organization.logo_url,
        } : null,
        inviter: inviter ? {
          name: inviter.name,
        } : null,
        has_account: !!existingUser,
      },
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}
