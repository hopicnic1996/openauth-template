import { createSubjects } from "@openauthjs/openauth/subject";
import { object, string } from "valibot";

// User roles enum
export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Enhanced user subject with role
export const subjects = createSubjects({
  user: object({
    id: string(),
    email: string(),
    role: string(),
    firstName: string(),
    lastName: string(),
  }),
});

// Session interface
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}

// User interface
export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Database result interface (matches DB column names)
interface UserDbResult {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  last_login?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

// Default admin emails - users with these emails will automatically get admin role
const DEFAULT_ADMIN_EMAILS = [
  'admin@myauth.com',
  'admin@example.com',
  'admin@localhost',
];

// Create a new session
export async function createSession(env: Env, userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await env.AUTH_DB.prepare(`
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `).bind(userId, token, expiresAt.toISOString()).run();

  return token;
}

// Get user by session token
export async function getUserBySession(env: Env, token: string): Promise<User | null> {
  const result = await env.AUTH_DB.prepare(`
    SELECT u.*, s.expires_at
    FROM user u
    JOIN user_sessions s ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
  `).bind(token).first<UserDbResult>();

  if (!result) {
    return null;
  }

  // Update last login
  await env.AUTH_DB.prepare(`
    UPDATE user SET last_login = datetime('now') WHERE id = ?
  `).bind(result.id).run();

  return {
    id: result.id,
    email: result.email,
    role: result.role as UserRole,
    firstName: result.first_name,
    lastName: result.last_name,
    lastLogin: result.last_login,
    isActive: Boolean(result.is_active),
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  };
}

// Delete session (logout)
export async function deleteSession(env: Env, token: string): Promise<void> {
  await env.AUTH_DB.prepare(`
    DELETE FROM user_sessions WHERE token = ?
  `).bind(token).run();
}

// Clean expired sessions
export async function cleanExpiredSessions(env: Env): Promise<void> {
  await env.AUTH_DB.prepare(`
    DELETE FROM user_sessions WHERE expires_at <= datetime('now')
  `).run();
}

// Check if user has required role
export function hasRole(user: User, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.USER]: 1,
    [UserRole.MODERATOR]: 2,
    [UserRole.ADMIN]: 3,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

// Get session token from request
export function getSessionToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const url = new URL(request.url);
  return url.searchParams.get('token');
}

// Middleware to require authentication
export async function requireAuth(
  request: Request,
  env: Env,
  requiredRole: UserRole = UserRole.USER
): Promise<{ user: User } | Response> {
  const token = getSessionToken(request);
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const user = await getUserBySession(env, token);
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!hasRole(user, requiredRole)) {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return { user };
}

// Ensure admin users are created with proper roles
export async function ensureAdminUser(env: Env, email: string): Promise<string> {
  const isDefaultAdmin = DEFAULT_ADMIN_EMAILS.includes(email.toLowerCase());
  const role = isDefaultAdmin ? UserRole.ADMIN : UserRole.USER;
  
  const result = await env.AUTH_DB.prepare(`
    INSERT INTO user (email, role, updated_at, created_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
    ON CONFLICT (email) DO UPDATE SET 
      role = CASE 
        WHEN ? = 'admin' AND role != 'admin' THEN 'admin'
        ELSE role
      END,
      updated_at = datetime('now')
    RETURNING id;
  `).bind(email, role, role).first<{ id: string }>();
  
  if (!result) {
    throw new Error(`Unable to process user: ${email}`);
  }
  
  console.log(`Found or created user ${result.id} with email ${email} and role ${role}`);
  return result.id;
}

// Create first admin user if none exists
export async function ensureFirstAdmin(env: Env): Promise<void> {
  const adminCount = await env.AUTH_DB.prepare(`
    SELECT COUNT(*) as count FROM user WHERE role = 'admin'
  `).first<{ count: number }>();

  if (adminCount && adminCount.count === 0) {
    // No admin users exist, create the default one
    await ensureAdminUser(env, DEFAULT_ADMIN_EMAILS[0]);
    console.log('Created first admin user with email:', DEFAULT_ADMIN_EMAILS[0]);
  }
}

// Check if email should have admin role
export function isDefaultAdmin(email: string): boolean {
  return DEFAULT_ADMIN_EMAILS.includes(email.toLowerCase());
} 