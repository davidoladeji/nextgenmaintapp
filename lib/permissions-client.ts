import { User } from '@/types';
import { AuthUser } from '@/lib/auth';

/**
 * Client-side permission checking utilities
 * These functions work with user data passed from the server
 * and don't require direct database access
 */

// ===== PLATFORM-LEVEL PERMISSIONS =====

/**
 * Check if user is superadmin (platform-wide access)
 */
export function isSuperAdmin(user: User | AuthUser | null): boolean {
  if (!user) return false;
  return user.is_superadmin === true;
}

/**
 * Check if organization has reached user limit
 */
export function canAddMoreUsers(currentUserCount: number, maxUsers: number): boolean {
  return currentUserCount < maxUsers;
}

/**
 * Check if organization has reached project limit
 */
export function canCreateMoreProjects(currentProjectCount: number, maxProjects: number): boolean {
  return currentProjectCount < maxProjects;
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
