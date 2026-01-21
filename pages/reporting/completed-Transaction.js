// SalesReport.js
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { saveAs } from "file-saver";

export default function SalesReport() {
  const [transactions, setTransactions] = useState([]);
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("completed");
  const [locations, setLocations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showBarcode, setShowBarcode] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    fetchTransactions();
  }, [locationFilter, statusFilter, selectedDate]);

async function fetchTransactions() {
  try {
    const res = await fetch("/api/transactions/transactions");
    if (!res.ok) throw new Error("Failed to fetch transactions");
    const data = await res.json();
    let filtered = data.transactions || [];

    // Extract unique locations (now as strings from API)
    const locationSet = new Set();
    filtered.forEach((tx) => {
      if (tx.location) {
        locationSet.add(tx.location);
      }
    });
    // Sort locations: "online" first, then others alphabetically
    const uniqueLocations = Array.from(locationSet)
      .sort((a, b) => {
        if (a === "online") return -1;
        if (b === "online") return 1;
        return a.localeCompare(b);
      })
      .map((name) => ({ id: name, name }));
    setLocations(uniqueLocations);

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter((tx) => tx.status === statusFilter);
    }

    // Filter by location (location is a string from API)
    if (locationFilter) {
      filtered = filtered.filter((tx) => tx.location === locationFilter);
    }

    // Filter by selected date
    if (selectedDate) {
      const target = new Date(selectedDate);
      const year = target.getFullYear();
      const month = target.getMonth();
      const day = target.getDate();
      
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return (
          txDate.getFullYear() === year &&
          txDate.getMonth() === month &&
          txDate.getDate() === day
        );
      });
    }

    setTransactions(filtered);
  } catch (err) {
    console.error(err);
  }
}


  const toggleDetails = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  const exportCSV = () => {
    const headers = [
      "Staff,Location,Device,Date,Customer,Discount,DiscountReason,Total,Tender,Change",
    ];
    const rows = transactions.map((tx) =>
      [
        tx.staff?.name || tx.staff || "N/A",
        tx.location || "N/A",
        tx.device,
        new Date(tx.createdAt).toLocaleString(),
        tx.customerName || "N/A",
        tx.discount,
        tx.discountReason,
        tx.total,
        tx.tenderType,
        tx.change,
      ].join(",")
    );
    const csv = headers.concat(rows).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "transactions.csv");
  };

  const handlePrint = () => window.print();

  const getTenderClass = (tenderType) => {
    if (tenderType === "cash") return "px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700";
    if (tenderType === "card") return "px-2 py-1 rounded text-xs font-medium bg-cyan-100 text-cyan-700";
    return "px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700";
  };

  // Calendar utility functions
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getCalendarDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const prevMonthDays = getDaysInMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1));

    // Previous month days (greyed out)
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
      });
    }

    // Next month days (greyed out)
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1));
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const handleDateSelect = (day) => {
    const year = calendarMonth.getFullYear();
    const month = String(calendarMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${dayStr}`);
  };

  return (
    <Layout title="Completed Transactions">
      <div className="min-h-screen bg-gray-50 p-6 text-gray-900 font-sans">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Completed Transactions</h1>
          <p className="text-gray-600 mt-1">View and manage transaction records with advanced filtering</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Calendar Filter */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 h-fit">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Previous month"
                >
                  <span className="text-lg">‹</span>
                </button>
                <h2 className="text-sm font-semibold text-gray-800">
                  {formatMonthYear(calendarMonth)}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Next month"
                >
                  <span className="text-lg">›</span>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-600 py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map((item, idx) => {
                  const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(item.day).padStart(2, "0")}`;
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleDateSelect(item.day)}
                      className={`py-2 rounded text-xs font-medium transition-all ${
                        !item.isCurrentMonth
                          ? "text-gray-300 cursor-default"
                          : isSelected
                          ? "bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      disabled={!item.isCurrentMonth}
                    >
                      {item.day}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full text-xs font-medium text-cyan-600 hover:text-cyan-700 py-2 px-3 rounded-lg hover:bg-cyan-50 transition-colors"
            >
              Clear Date Filter
            </button>
          </div>

          {/* Filters Panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Location Filter */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <span className="w-1 h-4 bg-emerald-500 rounded"></span>
                Location Filter
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 bg-white text-gray-800 transition-all"
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <span className="w-1 h-4 bg-amber-500 rounded"></span>
                Transaction Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 bg-white text-gray-800 transition-all"
              >
                <option value="">All Status</option>
                <option value="completed">✓ Completed</option>
                <option value="held">⏸ Held</option>
                <option value="refunded">↩ Refunded</option>
              </select>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLocationFilter("");
                  setStatusFilter("completed");
                  setSelectedDate(null);
                }}
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <span>↺</span> Reset All Filters
              </button>
              <button
                onClick={() => setLocationFilter("")}
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                All Locations
              </button>
            </div>
          </div>
        </div>

        {/* Export and Results Summary */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Results Summary</p>
              <p className="text-2xl font-bold text-cyan-600">
                {transactions.length}
                <span className="text-sm font-normal text-gray-600 ml-2">transactions found</span>
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Export Options</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportCSV}
                  className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  📊 Export CSV
                </button>
                <button
                  className="bg-white border border-cyan-600 text-cyan-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-50 transition-all"
                >
                  📄 Export Word
                </button>
                <button
                  className="bg-white border border-green-300 text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-all"
                >
                  📈 Export Excel
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  🖨 Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div id="print-section" className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Staff</th>
                    <th className="px-4 py-3 text-left font-semibold">Location</th>
                    <th className="px-4 py-3 text-left font-semibold">Device</th>
                    <th className="px-4 py-3 text-left font-semibold">Date/Time</th>
                    <th className="px-4 py-3 text-left font-semibold">Customer</th>
                    <th className="px-4 py-3 text-right font-semibold">Discount</th>
                    <th className="px-4 py-3 text-left font-semibold">Reason</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 text-left font-semibold">Tender</th>
                    <th className="px-4 py-3 text-right font-semibold">Change</th>
                    <th className="px-4 py-3 text-center font-semibold">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((tx, idx) => (
                    <>
                      <tr key={tx._id} className={`transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100">
                        <td className="px-4 py-3 font-medium text-gray-800">{tx.staff?.name || tx.staff || "N/A"}</td>
                        <td className="px-4 py-3">
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-medium">
                            {tx.location || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{tx.device || "Till 1"}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-800">{tx.customerName || "Walk-in"}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">₦{tx.discount?.toFixed(2) || "0.00"}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{tx.discountReason || "-"}</td>
                        <td className="px-4 py-3 text-right font-bold text-cyan-600">₦{tx.total?.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={getTenderClass(tx.tenderType)}>
                            {tx.tenderType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">₦{tx.change?.toFixed(2) || "0.00"}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                            onClick={() => toggleDetails(tx._id)}
                          >
                            {expandedTxId === tx._id ? "Hide" : "Show"}
                          </button>
                        </td>
                      </tr>
                      {expandedTxId === tx._id && (
                        <tr className="bg-gray-100">
                          <td colSpan={11} className="px-6 py-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-sm font-semibold text-gray-700 mb-3">Order Items ({tx.items?.length || 0} items)</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-cyan-50 border-b border-gray-300">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Product Name</th>
                                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Qty</th>
                                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Unit Price</th>
                                      <th className="px-3 py-2 text-right font-semibold text-gray-700">Total</th>
                                      {showBarcode && <th className="px-3 py-2 text-right font-semibold text-gray-700">Barcode</th>}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {tx.items?.map((item, idx) => (
                                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                        <td className="px-3 py-2 font-medium text-gray-800">{item.name}</td>
                                        <td className="px-3 py-2 text-right font-medium">{item.qty}</td>
                                        <td className="px-3 py-2 text-right text-gray-600">₦{item.salePriceIncTax?.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-cyan-600">₦{(item.qty * item.salePriceIncTax).toFixed(2)}</td>
                                        {showBarcode && <td className="px-3 py-2 text-right text-gray-600">{item.barcode || "-"}</td>}
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
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg font-medium">📭 No transactions found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters to see results</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

