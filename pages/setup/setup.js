import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";

// Field component - defined outside to prevent re-creation on each render
const Field = ({ label, ...props }) => (
  <div className="flex flex-col">
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
    <input 
      {...props} 
      className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
    />
  </div>
);

export default function Setup() {
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [country, setCountry] = useState("");

  const [locations, setLocations] = useState([]);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationForm, setLocationForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    code: "",
  });

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* =====================
     FETCH DATA
  ===================== */
  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/setup/setup");
      if (!res.ok) return;

      const data = await res.json();
      const { store, user } = data;

      if (store) {
        setStoreName(store.storeName || "");
        setStorePhone(store.storePhone || "");
        setCountry(store.country || "");
        
        // If DB has locations, use them; otherwise check localStorage
        if (store.locations && store.locations.length > 0) {
          setLocations(store.locations);
          // Clear localStorage since we have persisted data
          localStorage.removeItem("setupLocations");
        } else {
          // If no locations in DB, try to restore from localStorage
          const savedLocations = localStorage.getItem("setupLocations");
          if (savedLocations) {
            try {
              const parsed = JSON.parse(savedLocations);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setLocations(parsed);
                console.log("Restored locations from localStorage:", parsed);
              }
            } catch (e) {
              console.error("Failed to parse saved locations:", e);
              localStorage.removeItem("setupLocations");
            }
          }
        }
      }

      if (user) {
        setAdminName(user.name || "");
        setAdminEmail(user.email || "");
      }
    }

    fetchData();
  }, []);

  // Save locations to localStorage whenever they change
  useEffect(() => {
    if (locations && locations.length > 0) {
      localStorage.setItem("setupLocations", JSON.stringify(locations));
    }
  }, [locations]);

  /* =====================
     LOCATION HANDLERS
  ===================== */
  const handleLocationChange = useCallback((field, value) => {
    setLocationForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addLocation = useCallback(() => {
    if (!locationForm.name.trim()) {
      setMessage("⚠️ Location name is required");
      return;
    }

    setLocations((prev) => [
      ...prev,
      { ...locationForm, isActive: true },
    ]);

    setLocationForm({
      name: "",
      address: "",
      phone: "",
      email: "",
      code: "",
    });

    setMessage("✅ Location added successfully");
    setTimeout(() => {
      setShowLocationForm(false);
      setMessage("");
    }, 1000);
  }, [locationForm]);

  const removeLocation = (index) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  /* =====================
     SUBMIT
  ===================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!storeName.trim()) {
      setMessage("Store name is required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/setup/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          storePhone,
          country,
          locations,
          adminName,
          adminEmail,
          adminPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Setup saved successfully");
        setAdminPassword(""); // Clear password field after save
        // Clear localStorage after successful save
        localStorage.removeItem("setupLocations");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Setup failed: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Setup error:", error);
      setMessage("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Store Setup & Configuration</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">Manage your store information, locations, and admin settings</p>
          </div>

          {/* Warning for unsaved locations */}
          {locations && locations.length > 0 && showLocationForm && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-600 p-3 md:p-4 rounded text-sm">
              <p className="text-blue-800">
                <strong>💾 Note:</strong> Added locations are saved to your browser. Click "Save Setup Configuration" to permanently save them to the database.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">

            {/* SUMMARY - Left Column */}
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Store Summary</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Store Name</p>
                  <p className="text-lg font-semibold text-gray-900">{storeName || "Not set"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-lg font-semibold text-gray-900">{storePhone || "Not set"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Country</p>
                  <p className="text-lg font-semibold text-gray-900">{country || "Not set"}</p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">Locations ({locations.length})</h3>
                  <div className="space-y-3">
                    {locations.length ? locations.map((l, i) => (
                      <div key={i} className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg">
                        <div className="font-semibold text-gray-900">{l.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{l.address}</div>
                        <div className="text-sm text-gray-600">{l.phone}</div>
                      </div>
                    )) : <p className="text-gray-500 text-sm italic">No locations added yet</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* FORM - Right Column */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Update Configuration</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <Field label="Store Name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                  <Field label="Store Phone" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
                  <Field label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>

                {/* LOCATION SECTION */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowLocationForm(!showLocationForm);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-4 rounded-lg transition w-full"
                  >
                    {showLocationForm ? '− Cancel' : '+ Add Location'}
                  </button>

                  {showLocationForm && (
                    <div className="mt-4 border border-cyan-200 bg-cyan-50 p-4 rounded-lg space-y-3">
                      <Field 
                        label="Location Name" 
                        type="text"
                        value={locationForm.name} 
                        onChange={(e) => handleLocationChange("name", e.target.value)} 
                        placeholder="e.g., Main Store" 
                      />
                      <Field 
                        label="Address" 
                        type="text"
                        value={locationForm.address} 
                        onChange={(e) => handleLocationChange("address", e.target.value)} 
                        placeholder="Street address" 
                      />
                      <Field 
                        label="Phone" 
                        type="tel"
                        value={locationForm.phone} 
                        onChange={(e) => handleLocationChange("phone", e.target.value)} 
                        placeholder="Location phone number" 
                      />
                      <Field 
                        label="Email" 
                        type="email"
                        value={locationForm.email} 
                        onChange={(e) => handleLocationChange("email", e.target.value)} 
                        placeholder="Location email" 
                      />
                      <Field 
                        label="Code" 
                        type="text"
                        value={locationForm.code} 
                        onChange={(e) => handleLocationChange("code", e.target.value)} 
                        placeholder="Location code (optional)" 
                      />

                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          addLocation();
                        }} 
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition"
                      >
                        Save Location
                      </button>
                    </div>
                  )}
                </div>

                {/* ADMIN SECTION */}
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Admin Settings</p>
                  <Field label="Admin Name" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
                  <Field label="Admin Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                  <Field label="New Password (Optional)" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                </div>

                <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg transition text-lg mt-6" disabled={loading}>
                  {loading ? "Saving..." : "Save Setup Configuration"}
                </button>

                {message && (
                  <div className={`mt-4 p-3 rounded-lg text-center ${message.startsWith("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}



