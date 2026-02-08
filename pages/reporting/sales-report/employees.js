import Layout from "@/components/Layout";
import { formatCurrency } from "@/lib/format";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function EmployeesSales() {
  const [data, setData] = useState(null);
  const [allLocations, setAllLocations] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [timeRange, setTimeRange] = useState("last7");
  const [location, setLocation] = useState("All");
  const [device, setDevice] = useState("All");
  const [staff, setStaff] = useState("All");
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

  useEffect(() => {
    fetchAllFilters();
  }, []);

  useEffect(() => {
    if (allLocations.length > 0) {
      fetchData();
    }
  }, [timeRange, location, device, staff, allLocations]);

  async function fetchAllFilters() {
    try {
      const res = await fetch(`/api/transactions/transactions`);
      const txRes = await res.json();
      
      if (txRes.success && txRes.transactions) {
        // Extract all unique locations and staff
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

      // Calculate cutoff date
      const cutoffDate = new Date();
      const days = getTimeRangeDays(timeRange);
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Filter transactions
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

      // Group by staff member
      const staffMap = {};
      filteredTransactions.forEach((tx) => {
        const staffName = tx.staff?.name || "Unknown";
        const mainLocation = tx.location || "online";

        if (!staffMap[staffName]) {
          staffMap[staffName] = {
            name: staffName,
            mainLocation: mainLocation,
            completed: [],
            refunded: [],
            transactionQty: 0,
            refundQty: 0,
            refundValue: 0,
            noSaleQty: 0,
            voidedQty: 0,
            voidedValue: 0,
            itemQty: 0,
            salesIncTax: 0,
            discounts: 0,
          };
        }

        if (tx.status === "completed") {
          staffMap[staffName].completed.push(tx);
          staffMap[staffName].transactionQty += 1;
          staffMap[staffName].itemQty += tx.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
          staffMap[staffName].salesIncTax += tx.total || 0;
          staffMap[staffName].discounts += tx.discount || 0;
        } else if (tx.status === "refunded") {
          staffMap[staffName].refunded.push(tx);
          staffMap[staffName].refundQty += 1;
          staffMap[staffName].refundValue += tx.total || 0;
        }
      });

      // Calculate derived metrics for each staff
      const staffData = Object.values(staffMap).map((staff) => {
        const netSales = staff.salesIncTax - staff.discounts;
        const avgTransaction = staff.transactionQty > 0 ? netSales / staff.transactionQty : 0;
        
        return {
          ...staff,
          netSalesIncVat: netSales,
          netSalesExcTax: Math.max(0, netSales * 0.8), // Approximate
          avgTransaction: avgTransaction,
          avgMargin: 0, // Would need cost data
          grossMargin: 0,
          marginPercent: 0,
        };
      }).sort((a, b) => b.salesIncTax - a.salesIncTax);

      setData({
        employees: staffData,
        dateRange: getDateRange(cutoffDate),
      });
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  const getDateRange = (cutoffDate) => {
    const today = new Date();
    const start = cutoffDate.toISOString().split("T")[0];
    const end = today.toISOString().split("T")[0];
    return `${start} - ${end}`;
  };

  const tableData = data?.employees || [];
  const totals = {
    transactionQty: tableData.reduce((sum, row) => sum + row.transactionQty, 0),
    refundQty: tableData.reduce((sum, row) => sum + row.refundQty, 0),
    refundValue: tableData.reduce((sum, row) => sum + row.refundValue, 0),
    noSaleQty: tableData.reduce((sum, row) => sum + row.noSaleQty, 0),
    voidedQty: tableData.reduce((sum, row) => sum + row.voidedQty, 0),
    voidedValue: tableData.reduce((sum, row) => sum + row.voidedValue, 0),
    itemQty: tableData.reduce((sum, row) => sum + row.itemQty, 0),
    salesIncTax: tableData.reduce((sum, row) => sum + row.salesIncTax, 0),
    discounts: tableData.reduce((sum, row) => sum + row.discounts, 0),
    avgTransaction: tableData.length > 0 ? tableData.reduce((sum, row) => sum + row.avgTransaction, 0) / tableData.length : 0,
    netSalesIncVat: tableData.reduce((sum, row) => sum + row.netSalesIncVat, 0),
    netSalesExcTax: tableData.reduce((sum, row) => sum + row.netSalesExcTax, 0),
  };

  return (
    <Layout title="Sales By Employee">
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mb-6 text-sm">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700">Home</Link>
          <span className="mx-2 text-gray-400"></span>
          <Link href="/reporting" className="text-cyan-600 hover:text-cyan-700">Reporting</Link>
          <span className="mx-2 text-gray-400"></span>
          <span className="text-gray-600">Employees</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Sales By Employee <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded ml-2">HELP</span></h1>
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
          <p className="text-sm text-gray-600 mt-2">{data?.dateRange}</p>
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
              <p className="mt-4 text-gray-600 font-medium">Loading employee data...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-white">NAME</th>
                  <th className="px-4 py-3 text-left font-bold text-white">MAIN LOCATION</th>
                  <th className="px-4 py-3 text-right font-bold text-white">TRANSACTION QTY</th>
                  <th className="px-4 py-3 text-right font-bold text-white">REFUND QTY</th>
                  <th className="px-4 py-3 text-right font-bold text-white">REFUND VALUE</th>
                  <th className="px-4 py-3 text-right font-bold text-white">NO SALE QTY</th>
                  <th className="px-4 py-3 text-right font-bold text-white">VOIDED QTY</th>
                  <th className="px-4 py-3 text-right font-bold text-white">VOIDED VALUE</th>
                  <th className="px-4 py-3 text-right font-bold text-white">ITEM QTY</th>
                  <th className="px-4 py-3 text-right font-bold text-white">SALES INC. TAX</th>
                  <th className="px-4 py-3 text-right font-bold text-white">DISCOUNT</th>
                  <th className="px-4 py-3 text-right font-bold text-white">AVERAGE TRANSACTION NET SALES</th>
                  <th className="px-4 py-3 text-right font-bold text-white">NET SALES INC. VAT</th>
                  <th className="px-4 py-3 text-right font-bold text-white">NET SALES EXC. TAX</th>
                  <th className="px-4 py-3 text-right font-bold text-white">AVERAGE TRANSACTION MARGIN</th>
                  <th className="px-4 py-3 text-right font-bold text-white">GROSS MARGIN</th>
                  <th className="px-4 py-3 text-right font-bold text-white">MARGIN %</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                    <td className="px-4 py-3 text-gray-700">{row.mainLocation}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.transactionQty}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.refundQty}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{row.refundValue.toLocaleString('en-NG')}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.noSaleQty}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.voidedQty}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{row.voidedValue.toLocaleString('en-NG')}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.itemQty}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.salesIncTax.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{row.discounts.toLocaleString('en-NG')}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.avgTransaction.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.netSalesIncVat.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.netSalesExcTax.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.avgMargin.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.grossMargin.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.marginPercent.toFixed(2)}%</td>
                  </tr>
                ))}
                {/* TOTAL ROW */}
                <tr className="bg-cyan-100 font-bold border-t-2 border-gray-300">
                  <td className="px-4 py-3 text-gray-800">Total:</td>
                  <td className="px-4 py-3 text-gray-800"></td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.transactionQty}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.refundQty}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.refundValue.toLocaleString('en-NG')}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.noSaleQty}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.voidedQty}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.voidedValue.toLocaleString('en-NG')}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.itemQty}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.salesIncTax.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.discounts.toLocaleString('en-NG')}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.avgTransaction.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.netSalesIncVat.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{totals.netSalesExcTax.toLocaleString('en-NG', {maximumFractionDigits: 2})}</td>
                  <td className="px-4 py-3 text-right text-gray-800">0.00</td>
                  <td className="px-4 py-3 text-right text-gray-800">0.00</td>
                  <td className="px-4 py-3 text-right text-gray-800">0.00%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

