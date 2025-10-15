import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getUserFromToken } from '@/lib/auth';
import { queries, readDatabase, writeDatabase } from '@/lib/database-simple';
import { APIResponse } from '@/types';
import { canViewProject, canEditProject, canDeleteProject } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as APIResponse,
        { status: 401 }
      );
    }

    const projectId = params.id;

    if (!canViewProject(user, projectId)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' } as APIResponse,
        { status: 403 }
      );
    }

    const project = queries.getProjectById.get(projectId);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' } as APIResponse,
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: project,
      } as APIResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' } as APIResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as APIResponse,
        { status: 401 }
      );
    }

    const projectId = params.id;

    if (!canEditProject(user, projectId)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' } as APIResponse,
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' } as APIResponse,
        { status: 400 }
      );
    }

    // Update project in database
    const db = readDatabase();
    const projectIndex = db.projects.findIndex((p: any) => p.id === projectId);

    if (projectIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Project not found' } as APIResponse,
        { status: 404 }
      );
    }

    db.projects[projectIndex] = {
      ...db.projects[projectIndex],
      name: name.trim(),
      description: description?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    writeDatabase(db);

    // Fetch updated project
    const updatedProject = queries.getProjectById.get(projectId);

    return NextResponse.json(
      {
        success: true,
        data: updatedProject,
        message: 'Project updated successfully',
      } as APIResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' } as APIResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as APIResponse,
        { status: 401 }
      );
    }

    const projectId = params.id;

    // Check if user can delete project
    if (!canDeleteProject(user, projectId)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' } as APIResponse,
        { status: 403 }
      );
    }

    const project = queries.getProjectById.get(projectId);
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        } as APIResponse,
        { status: 404 }
      );
    }

    // Delete project and all related data (cascading)
    queries.deleteProject.run(projectId);

    return NextResponse.json(
      {
        success: true,
        message: 'Project and all related data deleted successfully',
      } as APIResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete project',
      } as APIResponse,
      { status: 500 }
    );
  }
}
