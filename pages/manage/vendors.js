"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import useProgress from "@/lib/useProgress";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Edit, Trash2, X, Phone, Mail, MapPin,
  ShoppingCart, Package, User, ChevronDown,
} from "lucide-react";

function getToday() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function VendorsPage() {
  const { progress, start, complete } = useProgress();
  const [vendors, setVendors] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [activeProductDropdown, setActiveProductDropdown] = useState(null);

  // Order form state
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [orderForm, setOrderForm] = useState({ date: getToday(), contact: "", products: [] });
  const [orders, setOrders] = useState([]); // staged orders before submit
  const [submitting, setSubmitting] = useState(false);
  const [editingOrder, setEditingOrder] = useState(false);
  const orderFormRef = useRef(null);

  const emptyForm = {
    companyName: "", vendorRep: "", repPhone: "", email: "",
    address: "", mainProduct: "", bankName: "", accountName: "",
    accountNumber: "", isActive: true, products: [],
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchVendors(); fetchProducts(); }, []);

  async function fetchVendors() {
    try {
      start();
      const res = await apiClient.get("/api/vendors");
      const list = res.data?.vendors || res.data;
      setVendors(Array.isArray(list) ? list : []);
      complete();
    } catch { complete(); } finally { setLoading(false); }
  }

  async function fetchProducts() {
    try {
      const res = await apiClient.get("/api/products?minimal=true&limit=1000");
      const list = res.data?.data || res.data?.products || res.data;
      setAllProducts(Array.isArray(list) ? list : []);
    } catch { }
  }

  function addVendorProduct() {
    setForm((prev) => ({
      ...prev,
      products: [...prev.products, { product: "", productName: "", price: 0, packType: "unit", qtyPerPack: 1 }],
    }));
  }

  function removeVendorProduct(idx) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== idx),
    }));
  }

  function updateVendorProduct(idx, field, value) {
    setForm((prev) => {
      const products = [...prev.products];
      if (field === "product") {
        const selected = allProducts.find((p) => p._id === value);
        products[idx] = { ...products[idx], product: value, productName: selected?.name || "" };
      } else {
        products[idx] = { ...products[idx], [field]: value };
      }
      return { ...prev, products };
    });
  }

  const filteredProductOptions = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const s = productSearch.toLowerCase();
    return allProducts.filter((p) => p.name?.toLowerCase().includes(s));
  }, [allProducts, productSearch]);

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
      products: (vendor.products || []).map((p) => ({
        product: p.product?._id || p.product || "",
        productName: p.productName || p.product?.name || "",
        price: p.price || 0,
        packType: p.packType || "unit",
        qtyPerPack: p.qtyPerPack || 1,
      })),
    });
    setEditingVendor(vendor);
    setShowForm(true);
  }

  function openAdd() {
    setForm(emptyForm);
    setEditingVendor(null);
    setShowForm(true);
  }

  // Place Order handler - pre-fill form with vendor's products
  function handlePlaceOrder(vendor) {
    setSelectedVendor(vendor);
    const products = (vendor.products || []).map((p) => ({
      _id: p.product?._id || p.product || "",
      name: p.productName || p.product?.name || p.name || "",
      quantity: 0,
      costPrice: p.price || 0,
    }));
    setOrderForm({
      date: getToday(),
      contact: vendor.repPhone || "",
      products: products.length > 0 ? products : [{ _id: "", name: "", quantity: 0, costPrice: 0 }],
    });
    setOrders([]);
    setEditingOrder(false);
    setTimeout(() => {
      orderFormRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleOrderFormSubmit(e) {
    e.preventDefault();
    const validProducts = orderForm.products.filter((p) => p.name && p.quantity > 0);
    if (validProducts.length === 0) {
      alert("Please add at least one product with quantity");
      return;
    }
    const newOrders = validProducts.map((prod) => ({
      productId: prod._id,
      name: prod.name,
      quantity: Number(prod.quantity),
      price: Number(prod.costPrice),
      total: Number(prod.quantity) * Number(prod.costPrice),
    }));
    setOrders((prev) => [...prev, ...newOrders]);
    // Reset quantities
    setOrderForm((prev) => ({
      ...prev,
      products: prev.products.map((p) => ({ ...p, quantity: 0 })),
    }));
  }

  async function handleSubmitOrder() {
    if (orders.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        vendor: selectedVendor._id,
        vendorName: selectedVendor.companyName,
        contact: orderForm.contact,
        date: orderForm.date,
        products: orders.map((o) => ({
          name: o.name,
          quantity: o.quantity,
          price: o.price,
          total: o.total,
        })),
        grandTotal: orders.reduce((sum, o) => sum + o.total, 0),
      };
      await apiClient.post("/api/purchase-orders", payload);
      alert("Purchase order submitted successfully!");
      setOrders([]);
      setSelectedVendor(null);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  }

  function updateOrderProduct(idx, field, value) {
    setOrderForm((prev) => {
      const products = [...prev.products];
      products[idx] = { ...products[idx], [field]: value };
      return { ...prev, products };
    });
  }

  function addOrderProductRow() {
    setOrderForm((prev) => ({
      ...prev,
      products: [...prev.products, { _id: "", name: "", quantity: 0, costPrice: 0 }],
    }));
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return vendors;
    const s = search.toLowerCase();
    return vendors.filter((v) =>
      v.companyName?.toLowerCase().includes(s) ||
      v.vendorRep?.toLowerCase().includes(s) ||
      v.mainProduct?.toLowerCase().includes(s)
    );
  }, [search, vendors]);

  const orderGrandTotal = useMemo(() =>
    orderForm.products.reduce((sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.costPrice) || 0), 0),
  [orderForm.products]);

  if (loading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-3 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-4 sm:mb-6">
            Vendor Management
          </h1>

          {/* Vendor Section */}
          <section className="bg-white p-3 sm:p-6 rounded shadow relative">
            <div className="flex flex-col mb-4 sm:flex-row sm:items-center gap-4 sm:gap-6 w-full">
              <label htmlFor="searchVendor" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Search
              </label>
              <input
                id="searchVendor"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor or product..."
                className="flex-grow border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md px-3 py-2 text-sm transition-all duration-200"
              />
            </div>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Vendors</h2>
              <button
                onClick={openAdd}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                + Add Vendor
              </button>
            </div>

            {/* Vendor Card Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {search ? "No vendors match your search" : "No vendors yet. Click Add Vendor to get started."}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((vendor, index) => {
                  const isExpanded = expandedIndex === index;
                  return (
                    <motion.div
                      key={vendor._id}
                      layout
                      className={`rounded-xl border shadow-sm cursor-pointer transition-all duration-200 ${
                        isExpanded
                          ? "col-span-2 sm:col-span-3 lg:col-span-4 bg-blue-50 border-blue-300"
                          : "bg-white border-gray-200 hover:shadow-md hover:border-blue-200"
                      }`}
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    >
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                            {vendor.companyName}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isExpanded ? "bg-blue-200 text-blue-800" : "bg-green-100 text-green-700"
                          }`}>
                            {isExpanded ? "Expanded" : "Open"}
                          </span>
                        </div>
                        {vendor.mainProduct && (
                          <p className="text-xs text-gray-500 truncate">{vendor.mainProduct}</p>
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 border-t border-blue-200 pt-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-700">
                                {vendor.vendorRep && (
                                  <div className="flex items-center gap-1.5">
                                    <User size={13} className="text-gray-400" />
                                    <span>Rep: {vendor.vendorRep}</span>
                                  </div>
                                )}
                                {vendor.repPhone && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone size={13} className="text-gray-400" />
                                    <span>{vendor.repPhone}</span>
                                  </div>
                                )}
                                {vendor.mainProduct && (
                                  <div className="flex items-center gap-1.5">
                                    <Package size={13} className="text-gray-400" />
                                    <span>{vendor.mainProduct}</span>
                                  </div>
                                )}
                                {vendor.products?.length > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <ShoppingCart size={13} className="text-gray-400" />
                                    <span>{vendor.products.length} product{vendor.products.length !== 1 ? "s" : ""}</span>
                                  </div>
                                )}
                                {vendor.email && (
                                  <div className="flex items-center gap-1.5">
                                    <Mail size={13} className="text-gray-400" />
                                    <span>{vendor.email}</span>
                                  </div>
                                )}
                                {vendor.address && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin size={13} className="text-gray-400" />
                                    <span className="truncate">{vendor.address}</span>
                                  </div>
                                )}
                              </div>

                              {/* Vendor Products List */}
                              {vendor.products?.length > 0 && (
                                <div className="mt-3 bg-gray-50 rounded-lg p-3">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Supplied Products</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {vendor.products.map((p, i) => (
                                      <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200 text-xs">
                                        <span className="font-medium text-gray-700 truncate">
                                          {p.productName || p.product?.name || "Unnamed"}
                                          {p.packType === "pack" && <span className="ml-1 text-purple-600">({p.qtyPerPack || 1}/pack)</span>}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.packType === "pack" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                                            {p.packType === "pack" ? "Pack" : "Unit"}
                                          </span>
                                          {p.price > 0 && <span className="text-blue-600 font-semibold">{formatCurrency(p.price)}</span>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePlaceOrder(vendor); }}
                                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                >
                                  <ShoppingCart size={14} /> Place Order
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEdit(vendor); }}
                                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                                >
                                  <Edit size={14} /> Edit
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(vendor._id); }}
                                  className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Delete confirm */}
                            {deleteConfirm === vendor._id && (
                              <div className="border-t border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between">
                                <span className="text-sm text-red-700">Delete this vendor?</span>
                                <div className="flex gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }} className="px-3 py-1 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Cancel</button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(vendor._id); }} className="px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Order Form */}
          {selectedVendor && (
            <form
              ref={orderFormRef}
              onSubmit={handleOrderFormSubmit}
              className="bg-white p-3 sm:p-6 rounded shadow space-y-4 sm:space-y-6"
            >
              {/* Vendor Info Header */}
              <div className="p-3 sm:p-5 rounded-xl shadow-md border border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl shadow-sm mb-4 gap-2">
                  <h2 className="text-base sm:text-xl font-bold text-blue-900 flex items-center gap-2">
                    <Package size={20} />
                    Vendor Order:{" "}
                    <span className="text-blue-700 font-semibold">
                      {selectedVendor.mainProduct || selectedVendor.companyName}
                    </span>
                  </h2>
                  <span className="text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 px-3 py-1 rounded-full shadow-sm">
                    Order Mode
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-700 space-y-1">
                  <p><strong>Company:</strong> {selectedVendor.companyName}</p>
                  {selectedVendor.vendorRep && <p><strong>Representative:</strong> {selectedVendor.vendorRep}</p>}
                  {selectedVendor.repPhone && <p><strong>Phone:</strong> {selectedVendor.repPhone}</p>}
                </div>
              </div>

              {/* Date & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={orderForm.date} onChange={(e) => setOrderForm({ ...orderForm, date: e.target.value })} className="w-full border p-2 rounded text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input type="text" value={selectedVendor.companyName} disabled className="w-full border p-2 rounded text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <input type="text" value={orderForm.contact} onChange={(e) => setOrderForm({ ...orderForm, contact: e.target.value })} placeholder="Phone number" className="w-full border p-2 rounded text-sm" />
                </div>
              </div>

              {/* Products */}
              {orderForm.products.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-700">Products</h2>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={addOrderProductRow}
                        className="text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Row
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Clear the entire form?")) {
                            setSelectedVendor(null);
                            setOrders([]);
                          }
                        }}
                        className="text-sm text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
                      >
                        × Clear All
                      </button>
                    </div>
                  </div>

                  {orderForm.products.map((product, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Product Name</label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => updateOrderProduct(index, "name", e.target.value)}
                            placeholder="Product name"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="0"
                            value={product.quantity}
                            onChange={(e) => updateOrderProduct(index, "quantity", e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Cost Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={product.costPrice}
                            onChange={(e) => updateOrderProduct(index, "costPrice", e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        Subtotal: <span className="font-semibold text-blue-700">{formatCurrency((Number(product.quantity) || 0) * (Number(product.costPrice) || 0))}</span>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between w-full text-right font-medium pt-2">
                    <div className="text-gray-700">Total</div>
                    <div className="font-semibold text-blue-700 text-lg">
                      {formatCurrency(orderGrandTotal)}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-right">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium">
                  Add Order
                </button>
              </div>
            </form>
          )}

          {/* Order Review / Summary */}
          {orders.length > 0 && (
            <section className="bg-white p-3 sm:p-6 rounded-xl shadow-lg space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-b pb-2">Purchase Order Summary</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left border border-gray-200">
                  <thead className="bg-blue-50 text-gray-700 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-2 border">#</th>
                      <th className="px-4 py-2 border">Product Name</th>
                      <th className="px-4 py-2 border">Quantity</th>
                      <th className="px-4 py-2 border">Unit Price</th>
                      <th className="px-4 py-2 border">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800">
                    {orders.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-all">
                        <td className="px-4 py-2 border">{index + 1}</td>
                        <td className="px-4 py-2 border">{item.name}</td>
                        <td className="px-4 py-2 border">
                          {editingOrder ? (
                            <input type="number" min={0} value={item.quantity}
                              onChange={(e) => { const u = [...orders]; u[index].quantity = parseFloat(e.target.value) || 0; u[index].total = u[index].quantity * u[index].price; setOrders(u); }}
                              className="w-16 border rounded px-1 py-0.5 text-sm" />
                          ) : item.quantity}
                        </td>
                        <td className="px-4 py-2 border">
                          {editingOrder ? (
                            <input type="number" min={0} step={0.01} value={item.price}
                              onChange={(e) => { const u = [...orders]; u[index].price = parseFloat(e.target.value) || 0; u[index].total = u[index].quantity * u[index].price; setOrders(u); }}
                              className="w-20 border rounded px-1 py-0.5 text-sm" />
                          ) : formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-2 border font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-100 text-blue-800 font-bold">
                      <td colSpan="4" className="px-4 py-2 text-right border">Grand Total:</td>
                      <td className="px-4 py-2 border">{formatCurrency(orders.reduce((sum, o) => sum + o.total, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex flex-wrap justify-end items-center gap-3 mt-4">
                {editingOrder ? (
                  <>
                    <button onClick={() => setEditingOrder(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all shadow-sm">Cancel Edit</button>
                    <button onClick={() => { setEditingOrder(false); }}
                      className="px-5 py-2 text-sm font-semibold bg-yellow-500 text-white rounded-sm hover:bg-yellow-600 transition-all shadow-sm">
                      Save Edit
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditingOrder(true)}
                    className="px-5 py-2 text-sm font-semibold border border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-sm transition-all shadow-sm">
                    Edit Order
                  </button>
                )}
                {!editingOrder && (
                  <button onClick={handleSubmitOrder}
                    className="px-6 py-3 text-sm font-semibold bg-green-600 text-white rounded-sm hover:bg-green-700 transition-all shadow-sm"
                    disabled={submitting}>
                    {submitting ? "Processing Order..." : "Submit Order"}
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Vendor Form Modal */}
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

              {/* Vendor Products */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Products Supplied</h3>
                  <button type="button" onClick={addVendorProduct} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"><Plus size={14} /> Add Product</button>
                </div>
                {form.products.length === 0 && (
                  <p className="text-xs text-gray-400 mb-2">No products attached yet. Add products this vendor supplies.</p>
                )}
                <div className="space-y-2">
                  {form.products.map((vp, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Search or select product..."
                            value={vp.productName || ""}
                            onChange={(e) => {
                              updateVendorProduct(i, "productName", e.target.value);
                              updateVendorProduct(i, "product", "");
                              setProductSearch(e.target.value);
                              setActiveProductDropdown(i);
                            }}
                            onFocus={() => {
                              setProductSearch(vp.productName || "");
                              setActiveProductDropdown(i);
                            }}
                            onBlur={() => setTimeout(() => setActiveProductDropdown(null), 200)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                          {activeProductDropdown === i && (
                            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                              {filteredProductOptions.slice(0, 30).map((p) => (
                                <button
                                  key={p._id}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    updateVendorProduct(i, "product", p._id);
                                    setProductSearch("");
                                    setActiveProductDropdown(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                                >
                                  {p.name}
                                </button>
                              ))}
                              {filteredProductOptions.length === 0 && (
                                <div className="px-3 py-2 text-xs text-gray-400">No products found</div>
                              )}
                            </div>
                          )}
                          {vp.product && (
                            <button type="button" onClick={() => { updateVendorProduct(i, "product", ""); updateVendorProduct(i, "productName", ""); setActiveProductDropdown(null); }} className="absolute right-2 top-2.5 text-gray-400 hover:text-red-500"><X size={14} /></button>
                          )}
                        </div>
                        <button type="button" onClick={() => removeVendorProduct(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Cost Price</label>
                          <input
                            type="number" min="0" step="0.01" placeholder="Cost price"
                            value={vp.price}
                            onChange={(e) => updateVendorProduct(i, "price", Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Type</label>
                          <select
                            value={vp.packType || "unit"}
                            onChange={(e) => updateVendorProduct(i, "packType", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="unit">Unit</option>
                            <option value="pack">Pack</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Qty/Pack</label>
                          <input
                            type="number" min="1" placeholder="1"
                            value={vp.qtyPerPack || 1}
                            onChange={(e) => updateVendorProduct(i, "qtyPerPack", Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500"
                            disabled={vp.packType !== "pack"}
                          />
                        </div>
                      </div>
                      {vp.packType === "pack" && vp.product && vp.qtyPerPack > 1 && (
                        <p className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          A child product &quot;{vp.productName} (Pack of {vp.qtyPerPack})&quot; will be auto-created with cost price {formatCurrency((vp.price || 0) * (vp.qtyPerPack || 1))}. You can set the sale price later in the Product List.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
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
