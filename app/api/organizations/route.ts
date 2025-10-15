import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase, generateId } from '@/lib/database-simple';
import { getUserFromToken } from '@/lib/auth';
import { getUserOrganizations, isSuperAdmin } from '@/lib/permissions';
import { Organization, OrganizationMember } from '@/types';

/**
 * GET /api/organizations
 * List all organizations user belongs to
 * Superadmin sees all organizations
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organizations = getUserOrganizations(user.id);

    return NextResponse.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations
 * Create new organization
 * Any authenticated user can create an organization and becomes org_admin
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, slug, plan = 'free' } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const db = readDatabase();

    // Check if slug already exists
    const existingOrg = db.organizations.find((org: any) => org.slug === slug);
    if (existingOrg) {
      return NextResponse.json(
        { success: false, error: 'Organization slug already exists' },
        { status: 409 }
      );
    }

    // Determine plan limits
    const planLimits = {
      free: { max_users: 3, max_projects: 5 },
      starter: { max_users: 10, max_projects: 25 },
      professional: { max_users: 50, max_projects: 100 },
      enterprise: { max_users: 999, max_projects: 999 },
    };

    const limits = planLimits[plan as keyof typeof planLimits] || planLimits.free;

    // Create organization
    const organizationId = generateId();
    const now = new Date().toISOString();

    const organization: Organization = {
      id: organizationId,
      name,
      slug,
      logo_url: body.logo_url || undefined,
      plan,
      max_users: limits.max_users,
      max_projects: limits.max_projects,
      settings: {
        default_rpn_thresholds: {
          low: 70,
          medium: 100,
          high: 150,
        },
        allowed_standards: [],
      },
      created_at: now,
      updated_at: now,
    };

    // Add creator as org_admin
    const membership: OrganizationMember = {
      id: generateId(),
      organization_id: organizationId,
      user_id: user.id,
      role: 'org_admin',
      invited_by: user.id, // Self-added
      joined_at: now,
      last_active_at: now,
    };

    db.organizations.push(organization);
    db.organization_members.push(membership);

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: organization,
      message: 'Organization created successfully',
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}
