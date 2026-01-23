import Layout from "@/components/Layout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSearch, faFilter, faCheckCircle, faClock, faTimes } from "@fortawesome/free-solid-svg-icons";
import Loader from "@/components/Loader";

const reasons = [
  "* All Reasons",
  "Restock",
  "Return",
  "Transfer",
  "Adjustment",
];
const statuses = ["All Statuses", "Pending", "Sent", "Received"];

export default function StockMovement() {
  const [movements, setMovements] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationMap, setLocationMap] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [locationFilter, setLocationFilter] = useState("* All Locations");
  const [reason, setReason] = useState("* All Reasons");
  const [status, setStatus] = useState("All Statuses");
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch locations on mount
  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("/api/setup/setup");
        const data = await res.json();
        if (data?.store?.locations) {
          const locArray = data.store.locations;
          setLocations(["* All Locations", ...locArray.map(loc => loc.name)]);
          
          // Create a map of location ID to name
          const map = {};
          locArray.forEach(loc => {
            map[loc._id] = loc.name;
            map[loc.name] = loc.name; // Also map name to name for filter compatibility
          });
          setLocationMap(map);
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    }
    fetchLocations();
  }, []);

  // Fetch stock movements
  useEffect(() => {
    async function fetchStockMovements() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/stock-movement/get");
        const data = await res.json();

        // Handle different response formats - data can be:
        // 1. An array (direct array response)
        // 2. An object with a data property containing an array
        // 3. An object with a movements property
        let movementsArray = [];
        
        if (Array.isArray(data)) {
          movementsArray = data;
        } else if (data?.data && Array.isArray(data.data)) {
          movementsArray = data.data;
        } else if (data?.movements && Array.isArray(data.movements)) {
          movementsArray = data.movements;
        } else {
          console.warn("Unexpected data format from API:", data);
          console.warn("Data type:", typeof data);
          console.warn("Data keys:", data ? Object.keys(data) : "null");
          setError("Invalid data format received from server");
          setMovements([]);
          setLoading(false);
          return;
        }

        // Additional validation - ensure all items are objects
        if (!Array.isArray(movementsArray) || !movementsArray.every(item => typeof item === 'object' && item !== null)) {
          console.error("Data validation failed - not all items are valid objects");
          setError("Invalid data format received");
          setMovements([]);
          setLoading(false);
          return;
        }

        setMovements(movementsArray);
      } catch (err) {
        console.error("Error fetching stock movements:", err);
        setError(err.message || "Failed to fetch stock movements");
        setMovements([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStockMovements();
  }, []);

  const parseDate = (dateStr) => (dateStr ? new Date(dateStr) : null);

  const filteredMovements = movements.filter((item) => {
    if (locationFilter !== "* All Locations" && item.fromLocationId !== locationFilter)
      return false;
    if (reason !== "* All Reasons" && item.reason !== reason) return false;
    if (status !== "All Statuses" && item.status !== status) return false;
    if (barcode && !item.transRef?.includes(barcode)) return false;
    if (fromDate) {
      const from = parseDate(fromDate);
      const dateSent = parseDate(item.dateSent);
      if (!dateSent || dateSent < from) return false;
    }
    if (toDate) {
      const to = parseDate(toDate);
      const dateSent = parseDate(item.dateSent);
      if (!dateSent || dateSent > to) return false;
    }
    return true;
  });

  const getStatusIcon = (status) => {
    switch(status) {
      case "Received":
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />;
      case "Sent":
        return <FontAwesomeIcon icon={faClock} className="text-yellow-600" />;
      case "Pending":
        return <FontAwesomeIcon icon={faClock} className="text-gray-600" />;
      default:
        return <FontAwesomeIcon icon={faTimes} className="text-red-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Received":
        return "bg-green-50 text-green-700 border-green-200";
      case "Sent":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Pending":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-red-50 text-red-700 border-red-200";
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-3 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Stock Movements</h1>
            <p className="text-gray-600">Track and manage inventory transfers between locations</p>
          </div>
          <Link href="../stock/add">
            <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition font-semibold">
              <FontAwesomeIcon icon={faPlus} />
              New Stock Movement
            </button>
          </Link>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow-sm">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 flex items-center justify-center min-h-96">
            <Loader size="md" text="Loading stock movements..." />
          </div>
        ) : (
          <>
            {/* Filters Section */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <FontAwesomeIcon icon={faFilter} className="text-cyan-600 text-lg" />
                <h3 className="text-lg font-semibold text-gray-900">Filter Movements</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 transition"
                  />
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 transition"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 transition"
                  >
                    {reasons.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 transition"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Barcode Search */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faSearch} className="text-cyan-600" />
                  Search by Reference/Barcode
                </label>
                <input
                  type="text"
                  placeholder="Enter transaction reference or barcode..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600 transition"
                />
              </div>
            </div>

            {/* Results Summary */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredMovements.length}</span> of <span className="font-semibold text-gray-900">{movements.length}</span> movements
              </p>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              {filteredMovements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Reference</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">From Location</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">To Location</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Reason</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Date Sent</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Total Items</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredMovements.map((item, index) => (
                        <tr key={index} className={`transition-colors ${index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}`}>
                          <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">{item.transRef}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{locationMap[item.fromLocationId] || item.fromLocationId || "Unknown"}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{locationMap[item.toLocationId] || item.toLocationId || "Unknown"}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-block bg-cyan-100 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
                              {item.reason}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {item.dateSent ? new Date(item.dateSent).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {item.products?.length || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-gray-500 text-lg">No stock movements found matching your filters</p>
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </div>
    </Layout>
  );
}

