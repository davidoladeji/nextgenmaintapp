import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { queries } from './database-simple';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'standard' | 'admin';
  is_superadmin: boolean;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role?: 'standard' | 'admin';
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateJWT(user: AuthUser): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_superadmin: user.is_superadmin || false,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  static verifyJWT(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        is_superadmin: decoded.is_superadmin || false,
      };
    } catch (error) {
      return null;
    }
  }

  static async createUser(userData: CreateUserData): Promise<AuthUser> {
    const { email, name, password, role = 'standard' } = userData;
    
    // Check if user already exists
    const existingUser = queries.getUserByEmail.get(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);
    
    // Create user
    const userId = randomUUID();
    queries.createUser.run(userId, email, name, passwordHash, role);
    
    return {
      id: userId,
      email,
      name,
      role,
    };
  }

  static async loginUser(loginData: LoginData): Promise<{ user: AuthUser; token: string }> {
    const { email, password } = loginData;
    
    // Get user by email
    const dbUser = queries.getUserByEmail.get(email) as any;
    if (!dbUser) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, dbUser.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const user: AuthUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      is_superadmin: dbUser.is_superadmin || false,
    };

    // Generate JWT token
    const token = this.generateJWT(user);
    
    // Create session in database
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    queries.createSession.run(sessionId, user.id, token, expiresAt.toISOString());

    return { user, token };
  }

  static async validateSession(token: string): Promise<AuthUser | null> {
    try {
      // Check session in database
      const session = queries.getSessionByToken.get(token) as any;
      if (!session) {
        return null;
      }

      // Verify JWT
      const user = this.verifyJWT(token);
      if (!user) {
        // Clean up invalid session
        queries.deleteSession.run(token);
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  static async logout(token: string): Promise<void> {
    queries.deleteSession.run(token);
  }

  static async getCurrentUser(token?: string): Promise<AuthUser | null> {
    if (!token) return null;
    return this.validateSession(token);
  }
}

// Middleware helper for API routes
export function withAuth<T = any>(
  handler: (req: Request, user: AuthUser) => Promise<T>
) {
  return async (req: Request): Promise<T> => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('No authorization token provided');
    }

    const token = authHeader.substring(7);
    const user = await AuthService.validateSession(token);
    
    if (!user) {
      throw new Error('Invalid or expired token');
    }

    return handler(req, user);
  };
}

// Helper function to get user from request token
export async function getUserFromToken(req: Request | { headers: Headers }): Promise<User | null> {
  try {
    const headers = 'headers' in req ? req.headers : req.headers;
    const authHeader = headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const authUser = await AuthService.validateSession(token);

    if (!authUser) {
      return null;
    }

    // Get full user details from database
    const dbUser = queries.getUserById.get(authUser.id);

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      is_superadmin: dbUser.is_superadmin || false,
      avatar_url: dbUser.avatar_url,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      role: dbUser.role,
    };
  } catch (error) {
    return null;
  }
}

// Helper functions for backward compatibility with API routes
export async function hashPassword(password: string): Promise<string> {
  return AuthService.hashPassword(password);
}

export async function generateToken(): Promise<string> {
  return randomUUID();
}

// Create default demo users and organization
export async function ensureDefaultUser() {
  try {
    const { readDatabase, writeDatabase, generateId } = require('./database-simple');
    const db = readDatabase();

    // 1. Create SUPERADMIN account
    const superadminExists = db.users.find((u: any) => u.email === 'superadmin@nextgenmaint.com');
    if (!superadminExists) {
      const superadminId = generateId();
      const passwordHash = await hashPassword('super123');

      db.users.push({
        id: superadminId,
        email: 'superadmin@nextgenmaint.com',
        name: 'Platform Superadmin',
        password_hash: passwordHash,
        is_superadmin: true,  // KEY FLAG
        role: 'admin', // Legacy
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log('✅ Created SUPERADMIN: superadmin@nextgenmaint.com / super123');
    }

    // 2. Ensure admin@fmea.local has proper flags and migrate to OgenticAI
    const legacyAdmin = db.users.find((u: any) => u.email === 'admin@fmea.local');
    if (legacyAdmin) {
      // Ensure admin has is_superadmin flag set to false
      const adminIndex = db.users.findIndex((u: any) => u.id === legacyAdmin.id);
      if (adminIndex !== -1 && db.users[adminIndex].is_superadmin === undefined) {
        db.users[adminIndex].is_superadmin = false;
      }

      // Find OgenticAI organization (should already exist, created by this user)
      const ogenticOrg = db.organizations.find((o: any) =>
        o.slug === 'ogenticai' || o.name === 'OgenticAI'
      );

      if (ogenticOrg) {
        // MIGRATE ADMIN'S PROJECTS TO OGENTIC AI
        const adminProjects = db.projects.filter((p: any) =>
          (p.user_id === legacyAdmin.id || p.userId === legacyAdmin.id) && !p.organization_id
        );

        if (adminProjects.length > 0) {
          adminProjects.forEach((project: any) => {
            const projectIndex = db.projects.findIndex((p: any) => p.id === project.id);
            if (projectIndex !== -1) {
              db.projects[projectIndex].organization_id = ogenticOrg.id;
              db.projects[projectIndex].created_by = legacyAdmin.id;
              console.log(`✅ Migrated project "${project.name}" to OgenticAI organization`);
            }
          });
        }
      }
    }

    // 3. Create DEMO CORPORATION (for john@democorp.com - separate demo org)
    let demoOrgId = db.organizations.find((o: any) => o.slug === 'demo-corp')?.id;
    if (!demoOrgId) {
      demoOrgId = generateId();
      db.organizations.push({
        id: demoOrgId,
        name: 'Demo Corporation',
        slug: 'demo-corp',
        plan: 'professional',
        max_users: 50,
        max_projects: 100,
        settings: {
          default_rpn_thresholds: { low: 70, medium: 100, high: 150 },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log('✅ Created Demo Corporation');
    }

    // 4. Create john@democorp.com user for Demo Corporation
    const regularUserExists = db.users.find((u: any) => u.email === 'john@democorp.com');
    if (!regularUserExists) {
      const userId = generateId();
      const passwordHash = await hashPassword('demo123');

      db.users.push({
        id: userId,
        email: 'john@democorp.com',
        name: 'John Smith',
        password_hash: passwordHash,
        is_superadmin: false,
        role: 'standard',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      db.organization_members.push({
        id: generateId(),
        organization_id: demoOrgId,
        user_id: userId,
        role: 'org_admin',
        invited_by: userId,
        joined_at: new Date().toISOString(),
      });

      console.log('✅ Created john@democorp.com as Org Admin of Demo Corporation');
    }

    writeDatabase(db);
  } catch (error) {
    console.error('Error creating default users:', error);
  }
}