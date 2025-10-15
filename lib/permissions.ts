import { User, Organization, OrganizationMember, Project, ProjectMember } from '@/types';
import { readDatabase } from './database-simple';

/**
 * Permission checking utilities for RBAC system
 *
 * Role Hierarchy:
 * 1. Superadmin - Platform-wide access
 * 2. Org Admin - Manage organization
 * 3. Project Manager - Create/manage projects
 * 4. Editor - Edit FMEA data
 * 5. Viewer - Read-only access
 * 6. Guest - Temporary project access
 */

// ===== PLATFORM-LEVEL PERMISSIONS =====

/**
 * Check if user is superadmin (platform-wide access)
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.is_superadmin === true;
}

// ===== ORGANIZATION-LEVEL PERMISSIONS =====

/**
 * Get user's role in an organization
 */
export function getUserRoleInOrganization(
  userId: string,
  organizationId: string
): 'org_admin' | 'project_manager' | 'editor' | 'viewer' | null {
  const db = readDatabase();
  const membership = db.organization_members.find(
    (m: any) => m.user_id === userId && m.organization_id === organizationId
  );
  return membership ? membership.role : null;
}

/**
 * Check if user belongs to organization
 */
export function isOrganizationMember(userId: string, organizationId: string): boolean {
  return getUserRoleInOrganization(userId, organizationId) !== null;
}

/**
 * Check if user can manage organization (invite users, change settings, etc.)
 */
export function canManageOrganization(user: User, organizationId: string): boolean {
  if (isSuperAdmin(user)) return true;

  const role = getUserRoleInOrganization(user.id, organizationId);
  return role === 'org_admin';
}

/**
 * Check if user can invite members to organization
 */
export function canInviteToOrganization(user: User, organizationId: string): boolean {
  if (isSuperAdmin(user)) return true;

  const role = getUserRoleInOrganization(user.id, organizationId);
  return role === 'org_admin';
}

/**
 * Check if user can create projects in organization
 */
export function canCreateProjects(user: User, organizationId: string): boolean {
  if (isSuperAdmin(user)) return true;

  const role = getUserRoleInOrganization(user.id, organizationId);
  return role === 'org_admin' || role === 'project_manager';
}

/**
 * Check if user can remove members from organization
 */
export function canRemoveOrganizationMember(
  user: User,
  organizationId: string,
  targetMemberId: string
): boolean {
  if (isSuperAdmin(user)) return true;

  const role = getUserRoleInOrganization(user.id, organizationId);
  if (role !== 'org_admin') return false;

  // Org admins can't remove themselves (prevent lockout)
  const db = readDatabase();
  const targetMember = db.organization_members.find((m: any) => m.id === targetMemberId);
  return targetMember && targetMember.user_id !== user.id;
}

// ===== PROJECT-LEVEL PERMISSIONS =====

/**
 * Get user's role in a specific project
 */
export function getUserRoleInProject(
  userId: string,
  projectId: string
): 'owner' | 'editor' | 'viewer' | null {
  const db = readDatabase();

  // Check project_members table
  const membership = db.project_members.find(
    (m: any) => m.user_id === userId && m.project_id === projectId
  );

  if (membership) return membership.role;

  // Check if user is project creator (legacy support)
  const project = db.projects.find((p: any) => p.id === projectId);
  if (project && (project.userId === userId || project.created_by === userId)) {
    return 'owner';
  }

  return null;
}

/**
 * Check if user can view project
 * Superadmin can view all, org members can view org projects, project members can view shared projects
 */
export function canViewProject(user: User, projectId: string): boolean {
  if (isSuperAdmin(user)) return true;

  const db = readDatabase();
  const project = db.projects.find((p: any) => p.id === projectId);

  if (!project) return false;

  // Check if user is in the project's organization
  if (project.organization_id && isOrganizationMember(user.id, project.organization_id)) {
    return true;
  }

  // Check if user is a project member
  return getUserRoleInProject(user.id, projectId) !== null;
}

/**
 * Check if user can edit project (add/modify FMEA data)
 */
export function canEditProject(user: User, projectId: string): boolean {
  if (isSuperAdmin(user)) return true;

  const role = getUserRoleInProject(user.id, projectId);
  return role === 'owner' || role === 'editor';
}

/**
 * Check if user can delete project
 */
export function canDeleteProject(user: User, projectId: string): boolean {
  if (isSuperAdmin(user)) return true;

  const db = readDatabase();
  const project = db.projects.find((p: any) => p.id === projectId);

  if (!project) return false;

  // Org admins can delete any org project
  if (project.organization_id) {
    const orgRole = getUserRoleInOrganization(user.id, project.organization_id);
    if (orgRole === 'org_admin') return true;
  }

  // Project owners and managers can delete their own projects
  const projectRole = getUserRoleInProject(user.id, projectId);
  return projectRole === 'owner';
}

/**
 * Check if user can share project (add members)
 */
export function canShareProject(user: User, projectId: string): boolean {
  if (isSuperAdmin(user)) return true;

  const db = readDatabase();
  const project = db.projects.find((p: any) => p.id === projectId);

  if (!project) return false;

  // Org admins and project managers can share
  if (project.organization_id) {
    const orgRole = getUserRoleInOrganization(user.id, project.organization_id);
    if (orgRole === 'org_admin' || orgRole === 'project_manager') return true;
  }

  // Project owners can share
  const projectRole = getUserRoleInProject(user.id, projectId);
  return projectRole === 'owner';
}

/**
 * Get all organizations user belongs to
 */
export function getUserOrganizations(userId: string): Organization[] {
  const db = readDatabase();

  // Superadmin sees all organizations
  const user = db.users.find((u: any) => u.id === userId);
  if (user && user.is_superadmin) {
    return db.organizations;
  }

  // Regular users see only their organizations
  const membershipOrgIds = db.organization_members
    .filter((m: any) => m.user_id === userId)
    .map((m: any) => m.organization_id);

  return db.organizations.filter((org: any) => membershipOrgIds.includes(org.id));
}

/**
 * Get all projects user can access in an organization
 */
export function getUserProjectsInOrganization(
  userId: string,
  organizationId: string
): Project[] {
  const db = readDatabase();

  // Check if user is org member
  if (!isOrganizationMember(userId, organizationId)) {
    return [];
  }

  // Return all org projects (org members can see all org projects)
  return db.projects.filter((p: any) => p.organization_id === organizationId);
}

/**
 * Check if organization has reached user limit
 */
export function canAddMoreUsers(organizationId: string): boolean {
  const db = readDatabase();
  const org = db.organizations.find((o: any) => o.id === organizationId);

  if (!org) return false;

  const currentUserCount = db.organization_members.filter(
    (m: any) => m.organization_id === organizationId
  ).length;

  return currentUserCount < org.max_users;
}

/**
 * Check if organization has reached project limit
 */
export function canCreateMoreProjects(organizationId: string): boolean {
  const db = readDatabase();
  const org = db.organizations.find((o: any) => o.id === organizationId);

  if (!org) return false;

  const currentProjectCount = db.projects.filter(
    (p: any) => p.organization_id === organizationId
  ).length;

  return currentProjectCount < org.max_projects;
}

/**
 * Validate invitation token
 */
export function validateInvitationToken(token: string): {
  valid: boolean;
  invitation?: any;
  reason?: string;
} {
  const db = readDatabase();
  const invitation = db.organization_invitations.find(
    (inv: any) => inv.invitation_token === token
  );

  if (!invitation) {
    return { valid: false, reason: 'Invitation not found' };
  }

  if (invitation.status !== 'pending') {
    return { valid: false, reason: `Invitation is ${invitation.status}`, invitation };
  }

  const expiresAt = new Date(invitation.expires_at);
  if (expiresAt < new Date()) {
    return { valid: false, reason: 'Invitation has expired', invitation };
  }

  return { valid: true, invitation };
}

// ===== HELPER FUNCTIONS =====

/**
 * Get highest role user has across all contexts for a project
 * Useful for UI rendering decisions
 */
export function getEffectiveProjectRole(
  user: User,
  projectId: string
): 'superadmin' | 'org_admin' | 'owner' | 'editor' | 'viewer' | null {
  if (isSuperAdmin(user)) return 'superadmin';

  const db = readDatabase();
  const project = db.projects.find((p: any) => p.id === projectId);

  if (!project) return null;

  // Check org role first
  if (project.organization_id) {
    const orgRole = getUserRoleInOrganization(user.id, project.organization_id);
    if (orgRole === 'org_admin') return 'org_admin';
  }

  // Check project role
  const projectRole = getUserRoleInProject(user.id, projectId);
  return projectRole;
}

/**
 * Check if user can perform action based on minimum required role
 */
export function hasMinimumRole(
  userRole: string | null,
  requiredRole: string
): boolean {
  const roleHierarchy = {
    superadmin: 100,
    org_admin: 80,
    project_manager: 60,
    owner: 60,
    editor: 40,
    viewer: 20,
    guest: 10,
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
}
