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

export default function Reporting() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeriodData();
  }, [period]);

  async function fetchPeriodData() {
    try {
      setLoading(true);
      const res = await fetch(`/api/reporting/reporting-data?location=All&period=${period}&days=30`);
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
          <p className="mt-4 text-gray-600 font-medium">Loading reporting dashboard...</p>
        </div>
      </div>
    </Layout>
  );

  const totalSales = data?.summary?.totalSales || 0;
  const avgDaily = data?.dates?.length > 0 ? totalSales / data.dates.length : 0;

  return (
    <Layout title="Reporting">
      <div className="min-h-screen bg-gray-50 p-3 md:p-6">
        <div className="mb-6 text-sm">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700">Home</Link>
          <span className="mx-2 text-gray-400">›</span>
          <span className="text-gray-600">Reporting</span>
        </div>

        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">📅 Time Period Analysis</h1>
            <p className="text-gray-600">Sales performance across different time periods</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/reporting/reporting"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
            >
              📈 Sales Report
            </Link>
            <Link 
              href="/reporting/end-of-day-report"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg"
            >
              📊 EOD Reports
            </Link>
          </div>
        </div>

        {/* PERIOD SELECTOR */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <div className="flex flex-wrap gap-3">
            {["day", "week", "month"].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition ${
                  period === p 
                    ? "bg-purple-600 text-white shadow-md" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard title="Total Sales" value={`₦${(totalSales || 0).toLocaleString('en-NG', {maximumFractionDigits: 0})}`} icon="💰" color="purple" />
          <MetricCard title="Transactions" value={data?.summary?.totalTransactions || 0} icon="💳" color="pink" />
          <MetricCard title="Avg/Period" value={`₦${(avgDaily).toLocaleString('en-NG', {maximumFractionDigits: 0})}`} icon="📊" color="violet" />
          <MetricCard title="Periods" value={data?.dates?.length || 0} icon="📅" color="rose" />
        </div>

        {/* TREND CHART */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Period Performance Trend</h2>
          <div className="h-[400px]">
            <Line
              data={{
                labels: data?.dates || [],
                datasets: [{
                  label: "Sales (₦)",
                  data: data?.salesData || [],
                  borderColor: "#06B6D4",
                  backgroundColor: "rgba(6, 182, 212, 0.1)",
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 5,
                }]
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
      </div>
    </Layout>
  );
}

function MetricCard({ title, value, icon, color }) {
  const colorMap = {
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    pink: "bg-pink-50 border-pink-200 text-pink-700",
    violet: "bg-violet-50 border-violet-200 text-violet-700",
    rose: "bg-rose-50 border-rose-200 text-rose-700",
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

