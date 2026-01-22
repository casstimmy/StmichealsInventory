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
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  // 🧠 APP SHELL
  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col">
      {/* Top Navigation Bar - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBar user={user} logout={logout} />
      </div>

      {/* Main Layout Container */}
      <div className="w-full flex flex-col md:flex-row pt-12 md:pt-20">
        {/* Desktop Navigation - Fixed Sidebar */}
        <Nav className="hidden md:block fixed md:relative top-12 left-0 h-screen md:h-auto w-20 md:w-[5rem] bg-inherit z-40 md:z-10" />

        {/* Main Content Area */}
        <div className="w-full flex-1 overflow-hidden">
          <div className="w-full h-full min-h-[calc(100vh-48px)] md:min-h-[calc(100vh-80px)] px-2 sm:px-3 md:px-4 lg:px-6 py-3 md:py-6 bg-slate-100 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Menu Button - Handled by Nav component */}
    </div>
  );
}
