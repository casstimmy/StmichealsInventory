"use client";

import Layout from "@/components/Layout";
import { Loader } from "@/components/ui";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EndOfDayReporting() {
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [locations, setLocations] = useState([]);
  const [locationMap, setLocationMap] = useState({}); // Map location names to IDs

  useEffect(() => {
    fetchData();
  }, [period, selectedLocation]);

  async function fetchData() {
    try {
      setLoading(true);
      const locationId = selectedLocation !== "All" ? locationMap[selectedLocation] : "";
      const locationParam = locationId ? `&locationId=${locationId}` : "";
      const res = await fetch(`/api/reporting/end-of-day-summary?period=${period}${locationParam}`);
      const data = await res.json();

      console.log("📊 EOD Report Data:", data); // Debug log

      if (data.success) {
        setSummary(data.summary);
        const reportsList = data.reports || [];
        setReports(reportsList);

        // Extract unique locations from summary.byLocation (already aggregated and enriched)
        if (data.summary && data.summary.byLocation && data.summary.byLocation.length > 0) {
          const locNames = data.summary.byLocation.map((loc) => loc.location).filter(Boolean);
          setLocations(locNames);
          
          // Build map of location names to names for filtering
          // (We'll filter by location name in the frontend since byLocation uses names)
          const map = {};
          locNames.forEach((name) => {
            map[name] = name;
          });
          setLocationMap(map);
        }
      } else {
        console.error("❌ API Error:", data.message);
      }
    } catch (err) {
      console.error("❌ Error fetching EOD data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <Loader size="lg" text="Loading end of day report..." />
      </Layout>
    );
  }

  if (!summary) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">No end-of-day reports available for this period.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Prepare chart data
  const dailyData = summary.dailyData || [];
  const lineChartData = {
    labels: dailyData.map((d) => d.date),
    datasets: [
      {
        label: "Daily Sales (₦)",
        data: dailyData.map((d) => d.sales),
        borderColor: "#06B6D4",
        backgroundColor: "rgba(6, 182, 212, 0.1)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Daily Transactions",
        data: dailyData.map((d) => d.transactions),
        borderColor: "#EC4899",
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        fill: false,
        yAxisID: "y1",
        tension: 0.3,
      },
    ],
  };

  const barChartData = {
    labels: summary.byLocation.map((l) => l.location),
    datasets: [
      {
        label: "Sales by Location (₦)",
        data: summary.byLocation.map((l) => l.totalSales),
        backgroundColor: "#06B6D4",
      },
      {
        label: "Transactions by Location",
        data: summary.byLocation.map((l) => l.transactions),
        backgroundColor: "#8B5CF6",
      },
    ],
  };

  const tenderData = {
    labels: Object.keys(summary.tenderBreakdown || {}),
    datasets: [
      {
        label: "Tender Breakdown",
        data: Object.values(summary.tenderBreakdown || {}),
        backgroundColor: [
          "#06B6D4",
          "#EC4899",
          "#8B5CF6",
          "#F59E0B",
          "#10B981",
          "#EF4444",
        ],
      },
    ],
  };

  return (
    <Layout>
      {loading ? (
        <Loader size="lg" text="Loading end of day report..." />
      ) : (
        <div className="page-container">
        <div className="page-content">
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">End of Day Reports</h1>
            <Link
              href="/reporting"
              className="btn-action-secondary"
            >
              ← Back to Reporting
            </Link>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-6">
            <div className="form-group">
              <label className="form-label">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="form-select"
              >
                <option value="day">Last Day</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="form-select"
              >
                <option value="All">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            <SummaryCard
              title="Total Reports"
              value={summary.totals.reports}
              icon="📋"
            />
            <SummaryCard
              title="Total Sales"
              value={`₦${summary.totals.sales.toLocaleString("en-NG", {
                maximumFractionDigits: 0,
              })}`}
              icon="💰"
            />
            <SummaryCard
              title="Total Transactions"
              value={summary.totals.transactions}
              icon="🔄"
            />
            <SummaryCard
              title="Reconciled Tills"
              value={summary.status.reconciled}
              subtext={`${summary.status.varianceNoted} with variance`}
              icon="✅"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* Daily Sales Trend */}
            <div className="content-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h2>
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  interaction: { mode: "index", intersect: false },
                  scales: {
                    y: { title: { display: true, text: "Sales (₦)" } },
                    y1: {
                      type: "linear",
                      position: "right",
                      title: { display: true, text: "Transactions" },
                    },
                  },
                }}
              />
            </div>

            {/* Tender Breakdown */}
            <div className="content-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tender Breakdown</h2>
              <Pie
                data={tenderData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "bottom" },
                  },
                }}
              />
            </div>
          </div>

          {/* By Location & Staff */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* Sales by Location */}
            <div className="content-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales by Location</h2>
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            </div>

            {/* Top Staff */}
            <div className="content-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Staff Performance</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(summary.byStaff || [])
                  .sort((a, b) => b.sales - a.sales)
                  .slice(0, 10)
                  .map((staff, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{staff.staff}</p>
                        <p className="text-sm text-gray-600">
                          {staff.reports} reports • {staff.transactions} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sky-600">
                          ₦{staff.totalSales.toLocaleString("en-NG", {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            staff.variance >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          Variance: ₦{staff.variance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Recent Reports Table */}
          <div className="content-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Staff</th>
                    <th className="text-right">Sales</th>
                    <th className="text-right">Transactions</th>
                    <th className="text-right">Variance</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.slice(0, 20).map((report, idx) => (
                    <tr
                      key={idx}
                      className={`${
                        report.status === "VARIANCE_NOTED" ? "bg-yellow-50" : ""
                      }`}
                    >
                      <td>
                        {new Date(report.closedAt).toLocaleDateString()}
                      </td>
                      <td>
                        {report.locationName || "Unknown"}
                      </td>
                      <td>{report.staffName || "N/A"}</td>
                      <td className="text-right font-medium">
                        ₦{(report.totalSales || 0).toLocaleString("en-NG", {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="text-right">
                        {report.transactionCount || 0}
                      </td>
                      <td
                        className={`text-right font-medium ${
                          (report.variance || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        ₦{(report.variance || 0).toLocaleString()}
                      </td>
                      <td className="text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.status === "RECONCILED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {report.status === "RECONCILED" ? "✅ Reconciled" : "⚠️ Variance"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      )}
    </Layout>
  );
}

function SummaryCard({ title, value, subtext, icon }) {
  return (
    <div className="stat-card border-l-4 border-sky-600">
      <div className="flex items-center justify-between">
        <div>
          <p className="stat-card-label">{title}</p>
          <p className="stat-card-value">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <p className="text-3xl md:text-4xl opacity-40">{icon}</p>
      </div>
    </div>
  );
}
