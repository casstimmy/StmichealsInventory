import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import Layout from "@/components/Layout";
import Loader from "@/components/Loader";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

export default function Reporting() {
  const [report, setReport] = useState(null);
  const [location, setLocation] = useState("All");
  const [period, setPeriod] = useState("DAY");
  const [timeRange, setTimeRange] = useState("Last 14 days");

  // Map time range to days
  const getTimeDays = (range) => {
    const rangeMap = {
      "Last 7 days": 7,
      "Last 14 days": 14,
      "Last 30 days": 30,
      "Last 90 days": 90,
      "This month": 30,
      "Last month": 30,
    };
    return rangeMap[range] || 14;
  };

  useEffect(() => {
    async function load() {
      const days = getTimeDays(timeRange);
      const periodLower = period.toLowerCase();
      const res = await fetch(
        `/api/reporting/reporting-data?location=${location}&period=${periodLower}&days=${days}`
      );
      setReport(await res.json());
    }
    load();
  }, [location, period, timeRange]);

  if (!report) return <Layout><div className="min-h-screen flex items-center justify-center"><Loader size="md" text="Loading report data..." /></div></Layout>;

  const { 
    dates = [], 
    salesData = [], 
    transactionQty = [], 
    salesByTender = {}, 
    salesByLocation = {}, 
    bestSellingProducts = [], 
    summary = {} 
  } = report;

  // Filter location names - handle both string and object formats, include online
  let locationNames = Object.keys(salesByLocation || {}).filter(Boolean);
  // Ensure online is always included if it has data
  if (salesByLocation?.online && !locationNames.includes("online")) {
    locationNames = ["online", ...locationNames];
  } else if (locationNames.length > 0 && !locationNames.includes("online")) {
    // Ensure online is always first in the list
    locationNames = locationNames.sort((a, b) => {
      if (a === "online") return -1;
      if (b === "online") return 1;
      return a.localeCompare(b);
    });
  }

  return (
    <Layout title="Reporting">
      <div className="min-h-screen bg-gray-50 p-3 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start gap-3">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Sales Report</h1>
              <p className="text-xs md:text-base text-gray-600 mt-2">Track your business performance and metrics in real-time</p>
            </div>
            <a
              href="/reporting/end-of-day-report"
              className="px-4 md:px-6 py-2 md:py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-md transition text-sm md:text-base whitespace-nowrap"
            >
              📊 EOD Reports
            </a>
          </div>

          {/* FILTER BAR */}
          <div className="bg-white rounded-lg shadow-lg p-3 md:p-6 mb-6 md:mb-8">
            <div className="flex flex-col gap-3 md:gap-4">
              {/* First row: Location and Time Range */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                {/* Location Dropdown */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">Location</label>
                  <select 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    className="w-full border border-gray-300 px-2 md:px-3 py-2 md:py-2.5 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition text-xs md:text-sm font-medium text-gray-700 bg-white"
                  >
                    <option value="All">All Locations</option>
                    <option value="online">Online</option>
                    {locationNames.map((l) => (
                      l !== "online" && <option key={l} value={l}>{l || "Unknown"}</option>
                    ))}
                  </select>
                </div>

                {/* Time Range Dropdown */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">Time Range</label>
                  <select 
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value)} 
                    className="w-full border border-gray-300 px-2 md:px-3 py-2 md:py-2.5 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition text-xs md:text-sm font-medium text-gray-700 bg-white"
                  >
                    <option value="Last 7 days">Last 7 days</option>
                    <option value="Last 14 days">Last 14 days</option>
                    <option value="Last 30 days">Last 30 days</option>
                    <option value="Last 90 days">Last 90 days</option>
                    <option value="This month">This month</option>
                    <option value="Last month">Last month</option>
                  </select>
                </div>
              </div>

              {/* Second row: Period Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <label className="text-xs md:text-sm font-bold text-gray-700">Period:</label>
                <div className="flex gap-1 md:gap-2 flex-wrap">
                  {["MONTH", "WEEK", "DAY", "HOURLY"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-2 md:px-4 py-1 md:py-2 rounded-lg text-xs font-bold transition-all ${
                        period === p 
                          ? "bg-cyan-600 text-white shadow-md" 
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card 
            title="Total Sales" 
            value={`₦${((summary?.totalSales || 0)).toLocaleString()}`}
            icon="📊"
            color="blue"
          />
          <Card 
            title="Transactions" 
            value={summary?.totalTransactions || 0}
            icon="💳"
            color="green"
          />
          <Card 
            title="Gross Margin" 
            value={`₦${((summary?.grossMargin || 0)).toLocaleString()}`}
            icon="💰"
            color="purple"
          />
          <Card 
            title="Operating Margin" 
            value={`${Math.round(summary?.operatingMargin || 0)}%`}
            icon="📈"
            color="orange"
          />
        </div>

        {/* SALES LINE CHART */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sales Trend</h2>
          <div className="h-[400px]">
            <Line
              data={{
                labels: dates || [],
                datasets: [
                  {
                    label: "Sales (₦)",
                    data: salesData || [],
                    borderColor: "#06B6D4",
                    backgroundColor: "rgba(8,145,178,0.1)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: "#06B6D4",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                  },
                  {
                    label: "Transactions",
                    data: transactionQty || [],
                    borderColor: "#F97316",
                    borderWidth: 2,
                    yAxisID: "y1",
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: "top",
                    labels: {
                      usePointStyle: true,
                      padding: 20,
                      font: { size: 12, weight: "500" },
                    },
                  },
                },
                scales: {
                  y: { 
                    beginAtZero: true,
                    title: { display: true, text: "Sales (₦)" },
                  },
                  y1: { 
                    position: "right", 
                    beginAtZero: true,
                    title: { display: true, text: "Transaction Count" },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* LOWER CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PieChart title="Tender Split" data={salesByTender || {}} />
          <BarChart title="Sales by Location" data={salesByLocation || {}} />
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Top Products</h3>
            <div className="h-[300px]">
              <Bar
                data={{
                  labels: (bestSellingProducts || []).map((p) => p[0] || "Unknown"),
                  datasets: [
                    {
                      label: "Units Sold",
                      data: (bestSellingProducts || []).map((p) => p[1]),
                      backgroundColor: [
                        "#3b82f6",
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                        "#8b5cf6",
                      ],
                      borderRadius: 8,
                      borderSkipped: false,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: "y",
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: { beginAtZero: true },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
}

function Card({ title, value, icon, color }) {
  const colorClass = {
    blue: "bg-cyan-50 border-l-4 border-cyan-600",
    green: "bg-green-50 border-l-4 border-green-600",
    purple: "bg-purple-50 border-l-4 border-purple-600",
    orange: "bg-orange-50 border-l-4 border-orange-600",
  }[color] || "bg-gray-50 border-l-4 border-gray-600";

  return (
    <div className={`${colorClass} bg-white rounded-lg shadow-lg p-3 md:p-6 transition hover:shadow-xl`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs md:text-sm font-semibold text-gray-600">{title}</p>
          <p className="text-xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2 break-words">{value}</p>
        </div>
        <div className="text-2xl md:text-4xl opacity-30 flex-shrink-0">{icon}</div>
      </div>
    </div>
  );
}

function PieChart({ title, data }) {
  let labels = Object.keys(data || {}).filter(Boolean);
  let values = labels.map(l => data[l] || 0);

  // Format labels for display
  const displayLabels = labels.map(l => {
    if (l === "online" || l === "web") return "🌐 Web Payment";
    if (l === "cash") return "💵 Cash";
    if (l === "card") return "💳 Card";
    if (l === "transfer") return "💸 Transfer";
    return l.charAt(0).toUpperCase() + l.slice(1);
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <div className="h-[300px]">
        <Pie 
          data={{ 
            labels: displayLabels.length > 0 ? displayLabels : ["No Data"], 
            datasets: [{ 
              data: values.length > 0 ? values : [1],
              backgroundColor: [
                "#0891B2",
                "#10b981",
                "#f59e0b",
                "#ef4444",
                "#8b5cf6",
                "#ec4899",
              ],
              borderColor: "#fff",
              borderWidth: 2,
            }] 
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: { padding: 15, font: { size: 11 } },
              },
            },
          }}
        />
      </div>
    </div>
  );
}

function BarChart({ title, data }) {
  let labels = Object.keys(data || {}).filter(Boolean);
  const values = Object.values(data || {});

  // Sort labels: online first, then others alphabetically
  labels = labels.sort((a, b) => {
    if (a === "online") return -1;
    if (b === "online") return 1;
    return a.localeCompare(b);
  });

  // Format labels for display (capitalize first letter, add emoji for online)
  const displayLabels = labels.map(l => {
    if (l === "online") return "🌐 Online";
    return l.charAt(0).toUpperCase() + l.slice(1);
  });

  // Reorder values to match sorted labels
  const sortedValues = labels.map(l => data[l] || 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <div className="h-[300px]">
        <Bar 
          data={{ 
            labels: displayLabels.length > 0 ? displayLabels : ["No Data"], 
            datasets: [{ 
              label: "Sales (₦)",
              data: sortedValues.length > 0 ? sortedValues : [0],
              backgroundColor: "#06B6D4",
              borderRadius: 8,
              borderSkipped: false,
            }] 
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true, position: "top" },
            },
            scales: { y: { beginAtZero: true } },
          }}
        />
      </div>
    </div>
  );
}

