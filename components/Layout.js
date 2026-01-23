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

  //  REDIRECT TO LOGIN IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  //  APP SHELL
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col md:flex-row">
      {/* Desktop Navigation */}
      <Nav className="fixed top-24 left-0 h-full w-[5rem] z-10 hidden md:block" />

      {/* Mobile spacing for hamburger menu */}
      <div className="md:hidden h-12 bg-gradient-to-r from-sky-600 to-sky-700" />

      {/* Main Content */}
      <div className="w-full md:ml-[5rem] flex justify-center overflow-hidden">
        <div className="w-full md:max-w-[calc(100%-42px)] p-3 md:p-6 md:mt-20 bg-slate-100 overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Top Navigation Bar */}
      <NavBar user={user} logout={logout} />
    </div>
  );
}