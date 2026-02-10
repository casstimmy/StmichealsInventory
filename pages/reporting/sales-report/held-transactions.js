import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useEffect, useState } from "react";
import Link from "next/link";
import { saveAs } from "file-saver";

function MetricCard({ title, value, icon, color }) {
  const colors = {
    sky: "bg-sky-50 border-sky-200 text-sky-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };
  return (
    <div className={`border rounded-xl p-4 shadow-sm ${colors[color] || colors.sky}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-80">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export default function HeldTransactionsReport() {
  const [data, setData] = useState(null);
  const [allData, setAllData] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [location, setLocation] = useState("All");
  const [staff, setStaff] = useState("All");
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { applyFilters(); }, [location, staff, allData]);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/transactions");
      const txRes = await res.json();
      if (!txRes.success || !txRes.transactions) { setData(null); setLoading(false); return; }

      const heldTx = txRes.transactions.filter((tx) => tx.status === "held");

      const locSet = new Set(); const staffSet = new Set();
      heldTx.forEach((tx) => {
        if (tx.location && tx.location !== "online") locSet.add(tx.location);
        if (tx.staff?.name) staffSet.add(tx.staff.name);
      });
      locSet.add("online");
      setAllLocations(Array.from(locSet).sort((a, b) => a === "online" ? -1 : b === "online" ? 1 : a.localeCompare(b)));
      setAllStaff(Array.from(staffSet).sort());
      setAllData(heldTx);
    } catch (err) { console.error("Error fetching data:", err); }
    finally { setLoading(false); }
  }

  function applyFilters() {
    const filtered = allData.filter((tx) => {
      return (location === "All" || (tx.location || "online") === location)
        && (staff === "All" || (tx.staff?.name || "Unknown") === staff);
    });

    const totalValue = filtered.reduce((s, tx) => s + (tx.total || 0), 0);
    const totalItems = filtered.reduce((s, tx) => s + (tx.items?.reduce((is, i) => is + (i.qty || 0), 0) || 0), 0);

    setData({
      transactions: filtered,
      totalCount: filtered.length,
      totalValue,
      totalItems,
      avgValue: filtered.length > 0 ? totalValue / filtered.length : 0,
    });
  }

  function exportCSV() {
    if (!data?.transactions?.length) return;
    const headers = ["Date", "Location", "Staff", "Items", "Total", "Status"];
    const csvRows = [headers.join(",")];
    data.transactions.forEach((tx) => {
      csvRows.push([
        new Date(tx.createdAt).toLocaleString(),
        tx.location || "online",
        tx.staff?.name || "Unknown",
        tx.items?.length || 0,
        (tx.total || 0).toFixed(2),
        tx.status,
      ].join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `held-transactions-${new Date().toISOString().split("T")[0]}.csv`);
  }

  return (
    <Layout title="Held Transactions Report">
      <div className="page-container">
        <div className="page-content">
          {/* Breadcrumb */}
          <div className="mb-6 text-sm text-gray-600">
            <Link href="/" className="text-cyan-600 hover:text-cyan-700">Home</Link>
            <span className="mx-2 text-gray-400">{">"}</span>
            <Link href="/reporting" className="text-cyan-600 hover:text-cyan-700">Reporting</Link>
            <span className="mx-2 text-gray-400">{">"}</span>
            <span className="text-gray-800 font-medium">Held Transactions</span>
          </div>

          <div className="page-header">
            <h1 className="page-title">Held Transactions Report</h1>
            <p className="page-subtitle">Overview of transactions currently on hold</p>
          </div>

          {/* Filters */}
          <div className="content-card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select value={location} onChange={(e) => setLocation(e.target.value)} className="form-select">
                  <option value="All">All Locations</option>
                  {allLocations.map((l) => (<option key={l} value={l}>{l}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staff</label>
                <select value={staff} onChange={(e) => setStaff(e.target.value)} className="form-select">
                  <option value="All">All Staff</option>
                  {allStaff.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={exportCSV} className="btn-action btn-action-primary">
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="content-card">
              <Loader size="md" text="Loading held transactions..." />
            </div>
          ) : data ? (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard title="Total Held" value={formatNumber(data.totalCount)} icon="⏸️" color="sky" />
                <MetricCard title="Total Value" value={formatCurrency(data.totalValue)} icon="💰" color="emerald" />
                <MetricCard title="Total Items" value={formatNumber(data.totalItems)} icon="📦" color="amber" />
                <MetricCard title="Avg Value" value={formatCurrency(data.avgValue)} icon="📊" color="purple" />
              </div>

              {/* Table */}
              <div className="data-table-container">
                <table className="data-table">
                  <thead className="sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold w-8"></th>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Location</th>
                      <th className="px-4 py-3 text-left font-semibold">Staff</th>
                      <th className="px-4 py-3 text-right font-semibold">Items</th>
                      <th className="px-4 py-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.transactions.map((tx, idx) => (
                      <>
                        <tr
                          key={idx}
                          className={`cursor-pointer hover:bg-sky-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                          onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                        >
                          <td className="px-4 py-3 text-gray-500">
                            <span className={`inline-block transition-transform ${expandedRow === idx ? "rotate-90" : ""}`}>▶</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {new Date(tx.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{tx.location || "online"}</td>
                          <td className="px-4 py-3 text-gray-700">{tx.staff?.name || "Unknown"}</td>
                          <td className="px-4 py-3 text-right">{tx.items?.length || 0}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(tx.total || 0)}</td>
                        </tr>
                        {expandedRow === idx && (
                          <tr key={`${idx}-detail`}>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                              <div className="text-sm font-medium text-gray-700 mb-2">Items in this transaction:</div>
                              <div className="grid gap-2">
                                {(tx.items || []).map((item, iIdx) => (
                                  <div key={iIdx} className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                                    <span className="text-gray-800">{item.name || "Unknown Item"}</span>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                      <span>Qty: {item.qty || 0}</span>
                                      <span>@ {formatCurrency(item.price || 0)}</span>
                                      <span className="font-medium text-gray-800">{formatCurrency((item.price || 0) * (item.qty || 0))}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {data.transactions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                          No held transactions found for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="content-card text-center text-gray-500 py-12">No data available.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}


