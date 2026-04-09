import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { clearAllAppCaches } from './clearAllCaches';

/**
 * Decode a JWT payload without verification (client-side expiry check only).
 * Returns null if the token is malformed.
 */
function decodeTokenPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Returns true when the JWT has an `exp` claim that is still in the future.
 * If the token cannot be decoded we treat it as invalid.
 */
function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeTokenPayload(token);
  if (!payload || !payload.exp) return false;
  // exp is in seconds, Date.now() in ms
  return payload.exp * 1000 > Date.now();
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if token exists in localStorage AND is not expired
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser && isTokenValid(savedToken)) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else if (savedToken) {
      // Token exists but is expired/invalid — clean up
      console.warn('[useAuth] Token expired or invalid, clearing session');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      clearAllAppCaches();
    }

    setLoading(false);
  }, []);

  const login = async (newToken, newUser) => {
    // Clear all stale caches before establishing the new session
    await clearAllAppCaches();
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    await clearAllAppCaches();
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const isAuthenticated = !!token && !!user;

  const isAdmin = user?.role === 'admin';
  const isSubAdmin = user?.role === 'sub-admin' || isAdmin;
  const isManager = user?.role === 'manager' || isSubAdmin;
  const isStaff = user?.role === 'staff' || isManager;

  const hasPermission = (section) => {
    if (isAdmin) return true;
    const permissions = user?.permissions || [];
    // Direct match
    if (permissions.includes(section)) return true;
    // If checking a child (e.g. "manage.products"), also check parent ("manage")
    const dot = section.indexOf(".");
    if (dot > 0) {
      const parent = section.substring(0, dot);
      return permissions.includes(parent);
    }
    return false;
  };

  // Find the first accessible page for this user
  const getFirstAccessiblePage = () => {
    if (isAdmin) return "/";
    const permissions = user?.permissions || [];
    if (permissions.includes("dashboard")) return "/";

    // Ordered list of pages to try
    const pageMap = [
      { perm: "manage.products", path: "/manage/products" },
      { perm: "manage", path: "/manage/products" },
      { perm: "stock.management", path: "/stock/management" },
      { perm: "stock", path: "/stock/management" },
      { perm: "reporting.sales-report", path: "/reporting/reporting" },
      { perm: "reporting", path: "/reporting/reporting" },
      { perm: "expenses.entry", path: "/expenses/expenses" },
      { perm: "expenses", path: "/expenses/expenses" },
      { perm: "setup.company", path: "/setup/setup" },
      { perm: "setup", path: "/setup/setup" },
      { perm: "support", path: "/support" },
    ];
    for (const { perm, path } of pageMap) {
      if (permissions.includes(perm)) return path;
    }
    return "/support"; // fallback
  };

  return {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    isSubAdmin,
    isManager,
    isStaff,
    hasPermission,
    getFirstAccessiblePage,
    login,
    logout,
  };
}

export function useProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  return { loading, isAuthenticated };
}
