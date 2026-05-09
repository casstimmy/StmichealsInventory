"use client";

import Layout from "@/components/Layout";
import { Loader } from "@/components/ui";
import { useState, useEffect } from "react";
import { Printer, TrendingUp, TrendingDown, Scale, FileText } from "lucide-react";

const TABS = [
  { key: "profit-loss", label: "Profit & Loss", icon: TrendingUp },
  { key: "balance-sheet", label: "Balance Sheet", icon: Scale },
  { key: "trial-balance", label: "Trial Balance", icon: FileText },
];

export default function AccountingReportsPage() {
  const [tab, setTab] = useState("profit-loss");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, [tab, dateFrom, dateTo]);

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
      } else {
        setError("Failed to load report");
      }
    } catch {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="page-title">Financial Reports</h1>
            <p className="page-subtitle">View your business financial statements</p>
          </div>
          <button onClick={() => window.print()} className="btn-action btn-action-secondary">
            <Printer size={18} /> Print
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}

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
    </Layout>
  );
}

/* ═══════════════════════════════════════
   PROFIT & LOSS TAB
═══════════════════════════════════════ */
function ProfitLoss({ data }) {
  if (!data) return null;
  const netIncome = data.netIncome || 0;

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
            <p>Revenue: <span className="font-bold text-green-700">{(data.totalRevenue || 0).toLocaleString()}</span></p>
            <p>Expenses: <span className="font-bold text-red-700">{(data.totalExpenses || 0).toLocaleString()}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PLSection title="Revenue" items={data.revenue || []} total={data.totalRevenue || 0} color="green" />
        <PLSection title="Expenses" items={data.expenses || []} total={data.totalExpenses || 0} color="red" />
      </div>
    </div>
  );
}

function PLSection({ title, items, total, color }) {
  return (
    <div className="content-card !p-0 overflow-hidden">
      <div className={`px-4 py-3 bg-${color}-50 border-b flex items-center justify-between`}>
        <h2 className={`font-bold text-${color}-800`}>{title}</h2>
        <span className={`text-${color}-700 font-bold`}>{total.toLocaleString()}</span>
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
              <td className={`px-4 py-2 text-right font-semibold text-${color}-700`}>{r.amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={`border-t-2 border-${color}-300 bg-${color}-50 font-bold`}>
            <td className="px-4 py-2">Total {title}</td>
            <td className={`px-4 py-2 text-right text-${color}-800`}>{total.toLocaleString()}</td>
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
        <div className="content-card text-center border-t-4 border-blue-500">
          <p className="text-sm text-gray-600 font-semibold">Total Assets</p>
          <p className="text-2xl font-bold text-blue-700">{(data.totalAssets || 0).toLocaleString()}</p>
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
        <BSSection title="Assets" items={data.assets || []} total={data.totalAssets || 0} colorClass="bg-blue-50 text-blue-800" />
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
                <span className="font-mono text-blue-600 text-xs mr-2">{item.code}</span>
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
                  <td className="px-4 py-2 font-mono text-blue-700">{row.code}</td>
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
