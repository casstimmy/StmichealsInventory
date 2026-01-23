import { Inter } from "next/font/google";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/useAuth";
import Sidebar from "@/components/Nav";
import TopBar from "@/components/NavBar";
import Loader from "@/components/Loader";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children }) {
  const router = useRouter();
  const { user, loading, isAuthenticated, logout } = useAuth();

  // State for sidebar and submenu width
  const [sidebarWidth, setSidebarWidth] = useState(80); // collapsed width
  const [submenuWidth, setSubmenuWidth] = useState(0); // width of opened submenu

  const totalLeftWidth = sidebarWidth + submenuWidth;

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
    <div className="bg-slate-50 min-h-screen w-full flex flex-col">
      {/* Top Navigation */}
      <div
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ marginLeft: totalLeftWidth }}
      >
        <TopBar user={user} logout={logout} />
      </div>

      {/* Main layout */}
      <div className="flex flex-1 pt-12 md:pt-16">
        {/* Sidebar */}
        <Sidebar
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
          submenuWidth={submenuWidth}
          setSubmenuWidth={setSubmenuWidth}
        />

        {/* Main content */}
        <div
          className="flex-1 overflow-auto transition-all duration-300 bg-slate-100"
          style={{ marginLeft: totalLeftWidth }}
        >
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
