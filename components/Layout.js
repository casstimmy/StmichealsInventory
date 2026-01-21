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
    <div className="bg-slate-50 min-h-screen flex">
      <Nav className="fixed top-24 left-0 h-full w-[5rem] z-10" />

      <div className="ml-[5rem] w-full flex justify-center overflow-hidden">
        <div className="w-full max-w-[calc(100%-42px)] p-6 mt-20 bg-slate-100 overflow-y-auto">
          {children}
        </div>
      </div>

      <NavBar user={user} logout={logout} />
    </div>
  );
}
