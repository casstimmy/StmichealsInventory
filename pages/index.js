"use client";

import { Bar } from "react-chartjs-2";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { apiClient } from "@/lib/api-client";
import { motion } from "framer-motion";
import { Loader } from "@/components/ui";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/* =======================
   FORMAT HELPERS
======================= */
const formatNumber = (value = 0) => Number(value).toLocaleString("en-NG");

const formatMoney = (value = 0) => `₦${Number(value).toLocaleString("en-NG")}`;

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [storeInfo, setStoreInfo] = useState({});
  const [selectedUser, setSelectedUser] = useState("Admin");

  const [allTransactions, setAllTransactions] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  /* =======================
     FETCH DATA
  ======================= */
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [txRes, storeRes, expenseRes, orderRes] = await Promise.all([
          apiClient.get("/api/transactions/transactions"),
          apiClient.get("/api/setup/get"),
          apiClient.get("/api/expenses"),
          apiClient.get("/api/orders"),
        ]);

        setStoreInfo(storeRes.data.store || {});
        setSelectedUser(storeRes.data.user?.name || "Admin");
        setAllTransactions(txRes.data.transactions || []);
        setAllExpenses(expenseRes.data.expenses || []);
        setAllOrders(
          Array.isArray(orderRes.data?.orders) ? orderRes.data.orders : []
        );
      } catch (err) {
        console.error("Dashboard load failed:", err);
        if (err.response?.status === 500) {
          console.error("Server error details:", {
            endpoint: err.config?.url,
            status: err.response?.status,
            message: err.response?.data?.message || err.response?.data?.error,
            details: err.response?.data?.error || err.message
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  /* =======================
     DATE FILTER
  ======================= */
  const isWithinPeriod = (date) => {
    const now = new Date();
    const d = new Date(date);

    if (selectedPeriod === "today")
      return d.toDateString() === now.toDateString();

    if (selectedPeriod === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo && d <= now;
    }

    if (selectedPeriod === "month")
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );

    return true;
  };

  /* =======================
     FILTERED DATA
  ======================= */
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      const loc =
        typeof tx.location === "object" ? tx.location?.name : tx.location;

      if (selectedLocation !== "All" && loc !== selectedLocation) return false;
      return isWithinPeriod(tx.createdAt);
    });
  }, [allTransactions, selectedLocation, selectedPeriod]);

 const filteredOrders = useMemo(() => {
  if (!Array.isArray(allOrders)) return [];
  return allOrders.filter((o) => isWithinPeriod(o.createdAt));
}, [allOrders, selectedPeriod]);


  const filteredExpenses = useMemo(
    () => allExpenses.filter((e) => isWithinPeriod(e.createdAt)),
    [allExpenses, selectedPeriod]
  );

  /* =======================
     KPIs
  ======================= */
  const kpis = useMemo(() => {
    const sales = filteredTransactions.reduce(
      (sum, t) => sum + Number(t.total || 0),
      0
    );
    const count = filteredTransactions.length;

    return {
      sales,
      transactions: count,
      avg: count ? sales / count : 0,
    };
  }, [filteredTransactions]);

  /* =======================
     PRODUCT SALES
  ======================= */
  const productSales = useMemo(() => {
    const map = {};
    filteredTransactions.forEach((tx) => {
      if (!tx.items || !Array.isArray(tx.items)) return;
      tx.items.forEach((i) => {
        if (!i || !i.name) return; // Skip null items
        // Use salePriceIncTax or price, fall back to 0
        const price = Number(i.salePriceIncTax || i.price || 0);
        const quantity = Number(i.qty || i.quantity || 0);
        const amount = price * quantity;
        map[i.name] = (map[i.name] || 0) + amount;
      });
    });
    return map;
  }, [filteredTransactions]);

  /* =======================
     TOP STAFF
  ======================= */
  const topStaff = useMemo(() => {
    const map = {};
    filteredTransactions.forEach((tx) => {
      const staff = tx.staff?.name || "Unknown";
      map[staff] = (map[staff] || 0) + Number(tx.total || 0);
    });

    


    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([staff, total]) => ({ staff, total }));
  }, [filteredTransactions]);

  /* =======================
     CHART DATA
  ======================= */
  const salesByProductData = {
    labels: Object.keys(productSales),
    datasets: [
      {
        label: "Sales",
        data: Object.values(productSales),
        backgroundColor: "#06B6D4",
      },
    ],
  };

  const expenseChart = {
    labels: filteredExpenses.map((e) => e.title),
    datasets: [
      {
        label: "Expenses",
        data: filteredExpenses.map((e) => Number(e.amount || 0)),
        backgroundColor: "#ef4444",
      },
    ],
  };

  const handleTestMail = async () => {
    try {
      const response = await apiClient.post("/api/test-mail");
      alert(`✅ Test email sent successfully!\n\nSent to: ${response.data.sentTo}`);
    } catch (error) {
      alert(`❌ Failed to send test email\n\n${error.response?.data?.error || error.message}`);
    }
  };

  return (
      <div className="page-container">
        {/* Header */}
        <header className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="page-title">Welcome {selectedUser}</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              className="btn-action-primary w-full sm:w-auto"
              onClick={() => router.push("/products/new")}
            >
              + Add Product
            </button>
            <button
              className="btn-action-secondary w-full sm:w-auto"
              onClick={handleTestMail}
              title="Test mail system configuration"
            >
              📧 Test Mail
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="form-group">
            <label className="form-label">Location</label>
            <select
              className="form-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="All">All Locations</option>
              {storeInfo.locations?.map((l) => (
                <option key={l._id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Period</label>
            <select
              className="form-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {loading ? (
          <Loader size="md" text="Loading dashboard..." />
        ) : (
          <>
            {/* KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <KpiCard label="Sales" value={formatMoney(kpis.sales)} />
              <KpiCard
                label="Transactions"
                value={formatNumber(kpis.transactions)}
              />
              <KpiCard
                label="Avg Tx Value"
                value={formatMoney(kpis.avg.toFixed(2))}
              />
            </section>

            {/* Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <ChartCard title="Sales by Product">
                <Bar data={salesByProductData} />
              </ChartCard>

              <ChartCard title="Expenses Breakdown">
                <Bar data={expenseChart} />
              </ChartCard>
            </section>

            {/* Lists */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ListCard
                title="Recent Orders"
                items={filteredOrders.slice(0, 10).map((o) => ({
                  label: o.customer?.name || "Unknown",
                  meta: formatMoney(o.total),
                }))}
              />

              <ListCard
                title="Top Staff"
                items={topStaff.map((s) => ({
                  label: s.staff,
                  meta: formatMoney(s.total),
                }))}
              />

              <ListCard
                title="Expenses"
                items={filteredExpenses.map((e) => ({
                  label: e.title,
                  meta: formatMoney(e.amount),
                }))}
              />
            </section>
          </>
        )}
      </div>

  );
}

/* =======================
   UI COMPONENTS
======================= */
function KpiCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="content-card">
      <h2 className="font-semibold mb-3 text-sm md:text-base text-gray-900">{title}</h2>
      <div className="h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ListCard({ title, items }) {
  return (
    <motion.div className="content-card flex flex-col h-[250px] sm:h-[280px] md:h-[320px]">
      <h2 className="font-semibold mb-3 text-sm md:text-base text-gray-900 flex-shrink-0">{title}</h2>
      <ul className="space-y-2 overflow-y-auto flex-1">
        {items.length ? (
          items.map((i, idx) => (
            <li key={idx} className="bg-gray-50 p-2.5 sm:p-3 rounded-lg border border-gray-200 text-xs sm:text-sm hover:bg-sky-50 transition-colors">
              <div className="font-medium text-gray-900 truncate">{i.label}</div>
              <div className="text-xs text-gray-600 mt-0.5">{i.meta}</div>
            </li>
          ))
        ) : (
          <li className="text-gray-400 italic text-xs sm:text-sm py-8 text-center">No data available</li>
        )}
      </ul>
    </motion.div>
  );
}

