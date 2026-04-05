"use client";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import useProgress from "@/lib/useProgress";
import { apiClient } from "@/lib/api-client";
import { Search, Plus, Edit, Trash2, X, ChevronDown, ChevronUp, Phone, Mail, MapPin } from "lucide-react";

export default function VendorsPage() {
  const { progress, start, complete } = useProgress();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const emptyForm = {
    companyName: "", vendorRep: "", repPhone: "", email: "",
    address: "", mainProduct: "", bankName: "", accountName: "",
    accountNumber: "", isActive: true,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchVendors(); }, []);

  async function fetchVendors() {
    try {
      start();
      const res = await apiClient.get("/api/vendors");
      setVendors(res.data);
      complete();
    } catch { complete(); } finally { setLoading(false); }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingVendor) {
        await apiClient.put(`/api/vendors/${editingVendor._id}`, form);
      } else {
        await apiClient.post("/api/vendors", form);
      }
      setShowForm(false);
      setEditingVendor(null);
      setForm(emptyForm);
      fetchVendors();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save vendor");
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await apiClient.delete(`/api/vendors/${id}`);
      setDeleteConfirm(null);
      fetchVendors();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete vendor");
    }
  }

  function openEdit(vendor) {
    setForm({
      companyName: vendor.companyName || "",
      vendorRep: vendor.vendorRep || "",
      repPhone: vendor.repPhone || "",
      email: vendor.email || "",
      address: vendor.address || "",
      mainProduct: vendor.mainProduct || "",
      bankName: vendor.bankName || "",
      accountName: vendor.accountName || "",
      accountNumber: vendor.accountNumber || "",
      isActive: vendor.isActive !== false,
    });
    setEditingVendor(vendor);
    setShowForm(true);
  }

  function openAdd() {
    setForm(emptyForm);
    setEditingVendor(null);
    setShowForm(true);
  }

  const filtered = vendors.filter((v) =>
    v.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    v.vendorRep?.toLowerCase().includes(search.toLowerCase()) ||
    v.mainProduct?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Vendor Management</h1>
            <p className="text-sm text-gray-500 mt-1">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""} registered</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            <Plus size={16} /> Add Vendor
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>

        {/* Vendor List */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {search ? "No vendors match your search" : "No vendors yet. Click Add Vendor to get started."}
            </div>
          )}
          {filtered.map((v) => (
            <div key={v._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Vendor row */}
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedVendor(expandedVendor === v._id ? null : v._id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 truncate">{v.companyName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.isActive !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {v.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    {v.vendorRep && <span>{v.vendorRep}</span>}
                    {v.mainProduct && <span>• {v.mainProduct}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(v); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={16} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(v._id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                  {expandedVendor === v._id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {/* Expanded details */}
              {expandedVendor === v._id && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 text-sm space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {v.repPhone && (
                      <div className="flex items-center gap-2 text-gray-600"><Phone size={14} /> {v.repPhone}</div>
                    )}
                    {v.email && (
                      <div className="flex items-center gap-2 text-gray-600"><Mail size={14} /> {v.email}</div>
                    )}
                    {v.address && (
                      <div className="flex items-center gap-2 text-gray-600"><MapPin size={14} /> {v.address}</div>
                    )}
                  </div>
                  {(v.bankName || v.accountName || v.accountNumber) && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <h4 className="font-medium text-gray-700 mb-1 text-xs uppercase tracking-wide">Bank Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-gray-600">
                        {v.bankName && <div><span className="text-gray-400 text-xs">Bank:</span> {v.bankName}</div>}
                        {v.accountName && <div><span className="text-gray-400 text-xs">Account Name:</span> {v.accountName}</div>}
                        {v.accountNumber && <div><span className="text-gray-400 text-xs">Account #:</span> {v.accountNumber}</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Delete confirm */}
              {deleteConfirm === v._id && (
                <div className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-red-700">Delete this vendor?</span>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Cancel</button>
                    <button onClick={() => handleDelete(v._id)} className="px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mb-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">{editingVendor ? "Edit Vendor" : "Add Vendor"}</h2>
              <button onClick={() => { setShowForm(false); setEditingVendor(null); }} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input type="text" value={form.vendorRep} onChange={(e) => setForm({ ...form, vendorRep: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={form.repPhone} onChange={(e) => setForm({ ...form, repPhone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Product/Service</label>
                  <input type="text" value={form.mainProduct} onChange={(e) => setForm({ ...form, mainProduct: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Bank Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
                    <input type="text" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Account Name</label>
                    <input type="text" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
                    <input type="text" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active Vendor</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingVendor(null); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                  {saving ? "Saving..." : editingVendor ? "Update Vendor" : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
