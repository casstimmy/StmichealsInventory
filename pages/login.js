import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { apiClient } from "@/lib/api-client";

/* ===== Ripple Handler ===== */
function createRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
  circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;

  const ripple = button.getElementsByTagName("span")[0];
  if (ripple) ripple.remove();

  button.appendChild(circle);
}

export default function Login({ staffList, locations }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState(locations?.[0] || "");
  const [availableLocations, setAvailableLocations] = useState(locations || []);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /* ===== Init Store ===== */
  useEffect(() => {
    async function init() {
      if (!availableLocations.length) {
        const res = await fetch("/api/setup/init", { method: "POST" });
        const data = await res.json();
        if (data.success) {
          const locs = data.store.locations.map((l) =>
            typeof l === "string" ? l : l.name,
          );
          setAvailableLocations(locs);
          setLocation(locs[0]);
        }
      }
    }
    init();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!name) return setError("Please select a user.");
    if (!location) return setError("Please select a location.");
    if (password.length !== 4) return setError("PIN must be 4 digits.");

    setLoading(true);
    try {
      const user = staffList.find((u) => u.name === name);
      if (!user?.email) throw new Error("User email not found");

      const res = await apiClient.post("/api/auth/login", {
        email: user.email,
        password,
      });

      localStorage.setItem("auth_token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({ ...res.data.user, location }),
      );

      router.push("/");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeypad = (value) => {
    if (value === "clear") setPassword("");
    else if (value === "back") setPassword((p) => p.slice(0, -1));
    else if (password.length < 4) setPassword((p) => p + value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full flex flex-col lg:flex-row items-center justify-between max-w-5xl gap-8">
        {/* ===== HERO ===== */}
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          {/* Brand */}
          <div className="flex justify-center lg:justify-start mb-6">
            <img
              src="/images/st-micheals-logo.png"
              alt="St Micheals Logo"
              className="h-16 w-auto"
            />
          </div>

          {/* Badge */}
          <span className="inline-flex items-center px-4 py-1 mb-4 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            Inventory Management System
          </span>

          {/* Heading */}
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-5">
            St Micheals <br className="hidden lg:block" />
            Inventory Platform
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
            A secure and centralized system to manage products, staff access,
            and store operations with accuracy and control.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg
                 bg-blue-600 text-white font-semibold
                 hover:bg-blue-700 active:scale-95 transition"
            >
              Create Admin Account
            </Link>

            <p className="text-sm text-slate-500 flex items-center justify-center">
              Authorized personnel only
            </p>
          </div>
        </div>

        {/* ===== LOGIN CARD ===== */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
            Staff Login
          </h2>

          <form onSubmit={handleLogin}>
            {/* USER */}
            <select
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mb-4 px-4 py-3 border-2 rounded-lg"
            >
              <option value="" disabled>
                Select User
              </option>

              {staffList.map((user, index) => (
                <option key={index} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>

            {/* LOCATION */}
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full mb-4 px-4 py-3 border-2 rounded-lg"
            >
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* PIN */}
            <div className="flex justify-center gap-3 mb-5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 border-gray-400 ${
                    password.length > i ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* KEYPAD */}
            <div className="grid grid-cols-3 border-2 border-gray-200 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "←"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => {
                    createRipple(e);
                    handleKeypad(
                      key === "C" ? "clear" : key === "←" ? "back" : key,
                    );
                  }}
                  className={`ripple h-16 rounded-xl text-lg font-bold shadow
                    active:scale-95 transition
                    ${
                      key === "C"
                        ? "bg-red-500 text-white"
                        : key === "←"
                          ? "bg-gray-400 text-white"
                          : "bg-blue-100 text-blue-800"
                    }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-4 text-sm text-center">
                {error}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              onClick={createRipple}
              className="ripple w-full py-3 rounded-lg font-bold text-white text-lg
                         bg-blue-600 hover:bg-blue-700 active:scale-95 transition"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Need an account?{" "}
            <Link href="/register" className="text-blue-600 font-semibold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===== SSR ===== */
export async function getServerSideProps() {
  const { connectToDatabase } = await import("@/lib/mongodb");
  const User = (await import("@/models/User")).default;
  const Store = (await import("@/models/Store")).default;

  await connectToDatabase();

  // ✅ Fetch ONLY admin users
  const adminUsers = await User.find(
    { role: "admin", isActive: true },
    "name email role",
  ).lean();

  const store = await Store.findOne({}).lean();

  const locations = store?.locations?.map((l) =>
    typeof l === "string" ? l : l.name,
  ) || ["Default Location"];

  return {
    props: {
      staffList: adminUsers,
      locations,
    },
  };
}
