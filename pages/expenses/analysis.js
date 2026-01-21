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
    fetchExpenses();
  }, []);

  const allCategories = [
    ...new Set(expenses.map((exp) => exp.category?.name).filter(Boolean)),
  ];

  const applyFilters = (expense) => {
    const { category, minAmount, maxAmount, startDate, endDate, location } =
      filters;
    const amount = Number(expense.amount);
    const date = new Date(expense.createdAt);
    return (
      (!category || expense.category?.name === category) &&
      (!location ||
        (expense.location &&
          expense.location.toLowerCase().includes(location.toLowerCase()))) &&
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
    const catName = curr.category?.name || "Uncategorized";
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
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">
            Expense Dashboard
          </h1>
          <p className="text-gray-600 text-lg mt-1">
            Visualize and monitor your business expenditures in one place.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow border space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" /> Filter Expenses
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="p-2 border rounded text-gray-700"
            >
              <option value="">All Categories</option>
              {allCategories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
              className="p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Min Amount"
              value={filters.minAmount}
              onChange={(e) =>
                setFilters({ ...filters, minAmount: e.target.value })
              }
              className="p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Max Amount"
              value={filters.maxAmount}
              onChange={(e) =>
                setFilters({ ...filters, maxAmount: e.target.value })
              }
              className="p-2 border rounded"
            />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="p-2 border rounded"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="p-2 border rounded"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-600 font-medium py-16">
            Loading expenses...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center text-gray-500 font-medium py-16">
            No expenses match the selected filters.
          </div>
        ) : (
          <>
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold text-gray-900">
                Total Amount Spent
              </h2>
              <p className="text-3xl font-bold text-red-600 mt-2">
                ₦{totalSpent.toLocaleString()}
              </p>
            </div>

            {/* Chart + List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow border border-gray-200 relative">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-cyan-700">
                    Category Breakdown
                  </h2>
                  <button
                    onClick={() => setShowBarChart(!showBarChart)}
                    className="text-cyan-600 hover:text-gray-900"
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
              <div className="bg-white p-6 rounded-xl shadow border border-gray-200 overflow-auto">
                <h2 className="text-lg font-semibold text-cyan-700 mb-4">
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
                          {exp.category?.name || "Uncategorized"}{" "}
                          {exp.location && `- ${exp.location}`}
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
                className="flex items-center gap-2 bg-cyan-600 text-white px-5 py-3 rounded-lg font-medium shadow hover:bg-cyan-700 transition"
              >
                <Download className="w-5 h-5" /> Download Report
              </button>

              <button
                onClick={() =>
                  window.open(
                    "mailto:?subject=Expense Report&body=Please find attached the expense report."
                  )
                }
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-lg font-medium shadow hover:bg-green-700 transition"
              >
                <Mail className="w-5 h-5" /> Send via Email
              </button>

              <button
                onClick={() =>
                  window.open(
                    "https://wa.me/?text=Download%20your%20expense%20report%20here:%20https://yourdomain.com/reports/ExpenseReport.pdf",
                    "_blank"
                  )
                }
                className="flex items-center gap-2 bg-gray-800 text-white px-5 py-3 rounded-lg font-medium shadow hover:bg-gray-900 transition"
              >
                <Share2 className="w-5 h-5" /> Share on WhatsApp
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

