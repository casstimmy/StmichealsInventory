import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import Link from "next/link";
import { saveAs } from "file-saver";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function HeldTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [locationFilter, setLocationFilter] = useState("All");
  const [staffFilter, setStaffFilter] = useState("All");
  const [timeRange, setTimeRange] = useState("all");
  const [locations, setLocations] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeldTransactions();
  }, [locationFilter, staffFilter, timeRange]);

  async function fetchHeldTransactions() {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/transactions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      let filtered = (data.transactions || []).filter(tx => tx.status === "held");

      // Extract locations and staff for dropdowns
      const locSet = new Set();
      const staffSet = new Set();
      filtered.forEach(tx => {
        if (tx.location) locSet.add(tx.location);
        if (tx.staffName) staffSet.add(tx.staffName);
        else if (tx.staff.name) staffSet.add(tx.staff.name);
      });

      setLocations(Array.from(locSet).sort());
      setStaffList(Array.from(staffSet).sort());

      // Apply location filter
      if (locationFilter !== "All") {
        filtered = filtered.filter(tx => tx.location === locationFilter);
      }
      
      // Apply staff filter
      if (staffFilter !== "All") {
        filtered = filtered.filter(tx => (tx.staffName || tx.staff.name) === staffFilter);
      }
      
      // Apply time range filter
      if (timeRange !== "all") {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        filtered = filtered.filter(tx => {
          const txDate = new Date(tx.createdAt);
          txDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor((now - txDate) / (1000 * 60 * 60 * 24));
          
          switch (timeRange) {
            case "today": return daysDiff === 0;
            case "yesterday": return daysDiff === 1;
            case "last7": return daysDiff <= 7;
            case "last30": return daysDiff <= 30;
            default: return true;
          }
        });
      }

      setTransactions(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleDetails = (id) => {
    setExpandedTxId(expandedTxId === id  null : id);
  };

  const handleVoidTransaction = async (txId) => {
    if (!confirm("Are you sure you want to void this held transaction")) return;
    
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTransactions(prev => prev.filter(tx => tx._id !== txId));
      } else {
        alert("Failed to void transaction");
      }
    } catch (err) {
      console.error(err);
      alert("Error voiding transaction");
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Staff", "Location", "Date", "Amount", "Items", "Status"];
    const rows = transactions.map(tx => {
      const heldTime = tx.createdAt
        ? new Date(tx.createdAt).toLocaleString("en-NG")
        : "N/A";
      return [
        tx._id,
        tx.staffName || tx.staff.name || "N/A",
        tx.location || "Online",
        heldTime,
        `${tx.total.toFixed(2)}`,
        tx.items.length || 0,
        "Held"
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "held-transactions.csv");
  };

  const totalValue = transactions.reduce((sum, tx) => sum + (tx.total || 0), 0);

  return (
    <Layout title="Held Transactions">
      <div className="page-container">
        {/* BREADCRUMB */}
        <div className="mb-6 text-sm">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700">Home</Link>
          <span className="mx-2 text-gray-400"></span>
          <Link href="/reporting/transaction-report" className="text-cyan-600 hover:text-cyan-700">Transaction Reports</Link>
          <span className="mx-2 text-gray-400"></span>
          <span className="text-gray-600">Held Transactions</span>
        </div>

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2"> Held Transactions</h1>
          <p className="text-gray-600">View and manage all transactions placed on hold</p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard title="Total Held" value={formatNumber(transactions.length)} icon="" color="cyan" />
          <SummaryCard title="Total Value" value={formatCurrency(totalValue)} icon="" color="blue" />
          <SummaryCard title="Locations" value={formatNumber(locations.length)} icon="" color="cyan" />
          <SummaryCard title="Staff" value={formatNumber(staffList.length)} icon="" color="cyan" />
        </div>

        {/* FILTERS */}
        <div className="content-card mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="form-select"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select 
                value={locationFilter} 
                onChange={(e) => setLocationFilter(e.target.value)}
                className="form-select"
              >
                <option value="All">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Staff</label>
              <select 
                value={staffFilter} 
                onChange={(e) => setStaffFilter(e.target.value)}
                className="form-select"
              >
                <option value="All">All Staff</option>
                {staffList.map(staff => (
                  <option key={staff} value={staff}>{staff}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={exportCSV}
              className="btn-action btn-action-primary ml-auto"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="content-card overflow-hidden">
          {loading  (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : transactions.length === 0  (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg"> No held transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Staff</th>
                    <th className="px-4 py-3 text-left font-semibold">Location</th>
                    <th className="px-4 py-3 text-left font-semibold">Date/Time</th>
                    <th className="px-4 py-3 text-right font-semibold">Items</th>
                    <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    <th className="px-4 py-3 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((tx, idx) => (
                    <>
                      <tr key={tx._id} className={`${idx % 2 === 0  "bg-white" : "bg-gray-50"} hover:bg-cyan-50 transition`}>
                        <td className="px-4 py-3 font-medium text-gray-800">{tx.staffName || tx.staff.name || "N/A"}</td>
                        <td className="px-4 py-3">
                          <span className="badge badge-secondary">
                            {tx.location || "Online"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{new Date(tx.createdAt).toLocaleString("en-NG")}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatNumber(tx.items?.length || 0)}</td>
                        <td className="px-4 py-3 text-right font-bold text-cyan-600">{formatCurrency(tx.total || 0)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button 
                              onClick={() => toggleDetails(tx._id)}
                              className="btn-action btn-action-secondary btn-sm"
                            >
                              {expandedTxId === tx._id  "Hide" : "View"}
                            </button>
                            <button 
                              onClick={() => handleVoidTransaction(tx._id)}
                              className="btn-action btn-action-danger btn-sm"
                            >
                              Void
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedTxId === tx._id && (
                        <tr className="bg-gray-100">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-sm font-semibold text-gray-700 mb-3">Items ({tx.items.length || 0})</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-cyan-50 border-b">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-semibold">Product</th>
                                      <th className="px-3 py-2 text-right font-semibold">Qty</th>
                                      <th className="px-3 py-2 text-right font-semibold">Price</th>
                                      <th className="px-3 py-2 text-right font-semibold">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tx.items.map((item, i) => (
                                      <tr key={i} className={i % 2 === 0  "bg-white" : "bg-gray-50"}>
                                        <td className="px-3 py-2">{item.name}</td>
                                        <td className="px-3 py-2 text-right">{formatNumber(item.qty || 0)}</td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(item.salePriceIncTax || 0)}</td>
                                        <td className="px-3 py-2 text-right font-semibold">{formatCurrency((item.qty || 0) * (item.salePriceIncTax || 0))}</td>
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
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
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


