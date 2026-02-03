import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function ProductsSales() {
  const [products, setProducts] = useState([]);
  const [sortBy, setSortBy] = useState("sales");
  const [timeRange, setTimeRange] = useState("last30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [timeRange]);

  const getTimeRangeDays = (range) => {
    const daysMap = {
      today: 0,
      yesterday: 1,
      last7: 7,
      last14: 14,
      last30: 30,
      last60: 60,
      last90: 90,
      thisWeek: 7,
      thisMonth: 30,
      thisYear: 365,
      lastWeek: 14,
      lastMonth: 60,
      lastYear: 365,
    };
    return daysMap[range] || 30;
  };

  async function fetchProducts() {
    try {
      setLoading(true);
      const days = getTimeRangeDays(timeRange);
      const res = await fetch(`/api/reporting/reporting-data?location=All&period=day&days=${days}`);
      const data = await res.json();
      setProducts(data.bestSellingProducts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
          <p className="mt-4 text-gray-600 font-medium">Loading products data...</p>
        </div>
      </div>
    </Layout>
  );

  const topProducts = products.slice(0, 10);
  const totalQty = products.reduce((sum, p) => sum + (p[1] || 0), 0);

  return (
    <Layout title="Sales by Products">
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mb-6 text-sm">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700">Home</Link>
          <span className="mx-2 text-gray-400">›</span>
          <Link href="/reporting" className="text-cyan-600 hover:text-cyan-700">Reporting</Link>
          <span className="mx-2 text-gray-400">›</span>
          <span className="text-gray-600">Sales by Product</span>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📦 Sales by Products</h1>
          <p className="text-gray-600">Top performing products and their sales metrics</p>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7">Last 7 Days</option>
                <option value="last14">Last 14 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="last60">Last 60 Days</option>
                <option value="last90">Last 90 Days</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="thisYear">This Year</option>
                <option value="lastWeek">Last Week</option>
                <option value="lastMonth">Last Month</option>
                <option value="lastYear">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Products" value={products.length} icon="📦" color="pink" />
          <StatCard title="Total Units Sold" value={totalQty.toLocaleString()} icon="📊" color="rose" />
          <StatCard title="Top Product" value={topProducts[0]?.[0] || "N/A"} icon="🏆" color="amber" />
        </div>

        {/* PRODUCTS CHART */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Top 10 Products by Units Sold</h2>
          <div className="h-[400px]">
            <Bar
              data={{
                labels: topProducts.map(p => p[0]),
                datasets: [{
                  label: "Units Sold",
                  data: topProducts.map(p => p[1]),
                  backgroundColor: ["#ec4899", "#f43f5e", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#06b6d4", "#0ea5e9"],
                  borderRadius: 6,
                  borderSkipped: false,
                }]
              }}
              options={{
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } },
              }}
            />
          </div>
        </div>

        {/* PRODUCTS TABLE */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Rank</th>
                <th className="px-6 py-3 text-left font-semibold">Product Name</th>
                <th className="px-6 py-3 text-right font-semibold">Units Sold</th>
                <th className="px-6 py-3 text-right font-semibold">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"} >
                  <td className="px-6 py-3 font-bold text-pink-600">#{idx + 1}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{product[0]}</td>
                  <td className="px-6 py-3 text-right font-semibold">{product[1]}</td>
                  <td className="px-6 py-3 text-right text-gray-600">
                    {((product[1] / totalQty) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorMap = {
    pink: "bg-pink-50 border-pink-200 text-pink-700",
    rose: "bg-rose-50 border-rose-200 text-rose-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  }[color];

  return (
    <div className={`${colorMap} border-2 rounded-lg p-6 shadow-md`}>
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

