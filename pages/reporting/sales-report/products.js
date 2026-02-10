import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import { formatCurrency, formatNumber } from "@/lib/format";
import { isInTimeRange } from "@/lib/dateFilter";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

export default function ProductsSales() {
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState("last7");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [timeRange]);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/transactions");
      const txRes = await res.json();
      if (!txRes.success || !txRes.transactions) { setData(null); setLoading(false); return; }

      const filteredTx = txRes.transactions.filter((tx) => {
        return tx.status === "completed" && isInTimeRange(tx.createdAt, timeRange);
      });

      const productMap = {};
      filteredTx.forEach((tx) => {
        (tx.items || []).forEach((item) => {
          const name = item.name || "Unknown";
          if (!productMap[name]) productMap[name] = { name, totalSales: 0, unitsSold: 0 };
          productMap[name].totalSales += (item.salePriceIncTax || item.price || 0) * (item.qty || 0);
          productMap[name].unitsSold += item.qty || 0;
        });
      });

      const products = Object.values(productMap).sort((a, b) => b.totalSales - a.totalSales);
      const totalSales = products.reduce((s, p) => s + p.totalSales, 0);
      const totalUnits = products.reduce((s, p) => s + p.unitsSold, 0);

      setData({
        products,
        totalSales,
        totalUnits,
        totalProducts: products.length,
        avgPerProduct: products.length > 0 ? totalSales / products.length : 0,
      });
    } catch (err) { console.error("Error fetching data:", err); }
    finally { setLoading(false); }
  }

  const chartColors = [
    "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6",
    "#ef4444", "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
  ];

  const top10 = data ? data.products.slice(0, 10) : [];
  const barData = data ? {
    labels: top10.map((p) => p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name),
    datasets: [{
      label: "Total Sales",
      data: top10.map((p) => p.totalSales),
      backgroundColor: chartColors.slice(0, top10.length),
      borderRadius: 6,
    }],
  } : null;

  return (
    <Layout title="Sales By Product">
      <div className="page-container">
        <div className="page-content">
          {/* Breadcrumb */}
          <div className="mb-6 text-sm text-gray-600">
            <Link href="/" className="text-cyan-600 hover:text-cyan-700">Home</Link>
            <span className="mx-2 text-gray-400">{">"}</span>
            <Link href="/reporting" className="text-cyan-600 hover:text-cyan-700">Reporting</Link>
            <span className="mx-2 text-gray-400">{">"}</span>
            <span className="text-gray-800 font-medium">Products</span>
          </div>

          <div className="page-header">
            <h1 className="page-title">Sales By Product</h1>
            <p className="page-subtitle">Product performance analysis</p>
          </div>

          {/* Filters */}
          <div className="content-card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Show data from</label>
                <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="form-select">
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7">Last 7 days</option>
                  <option value="last14">Last 14 days</option>
                  <option value="last30">Last 30 days</option>
                  <option value="last60">Last 60 days</option>
                  <option value="last90">Last 90 days</option>
                  <option value="thisWeek">This Week</option>
                  <option value="lastWeek">Last Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="lastYear">Last Year</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="content-card">
              <Loader size="md" text="Loading product data..." />
            </div>
          ) : data ? (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard title="Total Sales" value={formatCurrency(data.totalSales)} icon="💰" color="sky" />
                <MetricCard title="Total Units Sold" value={formatNumber(data.totalUnits)} icon="📦" color="emerald" />
                <MetricCard title="Unique Products" value={formatNumber(data.totalProducts)} icon="🏷️" color="amber" />
                <MetricCard title="Avg Per Product" value={formatCurrency(data.avgPerProduct)} icon="📊" color="purple" />
              </div>

              {/* Top 10 Chart */}
              <div className="content-card mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Products by Sales</h3>
                <div style={{ maxHeight: "400px" }}>
                  {barData && (
                    <Bar
                      data={barData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        indexAxis: "y",
                        plugins: { legend: { display: false } },
                        scales: { x: { beginAtZero: true } },
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Products Table */}
              <div className="data-table-container">
                <table className="data-table">
                  <thead className="sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Rank</th>
                      <th className="px-4 py-3 text-left font-semibold">Product</th>
                      <th className="px-4 py-3 text-right font-semibold">Units Sold</th>
                      <th className="px-4 py-3 text-right font-semibold">Total Sales</th>
                      <th className="px-4 py-3 text-right font-semibold">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.products.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        <p className="text-lg font-medium">No products found</p>
                        <p className="text-sm mt-1">Try adjusting your time range filter</p>
                      </td></tr>
                    ) : data.products.map((prod, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 font-medium text-gray-800">#{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{prod.name}</td>
                        <td className="px-4 py-3 text-right">{formatNumber(prod.unitsSold)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(prod.totalSales)}</td>
                        <td className="px-4 py-3 text-right">
                          {data.totalSales > 0 ? ((prod.totalSales / data.totalSales) * 100).toFixed(1) : "0.0"}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="content-card text-center text-gray-500 py-12">No data available for the selected filters.</div>
          )}
        </div>
      </div>
    </Layout>
  );
}

