import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";
import { getStoreLogo, getStoreName } from "@/lib/logoCache";

export default function Login({ staffList, locations, storeLogo, storeName }) {
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [location, setLocation] = useState(locations?.[0] || "");
  const [availableLocations, setAvailableLocations] = useState(locations || []);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState(storeLogo);
  const [company, setCompany] = useState(storeName);
  const router = useRouter();

  // Initialize store with default location if needed
  useEffect(() => {
    async function initializeStore() {
      try {
        // Load logo and store name if not already provided
        if (!logo) {
          const cachedLogo = await getStoreLogo();
          setLogo(cachedLogo);
        }
        if (!company) {
          const name = await getStoreName();
          setCompany(name);
        }

        if (!availableLocations || availableLocations.length === 0) {
          console.log("Initializing store with default location...");
          const res = await fetch("/api/setup/init", { method: "POST" });
          const data = await res.json();
          if (data.success && data.store?.locations) {
            const locs = data.store.locations.map((l) =>
              typeof l === "string" ? l : l.name
            );
            setAvailableLocations(locs);
            setLocation(locs[0] || "Default Location");
          }
        }
      } catch (err) {
        console.error("Store initialization error:", err);
      }
    }

    initializeStore();
  }, []);

  // Update location when availableLocations changes
  useEffect(() => {
    if (availableLocations.length > 0 && !location) {
      setLocation(availableLocations[0]);
    }
  }, [availableLocations]);

  // Filter and organize users by role
  const staffByRole = useMemo(() => {
    return {
      admin: staffList.filter((s) => s.role === "admin"),
      manager: staffList.filter((s) => s.role === "manager"),
      staff: staffList.filter((s) => s.role === "staff"),
      viewer: staffList.filter((s) => s.role === "viewer"),
    };
  }, [staffList]);

  const selectedUser = staffList.find((u) => u.name === name);
  const isAdminSelected = selectedUser?.role === "admin";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!name) {
      setError("Please select a user.");
      return;
    }

    if (!location) {
      setError("Please select a location.");
      return;
    }

    if (password.length !== 4) {
      setError("PIN must be 4 digits.");
      return;
    }

    setLoading(true);

    try {
      const selectedUser = staffList.find((u) => u.name === name);
      
      if (!selectedUser?.email) {
        setError("User email not found. Please try again.");
        setLoading(false);
        return;
      }

      // Login with actual email from database
      const res = await apiClient.post("/api/auth/login", {
        email: selectedUser.email,
        password: password,
      });

      const { token, user } = res.data;

      // Store token and user info
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify({ ...user, location }));

      // Redirect to dashboard
      router.push("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Invalid credentials.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeypad = (value) => {
    if (value === "clear") {
      setPassword("");
    } else if (value === "back") {
      setPassword((prev) => prev.slice(0, -1));
    } else if (password.length < 4) {
      setPassword((prev) => prev + value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full flex flex-col lg:flex-row items-center justify-between max-w-5xl gap-8">
        {/* Hero Section */}
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          {logo && (
            <div className="mb-8 flex justify-center lg:justify-start">
              <div className="relative w-32 h-32">
                <Image
                  src={logo}
                  alt={company || "Company Logo"}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          )}
          <h1 className="text-4xl lg:text-5xl font-extrabold text-blue-800 mb-2">
            {company || "Inventory Admin"}
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

        {/* Login Box */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
            Staff Login
          </h2>
          <form onSubmit={handleLogin}>
            {/* User Dropdown */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                User
              </label>
              <select
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
              >
                <option value="" disabled>
                  Select User
                </option>
                {staffByRole.admin.length > 0 && (
                  <optgroup label="Admin">
                    {staffByRole.admin.map((user, idx) => (
                      <option key={`admin-${idx}`} value={user.name}>
                        {user.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {staffByRole.manager.length > 0 && (
                  <optgroup label="Manager">
                    {staffByRole.manager.map((user, idx) => (
                      <option key={`manager-${idx}`} value={user.name}>
                        {user.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {staffByRole.staff.length > 0 && (
                  <optgroup label="Staff">
                    {staffByRole.staff.map((user, idx) => (
                      <option key={`staff-${idx}`} value={user.name}>
                        {user.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {staffByRole.viewer.length > 0 && (
                  <optgroup label="Viewer">
                    {staffByRole.viewer.map((user, idx) => (
                      <option key={`viewer-${idx}`} value={user.name}>
                        {user.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Location Dropdown */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location {isAdminSelected && <span className="text-cyan-600 text-xs">(All Locations Available)</span>}
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
              >
                <option value="">Select Location</option>
                {availableLocations && availableLocations.length > 0 ? (
                  availableLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading locations...</option>
                )}
              </select>
            </div>

            {/* PIN Display */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password (4-Digit PIN)
              </label>
              <div className="w-full h-14 px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-2xl tracking-widest font-bold flex items-center justify-center text-blue-600">
                {"●".repeat(password.length)}
              </div>
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "←"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    handleKeypad(
                      key === "C" ? "clear" : key === "←" ? "back" : key
                    )
                  }
                  className={`py-3 rounded-lg font-bold text-lg transition ${
                    key === "C" || key === "←"
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-blue-100 hover:bg-blue-300 text-blue-800"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white text-lg transition ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Need an account?{" "}
            <Link href="/register" className="text-blue-600 font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const { mongooseConnect } = await import("@/lib/mongodb");
    const Staff = (await import("@/models/Staff")).default;
    const User = (await import("@/models/User")).default;
    const Store = (await import("@/models/Store")).default;

    await mongooseConnect();

    // Get all staff
    const staffDocs = await Staff.find({}, "name role").lean();

    // Get all users (for admin login)
    const users = await User.find({}, "name email role").lean();

    // Combine staff and users for dropdown - prefer user data with email
    const allUsersMap = new Map();
    
    // Add all staff first (staff may not have emails)
    staffDocs.forEach((s) => {
      if (s.name) { // Only add if name exists
        allUsersMap.set(s.name, {
          name: s.name || null,
          role: s.role || null,
          email: null, // Staff won't have email
        });
      }
    });

    // Override with user data (which has email) - only if name exists
    users.forEach((user) => {
      if (user.name) { // Only add if name exists
        allUsersMap.set(user.name, {
          name: user.name || null,
          email: user.email || null, // Ensure email is never undefined
          role: user.role || null,
        });
      }
    });

    const allUsers = Array.from(allUsersMap.values());

    // Get locations and logo from Store model
    const store = await Store.findOne({}).lean();
    
    console.log("Store found:", !!store);
    console.log("Store locations:", store?.locations);
    
    // Build locations array - ensure we always have at least Default Location
    let locations = [];
    if (store?.locations && Array.isArray(store.locations) && store.locations.length > 0) {
      locations = store.locations.map((l) => {
        // Handle both string names and objects with name property
        return typeof l === 'string' ? l : (l.name || 'Unnamed Location');
      });
    } else {
      locations = ["Default Location"];
    }

    // Get logo and store name
    const storeLogo = store?.logo || null;
    const storeName = store?.storeName || null;

    return {
      props: {
        staffList: allUsers,
        locations,
        storeLogo,
        storeName,
      },
    };
  } catch (err) {
    console.error("Error fetching staff/locations:", err);
    return {
      props: {
        staffList: [],
        locations: ["Default Location"],
        storeLogo: null,
        storeName: null,
      },
    };
  }
}
