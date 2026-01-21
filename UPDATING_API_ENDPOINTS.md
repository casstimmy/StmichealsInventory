# How to Update Existing API Endpoints to Use JWT Auth

## Pattern 1: Require Authentication Only

```javascript
// Before (NextAuth)
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // ... rest of handler
}

// After (JWT)
import { authMiddleware } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  const error = authMiddleware(req, res);
  if (error) return error;
  
  // req.user is now available: { id, email, name, role }
  // ... rest of handler
}
```

## Pattern 2: Require Specific Role

```javascript
// Before (NextAuth)
export async function isAdminRequest(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !adminEmails.includes(session.user.email)) {
    return res.status(401).json({ error: "Not an admin" });
  }
}

// After (JWT)
import { requireRole, ROLES } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  const error = requireRole(ROLES.ADMIN)(req, res);
  if (error) return error;
  
  // Only admins reach here
  // ... rest of handler
}
```

## Pattern 3: Multiple Roles Allowed

```javascript
import { requireRole, ROLES } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  // Allow both admins and managers
  const error = requireRole(ROLES.ADMIN, ROLES.MANAGER)(req, res);
  if (error) return error;
  
  // ... rest of handler
}
```

## Example Updates for Your App

### 1. `/api/staff/index.js` (Staff Management)

```javascript
// ✅ Add at the top
import { authMiddleware } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  // ✅ Add authentication check
  const error = authMiddleware(req, res);
  if (error) return error;

  if (req.method === 'GET') {
    // ... existing code
  } else if (req.method === 'POST') {
    // ... existing code
  }
}
```

### 2. `/api/staff/[id].js` (Update/Delete Staff)

```javascript
import { authMiddleware } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  const error = authMiddleware(req, res);
  if (error) return error;

  const { id } = req.query;

  if (req.method === 'PUT') {
    // ... existing code
  } else if (req.method === 'DELETE') {
    // ... existing code
  }
}
```

### 3. `/api/salary-mail.js` (Email Sending)

```javascript
import { authMiddleware } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  const error = authMiddleware(req, res);
  if (error) return error;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ... existing code
}
```

### 4. `/api/categories.js` (Admin Only)

```javascript
import { requireRole, ROLES } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  // Only admins can manage categories
  const error = requireRole(ROLES.ADMIN)(req, res);
  if (error) return error;

  // ... existing code
}
```

## Using User Info in API Handlers

```javascript
import { authMiddleware } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  const error = authMiddleware(req, res);
  if (error) return error;

  // Access user information
  const { id, email, name, role } = req.user;

  // Log who is accessing
  console.log(`User ${name} (${email}) with role ${role} accessed this endpoint`);

  // Create records with user reference
  const newRecord = await Model.create({
    createdBy: id,
    // ... other fields
  });

  res.status(200).json(newRecord);
}
```

## Frontend: Updating API Calls

### Before (Manual headers)
```javascript
const res = await axios.post('/api/staff', data, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### After (Auto-injected)
```javascript
// Just use apiClient - token added automatically
import { apiClient } from '@/lib/api-client';

const res = await apiClient.post('/api/staff', data);
// Token already included in headers!
```

## Checking User Role in Frontend

```javascript
import { useAuth } from '@/lib/useAuth';

export default function MyComponent() {
  const { user, isAdmin, isManager, isStaff, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <p>Please login</p>;

  return (
    <div>
      <p>Welcome, {user.name}</p>
      
      {isAdmin && (
        <button>Admin Actions</button>
      )}
      
      {isManager && (
        <button>Manager Actions</button>
      )}
      
      {isStaff && (
        <p>You have staff access</p>
      )}
    </div>
  );
}
```

## Common Patterns

### Pattern: Only allow own record edit

```javascript
import { authMiddleware } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  const error = authMiddleware(req, res);
  if (error) return error;

  const { id } = req.query;
  const { id: userId } = req.user;

  // Only the owner can edit their own record
  if (userId !== id) {
    return res.status(403).json({ error: 'Cannot edit other users' });
  }

  // ... rest of handler
}
```

### Pattern: Log audit trail

```javascript
import { authMiddleware } from '@/lib/auth-middleware';
import AuditLog from '@/models/AuditLog';

export default async function handler(req, res) {
  const error = authMiddleware(req, res);
  if (error) return error;

  // ... do action

  // Log who did what
  await AuditLog.create({
    userId: req.user.id,
    action: 'DELETE_STAFF',
    resourceId: id,
    timestamp: new Date(),
  });

  res.status(200).json({ success: true });
}
```

## Testing Protected Endpoints

```bash
# 1. Get token by logging in
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"pass123"}' \
  | jq -r '.token')

# 2. Use token to access protected endpoint
curl -X GET http://localhost:3000/api/staff \
  -H "Authorization: Bearer $TOKEN"

# 3. Try without token (should fail)
curl -X GET http://localhost:3000/api/staff
# Returns: { error: "Missing authentication token" }
```

## Endpoints That Need Updates

Based on your app, update these:

- [ ] `/api/staff/index.js` - Add authMiddleware
- [ ] `/api/staff/[id].js` - Add authMiddleware  
- [ ] `/api/staff/penalties.js` - Add authMiddleware
- [ ] `/api/salary-mail.js` - Add authMiddleware (already done)
- [ ] `/api/send-email.js` - Add authMiddleware
- [ ] `/api/categories.js` - Add requireRole for admin
- [ ] `/api/products/` - Add authMiddleware
- [ ] `/api/orders/` - Add authMiddleware
- [ ] `/api/expenses/` - Add authMiddleware
- [ ] All reporting endpoints - Add authMiddleware

## Migration Checklist

- [x] JWT system created and working
- [x] Login/register pages functional
- [x] Layout authentication check in place
- [x] API client with auto-token injection ready
- [ ] **TO DO**: Update existing API routes with authMiddleware
- [ ] **TO DO**: Test each endpoint with token
- [ ] **TO DO**: Remove NextAuth from pages/_app.js if exists
- [ ] **TO DO**: Delete /pages/api/auth/[...nextauth].js

---

**Next Step**: Start updating API routes one by one, testing with the token from login endpoint.

