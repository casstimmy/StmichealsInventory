import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { apiClient } from "@/lib/api-client";
import { clearAllAppCaches } from "@/lib/clearAllCaches";
import { showToastMessage } from "@/lib/toast-state";

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

  // Determine if selected user is admin
  const selectedUser = staffList.find((u) => u.name === name);
  const isSelectedAdmin = selectedUser?.role === "admin";
  const userAssignedLocation = selectedUser?.assignedLocation || "";

  // When user changes, auto-set location for non-admins
  useEffect(() => {
    if (name && !isSelectedAdmin && userAssignedLocation) {
      setLocation(userAssignedLocation);
    }
  }, [name, isSelectedAdmin, userAssignedLocation]);

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

  useEffect(() => {
    if (!error) return;
    showToastMessage({ title: "Login", text: error, fallbackTone: "danger" });
    setError("");
  }, [error]);

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

      // Clear ALL stale caches before establishing the new session
      await clearAllAppCaches();

      localStorage.setItem("auth_token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({ ...res.data.user, location }),
      );

      // Determine redirect based on user permissions
      const loggedInUser = res.data.user;
      const isAdmin = loggedInUser?.role === "admin";
      const perms = loggedInUser?.permissions || [];
      const hasDashboard = isAdmin || perms.includes("dashboard");

      if (hasDashboard) {
        router.push("/");
      } else {
        // Find first accessible page
        const pageMap = [
          { perm: "manage.products", path: "/manage/products" },
          { perm: "manage", path: "/manage/products" },
          { perm: "stock.management", path: "/stock/management" },
          { perm: "stock", path: "/stock/management" },
          { perm: "reporting.sales-report", path: "/reporting/reporting" },
          { perm: "reporting", path: "/reporting/reporting" },
          { perm: "expenses.entry", path: "/expenses/expenses" },
          { perm: "expenses", path: "/expenses/expenses" },
          { perm: "setup.company", path: "/setup/setup" },
          { perm: "setup", path: "/setup/setup" },
          { perm: "support", path: "/support" },
        ];
        const first = pageMap.find(({ perm }) => perms.includes(perm));
        router.push(first?.path || "/support");
      }
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
    <div className="min-h-screen flex" style={{ backgroundColor: "#f9fafb" }}>
      {/* ===== LEFT BRAND PANEL (desktop only) ===== */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-10 xl:p-14"
        style={{ backgroundColor: "var(--btn-primary-bg, #0284c7)" }}
      >
        <div>
          <img
            src="/images/st-micheals-logo.png"
            alt="Logo"
            className="h-14 w-auto brightness-0 invert"
          />
        </div>
        <div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">
            Inventory Management
          </p>
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-snug mb-4">
            St Micheals<br />Inventory Platform
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            A secure, centralized system to manage products, staff access, and store operations.
          </p>
        </div>
        <div className="border-t border-white/20 pt-6">
          <p className="text-white/50 text-xs">Authorized personnel only</p>
        </div>
      </div>

      {/* ===== RIGHT LOGIN PANEL ===== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/images/st-micheals-logo.png"
              alt="Logo"
              className="h-14 w-auto mx-auto mb-3"
            />
            <h1 className="text-xl font-bold text-gray-900">St Micheals Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">Authorized personnel only</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Staff Login</h2>
            <p className="text-sm text-gray-500 mb-6">Select your account and enter your PIN</p>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* USER */}
              <div>
                <label className="form-label">User</label>
                <select
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                >
                  <option value="" disabled>Select user…</option>
                  {staffList.map((user, index) => (
                    <option key={index} value={user.name}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* LOCATION */}
              <div>
                <label className="form-label">Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={name && !isSelectedAdmin && !!userAssignedLocation}
                  className={`form-input ${name && !isSelectedAdmin && userAssignedLocation ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
                >
                  {(isSelectedAdmin || !name) ? (
                    availableLocations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))
                  ) : (
                    <option value={userAssignedLocation || location}>{userAssignedLocation || location}</option>
                  )}
                </select>
                {name && !isSelectedAdmin && userAssignedLocation && (
                  <p className="text-xs text-gray-400 mt-1">Assigned to {userAssignedLocation}</p>
                )}
              </div>

              {/* PIN INDICATOR */}
              <div>
                <label className="form-label">PIN</label>
                <div className="flex gap-3 justify-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full transition-all duration-150"
                      style={{
                        backgroundColor: password.length > i
                          ? "var(--btn-primary-bg, #0284c7)"
                          : "#d1d5db",
                        transform: password.length > i ? "scale(1.15)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* KEYPAD */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "←"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={(e) => {
                      createRipple(e);
                      handleKeypad(key === "C" ? "clear" : key === "←" ? "back" : key);
                    }}
                    className={`ripple h-12 rounded-lg text-sm font-semibold border transition-all duration-150 active:scale-95 select-none ${
                      key === "C"
                        ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                        : key === "←"
                          ? "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                          : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                onClick={createRipple}
                className="ripple w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
                style={{ backgroundColor: "var(--btn-primary-bg, #0284c7)" }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>
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
  const Staff = (await import("@/models/Staff")).default;

  await connectToDatabase();

  // Fetch all users (for login dropdown)
  const adminUsers = await User.find({}, "name email role").lean();

  // Fetch staff to get assigned locations
  const staffData = await Staff.find({}, "name location role").lean();

  const store = await Store.findOne({}).lean();

  const locations = store?.locations?.map((l) =>
    typeof l === "string" ? l : l.name,
  ) || ["Default Location"];

  // Create a map of user name to their assigned location from Staff
  const staffLocationMap = {};
  staffData.forEach((s) => {
    if (s.name && s.location) {
      staffLocationMap[s.name] = s.location;
    }
  });

  return {
    props: {
      staffList: adminUsers.map((u) => ({
        ...JSON.parse(JSON.stringify(u)),
        assignedLocation: staffLocationMap[u.name] || "",
      })),
      locations,
    },
  };
}
