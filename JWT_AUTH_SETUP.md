# JWT Authentication System - Implementation Guide

## Overview

NextAuth has been replaced with a custom JWT-based authentication system with role-based access control (RBAC).

## Features

✅ **JWT Token-based Authentication** - Stateless authentication with signed tokens  
✅ **Role-Based Access Control** - 4 roles: admin, manager, staff, viewer  
✅ **Login/Register Pages** - Custom authentication pages  
✅ **Automatic Token Management** - Token stored in localStorage  
✅ **Protected Routes** - Layout automatically redirects unauthenticated users  
✅ **API Route Protection** - Middleware for securing API endpoints  

## Architecture

### File Structure

```
lib/
├── jwt.js                      # Token creation and verification
├── auth-middleware.js          # Role-based middleware for API routes
├── useAuth.js                  # React hook for auth state
├── api-client.js              # Axios instance with auth headers

pages/
├── login.js                    # Login page
├── register.js                 # Registration page
├── api/auth/
│   ├── login.js               # Login endpoint
│   ├── register.js            # Registration endpoint
│   └── protected-example.js    # Example protected endpoint

components/
├── Layout.js                   # Updated to use JWT auth
└── NavBar.js                   # Shows user info, logout button
```

## Roles & Permissions

```javascript
ROLES: {
  ADMIN:   4  // Full access (can access everything)
  MANAGER: 3  // Can manage staff, reports, etc.
  STAFF:   2  // Can use system features
  VIEWER:  1  // Read-only access
}
```

## How to Use

### 1. **Login**

```javascript
// pages/login.js already configured
// POST /api/auth/login with { email, password }
// Returns: { token, user: { id, email, name, role } }
```

### 2. **Register**

```javascript
// pages/register.js already configured
// POST /api/auth/register with { email, password, name }
```

### 3. **Using Auth Hook in Components**

```javascript
import { useAuth } from '@/lib/useAuth';

export default function MyComponent() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  if (!isAuthenticated) return <p>Not logged in</p>;

  return (
    <div>
      <p>Welcome, {user.name}</p>
      {isAdmin && <p>You are an admin</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 4. **Protecting API Endpoints**

```javascript
import { authMiddleware, requireRole } from '@/lib/auth-middleware';
import { ROLES } from '@/lib/auth-middleware';

// Example 1: Require authentication only
export default async function handler(req, res) {
  const authError = authMiddleware(req, res);
  if (authError) return authError;

  // req.user is now available: { id, email, name, role }
  return res.status(200).json({ user: req.user });
}

// Example 2: Require specific role
export default async function handler(req, res) {
  const roleError = requireRole(ROLES.ADMIN)(req, res);
  if (roleError) return roleError;

  // Only admins can reach here
  return res.status(200).json({ message: 'Admin only' });
}

// Example 3: Multiple roles allowed
export default async function handler(req, res) {
  const roleError = requireRole(ROLES.ADMIN, ROLES.MANAGER)(req, res);
  if (roleError) return roleError;

  // Admins and managers can reach here
  return res.status(200).json({ message: 'Authorized' });
}
```

### 5. **Using API Client with Auto Auth**

```javascript
import { apiClient } from '@/lib/api-client';

// The token is automatically included in requests
const response = await apiClient.post('/api/staff', {
  name: 'John Doe',
  // ...
});
```

## Key Changes from NextAuth

| Feature | NextAuth | JWT System |
|---------|----------|-----------|
| **Login** | Google OAuth | Email/Password |
| **Token Storage** | Session cookie | localStorage |
| **Token Type** | Session | JWT |
| **API Protection** | `getServerSession()` | `authMiddleware()` |
| **Role Check** | Custom callback | `requireRole()` |
| **Dependencies** | next-auth, adapters | jsonwebtoken |

## Environment Variables

Update `.env`:

```env
JWT_SECRET=zW4pj5YQWzMv1DlO/kB6hz5IHpQ2p8Aa8k42FDtqNH8=
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

## Testing

### 1. **Test Registration**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. **Test Login**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "staff"
  }
}
```

### 3. **Test Protected Endpoint**

```bash
curl -X GET http://localhost:3000/api/protected-example \
  -H "Authorization: Bearer <token_from_login>"
```

## Workflow

1. **User visits app** → Redirected to `/login` (if not authenticated)
2. **User enters credentials** → POST to `/api/auth/login`
3. **Token received** → Stored in localStorage
4. **Token added to requests** → Axios interceptor adds `Authorization: Bearer <token>`
5. **API validates token** → `authMiddleware()` verifies JWT
6. **User logged in** → Can access protected pages and endpoints
7. **Token expires** → Auto-redirect to login on 401 response

## Next Steps

1. ✅ **Setup complete** - JWT system ready to use
2. **Update existing API routes** - Add `authMiddleware` to protected endpoints
3. **Update forms** - Use `apiClient` instead of `axios` for auto auth
4. **Test role-based access** - Create test users with different roles
5. **Remove NextAuth references** - Delete remaining NextAuth imports from pages

## Troubleshooting

### "Missing authentication token"
- Check that token is being sent: `Authorization: Bearer <token>`
- Verify token is stored in localStorage
- Check Network tab in DevTools

### "Invalid or expired token"
- Token may have expired (default 24h)
- User needs to login again
- Check JWT_SECRET matches between login.js and jwt.js

### API returns 401
- Endpoint is protected and token is invalid/missing
- Automatically redirects to login (see api-client.js)

## Security Notes

- JWT_SECRET should be strong and kept in `.env` (not committed to git)
- Tokens stored in localStorage are vulnerable to XSS attacks
  - For production, consider using httpOnly cookies
  - Implement CSRF protection if using cookies
- Always validate role on the backend, never trust client-side checks
- Consider token refresh strategy for longer sessions

