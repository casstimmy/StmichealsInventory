import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import {
  Download,
  Mail,
  Share2,
  Filter,
  BarChart2,
  PieChart as PieIcon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#3B82F6",
  "#60A5FA",
  "#93C5FD",
  "#1E3A8A",
  "#2563EB",
  "#1D4ED8",
  "#60A5FA",
];

export default function ExpenseAnalysis() {
  const [expenses, setExpenses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBarChart, setShowBarChart] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
    location: "",
  });

  useEffect(() => {
    async function fetchExpenses() {
      const res = await fetch("/api/expenses");
      if (res.ok) {
        const data = await res.json();
        // API returns { success: true, expenses: [...] }
        setExpenses(Array.isArray(data) ? data : (data.expenses || []));
      }
      setLoading(false);
    }

    async function fetchLocations() {
      try {
        const locRes = await fetch("/api/setup/get");
        const locData = await locRes.json();
        if (locData.store?.locations && Array.isArray(locData.store.locations)) {
          setLocations(locData.store.locations);
        }
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      }
    }

    fetchExpenses();
    fetchLocations();
  }, []);

  const allCategories = [
    ...new Set(expenses.map((exp) => exp.categoryName).filter(Boolean)),
  ];

  const applyFilters = (expense) => {
    const { category, minAmount, maxAmount, startDate, endDate, location } =
      filters;
    const amount = Number(expense.amount);
    const date = new Date(expense.createdAt);
    return (
      (!category || expense.categoryName === category) &&
      (!location || expense.locationName === location) &&
      (!minAmount || amount >= Number(minAmount)) &&
      (!maxAmount || amount <= Number(maxAmount)) &&
      (!startDate || date >= new Date(startDate)) &&
      (!endDate || date <= new Date(endDate))
    );
  };

  const filteredExpenses = expenses.filter(applyFilters);
  const totalSpent = filteredExpenses.reduce(
    (acc, exp) => acc + Number(exp.amount),
    0
  );

  const expensesByCategory = filteredExpenses.reduce((acc, curr) => {
    const catName = curr.categoryName || "Uncategorized";
    acc[catName] = (acc[catName] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const chartData = Object.entries(expensesByCategory).map(
    ([category, amount]) => ({
      category,
      amount,
    })
  );

  const downloadReport = async () => {
    const res = await fetch("/api/expenses/analysis");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ExpenseReport.pdf";
    a.click();
  };

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <h1 className="page-title">Expense Dashboard</h1>
            <p className="page-subtitle">
              Visualize and monitor your business expenditures in one place.
            </p>
          </div>

          {/* Filters */}
          <div className="content-card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-sky-600" /> Filter Expenses
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="form-select"
              >
                <option value="">All Categories</option>
                {allCategories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
                className="form-select"
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc._id || loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Min Amount"
                value={filters.minAmount}
                onChange={(e) =>
                  setFilters({ ...filters, minAmount: e.target.value })
                }
                className="form-input"
                onWheel={(e) => e.target.blur()}
              />
              <input
                type="number"
                placeholder="Max Amount"
                value={filters.maxAmount}
                onChange={(e) =>
                  setFilters({ ...filters, maxAmount: e.target.value })
                }
                className="form-input"
                onWheel={(e) => e.target.blur()}
              />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="form-input"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="form-input"
              />
            </div>
          </div>

          {loading ? (
            <div className="content-card text-center py-16">
              <div className="skeleton h-8 w-48 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="empty-state-container">
              <div className="empty-state-icon">📊</div>
              <p className="empty-state-text">No expenses match the selected filters.</p>
            </div>
          ) : (
            <>
              <div className="stat-card border-l-4 border-red-500">
                <h2 className="text-lg font-semibold text-gray-700">
                  Total Amount Spent
                </h2>
                <p className="stat-card-value text-red-600">
                  ₦{totalSpent.toLocaleString()}
                </p>
              </div>

              {/* Chart + List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="content-card relative">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-sky-700">
                      Category Breakdown
                    </h2>
                    <button
                      onClick={() => setShowBarChart(!showBarChart)}
                      className="btn-action p-2 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors"
                      title={
                        showBarChart
                          ? "Switch to Pie Chart"
                          : "Switch to Bar Chart"
                      }
                    >
                      {showBarChart ? (
                        <PieIcon className="w-5 h-5" />
                      ) : (
                        <BarChart2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                <ResponsiveContainer width="100%" height={320}>
                  {showBarChart ? (
                    <BarChart data={chartData}>
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) =>
                          `₦${Number(value).toLocaleString()}`
                        }
                      />
                      <Legend />
                      <Bar dataKey="amount" fill="#3B82F6">
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        label={({ name }) => name}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) =>
                          `₦${Number(value).toLocaleString()}`
                        }
                      />
                      <Legend />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>

                {/* Expense List */}
                <div className="content-card overflow-auto">
                  <h2 className="text-lg font-semibold text-sky-700 mb-4">
                    All Expenses
                  </h2>
                  <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                  {filteredExpenses
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((exp) => (
                      <li
                        key={exp._id}
                        className="flex flex-col border-b pb-2 border-gray-200"
                      >
                        <span className="font-medium text-gray-800">
                          {exp.title}
                        </span>
                        <span className="text-sm text-gray-600">
                          ₦{Number(exp.amount).toLocaleString()} -{" "}
                          {exp.categoryName || "Uncategorized"}{" "}
                          {exp.locationName && `- ${exp.locationName}`}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(exp.createdAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>

            </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mt-6">
                <button
                  onClick={downloadReport}
                  className="btn-action btn-action-primary flex items-center gap-2"
                >
                  <Download className="w-5 h-5" /> Download Report
                </button>

                <button
                  onClick={() => {
                    const subject = encodeURIComponent(`Expense Report - ${new Date().toLocaleDateString()}`);
                    const body = encodeURIComponent(
                      `Expense Report Summary\n\n` +
                      `Date: ${new Date().toLocaleDateString()}\n` +
                      `Total Expenses: ₦${totalSpent.toLocaleString()}\n` +
                      `Number of Expenses: ${filteredExpenses.length}\n\n` +
                      `Category Breakdown:\n` +
                      chartData.map(c => `• ${c.category}: ₦${c.amount.toLocaleString()}`).join('\n') +
                      `\n\nGenerated from St. Micheals Inventory System`
                    );
                    window.open(`mailto:?subject=${subject}&body=${body}`);
                  }}
                  className="btn-action btn-action-success flex items-center gap-2"
                >
                  <Mail className="w-5 h-5" /> Send via Email
                </button>

                <button
                  onClick={() => {
                    const message = encodeURIComponent(
                      `📊 *Expense Report Summary*\n\n` +
                      `📅 Date: ${new Date().toLocaleDateString()}\n` +
                      `💰 Total Expenses: ₦${totalSpent.toLocaleString()}\n` +
                      `📝 Number of Expenses: ${filteredExpenses.length}\n\n` +
                      `*Category Breakdown:*\n` +
                      chartData.map(c => `• ${c.category}: ₦${c.amount.toLocaleString()}`).join('\n') +
                      `\n\n_Generated from St. Micheals Inventory System_`
                    );
                    window.open(`https://wa.me/?text=${message}`, "_blank");
                  }}
                  className="btn-action bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                  <Share2 className="w-5 h-5" /> Share on WhatsApp
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

