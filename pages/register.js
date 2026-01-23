import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { apiClient } from "@/lib/api-client";

export default function Register({ locations }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [location, setLocation] = useState(locations?.[0] || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [availableLocations, setAvailableLocations] = useState(locations || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Ensure we always have at least one location */
  useEffect(() => {
    if (!availableLocations || availableLocations.length === 0) {
      setAvailableLocations(["Default Location"]);
      setLocation("Default Location");
    }
  }, [availableLocations]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post("/api/auth/register", {
        name,
        email,
        password,
        role,
        location,
      });

      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full flex flex-col lg:flex-row items-center justify-between max-w-5xl gap-8">

        {/* Hero Section */}
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-blue-800 mb-4">
            Inventory Admin
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Create a secure admin account to manage inventory, staff, and stores.
          </p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            ← Back to Login
          </Link>
        </div>

        {/* Register Box */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
            Create Account
          </h2>

          <form onSubmit={handleRegister}>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="admin@email.com"
              />
            </div>

            {/* Role */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Default Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white text-lg transition ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===== SERVER SIDE ===== */
export async function getServerSideProps() {
  try {
    const { connectToDatabase } = await import("@/lib/mongodb");
    const Store = (await import("@/models/Store")).default;

    await connectToDatabase();

    const store = await Store.findOne({}).lean();

    let locations = ["Default Location"];

    if (store?.locations?.length > 0) {
      locations = store.locations.map((l) =>
        typeof l === "string" ? l : l.name
      );
    }

    return {
      props: { locations },
    };
  } catch (err) {
    console.error("Register page load error:", err);
    return {
      props: { locations: ["Default Location"] },
    };
  }
}
