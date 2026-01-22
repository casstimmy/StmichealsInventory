import { Inter } from "next/font/google";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/useAuth";
import Nav from "@/components/Nav";
import NavBar from "@/components/NavBar";
import Loader from "@/components/Loader";

const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children, title = "Dashboard" }) {
  const router = useRouter();
  const { user, token, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  // 🔐 REDIRECT TO LOGIN IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return null;
  }

  // 🧠 APP SHELL
  return (
    <div className="bg-gray-50 min-h-screen w-full flex flex-row">
      {/* Sidebar Navigation */}
      <Nav />

      {/* Main Content Area - Navbar + Page Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-40 w-full">
          <NavBar user={user} logout={logout} />
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          <div className="w-full h-full px-3 md:px-6 bg-gray-50 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
