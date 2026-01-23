// Layout.js
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
  const { user, token, loading, isAuthenticated, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return null;
  }

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col">
      {/* Top Nav */}
      <div
        className="fixed top-0 left-0 right-0 z-50 w-full"
        style={{ left: sidebarCollapsed ? 0 : "5rem" }} // adjusts based on sidebar
      >
        <NavBar user={user} logout={logout} />
      </div>

      {/* Main Layout */}
      <div className="w-full flex pt-12 md:pt-16">
        <Nav
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          className={`fixed top-16 left-0 h-screen transition-all duration-300 z-40 ${
            sidebarCollapsed ? "w-16" : "w-20"
          }`}
        />

        {/* Content */}
        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? "ml-16" : "ml-20"
          } min-h-screen`}
        >
          <div className="w-full min-h-[calc(100vh-64px)] sm:px-3 bg-slate-100 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
