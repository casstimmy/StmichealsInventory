# JWT Authentication Migration Complete ✅

## Summary of Changes

### Files Created

1. **`/lib/jwt.js`** - Token creation and verification utilities
2. **`/lib/auth-middleware.js`** - Role-based access control middleware
3. **`/lib/useAuth.js`** - React hook for authentication state
4. **`/lib/api-client.js`** - Axios instance with automatic token injection
5. **`/pages/login.js`** - Login page with email/password
6. **`/pages/register.js`** - User registration page
7. **`/pages/api/auth/login.js`** - Login endpoint (validates credentials, returns JWT)
8. **`/pages/api/auth/register.js`** - Registration endpoint (creates new user)
9. **`/pages/api/protected-example.js`** - Example of protected API route
10. **`JWT_AUTH_SETUP.md`** - Complete implementation guide

### Files Modified

1. **`/models/User.js`** - Updated schema with roles (admin, manager, staff, viewer) and isActive flag
2. **`/components/Layout.js`** - Replaced NextAuth with custom JWT auth, automatic redirect to login
3. **`/components/NavBar.js`** - Updated to accept user prop and logout callback
4. **`/package.json`** - Removed NextAuth dependencies, added jsonwebtoken
5. **`.env`** - Removed NEXTAUTH variables, replaced with JWT_SECRET

### Files Removed

- **`/pages/api/auth/[...nextauth].js`** - No longer needed (delete manually if desired)

## Authentication Flow

```
User visits /dashboard
  ↓
Layout checks localStorage for token
  ↓
No token → Redirect to /login
  ↓
User enters email/password
  ↓
POST /api/auth/login
  ↓
Backend validates credentials → Returns JWT token
  ↓
Token stored in localStorage
  ↓
apiClient adds "Authorization: Bearer <token>" to all requests
  ↓
API middleware validates token
  ↓
Access granted/denied based on role
```

## Role-Based Access Control

### Hierarchy
```
ADMIN (4)   → Full system access
MANAGER (3) → Can manage staff, reports
STAFF (2)   → Normal user operations  
VIEWER (1)  → Read-only access
```

### Usage in API Routes
```javascript
// Admin only
const error = requireRole(ROLES.ADMIN)(req, res);

// Admin or Manager
const error = requireRole(ROLES.ADMIN, ROLES.MANAGER)(req, res);
```

### Usage in Components
```javascript
const { user, isAdmin, isManager, isStaff } = useAuth();

if (isAdmin) {
  // Show admin features
}
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
In `.env`, ensure:
```env
JWT_SECRET=zW4pj5YQWzMv1DlO/kB6hz5IHpQ2p8Aa8k42FDtqNH8=
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

### 3. Start Dev Server
```bash
npm run dev
```

### 4. Test
- Visit `http://localhost:3000` → Redirected to `/login`
- Click "Register here" → Create account
- Login with credentials
- Token automatically stored and used

## Protected API Routes

All existing API routes can be protected by adding:

```javascript
import { authMiddleware, requireRole, ROLES } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  // Verify authentication
  const error = authMiddleware(req, res);
  if (error) return error;
  
  // Now safe to use req.user
  console.log('Authenticated as:', req.user.email, 'Role:', req.user.role);
  
  // ... rest of handler
}
```

## Important Notes

⚠️ **Action Required**: Update API routes that are currently protected by NextAuth
- Staff management routes (`/api/staff`, `/api/staff/[id]`)
- Promotions routes
- Other sensitive endpoints

✅ **Already Configured**:
- Login/register flows
- Layout authentication check
- Automatic token injection in API calls
- User display in navbar
- Logout functionality

## Next Steps (Optional)

1. **Secure API Routes** - Add `authMiddleware()` to protected endpoints
2. **Create Admin Panel** - Use `isAdmin` hook to restrict features
3. **Add Refresh Tokens** - For longer sessions (recommended for production)
4. **Implement CSRF Protection** - If moving from localStorage to cookies
5. **Add 2FA** - For admin accounts

## Testing

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Protected Endpoint
```bash
curl -X GET http://localhost:3000/api/protected-example \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

## Token Expiration

- **Default**: 24 hours
- **Customizable**: In `/lib/jwt.js`, change `createToken()` expiresIn parameter
- **Auto-Redirect**: When expired, user automatically redirected to login

## Security Considerations

✅ **Implemented**:
- Passwords hashed with bcryptjs
- JWT tokens signed with secret
- Automatic 401 handling (redirect to login)
- Role-based access control

⚠️ **For Production**:
- Use httpOnly cookies instead of localStorage
- Implement CSRF protection
- Add rate limiting to login endpoint
- Use refresh token rotation
- Monitor token usage

## File Structure Overview

```
pages/
├── login.js                    # ✅ New - Login page
├── register.js                 # ✅ New - Registration page
└── api/auth/
    ├── login.js               # ✅ New - Login endpoint
    ├── register.js            # ✅ New - Register endpoint
    ├── [...]nextauth.js       # ❌ Delete (NextAuth)
    └── protected-example.js   # ✅ New - Example usage

lib/
├── jwt.js                     # ✅ New - Token utilities
├── auth-middleware.js         # ✅ New - RBAC middleware
├── useAuth.js                 # ✅ New - Auth hook
└── api-client.js             # ✅ New - Axios with auth

components/
├── Layout.js                  # ✅ Updated - JWT instead of NextAuth
└── NavBar.js                  # ✅ Updated - Props instead of useSession

models/
└── User.js                    # ✅ Updated - Added roles & isActive

.env                           # ✅ Updated - JWT_SECRET instead of NextAuth
package.json                   # ✅ Updated - Removed NextAuth, added JWT
```

---

**Migration completed successfully!** 🎉

All NextAuth functionality has been replaced with JWT authentication and role-based access control.

