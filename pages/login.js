import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
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

  const staffByRole = useMemo(
    () => ({
      admin: staffList.filter((s) => s.role === "admin"),
      manager: staffList.filter((s) => s.role === "manager"),
      staff: staffList.filter((s) => s.role === "staff"),
      viewer: staffList.filter((s) => s.role === "viewer"),
    }),
    [staffList],
  );

  const selectedUser = staffList.find((u) => u.name === name);
  const isAdminSelected = selectedUser?.role === "admin";

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
          {/* LOGO */}
          <div className="flex justify-center mb-4">
            <img
              src="/images/st-micheals-logo.png"
              alt="Logo"
              className="h-20"
            />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-blue-800 mb-4">
            St Micheals Inventory
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Efficient inventory management system for your business.
          </p>
          <Link
            href="/register"
            className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            → Create Account
          </Link>
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
            <div className="grid grid-cols-3 gap-3 mb-6">
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
  const Staff = (await import("@/models/Staff")).default;
  const User = (await import("@/models/User")).default;
  const Store = (await import("@/models/Store")).default;

  await connectToDatabase();

  const staff = await Staff.find({}, "name role").lean();
  const users = await User.find({}, "name email role").lean();

  const map = new Map();
  staff.forEach((s) => map.set(s.name, { ...s, email: null }));
  users.forEach((u) => map.set(u.name, u));

  const store = await Store.findOne({}).lean();
  const locations = store?.locations?.map((l) =>
    typeof l === "string" ? l : l.name,
  ) || ["Default Location"];

  return {
    props: {
      staffList: Array.from(map.values()),
      locations,
    },
  };
}
