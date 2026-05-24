"use client";

import Layout from "@/components/Layout";
import { Loader } from "@/components/ui";
import { useState, useEffect } from "react";
import { Printer, RefreshCw, TrendingUp, TrendingDown, Scale, FileText } from "lucide-react";

const TABS = [
  { key: "profit-loss", label: "Profit & Loss", icon: TrendingUp },
  { key: "balance-sheet", label: "Balance Sheet", icon: Scale },
  { key: "trial-balance", label: "Trial Balance", icon: FileText },
];

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatMargin(value) {
  return `${((Number(value) || 0) * 100).toFixed(1)}%`;
}

function formatSyncTime(value) {
  if (!value) return "No recent sync";
  return new Date(value).toLocaleString("en-NG");
}

export default function AccountingReportsPage() {
  const [tab, setTab] = useState("profit-loss");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncMessage, setSyncMessage] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, [tab, dateFrom, dateTo]);

  useEffect(() => {
    refreshSyncStatus();
  }, []);

  async function refreshSyncStatus() {
    try {
      const res = await fetch("/api/accounting/sync");
      if (!res.ok) return;

      const payload = await res.json();
      setSyncStatus(payload.status || null);
    } catch {
      // Leave the reports view usable even if sync status is temporarily unavailable.
    }
  }

  async function fetchReport() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ report: tab });
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const res = await fetch(`/api/accounting/reports?${params}`);
      if (res.ok) {
        setData(await res.json());
        void refreshSyncStatus();
      } else {
        setError("Failed to load report");
      }
    } catch {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSync() {
    try {
      setSyncing(true);
      setError("");
      setSyncMessage("");

      const res = await fetch("/api/accounting/sync", { method: "POST" });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.message || "Failed to sync accounting");
      }

      const result = payload.result || {};
      setSyncStatus(payload.status || null);
      setSyncMessage(
        `Accounting synced. ${result.salesSynced || 0} sales, ${result.expensesSynced || 0} expenses, ${result.purchaseOrdersSynced || 0} purchase orders refreshed.`
      );

      await fetchReport();
    } catch (syncError) {
      setError(syncError.message || "Failed to sync accounting");
    } finally {
      setSyncing(false);
    }
  }

  const syncSummary = syncStatus?.lastSummary
    ? `${syncStatus.lastSummary.salesSynced || 0} sales, ${syncStatus.lastSummary.expensesSynced || 0} expenses, ${syncStatus.lastSummary.purchaseOrdersSynced || 0} purchase orders`
    : "";

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="page-title">Financial Reports</h1>
            <p className="page-subtitle">View your business financial statements</p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={handleManualSync} disabled={syncing} className="btn-action btn-action-primary disabled:opacity-60 disabled:cursor-not-allowed">
                <RefreshCw size={18} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing..." : "Sync Accounting"}
              </button>
              <button onClick={() => window.print()} className="btn-action btn-action-secondary">
                <Printer size={18} /> Print
              </button>
            </div>
            <div className="text-xs text-gray-500 sm:text-right">
              <p>Last synced: {formatSyncTime(syncStatus?.lastSyncAt)}</p>
              {syncStatus?.lastDurationMs ? <p>Latest sync duration: {(syncStatus.lastDurationMs / 1000).toFixed(1)}s</p> : null}
              {syncSummary ? <p>{syncSummary}</p> : null}
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}
        {syncMessage && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{syncMessage}</div>}

        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Accounting sync is throttled automatically to keep these pages responsive. Use Sync Accounting when you want an immediate refresh from sales, expenses, and purchase orders.
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                  tab === t.key
                    ? "border-sky-600 text-sky-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Date Filters */}
        <div className="flex gap-3 mb-6">
          <div>
            <label className="form-label">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="form-input" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader size="lg" text="Loading report..." />
          </div>
        ) : (
          <>
            {tab === "profit-loss" && <ProfitLoss data={data} />}
            {tab === "balance-sheet" && <BalanceSheet data={data} />}
            {tab === "trial-balance" && <TrialBalance data={data} />}
          </>
        )}
        </div>
      </div>
    </Layout>
  );
}

/* ═══════════════════════════════════════
   PROFIT & LOSS TAB
═══════════════════════════════════════ */
function ExecutiveMetricCard({ title, value, helper, tone = "neutral" }) {
  const toneClasses = tone === "positive"
    ? { border: "border-green-500", value: "text-green-700" }
    : tone === "negative"
      ? { border: "border-red-500", value: "text-red-700" }
      : { border: "border-sky-500", value: "theme-accent-text" };

  return (
    <div className={`content-card border-t-4 ${toneClasses.border}`}>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${toneClasses.value}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-2">{helper}</p>
    </div>
  );
}

function ProfitLoss({ data }) {
  if (!data) return null;
  const netIncome = data.netIncome || 0;
  const summary = data.summary || {};
  const grossProfit = summary.grossProfit || 0;
  const operatingProfit = summary.operatingProfit || 0;
  const netMargin = summary.netMargin || 0;

  return (
    <div>
      {/* Net Income Summary */}
      <div className={`content-card mb-6 border-l-4 ${netIncome >= 0 ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {netIncome >= 0 ? <TrendingUp size={32} className="text-green-600" /> : <TrendingDown size={32} className="text-red-600" />}
            <div>
              <p className="text-sm font-semibold text-gray-600">Net {netIncome >= 0 ? "Profit" : "Loss"}</p>
              <p className={`text-3xl font-bold ${netIncome >= 0 ? "text-green-700" : "text-red-700"}`}>
                {Math.abs(netIncome).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Revenue: <span className="font-bold text-green-700">{formatMoney(data.totalRevenue || 0)}</span></p>
            <p>Expenses: <span className="font-bold text-red-700">{formatMoney(data.totalExpenses || 0)}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ExecutiveMetricCard
          title="Gross Profit"
          value={formatMoney(grossProfit)}
          helper={`COGS ${formatMoney(summary.costOfSales || 0)} | Gross margin ${formatMargin(summary.grossMargin)}`}
          tone={grossProfit >= 0 ? "positive" : "negative"}
        />
        <ExecutiveMetricCard
          title="Operating Profit"
          value={formatMoney(operatingProfit)}
          helper={`Operating expenses ${formatMoney(summary.operatingExpenses || 0)} | Operating margin ${formatMargin(summary.operatingMargin)}`}
          tone={operatingProfit >= 0 ? "positive" : "negative"}
        />
        <ExecutiveMetricCard
          title="Net Margin"
          value={formatMargin(netMargin)}
          helper={`Net income ${formatMoney(netIncome)} | Other income ${formatMoney(summary.otherIncome || 0)}`}
          tone={netMargin >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PLSection title="Revenue" items={data.revenue || []} total={data.totalRevenue || 0} color="green" />
        <PLSection title="Expenses" items={data.expenses || []} total={data.totalExpenses || 0} color="red" />
      </div>
    </div>
  );
}

function PLSection({ title, items, total, color }) {
  const sectionClasses = color === "green"
    ? {
        header: "bg-green-50",
        title: "text-green-800",
        value: "text-green-700",
        footer: "border-green-300 bg-green-50",
        footerValue: "text-green-800",
      }
    : {
        header: "bg-red-50",
        title: "text-red-800",
        value: "text-red-700",
        footer: "border-red-300 bg-red-50",
        footerValue: "text-red-800",
      };

  return (
    <div className="content-card !p-0 overflow-hidden">
      <div className={`px-4 py-3 border-b flex items-center justify-between ${sectionClasses.header}`}>
        <h2 className={`font-bold ${sectionClasses.title}`}>{title}</h2>
        <span className={`font-bold ${sectionClasses.value}`}>{total.toLocaleString()}</span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {items.length === 0 ? (
            <tr><td className="px-4 py-6 text-center text-gray-500">No {title.toLowerCase()} recorded</td></tr>
          ) : items.map((r, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-2">
                <span className="font-medium text-gray-900">{r.name}</span>
                {r.subType && <span className="text-xs text-gray-500 ml-2">({r.subType})</span>}
              </td>
              <td className={`px-4 py-2 text-right font-semibold ${sectionClasses.value}`}>{r.amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={`border-t-2 font-bold ${sectionClasses.footer}`}>
            <td className="px-4 py-2">Total {title}</td>
            <td className={`px-4 py-2 text-right ${sectionClasses.footerValue}`}>{total.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════
   BALANCE SHEET TAB
═══════════════════════════════════════ */
function BalanceSheet({ data }) {
  if (!data) return null;
  const totalLE = (data.totalLiabilities || 0) + (data.totalEquity || 0);
  const isBalanced = Math.abs((data.totalAssets || 0) - totalLE) < 0.01;

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="content-card text-center border-t-4" style={{ borderTopColor: "var(--btn-primary-bg, #0284c7)" }}>
          <p className="text-sm text-gray-600 font-semibold">Total Assets</p>
          <p className="text-2xl font-bold theme-accent-text">{(data.totalAssets || 0).toLocaleString()}</p>
        </div>
        <div className="content-card text-center border-t-4 border-red-500">
          <p className="text-sm text-gray-600 font-semibold">Total Liabilities</p>
          <p className="text-2xl font-bold text-red-700">{(data.totalLiabilities || 0).toLocaleString()}</p>
        </div>
        <div className="content-card text-center border-t-4 border-purple-500">
          <p className="text-sm text-gray-600 font-semibold">Total Equity</p>
          <p className="text-2xl font-bold text-purple-700">{(data.totalEquity || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-6">
        <BSSection title="Assets" items={data.assets || []} total={data.totalAssets || 0} colorClass="theme-surface-soft theme-border-soft" />
        <BSSection title="Liabilities" items={data.liabilities || []} total={data.totalLiabilities || 0} colorClass="bg-red-50 text-red-800" />
        <BSSection title="Equity" items={data.equity || []} total={data.totalEquity || 0} colorClass="bg-purple-50 text-purple-800" />
      </div>

      {/* Accounting Equation */}
      <div className="content-card mt-6 text-center bg-gray-50">
        <p className="text-lg font-bold text-gray-700">
          Assets ({(data.totalAssets || 0).toLocaleString()}) = Liabilities ({(data.totalLiabilities || 0).toLocaleString()}) + Equity ({(data.totalEquity || 0).toLocaleString()})
        </p>
        <p className={`text-sm mt-1 font-semibold ${isBalanced ? "text-green-600" : "text-red-600"}`}>
          {isBalanced ? "✓ Balanced" : `✗ Difference: ${Math.abs((data.totalAssets || 0) - totalLE).toLocaleString()}`}
        </p>
      </div>
    </div>
  );
}

function BSSection({ title, items, total, colorClass }) {
  return (
    <div className="content-card !p-0 overflow-hidden">
      <div className={`px-4 py-3 border-b flex items-center justify-between ${colorClass}`}>
        <h2 className="font-bold">{title}</h2>
        <span className="font-bold text-lg">{total.toLocaleString()}</span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {items.length === 0 ? (
            <tr><td className="px-4 py-6 text-center text-gray-500">No accounts with balance</td></tr>
          ) : items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-2">
                <span className="font-mono theme-accent-text text-xs mr-2">{item.code}</span>
                <span className="font-medium text-gray-900">{item.name}</span>
              </td>
              <td className="px-4 py-2 text-right font-semibold">{Math.abs(item.amount).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════
   TRIAL BALANCE TAB
═══════════════════════════════════════ */
function TrialBalance({ data }) {
  if (!data) return null;
  const rows = (data.rows || []).sort((a, b) => a.code.localeCompare(b.code));
  const isBalanced = Math.abs((data.totalDebit || 0) - (data.totalCredit || 0)) < 0.01;

  return (
    <div>
      <div className={`mb-4 p-3 rounded-lg text-sm font-semibold ${isBalanced ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
        {isBalanced ? "✓ Books are balanced" : `✗ Out of balance by ${Math.abs((data.totalDebit || 0) - (data.totalCredit || 0)).toLocaleString()}`}
      </div>

      <div className="content-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 font-semibold w-24">Code</th>
                <th className="text-left px-4 py-3 font-semibold">Account</th>
                <th className="text-left px-4 py-3 font-semibold w-24">Type</th>
                <th className="text-right px-4 py-3 font-semibold w-32">Debit</th>
                <th className="text-right px-4 py-3 font-semibold w-32">Credit</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No posted journal entries found</td></tr>
              ) : rows.map((row) => (
                <tr key={row._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono theme-accent-text">{row.code}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{row.type}</td>
                  <td className="px-4 py-2 text-right font-medium">{row.debit > 0 ? row.debit.toLocaleString() : ""}</td>
                  <td className="px-4 py-2 text-right font-medium">{row.credit > 0 ? row.credit.toLocaleString() : ""}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-400 bg-gray-100 font-bold text-lg">
                <td colSpan={3} className="px-4 py-3 text-right">Totals</td>
                <td className="px-4 py-3 text-right">{(data.totalDebit || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{(data.totalCredit || 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
