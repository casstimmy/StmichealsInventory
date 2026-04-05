// pages/stock/stock-take/[id].js
"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { Loader } from "@/components/ui";
import useProgress from "@/lib/useProgress";
import { formatCurrency } from "@/lib/format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlay,
  faCheck,
  faThumbsUp,
  faSyncAlt,
  faTimes,
  faSearch,
  faFileExport,
  faDownload,
  faSave,
  faExclamationTriangle,
  faCheckCircle,
  faBalanceScale,
} from "@fortawesome/free-solid-svg-icons";

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-700",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function StockTakeDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { progress, start, onFetch, onProcess, complete } = useProgress();

  const [stockTake, setStockTake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterItemStatus, setFilterItemStatus] = useState("all");
  const [filterVariance, setFilterVariance] = useState("all");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [pendingChanges, setPendingChanges] = useState({});
  const countInputRefs = useRef({});

  const fetchStockTake = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      start();
      onFetch();
      const res = await fetch(`/api/stock-take/${id}`);
      const data = await res.json();
      onProcess();
      if (data.success) {
        setStockTake(data.stockTake);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to load stock take" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load stock take" });
    } finally {
      complete();
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStockTake();
  }, [fetchStockTake]);

  const filteredItems = useMemo(() => {
    if (!stockTake?.items) return [];
    return stockTake.items.filter((item) => {
      if (filterItemStatus !== "all" && item.status !== filterItemStatus) return false;
      if (filterVariance === "positive" && !(item.countedQty !== null && item.variance > 0)) return false;
      if (filterVariance === "negative" && !(item.countedQty !== null && item.variance < 0)) return false;
      if (filterVariance === "match" && !(item.countedQty !== null && item.variance === 0)) return false;
      if (filterVariance === "uncounted" && item.countedQty !== null) return false;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        return (
          item.productName?.toLowerCase().includes(t) ||
          item.barcode?.toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [stockTake, filterItemStatus, filterVariance, searchTerm]);

  const handleCountChange = (itemId, value) => {
    const numVal = value === "" ? null : Number(value);
    setPendingChanges((prev) => ({ ...prev, [itemId]: { countedQty: numVal } }));
  };

  const saveChanges = async () => {
    const entries = Object.entries(pendingChanges);
    if (entries.length === 0) return;

    setSaving(true);
    try {
      const items = entries.map(([_id, data]) => ({ _id, ...data }));
      const res = await fetch(`/api/stock-take/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-counts", items }),
      });
      const data = await res.json();
      if (data.success) {
        setStockTake(data.stockTake);
        setPendingChanges({});
        showMsg("success", `${items.length} count(s) saved successfully`);
      } else {
        showMsg("error", data.message);
      }
    } catch (err) {
      showMsg("error", "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const performAction = async (action, extra = {}) => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/stock-take/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg("success", data.message);
        fetchStockTake();
      } else {
        showMsg("error", data.message);
      }
    } catch (err) {
      showMsg("error", "Action failed");
    } finally {
      setActionLoading("");
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const exportCSV = () => {
    if (!stockTake?.items) return;
    const header = "Product,Barcode,System Qty,Counted Qty,Variance,Variance Value,Status,Notes\n";
    const rows = stockTake.items.map((i) =>
      [
        `"${i.productName}"`,
        i.barcode,
        i.systemQty,
        i.countedQty ?? "",
        i.variance,
        i.varianceValue?.toFixed(2),
        i.status,
        `"${i.notes || ""}"`,
      ].join(",")
    );
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-take-${stockTake.reference}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader size="lg" text="Loading stock take..." progress={progress} />
        </div>
      </Layout>
    );
  }

  if (!stockTake) {
    return (
      <Layout>
        <div className="page-container">
          <div className="page-content text-center py-20">
            <p className="text-gray-500 text-lg">Stock take not found</p>
            <button onClick={() => router.push("/stock/stock-take")} className="btn-action-primary mt-4">
              Back to Stock Takes
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const isEditable = ["draft", "in-progress"].includes(stockTake.status);
  const hasPending = Object.keys(pendingChanges).length > 0;
  const progressPct = stockTake.totalItems > 0
    ? Math.round((stockTake.countedItems / stockTake.totalItems) * 100)
    : 0;

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <button
                onClick={() => router.push("/stock/stock-take")}
                className="text-blue-600 hover:text-blue-800 text-sm mb-2 flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" /> Back to Stock Takes
              </button>
              <h1 className="page-title">{stockTake.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {stockTake.reference}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[stockTake.status]}`}>
                  {stockTake.status}
                </span>
                <span className="text-sm text-gray-500">{stockTake.locationName}</span>
                <span className="text-sm text-gray-400">
                  Created {new Date(stockTake.createdAt).toLocaleDateString()} by {stockTake.createdBy}
                </span>
              </div>
              {stockTake.description && (
                <p className="text-sm text-gray-500 mt-1">{stockTake.description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {isEditable && hasPending && (
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="btn-action-success flex items-center gap-2 text-sm"
                >
                  <FontAwesomeIcon icon={faSave} className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : `Save (${Object.keys(pendingChanges).length})`}
                </button>
              )}
              {stockTake.status === "draft" && (
                <button
                  onClick={() => performAction("start")}
                  disabled={!!actionLoading}
                  className="btn-action-primary flex items-center gap-2 text-sm"
                >
                  <FontAwesomeIcon icon={faPlay} className="w-3.5 h-3.5" />
                  Start Counting
                </button>
              )}
              {(stockTake.status === "draft" || stockTake.status === "in-progress") && (
                <button
                  onClick={() => {
                    if (confirm("Zero ALL product counts? This sets every item's counted quantity to 0.")) {
                      performAction("zero-all");
                    }
                  }}
                  disabled={!!actionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-3.5 h-3.5" />
                  {actionLoading === "zero-all" ? "Zeroing..." : "Zero All Stock"}
                </button>
              )}
              {stockTake.status === "in-progress" && (
                <button
                  onClick={() => {
                    if (confirm("Finalize this stock take? Ensure all items are counted.")) {
                      performAction("complete");
                    }
                  }}
                  disabled={!!actionLoading}
                  className="btn-action-primary flex items-center gap-2 text-sm"
                >
                  <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                  Complete
                </button>
              )}
              {stockTake.status === "completed" && (
                <button
                  onClick={() => performAction("approve")}
                  disabled={!!actionLoading}
                  className="btn-action-success flex items-center gap-2 text-sm"
                >
                  <FontAwesomeIcon icon={faThumbsUp} className="w-3.5 h-3.5" />
                  Approve
                </button>
              )}
              {stockTake.status === "approved" && !stockTake.adjustmentApplied && (
                <button
                  onClick={() => {
                    if (confirm("Apply all variance adjustments to inventory? This cannot be undone.")) {
                      performAction("apply-adjustments");
                    }
                  }}
                  disabled={!!actionLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <FontAwesomeIcon icon={faSyncAlt} className="w-3.5 h-3.5" />
                  Apply Adjustments
                </button>
              )}
              {stockTake.adjustmentApplied && (
                <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm font-medium border border-green-200">
                  <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
                  Adjustments Applied
                </span>
              )}
              <button onClick={exportCSV} className="btn-action flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" />
                Export CSV
              </button>
              {!stockTake.adjustmentApplied && !["approved", "cancelled"].includes(stockTake.status) && (
                <button
                  onClick={() => {
                    if (confirm("Cancel this stock take?")) performAction("cancel");
                  }}
                  disabled={!!actionLoading}
                  className="btn-action btn-action-danger flex items-center gap-2 text-sm"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-3.5 h-3.5" />
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          {message.text && (
            <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 text-sm ${
              message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}>
              <FontAwesomeIcon icon={message.type === "error" ? faExclamationTriangle : faCheckCircle} className="w-4 h-4" />
              {message.text}
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            {[
              { label: "Total Items", value: stockTake.totalItems },
              { label: "Counted", value: stockTake.countedItems },
              { label: "Progress", value: `${progressPct}%` },
              { label: "Accuracy", value: `${stockTake.accuracyRate || 0}%` },
              { label: "System Qty", value: stockTake.totalSystemQty },
              { label: "Counted Qty", value: stockTake.totalCountedQty },
              { label: "Net Variance", value: stockTake.totalVariance, isVariance: true },
              { label: "Variance Value", value: formatCurrency(Math.abs(stockTake.totalVarianceValue || 0)), isVariance: true, raw: stockTake.totalVarianceValue },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                <div className={`text-lg font-bold ${
                  stat.isVariance
                    ? (stat.raw || stat.value) > 0
                      ? "text-green-600"
                      : (stat.raw || stat.value) < 0
                      ? "text-red-600"
                      : "text-gray-900"
                    : "text-gray-900"
                }`}>
                  {stat.isVariance && typeof stat.value === "number" && stat.value > 0 ? "+" : ""}
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Counting Progress</span>
              <span className="text-xs font-medium text-gray-700">{stockTake.countedItems} / {stockTake.totalItems}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  progressPct === 100 ? "bg-green-500" : progressPct > 50 ? "bg-blue-500" : "bg-orange-400"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="content-card mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products by name or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10"
                />
              </div>
              <select
                value={filterItemStatus}
                onChange={(e) => setFilterItemStatus(e.target.value)}
                className="form-select w-full md:w-36"
              >
                <option value="all">All Items</option>
                <option value="pending">Pending</option>
                <option value="counted">Counted</option>
              </select>
              <select
                value={filterVariance}
                onChange={(e) => setFilterVariance(e.target.value)}
                className="form-select w-full md:w-44"
              >
                <option value="all">All Variances</option>
                <option value="positive">Surplus (+)</option>
                <option value="negative">Shortage (-)</option>
                <option value="match">Exact Match</option>
                <option value="uncounted">Not Counted</option>
              </select>
            </div>
          </div>

          {/* Items Table */}
          <div className="content-card overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{filteredItems.length} item(s) shown</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 text-left">
                  <th className="py-2 px-2 font-semibold text-gray-600 w-8">#</th>
                  <th className="py-2 px-2 font-semibold text-gray-600">Product</th>
                  <th className="py-2 px-2 font-semibold text-gray-600 hidden md:table-cell">Barcode</th>
                  <th className="py-2 px-2 font-semibold text-gray-600 text-center">System Qty</th>
                  <th className="py-2 px-2 font-semibold text-gray-600 text-center w-28">Counted</th>
                  <th className="py-2 px-2 font-semibold text-gray-600 text-center">Variance</th>
                  <th className="py-2 px-2 font-semibold text-gray-600 text-right hidden lg:table-cell">Variance Value</th>
                  <th className="py-2 px-2 font-semibold text-gray-600 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const pendingVal = pendingChanges[item._id];
                  const displayCounted = pendingVal !== undefined
                    ? pendingVal.countedQty
                    : item.countedQty;
                  const displayVariance = displayCounted !== null && displayCounted !== undefined
                    ? displayCounted - item.systemQty
                    : null;

                  return (
                    <tr key={item._id} className={`border-b border-gray-100 transition-colors ${
                      displayVariance !== null && displayVariance !== 0
                        ? displayVariance > 0
                          ? "bg-green-50/40"
                          : "bg-red-50/40"
                        : "hover:bg-gray-50"
                    }`}>
                      <td className="py-2 px-2 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="py-2 px-2">
                        <div className="font-medium text-gray-900 text-sm">{item.productName}</div>
                      </td>
                      <td className="py-2 px-2 font-mono text-xs text-gray-500 hidden md:table-cell">{item.barcode || "—"}</td>
                      <td className="py-2 px-2 text-center font-medium text-gray-700">{item.systemQty}</td>
                      <td className="py-2 px-2 text-center">
                        {isEditable ? (
                          <input
                            ref={(el) => { if (el) countInputRefs.current[item._id] = el; }}
                            type="number"
                            min="0"
                            value={pendingVal !== undefined ? (pendingVal.countedQty ?? "") : (item.countedQty ?? "")}
                            onChange={(e) => handleCountChange(item._id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                // Move to next row
                                const nextItem = filteredItems[idx + 1];
                                if (nextItem && countInputRefs.current[nextItem._id]) {
                                  countInputRefs.current[nextItem._id].focus();
                                  countInputRefs.current[nextItem._id].select();
                                }
                              }
                            }}
                            className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            placeholder="—"
                          />
                        ) : (
                          <span className="font-medium">{item.countedQty ?? "—"}</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {displayVariance !== null ? (
                          <span className={`font-bold ${
                            displayVariance > 0 ? "text-green-600" : displayVariance < 0 ? "text-red-600" : "text-gray-500"
                          }`}>
                            {displayVariance > 0 ? "+" : ""}{displayVariance}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right hidden lg:table-cell">
                        {displayVariance !== null && displayVariance !== 0 ? (
                          <span className={displayVariance > 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(Math.abs(displayVariance * item.costPrice))}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {(pendingVal || item.status === "counted") ? (
                          <span className="inline-flex w-2 h-2 rounded-full bg-green-500" title="Counted" />
                        ) : (
                          <span className="inline-flex w-2 h-2 rounded-full bg-gray-300" title="Pending" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <FontAwesomeIcon icon={faBalanceScale} className="w-10 h-10 mb-3" />
                <p>No items match your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
