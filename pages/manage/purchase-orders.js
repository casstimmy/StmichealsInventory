"use client";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import useProgress from "@/lib/useProgress";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import {
  Plus, Search, X, ChevronDown, ChevronUp, Package,
  CreditCard, CheckCircle, Truck, Trash2, Filter,
} from "lucide-react";

const STATUS_COLORS = {
  "Not Paid": "bg-red-100 text-red-700",
  "Partly Paid": "bg-yellow-100 text-yellow-700",
  "Paid": "bg-green-100 text-green-700",
  "Credit": "bg-purple-100 text-purple-700",
};
const RECEIVED_COLORS = {
  Pending: "bg-gray-100 text-gray-600",
  "Partially Received": "bg-orange-100 text-orange-700",
  Received: "bg-green-100 text-green-700",
};

export default function PurchaseOrdersPage() {
  const { progress, start, complete } = useProgress();
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const emptyForm = {
    vendor: "", reason: "Restock", notes: "", payBeforeSupply: false,
    products: [{ name: "", quantity: 1, price: 0 }],
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchOrders();
    fetchVendors();
  }, []);

  async function fetchOrders() {
    try {
      start();
      const res = await apiClient.get("/api/purchase-orders");
      setOrders(res.data.orders || res.data);
      complete();
    } catch { complete(); } finally { setLoading(false); }
  }

  async function fetchVendors() {
    try {
      const res = await apiClient.get("/api/vendors?active=true");
      const list = res.data?.vendors || res.data;
      setVendors(Array.isArray(list) ? list : []);
    } catch {}
  }

  function addProductRow() {
    setForm({ ...form, products: [...form.products, { name: "", quantity: 1, price: 0 }] });
  }

  function removeProductRow(idx) {
    const p = [...form.products];
    p.splice(idx, 1);
    setForm({ ...form, products: p });
  }

  function updateProduct(idx, field, value) {
    const p = [...form.products];
    p[idx] = { ...p[idx], [field]: value };
    setForm({ ...form, products: p });
  }

  function getGrandTotal() {
    return form.products.reduce((sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.price) || 0), 0);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.vendor) {
      alert("Please select a vendor");
      return;
    }
    if (form.products.some((p) => !p.name)) {
      alert("All products must have a name");
      return;
    }
    setSaving(true);
    try {
      const vendor = vendors.find((v) => v._id === form.vendor);
      const payload = {
        vendor: form.vendor,
        vendorName: vendor?.companyName || "",
        contact: vendor?.repPhone || "",
        reason: form.reason,
        notes: form.notes,
        payBeforeSupply: form.payBeforeSupply,
        products: form.products.map((p) => ({
          name: p.name,
          quantity: Number(p.quantity) || 0,
          price: Number(p.price) || 0,
          total: (Number(p.quantity) || 0) * (Number(p.price) || 0),
        })),
        grandTotal: getGrandTotal(),
      };
      await apiClient.post("/api/purchase-orders", payload);
      setShowForm(false);
      setForm(emptyForm);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create order");
    } finally { setSaving(false); }
  }

  async function handlePayment(orderId) {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    try {
      await apiClient.put(`/api/purchase-orders/${orderId}`, {
        action: "update-payment",
        paymentMade: amount,
      });
      setShowPaymentModal(null);
      setPaymentAmount("");
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Payment update failed");
    }
  }

  async function handleConfirmReceived(orderId) {
    if (!confirm("Confirm items received? This will update stock quantities.")) return;
    try {
      await apiClient.put(`/api/purchase-orders/${orderId}`, {
        action: "confirm-received",
      });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to confirm");
    }
  }

  async function handleDelete(id) {
    try {
      await apiClient.delete(`/api/purchase-orders/${id}`);
      setDeleteConfirm(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  }

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderRef?.toLowerCase().includes(search.toLowerCase()) ||
      o.vendorName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
            <p className="text-sm text-gray-500 mt-1">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            <Plus size={16} /> New Order
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by reference or vendor..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-8 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 appearance-none">
              <option value="">All Statuses</option>
              <option value="Not Paid">Not Paid</option>
              <option value="Partly Paid">Partly Paid</option>
              <option value="Paid">Paid</option>
              <option value="Credit">Credit</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Orders", value: orders.length, color: "blue" },
            { label: "Not Paid", value: orders.filter((o) => o.status === "Not Paid").length, color: "red" },
            { label: "Partly Paid", value: orders.filter((o) => o.status === "Partly Paid").length, color: "yellow" },
            { label: "Pending Delivery", value: orders.filter((o) => o.receivedStatus === "Pending").length, color: "orange" },
          ].map((c) => (
            <div key={c.label} className={`bg-${c.color}-50 border border-${c.color}-200 rounded-xl p-3 text-center`}>
              <div className={`text-2xl font-bold text-${c.color}-700`}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {search || statusFilter ? "No orders match your filters" : "No purchase orders yet."}
            </div>
          )}
          {filtered.map((o) => (
            <div key={o._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Order Header */}
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedOrder(expandedOrder === o._id ? null : o._id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-gray-800 text-sm">{o.orderRef}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status] || ""}`}>{o.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RECEIVED_COLORS[o.receivedStatus] || ""}`}>{o.receivedStatus}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{o.vendorName}</span>
                    <span>•</span>
                    <span>{formatCurrency(o.grandTotal)}</span>
                    <span>•</span>
                    <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  {o.receivedStatus !== "Received" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleConfirmReceived(o._id); }}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="Confirm Received"
                    ><Truck size={16} /></button>
                  )}
                  {o.status !== "Paid" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowPaymentModal(o._id); setPaymentAmount(""); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Record Payment"
                    ><CreditCard size={16} /></button>
                  )}
                  {o.receivedStatus !== "Received" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(o._id); }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete"
                    ><Trash2 size={16} /></button>
                  )}
                  {expandedOrder === o._id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === o._id && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4 text-sm">
                  {/* Products Table */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Products</h4>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs text-gray-500 uppercase border-b">
                          <th className="pb-2 font-medium">Product</th>
                          <th className="pb-2 font-medium text-center">Qty</th>
                          <th className="pb-2 font-medium text-right">Price</th>
                          <th className="pb-2 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.products?.map((p, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-1.5">{p.name}</td>
                            <td className="py-1.5 text-center">{p.quantity}</td>
                            <td className="py-1.5 text-right">{formatCurrency(p.price)}</td>
                            <td className="py-1.5 text-right font-medium">{formatCurrency(p.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><span className="text-xs text-gray-400">Grand Total</span><div className="font-semibold">{formatCurrency(o.grandTotal)}</div></div>
                    <div><span className="text-xs text-gray-400">Paid</span><div className="font-semibold text-green-600">{formatCurrency(o.paymentMade)}</div></div>
                    <div><span className="text-xs text-gray-400">Balance</span><div className="font-semibold text-red-600">{formatCurrency(o.balance)}</div></div>
                    <div><span className="text-xs text-gray-400">Reason</span><div>{o.reason}</div></div>
                  </div>

                  {o.notes && <div className="text-gray-600"><span className="font-medium text-gray-700">Notes:</span> {o.notes}</div>}
                  {o.staffName && <div className="text-gray-500 text-xs">Created by: {o.staffName}</div>}
                </div>
              )}

              {/* Payment Modal Inline */}
              {showPaymentModal === o._id && (
                <div className="border-t border-blue-100 bg-blue-50 px-4 py-3 flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-blue-700 font-medium">Record Payment:</span>
                  <span className="text-xs text-gray-500">Balance: {formatCurrency(o.balance)}</span>
                  <input
                    type="number" min="0" step="0.01" placeholder="Amount" value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button onClick={(e) => { e.stopPropagation(); handlePayment(o._id); }} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Apply</button>
                  <button onClick={(e) => { e.stopPropagation(); setShowPaymentModal(null); }} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Cancel</button>
                </div>
              )}

              {/* Delete Confirm */}
              {deleteConfirm === o._id && (
                <div className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-red-700">Delete this order?</span>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Cancel</button>
                    <button onClick={() => handleDelete(o._id)} className="px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New Order Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mb-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">New Purchase Order</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                  <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500" required>
                    <option value="">Select vendor</option>
                    {vendors.map((v) => (
                      <option key={v._id} value={v._id}>{v.companyName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500">
                    <option>Restock</option>
                    <option>New Product</option>
                    <option>Emergency</option>
                    <option>Seasonal</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* Products */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Products</h3>
                  <button type="button" onClick={addProductRow} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"><Plus size={14} /> Add Row</button>
                </div>
                <div className="space-y-2">
                  {form.products.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" placeholder="Product name" value={p.name} onChange={(e) => updateProduct(i, "name", e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" required />
                      <input type="number" placeholder="Qty" min="1" value={p.quantity} onChange={(e) => updateProduct(i, "quantity", e.target.value)} className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:ring-2 focus:ring-blue-500" />
                      <input type="number" placeholder="Price" min="0" step="0.01" value={p.price} onChange={(e) => updateProduct(i, "price", e.target.value)} className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500" />
                      <span className="text-sm text-gray-600 w-24 text-right">{formatCurrency((Number(p.quantity) || 0) * (Number(p.price) || 0))}</span>
                      {form.products.length > 1 && (
                        <button type="button" onClick={() => removeProductRow(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-right mt-2 font-semibold text-gray-800">
                  Grand Total: {formatCurrency(getGrandTotal())}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="payBefore" checked={form.payBeforeSupply} onChange={(e) => setForm({ ...form, payBeforeSupply: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="payBefore" className="text-sm text-gray-700">Pay before supply</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                  {saving ? "Creating..." : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
