import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import Link from "next/link";
import { saveAs } from "file-saver";

export default function HeldTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [locationFilter, setLocationFilter] = useState("All");
  const [staffFilter, setStaffFilter] = useState("All");
  const [locations, setLocations] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeldTransactions();
  }, [locationFilter, staffFilter]);

  async function fetchHeldTransactions() {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/transactions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      let filtered = (data.transactions || []).filter(tx => tx.status === "held");

      // Extract locations
      const locSet = new Set();
      const staffSet = new Set();
      filtered.forEach(tx => {
        if (tx.location) locSet.add(tx.location);
        if (tx.staff) staffSet.add(tx.staff?.name || tx.staff);
      });

      setLocations(Array.from(locSet).sort());
      setStaffList(Array.from(staffSet).sort());

      // Apply filters
      if (locationFilter !== "All") {
        filtered = filtered.filter(tx => tx.location === locationFilter);
      }
      if (staffFilter !== "All") {
        filtered = filtered.filter(tx => (tx.staff?.name || tx.staff) === staffFilter);
      }

      setTransactions(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleDetails = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  const exportCSV = () => {
    const headers = ["ID", "Staff", "Location", "Date", "Amount", "Items", "Time Held"];
    const rows = transactions.map(tx => {
      const heldTime = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "N/A";
      return [
        tx._id,
        tx.staff?.name || tx.staff || "N/A",
        tx.location || "Online",
        heldTime,
        `₦${tx.total?.toFixed(2)}`,
        tx.items?.length || 0,
        "Pending"
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "held-transactions.csv");
  };

  const totalValue = transactions.reduce((sum, tx) => sum + (tx.total || 0), 0);

  return (
    <Layout title="Held Transactions">
      <div className="min-h-screen bg-gray-50 p-8">
        {/* BREADCRUMB */}
        <div className="mb-6 text-sm">
          <Link href="/reporting/sales-report" className="text-cyan-600 hover:underline">Sales Reports</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">Held Transactions</span>
        </div>

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">⏸ Held Transactions</h1>
          <p className="text-gray-600">View and manage all transactions placed on hold</p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard title="Total Held" value={transactions.length} icon="📝" color="amber" />
          <SummaryCard title="Total Value" value={`₦${totalValue.toLocaleString('en-NG', {minimumFractionDigits: 2})}`} icon="💰" color="orange" />
          <SummaryCard title="Locations" value={locations.length} icon="🏪" color="yellow" />
          <SummaryCard title="Staff" value={staffList.length} icon="👥" color="red" />
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <span className="font-semibold text-gray-700">Filter by:</span>
            <select 
              value={locationFilter} 
              onChange={(e) => setLocationFilter(e.target.value)}
              className="border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-cyan-600 focus:outline-none text-sm font-medium"
            >
              <option value="All">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <select 
              value={staffFilter} 
              onChange={(e) => setStaffFilter(e.target.value)}
              className="border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-cyan-600 focus:outline-none text-sm font-medium"
            >
              <option value="All">All Staff</option>
              {staffList.map(staff => (
                <option key={staff} value={staff}>{staff}</option>
              ))}
            </select>

            <button 
              onClick={exportCSV}
              className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition ml-auto"
            >
              📊 Export CSV
            </button>
          </div>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="inline-block">
                  <svg className="animate-spin h-12 w-12 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading held transactions...</p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">📭 No held transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Staff</th>
                    <th className="px-4 py-3 text-left font-semibold">Location</th>
                    <th className="px-4 py-3 text-left font-semibold">Date/Time</th>
                    <th className="px-4 py-3 text-left font-semibold">Customer</th>
                    <th className="px-4 py-3 text-right font-semibold">Items</th>
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    <th className="px-4 py-3 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((tx, idx) => (
                    <>
                      <tr key={tx._id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-amber-50 transition`}>
                        <td className="px-4 py-3 font-medium text-gray-800">{tx.staff?.name || "N/A"}</td>
                        <td className="px-4 py-3">
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                            {tx.location || "Online"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-800">{tx.customerName || "N/A"}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{tx.items?.length || 0}</td>
                        <td className="px-4 py-3 text-right font-bold text-orange-600">₦{tx.total?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => toggleDetails(tx._id)}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            {expandedTxId === tx._id ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {expandedTxId === tx._id && (
                        <tr className="bg-gray-100">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-sm font-semibold text-gray-700 mb-3">Items ({tx.items?.length || 0})</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-amber-50 border-b">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-semibold">Product</th>
                                      <th className="px-3 py-2 text-right font-semibold">Qty</th>
                                      <th className="px-3 py-2 text-right font-semibold">Price</th>
                                      <th className="px-3 py-2 text-right font-semibold">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tx.items?.map((item, i) => (
                                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                        <td className="px-3 py-2">{item.name}</td>
                                        <td className="px-3 py-2 text-right">{item.qty}</td>
                                        <td className="px-3 py-2 text-right">₦{item.salePriceIncTax?.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right font-semibold">₦{(item.qty * item.salePriceIncTax)?.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function SummaryCard({ title, value, icon, color }) {
  const colorClass = {
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    red: "bg-red-50 border-red-200 text-red-700",
  }[color];

  return (
    <div className={`${colorClass} border-2 rounded-lg shadow-md p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl opacity-20">{icon}</div>
      </div>
    </div>
  );
}

