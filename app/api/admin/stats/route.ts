import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/permissions';
import { readDatabase } from '@/lib/database-simple';

/**
 * GET /api/admin/stats
 * Get platform-wide statistics
 * Superadmin only
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    const db = readDatabase();

    // Calculate platform stats
    const stats = {
      total_organizations: db.organizations.length,
      total_users: db.users.length,
      total_projects: db.projects.length,
      active_projects: db.projects.filter((p: any) => p.status === 'in-progress').length,
      total_failure_modes: db.failureModes.length,

      // Plan distribution
      plan_distribution: {
        free: db.organizations.filter((o: any) => o.plan === 'free').length,
        starter: db.organizations.filter((o: any) => o.plan === 'starter').length,
        professional: db.organizations.filter((o: any) => o.plan === 'professional').length,
        enterprise: db.organizations.filter((o: any) => o.plan === 'enterprise').length,
      },

      // Recent activity (last 7 days)
      new_orgs_this_week: db.organizations.filter((o: any) => {
        const created = new Date(o.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      }).length,

      new_users_this_week: db.users.filter((u: any) => {
        const created = new Date(u.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      }).length,

      new_projects_this_week: db.projects.filter((p: any) => {
        const created = new Date(p.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      }).length,

      // Top organizations by project count
      top_organizations: db.organizations
        .map((org: any) => ({
          ...org,
          project_count: db.projects.filter((p: any) => p.organization_id === org.id).length,
          member_count: db.organization_members.filter((m: any) => m.organization_id === org.id).length,
        }))
        .sort((a: any, b: any) => b.project_count - a.project_count)
        .slice(0, 10),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
