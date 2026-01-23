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
    <div className="bg-slate-50 min-h-screen w-screen h-screen flex flex-col font-sans overflow-hidden">
      {/* Top Navbar - Full width on mobile, with sidebar offset on desktop */}
      <div className="fixed top-0 left-0 right-0 z-50 md:left-20 transition-all duration-300">
        <NavBar user={user} logout={logout} />
      </div>

      {/* Main Layout */}
      <div className="flex w-screen h-[calc(100vh-4rem)] pt-16 overflow-hidden">
        {/* Sidebar - Hidden on mobile, visible on md+ */}
        <div className="hidden md:block">
          <Nav />
        </div>

        {/* Main Content - Same width calculation as navbar */}
        <main className="w-full md:flex-1 transition-all duration-300 overflow-x-hidden overflow-y-auto">
          <div className="w-full min-h-full px-2 sm:px-3 md:px-4 bg-slate-100">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
