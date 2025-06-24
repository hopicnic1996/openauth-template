# Complete Authentication & Authorization System

A comprehensive authentication and authorization system built with OpenAuth and Cloudflare Workers, featuring role-based access control, session management, and a modern web interface.

## Features

### 🔐 Authentication
- **Passwordless authentication** with email verification codes
- **Secure session management** with JWT-like tokens
- **Automatic session cleanup** for expired sessions
- **Multi-device support** with session tracking

### 👥 Authorization
- **Role-based access control** (User, Moderator, Admin)
- **Hierarchical permissions** system
- **Protected routes** with middleware
- **API endpoint protection**

### 🎨 User Interface
- **Modern, responsive design** with Tailwind CSS
- **Professional landing page** with feature highlights
- **User dashboard** with profile overview
- **Admin panel** for user management
- **Profile management** pages

### 🚀 Infrastructure
- **Cloudflare Workers** for global edge deployment
- **Cloudflare D1** for SQLite database
- **Cloudflare KV** for session storage
- **TypeScript** for type safety

## Project Structure

```
src/
├── index.ts        # Main application router and handlers
├── auth.ts         # Authentication & authorization utilities
└── templates.ts    # HTML templates and UI components

migrations/
├── 0001_create_user_table.sql    # Initial user table
└── 0002_enhance_user_table.sql   # Enhanced schema with roles and sessions
```

## Database Schema

### Users Table
- **id**: Unique identifier (UUID)
- **email**: User email (unique)
- **role**: User role (user, moderator, admin)
- **first_name**: Optional first name
- **last_name**: Optional last name
- **last_login**: Last login timestamp
- **is_active**: Account status
- **created_at**: Account creation date
- **updated_at**: Last update timestamp

### Sessions Table
- **id**: Session identifier
- **user_id**: Reference to user
- **token**: Session token (UUID)
- **expires_at**: Session expiration
- **created_at**: Session creation time

## API Endpoints

### Public Routes
- `GET /` - Landing page
- `GET /authorize` - OpenAuth login page
- `GET /callback` - OAuth callback handler

### Protected Routes
- `GET /dashboard` - User dashboard (requires USER role)
- `GET /profile` - Profile management (requires USER role)
- `GET /admin` - Admin panel (requires ADMIN role)

### API Routes
- `POST /api/logout` - End user session
- `GET /api/sessions` - List user sessions (requires USER role)
- `GET /api/users` - List all users (requires ADMIN role)

## User Roles & Permissions

### User (Level 1)
- Access to dashboard
- View own profile
- Manage own sessions

### Moderator (Level 2)
- All User permissions
- Extended moderation capabilities (extensible)

### Admin (Level 3)
- All Moderator permissions
- Access to admin panel
- View all users
- Manage user accounts

## Authentication Flow

1. **Landing Page**: User visits `/` and sees the welcome page
2. **Sign In**: User clicks "Get Started" → redirected to `/authorize`
3. **Email Verification**: User enters email and receives verification code
4. **Code Entry**: User enters code to complete authentication
5. **Session Creation**: System creates session token and user record
6. **Dashboard Redirect**: User redirected to `/dashboard` with session token
7. **Token Storage**: Frontend stores token in localStorage for subsequent requests

## Session Management

- **Token-based sessions** with 7-day expiration
- **Automatic cleanup** of expired sessions
- **Multiple device support** - users can have multiple active sessions
- **Secure token generation** using crypto.randomUUID()
- **Session validation** on every protected request

## Security Features

- **Role-based authorization** with hierarchical permissions
- **Session token validation** on protected routes
- **Automatic session expiration** and cleanup
- **HTTPS-only deployment** via Cloudflare Workers
- **XSS protection** with proper HTML escaping
- **CSRF protection** via token-based sessions

## Getting Started

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Installation
```bash
npm install
```

### Database Setup
```bash
# Apply migrations
wrangler d1 migrations apply AUTH_DB --local  # For development
wrangler d1 migrations apply AUTH_DB --remote # For production
```

### Development
```bash
npm run dev
```

### Deployment
```bash
npm run deploy
```

## Configuration

### Environment Variables
Configure in `wrangler.json`:
- `AUTH_STORAGE`: KV namespace for session storage
- `AUTH_DB`: D1 database for user data

### Email Provider
Update the `sendCode` function in `src/index.ts` to integrate with your email provider (e.g., Resend, SendGrid).

## Customization

### Adding New Roles
1. Add role to `UserRole` enum in `src/auth.ts`
2. Update role hierarchy in `hasRole` function
3. Add role-specific routes and permissions

### Styling
The UI uses Tailwind CSS with a custom blue gradient theme. Modify the CSS classes in `src/templates.ts` to match your brand.

### Email Templates
Customize the email verification code delivery in the `sendCode` function.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the OpenAuth documentation
- Review Cloudflare Workers documentation
- Open an issue in this repository
