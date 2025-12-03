import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase, generateId } from '@/lib/database-simple';
import { getUserFromToken } from '@/lib/auth';
import { canShareProject, canViewProject, isSuperAdmin, getUserRoleInProject } from '@/lib/permissions';
import { ProjectMember } from '@/types';

/**
 * GET /api/projects/[id]/members
 * List all members who have access to this project
 * Accessible by project members
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

    const { id: projectId } = params;

    // Check if user can view project
    if (!canViewProject(user, projectId)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const db = readDatabase();

    // Get project members
    const members = db.project_members
      .filter((m: any) => m.project_id === projectId)
      .map((member: any) => {
        const memberUser = db.users.find((u: any) => u.id === member.user_id);
        const adder = db.users.find((u: any) => u.id === member.added_by);

        return {
          ...member,
          user: memberUser ? {
            id: memberUser.id,
            name: memberUser.name,
            email: memberUser.email,
            avatar_url: memberUser.avatar_url,
          } : null,
          added_by_user: adder ? {
            id: adder.id,
            name: adder.name,
          } : null,
        };
      });

    // Also include project owner from projects table
    const project = db.projects.find((p: any) => p.id === projectId);
    if (project) {
      const owner = db.users.find((u: any) => u.id === (project.created_by || project.userId));
      if (owner) {
        // Check if owner is already in members list
        const ownerInMembers = members.find((m: any) => m.user_id === owner.id);
        if (!ownerInMembers) {
          members.unshift({
            id: 'owner',
            project_id: projectId,
            user_id: owner.id,
            role: 'owner',
            added_by: owner.id,
            added_at: project.created_at || project.createdAt,
            user: {
              id: owner.id,
              name: owner.name,
              email: owner.email,
              avatar_url: owner.avatar_url,
            },
            is_creator: true,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Error fetching project members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/members
 * Add member to project (share project)
 * Requires owner, project_manager, or org_admin
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

    const { id: projectId } = params;

    // Check if user can share project
    if (!canShareProject(user, projectId)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to share project' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_id, role = 'viewer' } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    const db = readDatabase();

    // Check if target user exists
    const targetUser = db.users.find((u: any) => u.id === user_id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if project exists
    const project = db.projects.find((p: any) => p.id === projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user is already a project member
    const existingMember = db.project_members.find(
      (m: any) => m.user_id === user_id && m.project_id === projectId
    );

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'User already has access to this project' },
        { status: 409 }
      );
    }

    // Add member
    const membership: ProjectMember = {
      id: generateId(),
      project_id: projectId,
      user_id,
      role,
      added_by: user.id,
      added_at: new Date().toISOString(),
      last_accessed_at: undefined,
    };

    db.project_members.push(membership);
    writeDatabase(db);

    // Return member with user details
    return NextResponse.json({
      success: true,
      data: {
        ...membership,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          avatar_url: targetUser.avatar_url,
        },
      },
      message: 'Project shared successfully',
    });
  } catch (error) {
    console.error('Error adding project member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add project member' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/members?userId=[userId]
 * Remove member access from project
 * Requires owner, project_manager, or org_admin
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

    const { id: projectId } = params;
    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('userId');

    if (!userIdToRemove) {
      return NextResponse.json(
        { success: false, error: 'userId parameter required' },
        { status: 400 }
      );
    }

    // Check if user can share project (same permission needed to remove)
    if (!canShareProject(user, projectId)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const db = readDatabase();

    // Cannot remove project owner
    const project = db.projects.find((p: any) => p.id === projectId);
    if (project && (project.userId === userIdToRemove || project.created_by === userIdToRemove)) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove project owner' },
        { status: 400 }
      );
    }

    // Remove member
    const initialLength = db.project_members.length;
    db.project_members = db.project_members.filter(
      (m: any) => !(m.project_id === projectId && m.user_id === userIdToRemove)
    );

    if (db.project_members.length === initialLength) {
      return NextResponse.json(
        { success: false, error: 'Member not found or already removed' },
        { status: 404 }
      );
    }

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Member removed from project successfully',
    });
  } catch (error) {
    console.error('Error removing project member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove project member' },
      { status: 500 }
    );
  }
}
