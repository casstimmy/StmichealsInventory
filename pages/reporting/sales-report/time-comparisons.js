import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function TimeComparisons() {
  const [data, setData] = useState(null);
  const [metric, setMetric] = useState("transactions");
  const [dateRange, setDateRange] = useState("last90");
  const [compareTo, setCompareTo] = useState("previous-week");
  const [interval, setInterval] = useState("daily");
  const [loading, setLoading] = useState(true);

  const metrics = {
    transactions: { label: "Transaction Qty", key: "transactionQty" },
    refunds: { label: "Refund Qty", key: "refundQty" },
    refundValue: { label: "Refund Value", key: "refundValue" },
    noSale: { label: "No Sale Qty", key: "noSaleQty" },
    voided: { label: "Voided Qty", key: "voidedQty" },
    voidedValue: { label: "Voided Value", key: "voidedValue" },
    itemQty: { label: "Item Qty", key: "itemQty" },
    salesIncTax: { label: "Sales Inc. Tax", key: "salesData" },
    discounts: { label: "Discounts & Promotions", key: "discounts" },
    avgTransaction: { label: "Average Transaction Net Sales", key: "avgTransaction" },
    netSalesIncVat: { label: "Net Sales Inc. Vat", key: "netSales" },
    netSalesExcTax: { label: "Net Sales Exc. Tax", key: "netSalesExc" },
    avgMargin: { label: "Average Transaction Margin", key: "avgMargin" },
    grossMargin: { label: "Gross Margin", key: "grossMargin" },
    marginPercent: { label: "Margin %", key: "marginPercent" },
    customerQty: { label: "Customer Qty", key: "customerQty" },
    ratingQty: { label: "Rating Qty", key: "ratingQty" },
    avgRating: { label: "Avg Rating", key: "avgRating" },
  };

  const getDateRangeDays = (range) => {
    const ranges = {
      today: 0,
      yesterday: 1,
      thisWeek: 7,
      thisMonth: 30,
      thisQuarter: 90,
      lastWeek: 7,
      lastMonth: 30,
      last7: 7,
      last14: 14,
      last30: 30,
      last60: 60,
      last90: 90,
    };
    return ranges[range] || 7;
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, metric, compareTo, interval]);

  async function fetchData() {
    try {
      setLoading(true);
      const days = getDateRangeDays(dateRange);

      const res1 = await fetch(`/api/transactions/transactions`);
      const txRes = await res1.json();

      if (!txRes.success || !txRes.transactions) {
        setData(null);
        setLoading(false);
        return;
      }

      // Current period
      const currentCutoff = new Date();
      currentCutoff.setDate(currentCutoff.getDate() - days);
      const currentTxs = txRes.transactions.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return txDate >= currentCutoff;
      });

      // Previous period based on compareTo selection
      let previousCutoff = new Date();
      let previousStart = new Date();

      if (compareTo === "previous-week") {
        previousCutoff.setDate(previousCutoff.getDate() - days - 7);
        previousStart.setDate(previousStart.getDate() - 7);
      } else if (compareTo === "previous-month") {
        previousCutoff.setDate(previousCutoff.getDate() - days - 30);
        previousStart.setDate(previousStart.getDate() - 30);
      } else if (compareTo === "previous-quarter") {
        previousCutoff.setDate(previousCutoff.getDate() - days - 90);
        previousStart.setDate(previousStart.getDate() - 90);
      } else if (compareTo === "previous-year") {
        previousCutoff.setDate(previousCutoff.getDate() - days - 365);
        previousStart.setDate(previousStart.getDate() - 365);
      } else if (compareTo.includes("days-ago")) {
        const daysAgo = parseInt(compareTo);
        previousCutoff.setDate(previousCutoff.getDate() - days - daysAgo);
        previousStart.setDate(previousStart.getDate() - daysAgo);
      }

      const previousTxs = txRes.transactions.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return txDate >= previousCutoff && txDate < previousStart;
      });

      // Aggregate by interval
      const period1Data = aggregateByInterval(currentTxs, interval);
      const period2Data = aggregateByInterval(previousTxs, interval);

      setData({ period1: period1Data, period2: period2Data });
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  const aggregateByInterval = (transactions, intervalType) => {
    const dateMap = {};
    transactions.forEach((tx) => {
      let groupKey;
      const txDate = new Date(tx.createdAt);

      if (intervalType === "daily") {
        groupKey = txDate.toISOString().split("T")[0];
      } else if (intervalType === "weekly") {
        const d = new Date(txDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d.setDate(diff));
        groupKey = weekStart.toISOString().split("T")[0] + " (Week)";
      } else if (intervalType === "monthly") {
        groupKey = txDate.toISOString().slice(0, 7);
      }

      if (!dateMap[groupKey]) {
        dateMap[groupKey] = {
          completed: [],
          refunded: [],
          transactionQty: 0,
          refundQty: 0,
          refundValue: 0,
          itemQty: 0,
          salesData: 0,
          discounts: 0,
        };
      }

      if (tx.status === "completed") {
        dateMap[groupKey].completed.push(tx);
        dateMap[groupKey].transactionQty += 1;
        dateMap[groupKey].itemQty += tx.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
        dateMap[groupKey].salesData += tx.total || 0;
        dateMap[groupKey].discounts += tx.discount || 0;
      } else if (tx.status === "refunded") {
        dateMap[groupKey].refunded.push(tx);
        dateMap[groupKey].refundQty += 1;
        dateMap[groupKey].refundValue += tx.total || 0;
      }
    });

    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        transactionQty: data.transactionQty,
        refundQty: data.refundQty,
        refundValue: data.refundValue,
        itemQty: data.itemQty,
        salesData: data.salesData,
        discounts: data.discounts,
      }));
  }

  if (loading) return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <svg className="animate-spin h-12 w-12 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading comparison data...</p>
        </div>
      </div>
    </Layout>
  );

  const metricKey = metrics[metric].key;
  const getMetricValue = (item) => {
    return item[metricKey] || 0;
  };

  const period1Data = data?.period1 || [];
  const period2Data = data?.period2 || [];

  const period1Total = period1Data.reduce((sum, item) => sum + getMetricValue(item), 0);
  const period2Total = period2Data.reduce((sum, item) => sum + getMetricValue(item), 0);

  return (
    <Layout title="Sales By Time">
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mb-6 text-sm">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700">Home</Link>
          <span className="mx-2 text-gray-400">›</span>
          <Link href="/reporting" className="text-cyan-600 hover:text-cyan-700">Reporting</Link>
          <span className="mx-2 text-gray-400">›</span>
          <span className="text-gray-600">Sales By Time</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Sales By Time <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded ml-2">HELP</span></h1>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Metric</label>
              <select 
                value={metric} 
                onChange={(e) => setMetric(e.target.value)}
                className="w-full border-2 border-gray-300 px-3 py-2 rounded focus:border-cyan-600"
              >
                {Object.entries(metrics).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Date Range</label>
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full border-2 border-gray-300 px-3 py-2 rounded focus:border-cyan-600"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="thisQuarter">This Quarter</option>
                <option value="lastWeek">Last Week</option>
                <option value="lastMonth">Last Month</option>
                <option value="last7">Last 7 days</option>
                <option value="last14">Last 14 days</option>
                <option value="last30">Last 30 days</option>
                <option value="last60">Last 60 days</option>
                <option value="last90">Last 90 days</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Compare To</label>
              <select 
                value={compareTo} 
                onChange={(e) => setCompareTo(e.target.value)}
                className="w-full border-2 border-gray-300 px-3 py-2 rounded focus:border-cyan-600"
              >
                <option value="previous-week">Previous Week</option>
                <option value="previous-month">Previous Month</option>
                <option value="previous-quarter">Previous Quarter</option>
                <option value="previous-year">Previous Year</option>
                <option value="7days-ago">7 days ago</option>
                <option value="14days-ago">14 days ago</option>
                <option value="30days-ago">30 days ago</option>
                <option value="60days-ago">60 days ago</option>
                <option value="90days-ago">90 days ago</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Interval</label>
              <select 
                value={interval} 
                onChange={(e) => setInterval(e.target.value)}
                className="w-full border-2 border-gray-300 px-3 py-2 rounded focus:border-cyan-600"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* CHART */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <div className="h-[300px]">
            <Line
              data={{
                labels: period1Data.map((_, i) => i + 1),
                datasets: [
                  {
                    label: "1st Period",
                    data: period1Data.map(item => getMetricValue(item)),
                    borderColor: "#06B6D4",
                    backgroundColor: "rgba(6, 182, 212, 0.1)",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                  },
                  {
                    label: "2nd Period",
                    data: period2Data.map(item => getMetricValue(item)),
                    borderColor: "#9CA3AF",
                    backgroundColor: "rgba(156, 163, 175, 0.1)",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                  },
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>

        {/* COMPARISON TABLE */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white sticky top-0">
              <tr>
                <th colSpan="2" className="px-4 py-3 text-center font-bold text-white border-r border-cyan-600">
                  1ST PERIOD
                </th>
                <th colSpan="2" className="px-4 py-3 text-center font-bold text-white">
                  2ND PERIOD
                </th>
                <th className="px-4 py-3 text-center font-bold text-white">DIFF IN PERIODS</th>
              </tr>
              <tr>
                <th className="px-4 py-3 text-left font-bold text-white border-r border-cyan-600">DATE</th>
                <th className="px-4 py-3 text-right font-bold text-white border-r border-cyan-600">{metrics[metric].label.toUpperCase()}</th>
                <th className="px-4 py-3 text-left font-bold text-white">DATE</th>
                <th className="px-4 py-3 text-right font-bold text-white">{metrics[metric].label.toUpperCase()}</th>
                <th className="px-4 py-3 text-right font-bold text-white">DIFF</th>
              </tr>
            </thead>
            <tbody>
              {Math.max(period1Data.length, period2Data.length) > 0 ? (
                Array.from({ length: Math.max(period1Data.length, period2Data.length) }).map((_, idx) => {
                  const p1 = period1Data[idx];
                  const p2 = period2Data[idx];
                  const diff = p2 && p1 ? getMetricValue(p2) - getMetricValue(p1) : 0;
                  const diffColor = diff >= 0 ? "text-green-600" : "text-red-600";

                  return (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 border-r border-gray-200">{p1?.date || "-"}</td>
                      <td className="px-4 py-3 text-right text-gray-700 border-r border-gray-200">{p1 ? getMetricValue(p1).toLocaleString('en-NG') : "-"}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{p2?.date || "-"}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{p2 ? getMetricValue(p2).toLocaleString('en-NG') : "-"}</td>
                      <td className={`px-4 py-3 text-right font-medium ${diffColor}`}>{diff > 0 ? "+" : ""}{diff.toLocaleString('en-NG')}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

