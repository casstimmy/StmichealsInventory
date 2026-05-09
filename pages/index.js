"use client";

import { Bar } from "react-chartjs-2";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { apiClient } from "@/lib/api-client";
import { showAlertDialog } from "@/lib/dialogs";
import { motion } from "framer-motion";
import { Loader } from "@/components/ui";
import useProgress from "@/lib/useProgress";
import { getCachedSetup } from "@/lib/setupCache";
import { formatCurrency, formatNumber } from "@/lib/format";
import { aggregateProductSales } from "@/lib/product-sales-report";
import {
  ArrowRight,
  ChevronDown,
  List,
  Mail,
  PackagePlus,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
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

const PERIOD_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  lastWeek: "Last Week",
  month: "This Month",
  lastMonth: "Last Month",
  custom: "Custom Period",
};

function resolveLocationName(record) {
  const rawLocation =
    record?.locationName ??
    record?.location ??
    record?.storeLocation ??
    null;

  if (typeof rawLocation === "string") {
    return rawLocation;
  }

  if (rawLocation && typeof rawLocation === "object") {
    if (typeof rawLocation.name === "string") return rawLocation.name;
    if (typeof rawLocation.label === "string") return rawLocation.label;
  }

  return null;
}

function matchesSelectedLocation(record, selectedLocation) {
  if (selectedLocation === "All") return true;
  return resolveLocationName(record) === selectedLocation;
}

export default function Home() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const { progress, start, onFetch, onProcess, complete } = useProgress();
  const [lastRefresh, setLastRefresh] = useState(null);

  const [storeInfo, setStoreInfo] = useState({});
  const [selectedUser, setSelectedUser] = useState("Admin");

  const [allTransactions, setAllTransactions] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  /* =======================
     FETCH DATA (Optimized with caching + parallel calls)
  ======================= */
  async function fetchDashboardData() {
    try {
      setLoading(true);
      start();

      // Use cached setup (24-hour TTL) to avoid unnecessary API call
      const setupData = await getCachedSetup();
      setStoreInfo(setupData?.store || {});
      setSelectedUser(setupData?.user?.name || "Admin");

      // Fetch transactional data in parallel (cannot cache - changes frequently)
      onFetch();
      const [txRes, expenseRes, orderRes] = await Promise.all([
        apiClient.get("/api/transactions/transactions"),
        apiClient.get("/api/expenses"),
        apiClient.get("/api/orders"),
      ]);

      onProcess();
      setAllTransactions(txRes.data.transactions || []);
      setAllExpenses(expenseRes.data.expenses || []);
      setAllOrders(
        Array.isArray(orderRes.data?.orders) ? orderRes.data.orders : []
      );
      
      setLastRefresh(new Date());
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
      complete();
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* =======================
     DATE FILTER
  ======================= */
  const isWithinPeriod = (date) => {
    const now = new Date();
    const d = new Date(date);

    if (selectedPeriod === "today")
      return d.toDateString() === now.toDateString();

    if (selectedPeriod === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return d.toDateString() === yesterday.toDateString();
    }

    if (selectedPeriod === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo && d <= now;
    }

    if (selectedPeriod === "lastWeek") {
      const lastWeekStart = new Date();
      lastWeekStart.setDate(now.getDate() - 14);
      const lastWeekEnd = new Date();
      lastWeekEnd.setDate(now.getDate() - 7);
      return d >= lastWeekStart && d <= lastWeekEnd;
    }

    if (selectedPeriod === "month")
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );

    if (selectedPeriod === "lastMonth") {
      const lastMonth = new Date();
      lastMonth.setMonth(now.getMonth() - 1);
      return (
        d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear()
      );
    }

    if (selectedPeriod === "custom") {
      if (!customDateRange.startDate || !customDateRange.endDate) return true;
      const start = new Date(customDateRange.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customDateRange.endDate);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }

    return true;
  };

  /* =======================
     FILTERED DATA
  ======================= */
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      if (tx.status !== "completed") return false;
      if (!matchesSelectedLocation(tx, selectedLocation)) return false;
      return isWithinPeriod(tx.createdAt);
    });
  }, [allTransactions, selectedLocation, selectedPeriod, customDateRange]);

  const heldTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      if (tx.status !== "held") return false;
      if (!matchesSelectedLocation(tx, selectedLocation)) return false;
      return isWithinPeriod(tx.createdAt);
    });
  }, [allTransactions, selectedLocation, selectedPeriod, customDateRange]);

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(allOrders)) return [];

    return allOrders.filter((order) => {
      if (!matchesSelectedLocation(order, selectedLocation)) return false;
      return isWithinPeriod(order.createdAt);
    });
  }, [allOrders, selectedLocation, selectedPeriod, customDateRange]);

  const filteredExpenses = useMemo(
    () =>
      allExpenses.filter((expense) => {
        if (!matchesSelectedLocation(expense, selectedLocation)) return false;
        return isWithinPeriod(expense.expenseDate || expense.createdAt);
      }),
    [allExpenses, selectedLocation, selectedPeriod, customDateRange]
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
    const heldCount = heldTransactions.length;
    const heldTotal = heldTransactions.reduce(
      (sum, t) => sum + Number(t.total || 0),
      0
    );

    return {
      sales,
      transactions: count,
      avg: count ? sales / count : 0,
      heldCount,
      heldTotal,
    };
  }, [filteredTransactions, heldTransactions]);

  /* =======================
     PRODUCT SALES
  ======================= */
  const productSales = useMemo(() => {
    return aggregateProductSales(filteredTransactions);
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
    labels: productSales.map((product) => product.name),
    datasets: [
      {
        label: "Sales",
        data: productSales.map((product) => product.totalSales),
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

  const handleDailyMail = async () => {
    try {
      const response = await apiClient.post("/api/daily-mail");
      await showAlertDialog({
        title: "Daily email sent",
        message: `Sent to: ${response.data.sentTo}`,
        tone: "success",
      });
    } catch (error) {
      await showAlertDialog({
        title: "Daily email failed",
        message: error.response?.data?.error || error.message,
        tone: "danger",
      });
    }
  };

  const dashboardHeading = storeInfo?.name || selectedUser;
  const periodLabel = PERIOD_LABELS[selectedPeriod] || "Selected Period";
  const locationLabel = selectedLocation === "All" ? "All Locations" : selectedLocation;
  const quickActions = [
    {
      label: "Add products",
      icon: PackagePlus,
      onClick: () => router.push("/products/new"),
    },
    {
      label: "Stock",
      icon: List,
      onClick: () => router.push("/stock/management"),
    },
    {
      label: "Purchase order",
      icon: ShoppingCart,
      onClick: () => router.push("/manage/purchase-orders"),
    },
  ];

  return (
    <div className="page-container bg-[#f5f7fb]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
        <section className="flex flex-col gap-6">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.5rem]">
                Hi, {dashboardHeading}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {lastRefresh && (
                  <span>Last updated {lastRefresh.toLocaleTimeString()}</span>
                )}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
                  onClick={handleDailyMail}
                  title="Send daily mail report"
                >
                  <Mail className="h-4 w-4" />
                  Mail report
                </button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {quickActions.map((action) => (
              <QuickActionTile
                key={action.label}
                label={action.label}
                icon={action.icon}
                onClick={action.onClick}
              />
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-[1.9rem] font-semibold tracking-tight text-slate-950">
                Key trading metrics
              </h2>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <FilterSelect
                label="Location"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="All">All Locations</option>
                {storeInfo.locations?.map((location) => (
                  <option key={location._id} value={location.name}>
                    {location.name}
                  </option>
                ))}
              </FilterSelect>

              <FilterSelect
                label="Time period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="lastWeek">Last Week</option>
                <option value="month">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Period</option>
              </FilterSelect>

              <button
                type="button"
                className="inline-flex h-[62px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-base font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={fetchDashboardData}
                disabled={loading}
                title="Refresh dashboard data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {selectedPeriod === "custom" && (
            <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-4 py-4 sm:grid-cols-2 sm:px-6">
              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Start Date
                </span>
                <input
                  type="date"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  value={customDateRange.startDate}
                  onChange={(e) =>
                    setCustomDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  End Date
                </span>
                <input
                  type="date"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  value={customDateRange.endDate}
                  onChange={(e) =>
                    setCustomDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
          )}

          {loading ? (
            <div className="px-4 py-10 sm:px-6">
              <Loader size="md" text="Loading dashboard..." progress={progress} />
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 gap-4 p-4 md:grid-cols-2 sm:p-6 ${
                kpis.heldCount > 0 ? "xl:grid-cols-4" : "xl:grid-cols-3"
              }`}
            >
              <MetricCard
                label="Sales"
                value={formatCurrency(kpis.sales)}
                detail={`${periodLabel} • ${locationLabel}`}
                linkLabel="Sales breakdown"
                onClick={() => router.push("/reporting/reporting")}
              />
              <MetricCard
                label="Transactions"
                value={formatNumber(kpis.transactions)}
                detail={`${periodLabel} • ${locationLabel}`}
                linkLabel="Transactions report"
                onClick={() => router.push("/reporting/transaction-report")}
              />
              <MetricCard
                label="Avg. transaction value"
                value={formatCurrency(kpis.avg.toFixed(2))}
                detail={`${formatNumber(kpis.transactions)} completed sales`}
              />
              {kpis.heldCount > 0 && (
                <MetricCard
                  label="Held transactions"
                  value={`${kpis.heldCount} (${formatCurrency(kpis.heldTotal)})`}
                  detail="Excluded from sales and average KPIs"
                  linkLabel="Transactions report"
                  onClick={() => router.push("/reporting/transaction-report")}
                />
              )}
            </div>
          )}
        </section>

        {!loading && (
          <>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard
                title="Sales by Product"
                onViewMore={() => router.push("/reporting/reporting")}
              >
                <Bar data={salesByProductData} />
              </ChartCard>

              <ChartCard
                title="Expenses Breakdown"
                onViewMore={() => router.push("/expenses/analysis")}
              >
                <Bar data={expenseChart} />
              </ChartCard>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ListCard
                title="Recent Orders"
                emptyMessage={
                  selectedLocation === "All"
                    ? "No data available"
                    : "No location-tagged orders available for this location."
                }
                items={filteredOrders.slice(0, 10).map((order) => ({
                  label: order.customer?.name || "Unknown",
                  meta: formatCurrency(order.total),
                }))}
              />

              <ListCard
                title="Top Staff"
                items={topStaff.map((staffItem) => ({
                  label: staffItem.staff,
                  meta: formatCurrency(staffItem.total),
                }))}
              />

              <ListCard
                title="Expenses"
                items={filteredExpenses.map((expense) => ({
                  label: expense.title,
                  meta: formatCurrency(expense.amount),
                }))}
              />
            </section>
          </>
        )}
      </div>
    </div>

  );
}

/* =======================
   UI COMPONENTS
======================= */
function QuickActionTile({ label, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      className="group flex min-h-[88px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-800">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-xl font-medium tracking-tight text-slate-950">
          {label}
        </span>
      </div>
      <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-slate-900" />
    </button>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="min-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <div className="relative">
        <select
          className="w-full appearance-none bg-transparent pr-8 text-lg font-medium text-slate-950 outline-none"
          value={value}
          onChange={onChange}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </label>
  );
}

function MetricCard({ label, value, detail, linkLabel, onClick }) {
  return (
    <div className="flex min-h-[210px] flex-col rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="text-[1.35rem] font-semibold tracking-tight text-slate-950">
        {label}
      </div>
      <div className="mt-3 text-[2.65rem] font-semibold leading-none tracking-tight text-slate-950">
        {value}
      </div>
      <div className="mt-4 text-sm text-slate-500">{detail}</div>
      {linkLabel && onClick ? (
        <button
          type="button"
          className="mt-auto pt-10 text-left text-[1.05rem] font-medium text-blue-700 transition hover:text-blue-800"
          onClick={onClick}
        >
          {linkLabel}
        </button>
      ) : (
        <div className="mt-auto pt-10" />
      )}
    </div>
  );
}

function ChartCard({ title, children, onViewMore }) {
  return (
    <div className="content-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-sm md:text-base text-gray-900">{title}</h2>
        {onViewMore && (
          <button
            type="button"
            className="btn-action-secondary !py-1.5 !px-3 text-xs"
            onClick={onViewMore}
          >
            View More
          </button>
        )}
      </div>
      <div className="h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ListCard({ title, items, emptyMessage = "No data available" }) {
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
          <li className="text-gray-400 italic text-xs sm:text-sm py-8 text-center">{emptyMessage}</li>
        )}
      </ul>
    </motion.div>
  );
}



