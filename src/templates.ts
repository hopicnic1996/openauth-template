import { User } from './auth';

export function getBaseTemplate(title: string, content: string, user?: User): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - myAuth</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="icon" href="https://workers.cloudflare.com//favicon.ico">
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #0051c3 0%, #004ba0 100%);
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <nav class="gradient-bg shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <img src="https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/fa5a3023-7da9-466b-98a7-4ce01ee6c700/public" 
                         alt="myAuth" class="h-8 w-auto">
                    <span class="ml-3 text-white text-xl font-bold">myAuth</span>
                </div>
                ${user ? `
                <div class="flex items-center space-x-4">
                    <span class="text-white">Welcome, ${user.firstName || user.email}</span>
                    <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        ${user.role.toUpperCase()}
                    </span>
                    <button onclick="logout()" 
                            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                        Logout
                    </button>
                </div>
                ` : `
                <div class="flex items-center">
                    <a href="/authorize" 
                       class="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                        Sign In
                    </a>
                </div>
                `}
            </div>
        </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        ${content}
    </main>

    <script>
        // Set up the Get Started button href
        document.addEventListener('DOMContentLoaded', function() {
            const getStartedBtn = document.getElementById('get-started-btn');
            if (getStartedBtn) {
                const redirectUri = encodeURIComponent(location.origin + '/dashboard');
                getStartedBtn.href = '/authorize?redirect_uri=' + redirectUri + '&client_id=your-client-id&response_type=code';
            }
        });

        function logout() {
            const token = localStorage.getItem('auth_token') || new URLSearchParams(location.search).get('token');
            if (token) {
                fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    }
                }).then(() => {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/';
                });
            } else {
                window.location.href = '/';
            }
        }

        // Store token in localStorage if provided in URL
        const urlToken = new URLSearchParams(location.search).get('token');
        if (urlToken) {
            localStorage.setItem('auth_token', urlToken);
            // Clean URL without token
            const cleanUrl = location.pathname;
            history.replaceState({}, document.title, cleanUrl);
        }
    </script>
</body>
</html>
  `;
}

export function getHomePage(): string {
  const content = `
    <div class="text-center">
        <div class="max-w-3xl mx-auto">
            <h1 class="text-4xl font-bold text-gray-900 sm:text-6xl">
                Welcome to myAuth
            </h1>
            <p class="mt-6 text-lg leading-8 text-gray-600">
                A secure authentication and authorization system built with OpenAuth and Cloudflare Workers.
                Sign in to access your personalized dashboard and manage your account.
            </p>
            <div class="mt-10 flex items-center justify-center gap-x-6">
                <a id="get-started-btn"
                   class="gradient-bg px-8 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-lg transition-colors">
                    Get Started
                </a>
                <a href="#features" class="text-lg font-semibold leading-6 text-gray-900">
                    Learn more <span aria-hidden="true">→</span>
                </a>
            </div>
        </div>
    </div>

    <div id="features" class="py-24 sm:py-32">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div class="mx-auto max-w-2xl lg:text-center">
                <h2 class="text-base font-semibold leading-7 text-blue-600">Secure Authentication</h2>
                <p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Everything you need for modern auth
                </p>
            </div>
            <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                    <div class="flex flex-col">
                        <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                            <div class="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600">
                                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            Secure Authentication
                        </dt>
                        <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                            <p class="flex-auto">Email-based authentication with secure verification codes. No passwords to remember or manage.</p>
                        </dd>
                    </div>
                    <div class="flex flex-col">
                        <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                            <div class="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600">
                                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                            </div>
                            Role-Based Access
                        </dt>
                        <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                            <p class="flex-auto">Advanced authorization with user roles and permissions. Control access to different parts of your application.</p>
                        </dd>
                    </div>
                    <div class="flex flex-col">
                        <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                            <div class="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-600">
                                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                            </div>
                            Lightning Fast
                        </dt>
                        <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                            <p class="flex-auto">Built on Cloudflare Workers for global edge deployment and sub-100ms response times worldwide.</p>
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    </div>
  `;

  return getBaseTemplate('Home', content);
}

export function getDashboard(user: User): string {
  const content = `
    <div class="px-4 sm:px-6 lg:px-8">
        <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
                <h1 class="text-2xl font-semibold leading-6 text-gray-900">Dashboard</h1>
                <p class="mt-2 text-sm text-gray-700">
                    Welcome back, ${user.firstName || user.email}! Here's an overview of your account.
                </p>
            </div>
        </div>

        <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <!-- Profile Card -->
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Profile</dt>
                                <dd class="text-lg font-medium text-gray-900">${user.email}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-5 py-3">
                    <div class="text-sm">
                        <a href="/profile" class="font-medium text-blue-700 hover:text-blue-900">
                            Edit profile
                        </a>
                    </div>
                </div>
            </div>

            <!-- Role Card -->
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                                <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Role</dt>
                                <dd class="text-lg font-medium text-gray-900 capitalize">${user.role}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-5 py-3">
                    <div class="text-sm">
                        <span class="text-gray-500">Access level: ${user.role.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <!-- Activity Card -->
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center">
                                <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">Last Login</dt>
                                <dd class="text-lg font-medium text-gray-900">
                                    ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Just now'}
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <a href="/profile" 
                   class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="absolute inset-0" aria-hidden="true"></span>
                        <p class="text-sm font-medium text-gray-900">Edit Profile</p>
                        <p class="text-sm text-gray-500">Update your information</p>
                    </div>
                </a>

                <a href="/api/sessions" 
                   class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="absolute inset-0" aria-hidden="true"></span>
                        <p class="text-sm font-medium text-gray-900">View Sessions</p>
                        <p class="text-sm text-gray-500">Manage active sessions</p>
                    </div>
                </a>

                ${user.role === 'admin' ? `
                <a href="/admin" 
                   class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="absolute inset-0" aria-hidden="true"></span>
                        <p class="text-sm font-medium text-gray-900">Admin Panel</p>
                        <p class="text-sm text-gray-500">Manage users and settings</p>
                    </div>
                </a>
                ` : ''}

                <button onclick="logout()"
                        class="relative rounded-lg border border-red-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-red-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500">
                    <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-red-900">Sign Out</p>
                        <p class="text-sm text-red-500">End your session</p>
                    </div>
                </button>
            </div>
        </div>
    </div>
  `;

  return getBaseTemplate('Dashboard', content, user);
}

export function getUnauthorizedPage(): string {
  const content = `
    <div class="text-center">
        <div class="max-w-md mx-auto">
            <div class="mx-auto h-12 w-12 text-red-400">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>
            <h1 class="mt-4 text-3xl font-bold tracking-tight text-gray-900">Access Denied</h1>
            <p class="mt-6 text-base leading-7 text-gray-600">
                You don't have permission to access this resource. Please contact an administrator if you believe this is an error.
            </p>
            <div class="mt-10 flex items-center justify-center gap-x-6">
                <a href="/dashboard" 
                   class="gradient-bg px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-lg">
                    Go to Dashboard
                </a>
                <a href="/" class="text-sm font-semibold text-gray-900">
                    Go Home <span aria-hidden="true">&rarr;</span>
                </a>
            </div>
        </div>
    </div>
  `;

  return getBaseTemplate('Access Denied', content);
} 