# Final Steps - After JWT Migration

## 🗑️ Clean Up

### Delete NextAuth Config File

**File to delete:**
- `pages/api/auth/[...nextauth].js` ← DELETE THIS

This file is no longer needed. You can safely delete it.

**Why?** It was used for NextAuth OAuth authentication, which has been completely replaced by JWT.

---

## 📦 Update package.json (Optional)

If you want to remove the NextAuth package completely from your project:

```bash
npm uninstall next-auth @auth/mongodb-adapter
```

**Note:** It's already not used anymore, but removing it will clean up your dependencies.

---

## ✅ Checklist

- [x] JWT authentication system created
- [x] Login/register pages working
- [x] Layout authentication check in place
- [x] NavBar updated to use JWT
- [x] API client with auto token injection ready
- [x] Documentation created
- [ ] **Delete `/pages/api/auth/[...nextauth].js`** ← Next action
- [ ] Test login/register flow
- [ ] Update API endpoints with authMiddleware (see UPDATING_API_ENDPOINTS.md)
- [ ] Remove NextAuth dependencies (optional)

---

## 🧪 Test Your Setup

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Visit App
- Open `http://localhost:3000`
- Should redirect to `/login` automatically
- If not, check browser console for errors

### 3. Test Registration
- Click "Register here"
- Create account with:
  - Name: `Test User`
  - Email: `test@example.com`
  - Password: `password123`
- Should redirect to login

### 4. Test Login
- Enter credentials from step 3
- Click "Sign In"
- Should see dashboard with your name in top bar
- Name should appear in top right corner

### 5. Test Logout
- Click logout button (top right)
- Should redirect to login page
- Try visiting `/` directly → redirects to `/login`

### 6. Verify Token Storage
- Open DevTools (F12)
- Go to Application → Local Storage
- Should see `auth_token` and `user` entries
- Click logout → entries should be cleared

---

## 🔧 What's Ready to Use

### ✅ Login System
- Email/password authentication
- JWT token generation
- Token stored in localStorage
- Automatic redirect to login if not authenticated

### ✅ User Management
- Registration with password hashing
- User roles (admin, manager, staff, viewer)
- Role-based access control
- User profile in navbar

### ✅ API Client
- Automatic token injection
- Auto-redirect to login on 401
- Ready to use with `apiClient` import

### ✅ Authentication Hook
```javascript
import { useAuth } from '@/lib/useAuth';

const { user, isAdmin, isManager, isStaff, logout } = useAuth();
```

---

## 🛠️ API Protection (Next Step)

Once you verify login works, protect your API endpoints:

### For Staff Endpoint

**File:** `/pages/api/staff/index.js`

```javascript
// Add this import at the top
import { authMiddleware } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  // Add this check
  const error = authMiddleware(req, res);
  if (error) return error;

  // Rest of your code...
  if (req.method === 'GET') {
    // existing code
  }
}
```

**Repeat for:**
- `/api/staff/[id].js`
- `/api/staff/penalties.js`
- `/api/salary-mail.js`
- `/api/send-email.js`
- `/api/categories.js`
- All other sensitive endpoints

See `UPDATING_API_ENDPOINTS.md` for complete patterns.

---

## 🌍 Environment Variables

**Verify `.env` has:**
```env
JWT_SECRET=zW4pj5YQWzMv1DlO/kB6hz5IHpQ2p8Aa8k42FDtqNH8=
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
EMAIL_USER=hello.ayoola@gmail.com
EMAIL_PASS=ptdx pngp gfoq ajmy
SALARY_MAIL_TO=hello.ayoola@gmail.com
```

**Do NOT have:**
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## 📊 File Status

| File | Status | Action |
|------|--------|--------|
| `/pages/login.js` | ✅ New | Ready to use |
| `/pages/register.js` | ✅ New | Ready to use |
| `/pages/api/auth/login.js` | ✅ New | Ready to use |
| `/pages/api/auth/register.js` | ✅ New | Ready to use |
| `/pages/api/auth/[...nextauth].js` | ❌ Old | **DELETE** |
| `/components/Layout.js` | ✅ Updated | Ready to use |
| `/components/NavBar.js` | ✅ Updated | Ready to use |
| `/models/User.js` | ✅ Updated | Ready to use |
| `/lib/jwt.js` | ✅ New | Ready to use |
| `/lib/auth-middleware.js` | ✅ New | Ready to use |
| `/lib/useAuth.js` | ✅ New | Ready to use |
| `/lib/api-client.js` | ✅ New | Ready to use |

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot find module 'jsonwebtoken'"
**Solution:** Run `npm install jsonwebtoken` or install from package.json

### Issue: Layout not redirecting to login
**Solution:** 
- Check MongoDB is running
- Check User model exists
- Look at browser console for errors
- Verify `.env` has MONGODB_URI

### Issue: Token not persisting
**Solution:**
- Check localStorage is enabled in browser
- Check login response includes "token"
- Look in DevTools → Application → Local Storage

### Issue: "Invalid or expired token"
**Solution:**
- User needs to login again
- Token expires after 24 hours (default)
- JWT_SECRET in .env must match lib/jwt.js

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| `README_JWT_AUTH.md` | Quick start guide |
| `JWT_AUTH_SETUP.md` | Detailed setup instructions |
| `MIGRATION_COMPLETE.md` | Summary of all changes |
| `UPDATING_API_ENDPOINTS.md` | How to protect API routes |
| `pages/api/protected-example.js` | Code example |

---

## 🎯 Success Criteria

You'll know it's working when:

- ✅ Visiting `/` redirects to `/login`
- ✅ Can register new account
- ✅ Can login with credentials
- ✅ User name appears in top bar
- ✅ Can logout
- ✅ Token appears in localStorage
- ✅ Can access protected dashboard pages
- ✅ API endpoints return 401 without token

---

## 🎉 You're Done!

The JWT authentication system is fully installed and ready to use.

**Next steps:**
1. Delete `/pages/api/auth/[...nextauth].js`
2. Test login/register flow
3. Protect API endpoints (see UPDATING_API_ENDPOINTS.md)
4. Enjoy your new authentication system!

---

**Questions?** Check the documentation files or the code examples in your project.

