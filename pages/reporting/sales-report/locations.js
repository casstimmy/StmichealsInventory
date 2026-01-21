import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

export default function LocationsSales() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocationData();
  }, []);

  async function fetchLocationData() {
    try {
      setLoading(true);
      const res = await fetch("/api/reporting/reporting-data?location=All&period=day&days=30");
      setData(await res.json());
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
          <p className="mt-4 text-gray-600 font-medium">Loading locations data...</p>
        </div>
      </div>
    </Layout>
  );

  const locations = data?.salesByLocation || {};
  const locationArray = Object.entries(locations).map(([name, sales]) => ({ name, sales })).sort((a, b) => b.sales - a.sales);
  const totalSales = Object.values(locations).reduce((sum, v) => sum + v, 0);

  return (
    <Layout title="Sales by Location">
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mb-6 text-sm">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700">Home</Link>
          <span className="mx-2 text-gray-400">›</span>
          <Link href="/reporting" className="text-cyan-600 hover:text-cyan-700">Reporting</Link>
          <span className="mx-2 text-gray-400">›</span>
          <span className="text-gray-600">Locations</span>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏪 Sales by Location</h1>
          <p className="text-gray-600">Branch and store performance analysis</p>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Locations" value={locationArray.length} icon="🏪" color="orange" />
          <StatCard title="Total Sales" value={`₦${(totalSales).toLocaleString('en-NG', {maximumFractionDigits: 0})}`} icon="💰" color="amber" />
          <StatCard title="Top Location" value={locationArray[0]?.name || "N/A"} icon="🏆" color="yellow" />
          <StatCard title="Avg/Location" value={`₦${(totalSales / locationArray.length).toLocaleString('en-NG', {maximumFractionDigits: 0})}`} icon="📊" color="red" />
        </div>

        {/* PIE CHART */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sales Distribution by Location</h2>
          <div className="h-[400px]">
            <Pie
              data={{
                labels: locationArray.map(l => l.name),
                datasets: [{
                  data: locationArray.map(l => l.sales),
                  backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
                  borderColor: "#fff",
                  borderWidth: 2,
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom", labels: { padding: 15 } },
                },
              }}
            />
          </div>
        </div>

        {/* BAR CHART */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Location Revenue Comparison</h2>
          <div className="h-[400px]">
            <Bar
              data={{
                labels: locationArray.map(l => l.name),
                datasets: [{
                  label: "Sales (₦)",
                  data: locationArray.map(l => l.sales),
                  backgroundColor: "#06B6D4",
                  borderRadius: 8,
                  borderSkipped: false,
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>

        {/* LOCATIONS TABLE */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Rank</th>
                <th className="px-6 py-3 text-left font-semibold">Location</th>
                <th className="px-6 py-3 text-right font-semibold">Total Sales</th>
                <th className="px-6 py-3 text-right font-semibold">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {locationArray.map((location, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-3 font-bold text-orange-600">#{idx + 1}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{location.name}</td>
                  <td className="px-6 py-3 text-right font-semibold">₦{location.sales.toLocaleString('en-NG')}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{((location.sales / totalSales) * 100).toFixed(1)}%</td>
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
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    red: "bg-red-50 border-red-200 text-red-700",
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

