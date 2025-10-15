import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase, generateId } from '@/lib/database-simple';
import { validateInvitationToken } from '@/lib/permissions';
import { hashPassword, generateToken } from '@/lib/auth';
import { User, OrganizationMember } from '@/types';

/**
 * POST /api/invitations/[token]/accept
 * Accept organization invitation
 * Creates account if new user, or adds existing user to organization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await request.json();

    // Validate invitation
    const validation = validateInvitationToken(token);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.reason },
        { status: 400 }
      );
    }

    const invitation = validation.invitation;
    const db = readDatabase();

    let userId: string;
    let isNewUser = false;

    // Check if user already exists
    const existingUser = db.users.find((u: any) => u.email === invitation.email);

    if (existingUser) {
      // Existing user - just add to organization
      userId = existingUser.id;

      // Check if already a member
      const existingMember = db.organization_members.find(
        (m: any) => m.user_id === userId && m.organization_id === invitation.organization_id
      );

      if (existingMember) {
        return NextResponse.json(
          { success: false, error: 'You are already a member of this organization' },
          { status: 409 }
        );
      }
    } else {
      // New user - create account
      const { name, password } = body;

      if (!name || !password) {
        return NextResponse.json(
          { success: false, error: 'Name and password required for new users' },
          { status: 400 }
        );
      }

      userId = generateId();
      const passwordHash = await hashPassword(password);
      const now = new Date();

      const newUser: User = {
        id: userId,
        email: invitation.email,
        name,
        is_superadmin: false,
        createdAt: now,
        updatedAt: now,
        role: 'standard', // Legacy field
      };

      db.users.push({
        ...newUser,
        password_hash: passwordHash,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

      isNewUser = true;
    }

    // Add user to organization
    const membership: OrganizationMember = {
      id: generateId(),
      organization_id: invitation.organization_id,
      user_id: userId,
      role: invitation.role,
      invited_by: invitation.invited_by,
      joined_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };

    db.organization_members.push(membership);

    // Mark invitation as accepted
    const invitationIndex = db.organization_invitations.findIndex(
      (inv: any) => inv.invitation_token === token
    );

    if (invitationIndex !== -1) {
      db.organization_invitations[invitationIndex].status = 'accepted';
      db.organization_invitations[invitationIndex].accepted_at = new Date().toISOString();
    }

    // Create session token for auto-login
    const sessionToken = await generateToken();
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30); // 30 days

    db.sessions.push({
      id: generateId(),
      userId,
      token: sessionToken,
      expiresAt: sessionExpiry,
      createdAt: new Date(),
    });

    writeDatabase(db);

    // Get organization details for response
    const organization = db.organizations.find(
      (org: any) => org.id === invitation.organization_id
    );

    return NextResponse.json({
      success: true,
      data: {
        user_id: userId,
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        } : null,
        membership,
        session_token: sessionToken,
        is_new_user: isNewUser,
      },
      message: isNewUser
        ? 'Account created and joined organization successfully'
        : 'Joined organization successfully',
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
