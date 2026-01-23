import { Inter } from "next/font/google";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/useAuth";
import Nav from "@/components/Nav";
import NavBar from "@/components/NavBar";
import Loader from "@/components/Loader";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children, title = "Dashboard" }) {
  const router = useRouter();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [navExpanded, setNavExpanded] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined") router.push("/login");
    return null;
  }

  return (
    <div className="bg-slate-50 min-h-screen h-screen flex flex-col font-sans overflow-hidden">
      {/* Top Navbar - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-40 h-14 md:h-16">
        <NavBar user={user} logout={logout} />
      </div>

      {/* Main Layout Container */}
      <div className="flex w-full h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] pt-14 md:pt-16 overflow-hidden">
        {/* Collapsible Sidebar - Desktop only */}
        <Nav 
          isExpanded={navExpanded} 
          onToggle={() => setNavExpanded(!navExpanded)}
        />

        {/* Main Content Area - Flexible width */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 transition-all duration-300">
          <div className="w-full h-full px-4 sm:px-6 md:px-8 py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
