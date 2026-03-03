// pages/stock/stock-take.js
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { Loader } from "@/components/ui";
import useProgress from "@/lib/useProgress";
import { formatCurrency } from "@/lib/format";
import { getCachedSetup } from "@/lib/setupCache";
import { getCachedCategories } from "@/lib/categoriesCache";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faClipboardList,
  faEye,
  faPlay,
  faCheck,
  faTimes,
  faSearch,
  faFileExport,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  "in-progress": "bg-blue-50 text-blue-700 border-blue-300",
  completed: "bg-yellow-50 text-yellow-700 border-yellow-300",
  approved: "bg-green-50 text-green-700 border-green-300",
  cancelled: "bg-red-50 text-red-700 border-red-300",
};

const TYPE_LABELS = {
  full: "Full Count",
  partial: "Partial Count",
  cycle: "Cycle Count",
  "spot-check": "Spot Check",
};

export default function StockTakeList() {
  const router = useRouter();
  const { progress, start, onFetch, onProcess, complete } = useProgress();

  const [stockTakes, setStockTakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Create form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    locationName: "",
    locationId: "",
    type: "full",
    category: "all",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchStockTakes = useCallback(async () => {
    try {
      setLoading(true);
      start();
      onFetch();
      const res = await fetch("/api/stock-take");
      const data = await res.json();
      onProcess();
      if (data.success) {
        setStockTakes(data.stockTakes || []);
      }
    } catch (err) {
      console.error("Failed to fetch stock takes:", err);
    } finally {
      complete();
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const [setup, cats] = await Promise.all([
          getCachedSetup(),
          getCachedCategories(),
        ]);
        const locs = setup?.store?.locations || [];
        setLocations(locs);
        setCategories(Array.isArray(cats) ? cats : []);
        if (locs.length > 0) {
          setForm((f) => ({ ...f, locationName: locs[0].name, locationId: locs[0]._id }));
        }
      } catch (err) {
        console.error("Init error:", err);
      }
      fetchStockTakes();
    }
    init();
  }, [fetchStockTakes]);

  const filtered = useMemo(() => {
    return stockTakes.filter((st) => {
      if (filterStatus !== "all" && st.status !== filterStatus) return false;
      if (filterLocation !== "all" && st.locationName !== filterLocation) return false;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        return (
          st.reference?.toLowerCase().includes(t) ||
          st.title?.toLowerCase().includes(t) ||
          st.createdBy?.toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [stockTakes, filterStatus, filterLocation, searchTerm]);

  const handleCreate = async () => {
    if (!form.title.trim()) return setError("Title is required");
    if (!form.locationName) return setError("Please select a location");
    setCreating(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch("/api/stock-take", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          createdBy: user?.name || "Admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setForm((f) => ({ ...f, title: "", description: "", type: "full", category: "all" }));
        router.push(`/stock/stock-take/${data.id}`);
      } else {
        setError(data.message || "Failed to create stock take");
      }
    } catch (err) {
      setError("Failed to create stock take");
    } finally {
      setCreating(false);
    }
  };

  const summary = useMemo(() => {
    const all = stockTakes;
    return {
      total: all.length,
      draft: all.filter((s) => s.status === "draft").length,
      inProgress: all.filter((s) => s.status === "in-progress").length,
      completed: all.filter((s) => s.status === "completed").length,
      approved: all.filter((s) => s.status === "approved").length,
    };
  }, [stockTakes]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader size="lg" text="Loading stock takes..." progress={progress} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
          {/* Header */}
          <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="page-title">Stock Take</h1>
              <p className="page-subtitle">Physical inventory counts & reconciliation</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-action-primary flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              New Stock Take
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Total", value: summary.total, color: "bg-gray-50 border-gray-200" },
              { label: "Draft", value: summary.draft, color: "bg-gray-50 border-gray-300" },
              { label: "In Progress", value: summary.inProgress, color: "bg-blue-50 border-blue-200" },
              { label: "Completed", value: summary.completed, color: "bg-yellow-50 border-yellow-200" },
              { label: "Approved", value: summary.approved, color: "bg-green-50 border-green-200" },
            ].map((card) => (
              <div key={card.label} className={`p-4 rounded-lg border ${card.color}`}>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                <div className="text-xs text-gray-600 mt-1">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="content-card mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by reference, title, or creator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-select w-full md:w-40"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="approved">Approved</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="form-select w-full md:w-48"
              >
                <option value="all">All Locations</option>
                {locations.map((l) => (
                  <option key={l._id || l.name} value={l.name}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="content-card overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <FontAwesomeIcon icon={faClipboardList} className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No stock takes found</p>
                <p className="text-gray-400 text-sm">Create a new stock take to begin inventory reconciliation</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="py-3 px-3 font-semibold text-gray-600">Reference</th>
                    <th className="py-3 px-3 font-semibold text-gray-600">Title</th>
                    <th className="py-3 px-3 font-semibold text-gray-600 hidden md:table-cell">Type</th>
                    <th className="py-3 px-3 font-semibold text-gray-600">Location</th>
                    <th className="py-3 px-3 font-semibold text-gray-600 hidden md:table-cell">Items</th>
                    <th className="py-3 px-3 font-semibold text-gray-600 hidden md:table-cell">Progress</th>
                    <th className="py-3 px-3 font-semibold text-gray-600 hidden lg:table-cell">Variance</th>
                    <th className="py-3 px-3 font-semibold text-gray-600">Status</th>
                    <th className="py-3 px-3 font-semibold text-gray-600 hidden md:table-cell">Date</th>
                    <th className="py-3 px-3 font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((st) => {
                    const progressPct = st.totalItems > 0 ? Math.round((st.countedItems / st.totalItems) * 100) : 0;
                    return (
                      <tr key={st._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 font-mono text-xs text-blue-600">{st.reference}</td>
                        <td className="py-3 px-3 font-medium text-gray-900">{st.title}</td>
                        <td className="py-3 px-3 text-gray-600 hidden md:table-cell">{TYPE_LABELS[st.type] || st.type}</td>
                        <td className="py-3 px-3 text-gray-600">{st.locationName}</td>
                        <td className="py-3 px-3 text-gray-600 hidden md:table-cell">{st.countedItems}/{st.totalItems}</td>
                        <td className="py-3 px-3 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${progressPct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{progressPct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 hidden lg:table-cell">
                          {st.totalVariance !== 0 ? (
                            <span className={st.totalVariance > 0 ? "text-green-600" : "text-red-600"}>
                              {st.totalVariance > 0 ? "+" : ""}{st.totalVariance}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[st.status] || "bg-gray-100 text-gray-600"}`}>
                            {st.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 text-xs hidden md:table-cell">
                          {new Date(st.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => router.push(`/stock/stock-take/${st._id}`)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                            title="View Details"
                          >
                            <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">New Stock Take</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
              )}
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Monthly Full Count - March 2026"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-input"
                  rows={2}
                  placeholder="Optional notes about this stock take"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Location *</label>
                  <select
                    value={form.locationName}
                    onChange={(e) => {
                      const loc = locations.find((l) => l.name === e.target.value);
                      setForm({ ...form, locationName: e.target.value, locationId: loc?._id || "" });
                    }}
                    className="form-select"
                  >
                    {locations.map((l) => (
                      <option key={l._id || l.name} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Count Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="form-select"
                  >
                    <option value="full">Full Count</option>
                    <option value="partial">Partial Count</option>
                    <option value="cycle">Cycle Count</option>
                    <option value="spot-check">Spot Check</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category Filter</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="form-select"
                >
                  <option value="all">All Categories (Full Inventory)</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="btn-action btn-action-danger">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="btn-action-primary flex items-center gap-2"
              >
                {creating ? "Creating..." : "Create Stock Take"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
