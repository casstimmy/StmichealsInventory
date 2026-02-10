// Completed Transactions Report
import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import Link from "next/link";
import { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import { formatCurrency, formatNumber } from "@/lib/format";
import { isInDateRange } from "@/lib/dateFilter";
import useProgress from "@/lib/useProgress";

export default function CompletedTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showBarcode, setShowBarcode] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const { progress, start, onFetch, onProcess, complete } = useProgress();

  // Fetch once, filter client-side
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [locationFilter, statusFilter, selectedDate, startDate, endDate, allTransactions]);

async function fetchTransactions() {
  try {
    setLoading(true);
    start();
    const res = await fetch("/api/transactions/transactions");
    if (!res.ok) throw new Error("Failed to fetch transactions");
    onFetch();
    const data = await res.json();
    onProcess();
    const all = data.transactions || [];

    // Extract unique locations
    const locationSet = new Set();
    all.forEach((tx) => {
      if (tx.location) locationSet.add(tx.location);
    });
    const uniqueLocations = Array.from(locationSet)
      .sort((a, b) => {
        if (a === "online") return -1;
        if (b === "online") return 1;
        return a.localeCompare(b);
      })
      .map((name) => ({ id: name, name }));
    setLocations(uniqueLocations);
    setAllTransactions(all);
    complete();
  } catch (err) {
    console.error(err);
    complete();
  } finally {
    setLoading(false);
  }
}

function applyFilters() {
    let filtered = [...allTransactions];

    // Filter by status (voided is treated as refunded)
    if (statusFilter) {
      if (statusFilter === "refunded") {
        filtered = filtered.filter((tx) => tx.status === "refunded" || tx.status === "voided");
      } else {
        filtered = filtered.filter((tx) => tx.status === statusFilter);
      }
    }

    // Filter by location
    if (locationFilter) {
      filtered = filtered.filter((tx) => tx.location === locationFilter);
    }

    // Filter by selected date (calendar)
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

    // Filter by date range
    if (startDate && endDate) {
      filtered = filtered.filter((tx) => isInDateRange(tx.createdAt, startDate, endDate));
    } else if (startDate) {
      filtered = filtered.filter((tx) => new Date(tx.createdAt) >= new Date(startDate));
    } else if (endDate) {
      filtered = filtered.filter((tx) => new Date(tx.createdAt) <= new Date(endDate + "T23:59:59"));
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setTransactions(filtered);
}

  // Get display status (voided → Refunded)
  function getDisplayStatus(status) {
    if (status === "voided") return "Refunded";
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "held": return "bg-amber-100 text-amber-800";
      case "refunded":
      case "voided": return "bg-red-100 text-red-800";
      case "edited": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  // Handle void held transaction
  async function handleVoidTransaction(txId) {
    if (!confirm("Are you sure you want to void this held transaction? It will be marked as refunded.")) return;
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "voided" }),
      });
      if (res.ok) {
        setAllTransactions((prev) =>
          prev.map((tx) => tx._id === txId ? { ...tx, status: "voided" } : tx)
        );
      }
    } catch (err) {
      console.error("Error voiding transaction:", err);
    }
  }

  // Compute sales total excluding refunded/voided
  function getSalesTotalExcludingRefunded(txList) {
    return txList
      .filter((tx) => tx.status !== "voided" && tx.status !== "refunded")
      .reduce((sum, tx) => sum + (tx.total || 0), 0);
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

  const formatTenderLabel = (value) => {
    if (!value) return "Unknown";
    const cleaned = String(value).replace(/[_-]+/g, " ").trim();
    return cleaned.replace(/\s+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getTenderBadgeClass = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (normalized.includes("cash")) return "badge-success";
    if (normalized.includes("card") || normalized.includes("pos")) return "badge-primary";
    if (normalized.includes("transfer") || normalized.includes("bank")) return "badge-warning";
    if (normalized.includes("online")) return "badge-secondary";
    return "badge";
  };

  const getTenderDisplay = (tx) => {
    const hasSplit = Array.isArray(tx.tenderPayments) && tx.tenderPayments.length > 1;
    if (hasSplit) {
      return {
        isSplit: true,
        payments: tx.tenderPayments.map((payment) => ({
          label: formatTenderLabel(payment?.tenderName || payment?.tenderType || "Tender"),
          amount: payment?.amount || 0,
          className: getTenderBadgeClass(payment?.tenderName || payment?.tenderType),
        })),
      };
    }

    const tenderName =
      Array.isArray(tx.tenderPayments) && tx.tenderPayments.length === 1
        ? tx.tenderPayments[0]?.tenderName || tx.tenderPayments[0]?.tenderType
        : tx.tenderType;

    const label = formatTenderLabel(tenderName || "Unknown");
    return {
      isSplit: false,
      label,
      title: label,
      className: getTenderBadgeClass(tenderName),
    };
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
    const remainingDays = 42 - days.length; // 6 rows x 7 days
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
      <div className="page-container">
        <div className="page-content">
          {/* Breadcrumb */}
          <div className="mb-6 text-sm text-gray-600">
            <Link href="/" className="text-cyan-600 hover:text-cyan-700">Home</Link>
            <span className="mx-2 text-gray-400">{">"}</span>
            <Link href="/reporting/transaction-report" className="text-cyan-600 hover:text-cyan-700">Transaction Reports</Link>
            <span className="mx-2 text-gray-400">{">"}</span>
            <span className="text-gray-800 font-medium">Completed Transactions</span>
          </div>

        <div className="page-header">
          <h1 className="page-title">Completed Transactions</h1>
          <p className="page-subtitle">View and manage transaction records with advanced filtering</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 lg:items-stretch">
          {/* Calendar & Date Range Card */}
          <div className="content-card flex flex-col">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Previous month"
                >
                  <span className="text-lg">{"<"}</span>
                </button>
                <h2 className="text-sm font-semibold text-gray-800">
                  {formatMonthYear(calendarMonth)}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Next month"
                >
                  <span className="text-lg">{">"}</span>
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
                          ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-50"
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
              className="w-full text-xs font-medium text-cyan-600 hover:text-cyan-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors mb-4"
            >
              Clear Date Filter
            </button>

            {/* Date Range - same card */}
            <div className="border-t border-gray-200 pt-4 mt-auto">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <span className="w-1 h-4 bg-sky-500 rounded"></span>
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setSelectedDate(null); }}
                    className="form-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setSelectedDate(null); }}
                    className="form-input text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => { setStartDate(""); setEndDate(""); }}
                className="w-full text-xs font-medium text-cyan-600 hover:text-cyan-700 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors mt-2"
              >
                Clear Date Range
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          <div className="flex flex-col space-y-4">
            {/* Location Filter */}
            <div className="content-card">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <span className="w-1 h-4 bg-emerald-500 rounded"></span>
                Location Filter
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="form-select"
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
            <div className="content-card">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <span className="w-1 h-4 bg-amber-500 rounded"></span>
                Transaction Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="held">Held</option>
                <option value="refunded">Refunded</option>
                <option value="edited">Edited</option>
              </select>
            </div>

            {/* Filter Actions - pushed to bottom */}
            <div className="flex gap-2 mt-auto pt-2">
              <button
                onClick={() => {
                  setLocationFilter("");
                  setStatusFilter("");
                  setSelectedDate(null);
                  setStartDate("");
                  setEndDate("");
                }}
                className="flex-1 btn-action btn-action-secondary flex items-center justify-center gap-2"
              >
                Reset All Filters
              </button>
              <button
                onClick={() => setLocationFilter("")}
                className="flex-1 btn-action btn-action-secondary"
              >
                All Locations
              </button>
            </div>
          </div>
        </div>

        {/* Export and Results Summary */}
        <div className="content-card mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Results Summary</p>
              <p className="text-2xl font-bold text-cyan-600">
                {formatNumber(transactions.length)}
                <span className="text-sm font-normal text-gray-600 ml-2">transactions found</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Sales Total: <span className="font-semibold text-emerald-600">{formatCurrency(getSalesTotalExcludingRefunded(transactions))}</span>
                <span className="text-xs text-gray-400 ml-1">(excl. refunded)</span>
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Export Options</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportCSV}
                  className="btn-action btn-action-primary"
                >
                  Export CSV
                </button>
                <button
                  className="btn-action btn-action-secondary"
                >
                  Export Word
                </button>
                <button
                  className="btn-action btn-action-secondary"
                >
                  Export Excel
                </button>
                <button
                  onClick={handlePrint}
                  className="btn-action btn-action-success"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div id="print-section" className="data-table-container">
          {loading ? (
            <div className="p-8">
              <Loader size="md" text="Loading transactions..." progress={progress} />
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead className="sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Staff</th>
                    <th className="px-4 py-3 text-left font-semibold">Location</th>
                    <th className="px-4 py-3 text-left font-semibold">Date/Time</th>
                    <th className="px-4 py-3 text-left font-semibold">Customer</th>
                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 text-left font-semibold">Tender</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((tx, idx) => (
                    <>
                      <tr key={tx._id} className={`transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-50`}>
                        <td className="px-4 py-3 font-medium text-gray-800">{tx.staff?.name || tx.staff || "N/A"}</td>
                        <td className="px-4 py-3">
                          <span className="badge badge-success">
                            {tx.location || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{new Date(tx.createdAt).toLocaleString("en-NG")}</td>
                        <td className="px-4 py-3 text-gray-800">{tx.customerName || "Walk-in"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(tx.status)}`}>
                            {getDisplayStatus(tx.status)}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${(tx.status === "voided" || tx.status === "refunded") ? "text-red-400 line-through" : "text-cyan-600"}`}>
                          {formatCurrency(tx.total || 0)}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const tenderInfo = getTenderDisplay(tx);
                            if (tenderInfo.isSplit) {
                              return (
                                <div className="flex flex-col gap-1">
                                  {tenderInfo.payments.map((p, i) => (
                                    <span key={i} className={`badge ${p.className} text-xs`}>
                                      {p.label}: {formatCurrency(p.amount)}
                                    </span>
                                  ))}
                                </div>
                              );
                            }
                            return (
                              <span className={`badge ${tenderInfo.className}`} title={tenderInfo.title}>
                                {tenderInfo.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="btn-action btn-action-success btn-sm"
                              onClick={() => toggleDetails(tx._id)}
                            >
                              {expandedTxId === tx._id ? "Hide" : "View"}
                            </button>
                            {tx.status === "held" && (
                              <button
                                className="btn-action btn-action-danger btn-sm"
                                onClick={() => handleVoidTransaction(tx._id)}
                              >
                                Void
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedTxId === tx._id && (
                        <tr className="bg-gray-100">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <p className="text-sm font-semibold text-gray-700 mb-3">Order Items ({tx.items?.length || 0} items)</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50 border-b border-gray-300">
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
                                        <td className="px-3 py-2 text-right font-medium">{formatNumber(item.qty || 0)}</td>
                                        <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(item.salePriceIncTax || 0)}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-cyan-600">{formatCurrency((item.qty || 0) * (item.salePriceIncTax || 0))}</td>
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
              <p className="text-gray-500 text-lg font-medium">No transactions found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters to see results</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </Layout>
  );
}


