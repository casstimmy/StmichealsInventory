import { Inter } from "next/font/google";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/useAuth";
import Nav from "@/components/Nav";
import NavBar from "@/components/NavBar";
import Loader from "@/components/Loader";
import { Shield } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

// Map route prefixes to required permission keys
const ROUTE_PERMISSIONS = {
  "/setup/users": "users",
  "/setup/assets": "assets",
  "/setup": "setup",
  "/manage/staff": "staff",
  "/manage": "manage",
  "/stock": "stock",
  "/reporting": "reporting",
  "/expenses": "expenses",
  "/support": "support",
};

function getRequiredPermission(pathname) {
  // Check most specific routes first (longer paths first)
  const sorted = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (pathname.startsWith(prefix)) {
      return ROUTE_PERMISSIONS[prefix];
    }
  }
  return null; // No permission required (home, etc.)
}

export default function Layout({ children, title = "Dashboard" }) {
  const router = useRouter();
  const { user, token, loading, isAuthenticated, isAdmin, hasPermission, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  //  REDIRECT TO LOGIN IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return null;
  }

  // CHECK PAGE PERMISSIONS
  const requiredPermission = getRequiredPermission(router.pathname);
  const hasAccess = !requiredPermission || isAdmin || hasPermission(requiredPermission);

  //  APP SHELL
  return (
    <div className="bg-gray-50 min-h-screen w-full flex flex-col">
      {/* Top Navigation Bar - Fixed */}
      <NavBar user={user} logout={logout} />

      {/* Main Layout Container */}
      <div className="w-full flex flex-col md:flex-row pt-14 md:pt-16 md:pl-20">
        {/* Desktop Navigation - Relative positioned sidebar */}
        <Nav className="hidden md:flex md:fixed md:top-16 md:left-0 md:w-20 md:h-screen md:z-40 md:flex-col" />

        {/* Main Content Area */}
        <div className="w-full flex-1 overflow-hidden">
          <div
            className="w-full min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-64px)] px-3 md:px-6 bg-gray-50 overflow-y-auto"
          >
            {hasAccess ? children : (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <Shield className="mx-auto mb-4 text-red-400" size={48} />
                  <h2 className="text-xl font-bold text-gray-700">Access Denied</h2>
                  <p className="text-gray-500 mt-2">You don&apos;t have permission to access this page.</p>
                  <button onClick={() => router.push("/")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Go to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Button - Handled by Nav component */}
    </div>
  );
}
