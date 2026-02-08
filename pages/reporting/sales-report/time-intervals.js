import Layout from "@/components/Layout";
import { formatCurrency } from "@/lib/format";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TimeIntervals() {
  const [data, setData] = useState(null);
  const [allLocations, setAllLocations] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [timeRange, setTimeRange] = useState("last7");
  const [location, setLocation] = useState("All");
  const [device, setDevice] = useState("All");
  const [staff, setStaff] = useState("All");
  const [timeInterval, setTimeInterval] = useState("daily");
  const [loading, setLoading] = useState(true);

  const getTimeRangeDays = (rangeKey) => {
    const today = new Date();
    const ranges = {
      today: 0,
      yesterday: 1,
      thisWeek: Math.floor((today.getDay() + 6) % 7),
      thisMonth: today.getDate() - 1,
      thisYear: Math.floor((today - new Date(today.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)),
      lastWeek: Math.floor((today.getDay() + 6) % 7) + 7,
      lastMonth: 30,
      lastYear: 365,
      last7: 7,
      last14: 14,
      last30: 30,
      last60: 60,
      last90: 90,
    };
    return ranges[rangeKey] || 7;
  };

  const getTimeIntervalLabel = () => {
    const labels = {
      daily: "DAY COMMENCING",
      weekly: "WEEK COMMENCING",
      monthly: "MONTH COMMENCING",
      quarterly: "QUARTER COMMENCING",
      yearly: "YEAR",
      hourly: "HOUR",
      halfHourly: "TIME",
    };
    return labels[timeInterval] || "DATE";
  };

  useEffect(() => {
    fetchAllFilters();
  }, []);

  useEffect(() => {
    if (allLocations.length > 0) {
      fetchData();
    }
  }, [timeRange, location, device, staff, timeInterval, allLocations]);

  async function fetchAllFilters() {
    try {
      const res = await fetch(`/api/transactions/transactions`);
      const txRes = await res.json();
      
      if (txRes.success && txRes.transactions) {
        // Extract all unique locations
        const locationSet = new Set();
        const staffSet = new Set();
        txRes.transactions.forEach((tx) => {
          if (tx.location && tx.location !== "online") {
            locationSet.add(tx.location);
          }
          if (tx.staff?.name) {
            staffSet.add(tx.staff.name);
          }
        });
        locationSet.add("online");
        
        let locNames = Array.from(locationSet);
        locNames = locNames.sort((a, b) => {
          if (a === "online") return -1;
          if (b === "online") return 1;
          return a.localeCompare(b);
        });
        
        let staffNames = Array.from(staffSet).sort();
        
        setAllLocations(locNames);
        setAllStaff(staffNames);
      }
    } catch (err) {
      console.error("Error fetching filters:", err);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch(`/api/transactions/transactions`);
      const txRes = await res.json();
      
      if (!txRes.success || !txRes.transactions) {
        setData(null);
        setLoading(false);
        return;
      }

      // Calculate cutoff date based on timeRange
      const cutoffDate = new Date();
      const days = getTimeRangeDays(timeRange);
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Filter transactions by all criteria
      let filteredTransactions = txRes.transactions.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        const isInDateRange = txDate >= cutoffDate;
        
        const txLocation = tx.location || "online";
        const isMatchingLocation = location === "All" || txLocation === location;
        
        const txDevice = tx.device || "POS";
        const isMatchingDevice = device === "All" || txDevice === device;
        
        const txStaff = tx.staff?.name || "Unknown";
        const isMatchingStaff = staff === "All" || txStaff === staff;
        
        return isInDateRange && isMatchingLocation && isMatchingDevice && isMatchingStaff;
      });

      // Group transactions by time interval
      const dateMap = {};
      
      filteredTransactions.forEach((tx) => {
        let groupKey;
        const txDate = new Date(tx.createdAt);
        
        if (timeInterval === "daily") {
          groupKey = txDate.toISOString().split("T")[0];
        } else if (timeInterval === "weekly") {
          // ISO week start (Monday)
          const d = new Date(txDate);
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const weekStart = new Date(d.setDate(diff));
          groupKey = weekStart.toISOString().split("T")[0] + " (Week)";
        } else if (timeInterval === "monthly") {
          groupKey = txDate.toISOString().slice(0, 7);
        } else if (timeInterval === "quarterly") {
          const quarter = Math.floor(txDate.getMonth() / 3);
          const year = txDate.getFullYear();
          groupKey = `${year}-Q${quarter + 1}`;
        } else if (timeInterval === "yearly") {
          groupKey = txDate.getFullYear().toString();
        } else if (timeInterval === "hourly") {
          groupKey = txDate.toISOString().slice(0, 13) + ":00:00";
        } else if (timeInterval === "halfHourly") {
          const minutes = Math.floor(txDate.getMinutes() / 30) * 30;
          const d = new Date(txDate);
          d.setMinutes(minutes, 0, 0);
          groupKey = d.toISOString().slice(0, 16);
        }
        
        if (!dateMap[groupKey]) {
          dateMap[groupKey] = {
            completed: [],
            refunded: [],
            held: [],
          };
        }
        
        if (tx.status === "completed") dateMap[groupKey].completed.push(tx);
        else if (tx.status === "refunded") dateMap[groupKey].refunded.push(tx);
        else if (tx.status === "held") dateMap[groupKey].held.push(tx);
      });

      // Build table data
      const aggregatedData = Object.entries(dateMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dayData]) => {
          const completed = dayData.completed;
          const refunded = dayData.refunded;

          const transactions = completed.length;
          const refunds = refunded.length;
          const refundValue = refunded.reduce((sum, tx) => sum + (tx.total || 0), 0);
          const itemQty = completed.reduce((sum, tx) => {
            return sum + (tx.items?.reduce((isum, item) => isum + (item.qty || 0), 0) || 0);
          }, 0);
          const salesIncTax = completed.reduce((sum, tx) => sum + (tx.total || 0), 0);
          const discounts = completed.reduce((sum, tx) => sum + (tx.discount || 0), 0);
          const netSales = salesIncTax - discounts;
          const avgTransaction = transactions > 0 ? netSales / transactions : 0;

          return {
            date,
            transactions,
            refunds,
            refundValue,
            noSale: 0,
            voided: 0,
            voidedValue: 0,
            itemQty,
            salesIncTax,
            discounts,
            avgTransaction,
            netSales,
          };
        });

      setData({
        dates: aggregatedData.map((d) => d.date),
        byDate: aggregatedData,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  const getDateRange = () => {
    if (!data?.dates || data.dates.length === 0) return "";
    const start = data.dates[0];
    const end = data.dates[data.dates.length - 1];
    return `${start} - ${end}`;
  };

  const tableData = data?.byDate || [];

  const totals = {
    transactions: tableData.reduce((sum, row) => sum + row.transactions, 0),
    refunds: tableData.reduce((sum, row) => sum + row.refunds, 0),
    refundValue: tableData.reduce((sum, row) => sum + row.refundValue, 0),
    noSale: tableData.reduce((sum, row) => sum + row.noSale, 0),
    voided: tableData.reduce((sum, row) => sum + row.voided, 0),
    voidedValue: tableData.reduce((sum, row) => sum + row.voidedValue, 0),
    itemQty: tableData.reduce((sum, row) => sum + row.itemQty, 0),
    salesIncTax: tableData.reduce((sum, row) => sum + row.salesIncTax, 0),
    discounts: tableData.reduce((sum, row) => sum + row.discounts, 0),
    avgTransaction: tableData.length > 0 ? tableData.reduce((sum, row) => sum + row.avgTransaction, 0) / tableData.length : 0,
    netSales: tableData.reduce((sum, row) => sum + row.netSales, 0),
  };

  return (
    <Layout title="Sales Breakdown">
      <div className="min-h-screen bg-gray-50 p-8">
        {/* BREADCRUMB */}
        <div className="mb-6 text-sm">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700">Home</Link>
          <span className="mx-2 text-gray-400"></span>
          <Link href="/reporting" className="text-cyan-600 hover:text-cyan-700">Reporting</Link>
          <span className="mx-2 text-gray-400"></span>
          <span className="text-gray-600">Time Intervals</span>
        </div>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Sales Breakdown <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded ml-2">HELP</span></h1>
        </div>

        {/* SHOW DATA FROM */}
        <div className="bg-white rounded p-4 mb-4 border border-gray-200">
          <label className="text-sm font-medium text-gray-700 block mb-2">Show data from</label>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full border-2 border-gray-300 px-3 py-2 rounded focus:border-cyan-600 bg-white"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 days</option>
            <option value="last14">Last 14 days</option>
            <option value="last30">Last 30 days</option>
            <option value="last60">Last 60 days</option>
            <option value="last90">Last 90 days</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="thisYear">This Year</option>
            <option value="lastWeek">Last Week</option>
            <option value="lastMonth">Last Month</option>
            <option value="lastYear">Last Year</option>
          </select>
          <p className="text-sm text-gray-600 mt-2">{getDateRange()}</p>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded p-4 mb-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Filter by Location</label>
              <select 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border-2 border-gray-300 px-3 py-2 rounded focus:border-cyan-600"
              >
                <option value="All">All Locations</option>
                <option value="online">Online</option>
                {allLocations.map((l) => (
                  l !== "online" && <option key={l} value={l}>{l || "Unknown"}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Filter by Device</label>
              <select 
                value={device} 
                onChange={(e) => setDevice(e.target.value)}
                className="w-full border-2 border-gray-300 px-3 py-2 rounded focus:border-cyan-600"
              >
                <option value="All">All Devices</option>
                <option value="POS">POS</option>
                <option value="Mobile">Mobile</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Filter by Staff</label>
              <select 
                value={staff} 
                onChange={(e) => setStaff(e.target.value)}
                className="w-full border-2 border-gray-300 px-3 py-2 rounded focus:border-cyan-600"
              >
                <option value="All">All Staff</option>
                {allStaff.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TIME INTERVAL */}
        <div className="bg-white rounded p-4 mb-6 border border-gray-200">
          <label className="text-sm font-medium text-gray-700 block mb-2">Show by Time Interval</label>
          <select 
            value={timeInterval} 
            onChange={(e) => setTimeInterval(e.target.value)}
            className="w-full border-2 border-gray-300 px-3 py-2 rounded focus:border-cyan-600"
          >
            <option value="yearly">Yearly</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
            <option value="hourly">Hourly</option>
            <option value="halfHourly">Half Hourly</option>
          </select>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-2 mb-6">
          <button className="px-4 py-2 bg-gray-50 text-cyan-700 border-2 border-cyan-600 rounded font-medium hover:bg-cyan-100">
            EXPORT TO CSV
          </button>
          <button className="px-4 py-2 bg-gray-50 text-cyan-700 border-2 border-cyan-600 rounded font-medium hover:bg-cyan-100">
            EXPORT TO WORD
          </button>
          <button className="px-4 py-2 bg-gray-50 text-cyan-700 border-2 border-cyan-600 rounded font-medium hover:bg-cyan-100">
            EXPORT TO EXCEL
          </button>
          <button className="px-4 py-2 bg-gray-50 text-cyan-700 border-2 border-cyan-600 rounded font-medium hover:bg-cyan-100">
            PRINT
          </button>
          <button className="ml-auto px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded font-medium hover:bg-gray-200">
            RESET
          </button>
          <button className="px-4 py-2 bg-cyan-600 text-white rounded font-medium hover:bg-cyan-700">
            APPLY
          </button>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block">
                <svg className="animate-spin h-12 w-12 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Loading sales data...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-white">{getTimeIntervalLabel()}</th>
                  <th className="px-4 py-3 text-right font-bold text-white">TRANSACTION QTY</th>
                  <th className="px-4 py-3 text-right font-bold text-white">REFUND QTY</th>
                  <th className="px-4 py-3 text-right font-bold text-white">REFUND VALUE</th>
                  <th className="px-4 py-3 text-right font-bold text-white">NO SALE QTY</th>
                  <th className="px-4 py-3 text-right font-bold text-white">VOIDED QTY</th>
                  <th className="px-4 py-3 text-right font-bold text-white">DELETED/VOIDED VALUE</th>
                  <th className="px-4 py-3 text-right font-bold text-white">ITEM QTY</th>
                  <th className="px-4 py-3 text-right font-bold text-white">SALES INC TAX</th>
                  <th className="px-4 py-3 text-right font-bold text-white">DISCOUNTS</th>
                  <th className="px-4 py-3 text-right font-bold text-white">AVERAGE TRANSACTION</th>
                  <th className="px-4 py-3 text-right font-bold text-white">NET SALES</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.date}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.transactions}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.refunds}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{row.refundValue.toLocaleString('en-NG')}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.noSale}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.voided}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{row.voidedValue.toLocaleString('en-NG')}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.itemQty}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.salesIncTax.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{row.discounts.toLocaleString('en-NG')}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.avgTransaction.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.netSales.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                  </tr>
                ))}
                {/* TOTAL ROW */}
                <tr className="bg-cyan-100 font-bold border-t-2 border-gray-300">
                  <td className="px-4 py-3 text-gray-800">TOTAL</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.transactions}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.refunds}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.refundValue.toLocaleString('en-NG')}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.noSale}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.voided}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.voidedValue.toLocaleString('en-NG')}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.itemQty}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.salesIncTax.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.discounts.toLocaleString('en-NG')}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.avgTransaction.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.netSales.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

