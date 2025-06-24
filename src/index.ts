import { issuer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { PasswordProvider } from "@openauthjs/openauth/provider/password";
import { PasswordUI } from "@openauthjs/openauth/ui/password";
import { object, string } from "valibot";

import { 
  subjects, 
  UserRole, 
  createSession, 
  getUserBySession, 
  deleteSession, 
  requireAuth, 
  getSessionToken,
  cleanExpiredSessions,
  ensureAdminUser,
  ensureFirstAdmin,
  User
} from "./auth";
import { 
  getHomePage, 
  getDashboard, 
  getUnauthorizedPage,
  getBaseTemplate,
  getAdminSetupPage
} from "./templates";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    
    // Clean expired sessions and ensure first admin exists
    ctx.waitUntil(cleanExpiredSessions(env));
    ctx.waitUntil(ensureFirstAdmin(env));

    // Handle different routes
    switch (url.pathname) {
      case "/":
        return handleHomePage(request, env);
        
      case "/dashboard":
        return handleDashboard(request, env);
        
      case "/profile":
        return handleProfile(request, env);
        
      case "/admin":
        return handleAdmin(request, env);
        
      case "/setup":
        return handleSetup(request, env);
        
      case "/unauthorized":
        return new Response(getUnauthorizedPage(), {
          headers: { "Content-Type": "text/html" }
        });

      // API Routes
      case "/api/logout":
        return handleLogout(request, env);
        
      case "/api/sessions":
        return handleSessions(request, env);
        
      case "/api/users":
        return handleUsers(request, env);

      // OAuth callback for demo purposes
      case "/callback":
        return handleOAuthCallback(request, env);

      // Default: handle OpenAuth routes
      default:
        return handleOpenAuth(request, env, ctx);
    }
  },
} satisfies ExportedHandler<Env>;

async function handleHomePage(request: Request, env: Env): Promise<Response> {
  return new Response(getHomePage(), {
    headers: { "Content-Type": "text/html" }
  });
}

async function handleDashboard(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env, UserRole.USER);
  
  if (authResult instanceof Response) {
    // Redirect to home page if not authenticated
    return Response.redirect(new URL("/", request.url).toString());
  }

  return new Response(getDashboard(authResult.user), {
    headers: { "Content-Type": "text/html" }
  });
}

async function handleProfile(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env, UserRole.USER);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  // Simple profile page
  const content = `
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
      <div class="bg-white shadow rounded-lg p-6">
        <form class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value="${authResult.user.email}" 
                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" readonly>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Role</label>
            <input type="text" value="${authResult.user.role}" 
                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" readonly>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Member Since</label>
            <input type="text" value="${new Date(authResult.user.createdAt).toLocaleDateString()}" 
                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" readonly>
          </div>
        </form>
      </div>
    </div>
  `;

  return new Response(getBaseTemplate('Profile', content, authResult.user), {
    headers: { "Content-Type": "text/html" }
  });
}

async function handleAdmin(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env, UserRole.ADMIN);
  
  if (authResult instanceof Response) {
    return new Response(getUnauthorizedPage(), {
      headers: { "Content-Type": "text/html" }
    });
  }

  // Admin panel - list all users
  const users = await env.AUTH_DB.prepare(`
    SELECT id, email, role, first_name, last_name, created_at, last_login, is_active
    FROM user 
    ORDER BY created_at DESC
  `).all();

  const content = `
    <div class="px-4 sm:px-6 lg:px-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>
      
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Users</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${users.results.map((user: any) => `
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${user.email}</div>
                    ${user.first_name ? `<div class="text-sm text-gray-500">${user.first_name} ${user.last_name || ''}</div>` : ''}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                      ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                        user.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}">
                      ${user.role}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                      ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                      ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return new Response(getBaseTemplate('Admin Panel', content, authResult.user), {
    headers: { "Content-Type": "text/html" }
  });
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const token = getSessionToken(request);
  if (token) {
    await deleteSession(env, token);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}

async function handleSessions(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env, UserRole.USER);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  if (request.method === "GET") {
    // Get user's sessions
    const sessions = await env.AUTH_DB.prepare(`
      SELECT id, token, expires_at, created_at
      FROM user_sessions 
      WHERE user_id = ? AND expires_at > datetime('now')
      ORDER BY created_at DESC
    `).bind(authResult.user.id).all();

    return new Response(JSON.stringify(sessions.results), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
}

async function handleUsers(request: Request, env: Env): Promise<Response> {
  const authResult = await requireAuth(request, env, UserRole.ADMIN);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  if (request.method === "GET") {
    const users = await env.AUTH_DB.prepare(`
      SELECT id, email, role, first_name, last_name, created_at, last_login, is_active
      FROM user 
      ORDER BY created_at DESC
    `).all();

    return new Response(JSON.stringify(users.results), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
}

async function handleOAuthCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  
  if (!code) {
    return Response.json({
      error: "No authorization code provided",
      params: Object.fromEntries(url.searchParams.entries()),
    });
  }

  // In a real implementation, you would exchange the code for tokens here
  // For demo purposes, we'll create a mock session
  const userEmail = "demo@example.com";
  const userId = await getOrCreateUser(env, userEmail);
  const sessionToken = await createSession(env, userId);

  // Redirect to dashboard with session token
  const dashboardUrl = new URL("/dashboard", request.url);
  dashboardUrl.searchParams.set("token", sessionToken);
  
  return Response.redirect(dashboardUrl.toString());
}

async function handleOpenAuth(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  return issuer({
    storage: CloudflareStorage({
      namespace: env.AUTH_STORAGE,
    }),
    subjects,
    providers: {
      password: PasswordProvider(
        PasswordUI({
          // eslint-disable-next-line @typescript-eslint/require-await
          sendCode: async (email, code) => {
            // This is where you would email the verification code to the
            // user, e.g. using Resend:
            // https://resend.com/docs/send-with-cloudflare-workers
            console.log(`Sending code ${code} to ${email}`);
          },
          copy: {
            input_code: "Code (check Worker logs)",
          },
        }),
      ),
    },
    theme: {
      title: "myAuth",
      primary: "#0051c3",
      favicon: "https://workers.cloudflare.com//favicon.ico",
      logo: {
        dark: "https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/db1e5c92-d3a6-4ea9-3e72-155844211f00/public",
        light:
          "https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/fa5a3023-7da9-466b-98a7-4ce01ee6c700/public",
      },
    },
    success: async (ctx, value) => {
      const userId = await getOrCreateUser(env, value.email);
      const sessionToken = await createSession(env, userId);
      
      // Get user details for the subject
      const user = await env.AUTH_DB.prepare(`
        SELECT id, email, role, first_name, last_name 
        FROM user WHERE id = ?
      `).bind(userId).first<any>();

      return ctx.subject("user", {
        id: user.id,
        email: user.email,
        role: user.role || UserRole.USER,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
      });
    },
  }).fetch(request, env, ctx);
}

async function getOrCreateUser(env: Env, email: string): Promise<string> {
  // Use the enhanced admin-aware user creation function
  return await ensureAdminUser(env, email);
}

async function handleSetup(request: Request, env: Env): Promise<Response> {
  return new Response(getAdminSetupPage(), {
    headers: { "Content-Type": "text/html" }
  });
}
