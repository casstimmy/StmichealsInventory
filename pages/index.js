"use client";

import { Bar, Line } from "react-chartjs-2";
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
  ChevronUp,
  List,
  Mail,
  PackagePlus,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
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

const COMPARISON_LABELS = {
  today:     { current: "Today",        prev: "Week Before" },
  yesterday: { current: "Yesterday",    prev: "Week Before" },
  week:      { current: "This Week",    prev: "Last Week" },
  lastWeek:  { current: "Last Week",    prev: "Week Before" },
  month:     { current: "This Month",   prev: "Last Month" },
  lastMonth: { current: "Last Month",   prev: "Month Before" },
  custom:    { current: "Selected",     prev: null },
};

function computeTrend(current, previous) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { direction: "up", label: "+100%" };
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return {
    direction: pct >= 0 ? "up" : "down",
    label: `${sign}${pct.toFixed(2)}%`,
  };
}

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
  const [salesChartOpen, setSalesChartOpen] = useState(true);

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

  const isInPrevPeriod = (date) => {
    const now = new Date();
    const d = new Date(date);
    if (selectedPeriod === "today") {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return d.toDateString() === yesterday.toDateString();
    }
    if (selectedPeriod === "yesterday") {
      const dayBefore = new Date();
      dayBefore.setDate(now.getDate() - 2);
      return d.toDateString() === dayBefore.toDateString();
    }
    if (selectedPeriod === "week") {
      const s = new Date(); s.setDate(now.getDate() - 14);
      const e = new Date(); e.setDate(now.getDate() - 7);
      return d >= s && d <= e;
    }
    if (selectedPeriod === "lastWeek") {
      const s = new Date(); s.setDate(now.getDate() - 21);
      const e = new Date(); e.setDate(now.getDate() - 14);
      return d >= s && d <= e;
    }
    if (selectedPeriod === "month") {
      const lm = new Date(); lm.setMonth(now.getMonth() - 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    }
    if (selectedPeriod === "lastMonth") {
      const tm = new Date(); tm.setMonth(now.getMonth() - 2);
      return d.getMonth() === tm.getMonth() && d.getFullYear() === tm.getFullYear();
    }
    return false;
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

  const prevFilteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      if (tx.status !== "completed") return false;
      if (!matchesSelectedLocation(tx, selectedLocation)) return false;
      return isInPrevPeriod(tx.createdAt);
    });
  }, [allTransactions, selectedLocation, selectedPeriod]);

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

  const prevKpis = useMemo(() => {
    const sales = prevFilteredTransactions.reduce(
      (sum, t) => sum + Number(t.total || 0),
      0
    );
    const count = prevFilteredTransactions.length;
    return { sales, transactions: count, avg: count ? sales / count : 0 };
  }, [prevFilteredTransactions]);

  /* =======================
     SALES TREND CHART DATA
  ======================= */
  const salesChartData = useMemo(() => {
    const DAY = 86400000;
    const now = new Date();
    const completed = allTransactions.filter(
      (tx) =>
        tx.status === "completed" && matchesSelectedLocation(tx, selectedLocation)
    );

    const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => {
      if (h === 0) return "12AM";
      if (h === 12) return "12PM";
      return h < 12 ? `${h}AM` : `${h - 12}PM`;
    });
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (selectedPeriod === "today" || selectedPeriod === "yesterday") {
      const curDay =
        selectedPeriod === "today"
          ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
          : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const prevDay = new Date(curDay.getTime() - 7 * DAY);

      const currentData = Array(24).fill(0);
      const prevData = Array(24).fill(0);

      completed.forEach((tx) => {
        const d = new Date(tx.createdAt);
        const dKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const curKey = `${curDay.getFullYear()}-${curDay.getMonth()}-${curDay.getDate()}`;
        const prevKey = `${prevDay.getFullYear()}-${prevDay.getMonth()}-${prevDay.getDate()}`;
        if (dKey === curKey) currentData[d.getHours()] += Number(tx.total || 0);
        if (dKey === prevKey) prevData[d.getHours()] += Number(tx.total || 0);
      });

      // Null-out future hours for "today" so line doesn't extend into future
      if (selectedPeriod === "today") {
        for (let h = now.getHours() + 1; h < 24; h++) currentData[h] = null;
      }

      // Trim to active window: find first and last hour with any data
      let startH = 23;
      let endH = 0;
      for (let h = 0; h < 24; h++) {
        const hasData = (currentData[h] ?? 0) > 0 || prevData[h] > 0;
        if (hasData) { if (h < startH) startH = h; if (h > endH) endH = h; }
      }
      // For today also include the current hour even if no sales yet
      if (selectedPeriod === "today") endH = Math.max(endH, now.getHours());
      // If no transactions at all, fall back to full day
      if (startH > endH) { startH = 0; endH = 23; }

      const slicedLabels = HOUR_LABELS.slice(startH, endH + 1);
      return {
        labels: slicedLabels,
        currentData: currentData.slice(startH, endH + 1),
        prevData: prevData.slice(startH, endH + 1),
      };
    }

    if (selectedPeriod === "week" || selectedPeriod === "lastWeek") {
      const weekStart =
        selectedPeriod === "week"
          ? new Date(now.getTime() - 7 * DAY)
          : new Date(now.getTime() - 14 * DAY);
      weekStart.setHours(0, 0, 0, 0);
      const prevWeekStart = new Date(weekStart.getTime() - 7 * DAY);

      const labels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart.getTime() + i * DAY);
        return `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;
      });

      const currentData = Array(7).fill(0);
      const prevData = Array(7).fill(0);

      completed.forEach((tx) => {
        const d = new Date(tx.createdAt);
        const diffCur = Math.floor((d - weekStart) / DAY);
        const diffPrev = Math.floor((d - prevWeekStart) / DAY);
        if (diffCur >= 0 && diffCur < 7) currentData[diffCur] += Number(tx.total || 0);
        if (diffPrev >= 0 && diffPrev < 7) prevData[diffPrev] += Number(tx.total || 0);
      });

      return { labels, currentData, prevData };
    }

    if (selectedPeriod === "month" || selectedPeriod === "lastMonth") {
      const refDate =
        selectedPeriod === "month"
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevRefDate = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);

      const daysInCur = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();
      const daysInPrev = new Date(prevRefDate.getFullYear(), prevRefDate.getMonth() + 1, 0).getDate();
      const maxDays = Math.max(daysInCur, daysInPrev);

      const labels = Array.from({ length: maxDays }, (_, i) => `${i + 1}`);
      const currentData = Array(maxDays).fill(0);
      const prevData = Array(maxDays).fill(0);

      completed.forEach((tx) => {
        const d = new Date(tx.createdAt);
        const dayIdx = d.getDate() - 1;
        if (d.getFullYear() === refDate.getFullYear() && d.getMonth() === refDate.getMonth())
          currentData[dayIdx] += Number(tx.total || 0);
        if (d.getFullYear() === prevRefDate.getFullYear() && d.getMonth() === prevRefDate.getMonth())
          prevData[dayIdx] += Number(tx.total || 0);
      });

      return { labels, currentData, prevData };
    }

    return { labels: [], currentData: [], prevData: [] };
  }, [allTransactions, selectedPeriod, selectedLocation]);

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

  const salesTrend = computeTrend(kpis.sales, prevKpis.sales);
  const txTrend = computeTrend(kpis.transactions, prevKpis.transactions);
  const avgTrend = computeTrend(kpis.avg, prevKpis.avg);

  return (
    <div className="page-container">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        {/* Greeting */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Hi, {dashboardHeading}
            </h1>
            {lastRefresh && (
              <p className="mt-1 text-xs text-gray-400">
                Updated {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-white hover:border-gray-300 hover:shadow"
            style={{ borderRadius: 'var(--radius-lg)' }}
            onClick={handleDailyMail}
            title="Send daily mail report"
          >
            <Mail className="h-3.5 w-3.5" />
            Mail report
          </button>
        </header>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <QuickActionTile
              key={action.label}
              label={action.label}
              icon={action.icon}
              onClick={action.onClick}
            />
          ))}
        </div>

        {/* Key Trading Metrics */}
        <section
          className="overflow-hidden border border-gray-200 bg-white"
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-bold tracking-tight text-gray-900">
                Key trading metrics
              </h2>
              <div className="flex flex-wrap items-center gap-4">
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

                <div className="h-9 w-px bg-gray-200 hidden sm:block" />

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-white hover:border-gray-300 hover:text-gray-900 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  title="Refresh dashboard data"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {selectedPeriod === "custom" && (
            <div className="grid grid-cols-1 gap-3 border-b border-gray-200 px-4 py-4 sm:grid-cols-2 sm:px-5">
              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                  Start Date
                </span>
                <input
                  type="date"
                  className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  style={{ borderRadius: 'var(--radius-lg)' }}
                  value={customDateRange.startDate}
                  onChange={(e) =>
                    setCustomDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                  End Date
                </span>
                <input
                  type="date"
                  className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  style={{ borderRadius: 'var(--radius-lg)' }}
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
            <div className="px-4 py-10 sm:px-5">
              <Loader size="md" text="Loading dashboard..." progress={progress} />
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 divide-y divide-gray-200 sm:divide-y-0 sm:divide-x sm:grid-cols-2 ${
                kpis.heldCount > 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
              }`}
            >
              <MetricCard
                label="Sales"
                value={formatCurrency(kpis.sales)}
                trend={salesTrend}
                linkLabel="Sales breakdown"
                onClick={() => router.push("/reporting/reporting")}
              />
              <MetricCard
                label="Transactions"
                value={formatNumber(kpis.transactions)}
                trend={txTrend}
                linkLabel="Transactions report"
                onClick={() => router.push("/reporting/completed-transactions")}
              />
              <MetricCard
                label="Avg. transaction value"
                value={formatCurrency(kpis.avg.toFixed(2))}
                trend={avgTrend}
              />
              {kpis.heldCount > 0 && (
                <MetricCard
                  label="Held transactions"
                  value={`${kpis.heldCount} (${formatCurrency(kpis.heldTotal)})`}
                  detail="Excluded from sales and average KPIs"
                  linkLabel="Transactions report"
                  onClick={() => router.push("/reporting/completed-transactions")}
                />
              )}
            </div>
          )}
        </section>

        {/* Sales Trend Chart — collapsible */}
        {!loading && salesChartData.labels.length > 0 && selectedPeriod !== "custom" && (
          <section
            className="overflow-hidden border border-gray-200 bg-white"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold tracking-tight text-gray-900">
                  Sales Over Time
                </h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  {COMPARISON_LABELS[selectedPeriod]?.current} vs{" "}
                  {COMPARISON_LABELS[selectedPeriod]?.prev} · refunds excluded
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-white hover:border-gray-300"
                onClick={() => setSalesChartOpen((o) => !o)}
                aria-label={salesChartOpen ? "Collapse chart" : "Expand chart"}
              >
                {salesChartOpen ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Expand
                  </>
                )}
              </button>
            </div>

            {/* Chart body */}
            {salesChartOpen && (
              <div className="px-5 pt-4 pb-5">
                <div className="h-[220px] sm:h-[280px] md:h-[320px]">
                  <Line
                    data={{
                      labels: salesChartData.labels,
                      datasets: [
                        {
                          label: COMPARISON_LABELS[selectedPeriod]?.current || "Current",
                          data: salesChartData.currentData,
                          borderColor: "#2563eb",
                          backgroundColor: "rgba(37,99,235,0.08)",
                          pointRadius: 3,
                          pointHoverRadius: 5,
                          borderWidth: 2,
                          tension: 0.3,
                          fill: true,
                          spanGaps: false,
                        },
                        {
                          label: COMPARISON_LABELS[selectedPeriod]?.prev || "Previous",
                          data: salesChartData.prevData,
                          borderColor: "#f97316",
                          backgroundColor: "transparent",
                          pointRadius: 3,
                          pointHoverRadius: 5,
                          borderWidth: 2,
                          borderDash: [6, 4],
                          tension: 0.3,
                          fill: false,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: { mode: "index", intersect: false },
                      plugins: {
                        legend: {
                          position: "top",
                          align: "end",
                          labels: {
                            usePointStyle: true,
                            pointStyle: "line",
                            boxWidth: 24,
                            font: { size: 11 },
                            padding: 16,
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: (ctx) =>
                              ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw ?? 0)}`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: {
                            font: { size: 10 },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 12,
                          },
                        },
                        y: {
                          grid: { color: "rgba(0,0,0,0.04)" },
                          ticks: {
                            font: { size: 10 },
                            callback: (v) =>
                              v >= 1000000
                                ? `₦${(v / 1000000).toFixed(1)}M`
                                : v >= 1000
                                ? `₦${(v / 1000).toFixed(0)}k`
                                : `₦${v}`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </section>
        )}

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
      className="group flex items-center justify-between border border-gray-200 bg-white px-5 py-4 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
      style={{ borderRadius: 'var(--radius-lg)' }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center border border-gray-200 bg-gray-50 text-gray-700"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-gray-900">{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-gray-600" />
    </button>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div className="relative min-w-[170px]">
      <span className="absolute left-3 -top-2.5 bg-white px-1.5 text-[11px] font-semibold text-gray-400 z-10 leading-none tracking-wide uppercase">
        {label}
      </span>
      <div className="relative border border-gray-200 bg-white shadow-sm px-3 py-2" style={{ borderRadius: 6 }}>
        <select
          className="w-full appearance-none bg-transparent pr-6 text-sm font-medium text-gray-800 outline-none cursor-pointer"
          value={value}
          onChange={onChange}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, detail, linkLabel, onClick }) {
  return (
    <div className="flex flex-col px-5 py-5">
      <div className="text-sm font-medium text-gray-600">{label}</div>
      <div className="mt-2 text-[1.85rem] font-bold leading-none tracking-tight text-gray-900 sm:text-[2.1rem]">
        {value}
      </div>
      {trend ? (
        <div
          className={`mt-2 flex items-center gap-1 text-sm font-semibold ${
            trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {trend.direction === 'up' ? (
            <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          <span>{trend.label}</span>
        </div>
      ) : detail ? (
        <div className="mt-2 text-sm text-gray-500">{detail}</div>
      ) : null}
      {linkLabel && onClick ? (
        <button
          type="button"
          className="mt-auto pt-4 text-left text-sm font-semibold transition hover:opacity-75"
          style={{ color: 'var(--btn-primary-bg, #0284c7)' }}
          onClick={onClick}
        >
          {linkLabel}
        </button>
      ) : (
        <div className="mt-auto pt-3" />
      )}
    </div>
  );
}

function ChartCard({ title, children, onViewMore }) {
  return (
    <div className="border border-gray-200 bg-white p-4 sm:p-5" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
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

function ListCard({ title, items, emptyMessage = 'No data available' }) {
  return (
    <motion.div
      className="border border-gray-200 bg-white p-4 sm:p-5 flex flex-col h-[250px] sm:h-[280px] md:h-[320px]"
      style={{ borderRadius: 'var(--radius-lg)' }}
    >
      <h2 className="text-sm font-semibold mb-3 text-gray-900 flex-shrink-0">{title}</h2>
      <ul className="space-y-1.5 overflow-y-auto flex-1">
        {items.length ? (
          items.map((i, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between p-2.5 border border-gray-200 bg-gray-50 text-xs hover:bg-gray-100 transition-colors"
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <span className="font-medium text-gray-900 truncate">{i.label}</span>
              <span className="text-gray-600 ml-2 flex-shrink-0">{i.meta}</span>
            </li>
          ))
        ) : (
          <li className="text-gray-400 italic text-xs py-8 text-center">{emptyMessage}</li>
        )}
      </ul>
    </motion.div>
  );
}




