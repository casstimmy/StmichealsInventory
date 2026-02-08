"use client";

import Layout from "@/components/Layout";
import { Loader } from "@/components/ui";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function PromotionsManagementPage() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetCustomerTypes: [],
    valueType: "DISCOUNT",
    discountType: "PERCENTAGE",
    discountValue: 0,
    applicationType: "ALL_PRODUCTS",
    products: [],
    categories: [],
    startDate: "",
    endDate: "",
    indefinite: false,
    active: true,
    maxUses: "",
    displayAbovePrice: true,
    priority: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch promotions
      const promoRes = await fetch("/api/promotions");
      if (promoRes.ok) {
        const data = await promoRes.json();
        setPromotions(data.promotions || []);
      }

      // Fetch products - products endpoint returns { success: true, data: [...] }
      const prodRes = await fetch("/api/products");
      if (prodRes.ok) {
        const data = await prodRes.json();
        // Handle products response format
        const productsList = Array.isArray(data) ? data : (data.data || []);
        console.log(" Products loaded:", productsList.length, productsList.slice(0, 3));
        setProducts(productsList);
      } else {
        console.error(" Failed to fetch products:", prodRes.status);
      }

      // Fetch categories - categories endpoint returns array directly
      const catRes = await fetch("/api/categories");
      if (catRes.ok) {
        const data = await catRes.json();
        // Categories are returned as direct array
        const categoriesList = Array.isArray(data) ? data : (data.categories || []);
        console.log(" Categories loaded:", categoriesList.length, categoriesList.slice(0, 3));
        setCategories(categoriesList);
      } else {
        console.error(" Failed to fetch categories:", catRes.status);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name) {
      setError("Promotion name is required");
      return;
    }

    // Only require dates if NOT indefinite
    if (!formData.indefinite) {
      if (!formData.startDate) {
        setError("Start date is required");
        return;
      }
      if (!formData.endDate) {
        setError("End date is required");
        return;
      }
    }

    if (formData.applicationType === "ONE_PRODUCT" && formData.products.length === 0) {
      setError("Please select a product");
      return;
    }

    if (formData.applicationType === "CATEGORY" && formData.categories.length === 0) {
      setError("Please select at least one category");
      return;
    }

    if (formData.targetCustomerTypes.length === 0) {
      setError("Please select at least one customer type");
      return;
    }

    try {
      const url = editing ? `/api/promotions/${editing}` : "/api/promotions";
      const method = editing ? "PUT" : "POST";

      // Prepare data - handle dates properly
      const dataToSend = { ...formData };
      
      // Ensure dates are properly formatted
      if (dataToSend.indefinite) {
        // For indefinite promotions, set a 1-year date range
        const today = new Date();
        const oneYearLater = new Date();
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        
        dataToSend.startDate = dataToSend.startDate ? new Date(dataToSend.startDate) : today;
        dataToSend.endDate = dataToSend.endDate ? new Date(dataToSend.endDate) : oneYearLater;
      } else {
        // For regular promotions, ensure both dates are Date objects
        if (dataToSend.startDate && typeof dataToSend.startDate === 'string') {
          dataToSend.startDate = new Date(dataToSend.startDate);
        }
        if (dataToSend.endDate && typeof dataToSend.endDate === 'string') {
          dataToSend.endDate = new Date(dataToSend.endDate);
        }
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save promotion");
      }

      setSuccess(`Promotion ${editing ? "updated" : "created"} successfully!`);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      targetCustomerTypes: [],
      valueType: "DISCOUNT",
      discountType: "PERCENTAGE",
      discountValue: 0,
      applicationType: "ALL_PRODUCTS",
      products: [],
      categories: [],
      startDate: "",
      endDate: "",
      indefinite: false,
      active: true,
      maxUses: "",
      displayAbovePrice: true,
      priority: 0,
    });
    setEditing(null);
    setShowForm(false);
  }

  function handleEdit(promo) {
    setFormData({
      ...promo,
      products: promo.products?.map(p => p._id || p) || [],
      categories: promo.categories?.map(c => c._id || c) || [],
    });
    setEditing(promo._id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this promotion?")) return;

    try {
      const res = await fetch(`/api/promotions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Promotion deleted successfully!");
        fetchData();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  const toggleCustomerType = (type) => {
    setFormData({
      ...formData,
      targetCustomerTypes: formData.targetCustomerTypes.includes(type)
        ? formData.targetCustomerTypes.filter(t => t !== type)
        : [...formData.targetCustomerTypes, type],
    });
  };

  const toggleProduct = (id) => {
    setFormData({
      ...formData,
      products: formData.products.includes(id)
        ? formData.products.filter(p => p !== id)
        : [...formData.products, id],
    });
  };

  const toggleCategory = (id) => {
    setFormData({
      ...formData,
      categories: formData.categories.includes(id)
        ? formData.categories.filter(c => c !== id)
        : [...formData.categories, id],
    });
  };

  if (loading) {
    return (
      <Layout>
        <Loader size="lg" text="Loading promotions..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-3 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Customer Promotions</h1>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold text-sm md:text-base"
            >
              + Create Promotion
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {success}
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editing ? "Edit Promotion" : "Create New Promotion"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Promotion Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Discount/Increment Settings */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Price Adjustment Settings</h3>
                  
                  {/* Value Type Toggle */}
                  <div className="mb-4 flex gap-2">
                    <label className="flex-1 flex items-center p-3 border-2 rounded-lg cursor-pointer" style={{
                      borderColor: formData.valueType === "DISCOUNT" ? "#06b6d4" : "#e5e7eb",
                      backgroundColor: formData.valueType === "DISCOUNT" ? "#ecf9fb" : "white",
                    }}>
                      <input
                        type="radio"
                        name="valueType"
                        value="DISCOUNT"
                        checked={formData.valueType === "DISCOUNT"}
                        onChange={(e) => setFormData({ ...formData, valueType: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="ml-2 font-semibold text-gray-700"> Discount (Reduce Price)</span>
                    </label>
                    <label className="flex-1 flex items-center p-3 border-2 rounded-lg cursor-pointer" style={{
                      borderColor: formData.valueType === "INCREMENT" ? "#06b6d4" : "#e5e7eb",
                      backgroundColor: formData.valueType === "INCREMENT" ? "#ecf9fb" : "white",
                    }}>
                      <input
                        type="radio"
                        name="valueType"
                        value="INCREMENT"
                        checked={formData.valueType === "INCREMENT"}
                        onChange={(e) => setFormData({ ...formData, valueType: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="ml-2 font-semibold text-gray-700"> Increment (Increase Price)</span>
                    </label>
                  </div>

                  {/* Amount Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount ()</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Value * ({formData.valueType === "DISCOUNT" ? "Discount" : "Increment"})
                      </label>
                      <input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                        required
                        min="0"
                        placeholder={formData.discountType === "PERCENTAGE" ? "Enter 0-100" : "Enter amount in "}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Max Uses (Optional)
                      </label>
                      <input
                        type="number"
                        value={formData.maxUses}
                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : "" })}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Types */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Target Customer Types *</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {["REGULAR", "VIP", "NEW", "INACTIVE", "BULK_BUYER"].map((type) => (
                      <label key={type} className="flex items-center p-2 border-2 rounded-lg cursor-pointer hover:bg-gray-50" style={{
                        borderColor: formData.targetCustomerTypes.includes(type) ? "#06b6d4" : "#e5e7eb",
                        backgroundColor: formData.targetCustomerTypes.includes(type) ? "#ecf9fb" : "white",
                      }}>
                        <input
                          type="checkbox"
                          checked={formData.targetCustomerTypes.includes(type)}
                          onChange={() => toggleCustomerType(type)}
                          className="w-4 h-4"
                        />
                        <span className="ml-2 text-sm font-semibold text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Application Type */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Apply To *</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: "ALL_PRODUCTS", label: "All Products" },
                      { value: "CATEGORY", label: "Specific Categories" },
                      { value: "ONE_PRODUCT", label: "Specific Products" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50" style={{
                        borderColor: formData.applicationType === option.value ? "#06b6d4" : "#e5e7eb",
                        backgroundColor: formData.applicationType === option.value ? "#ecf9fb" : "white",
                      }}>
                        <input
                          type="radio"
                          name="applicationType"
                          value={option.value}
                          checked={formData.applicationType === option.value}
                          onChange={(e) => setFormData({ ...formData, applicationType: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span className="ml-2 text-sm font-semibold text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Categories Selection */}
                {formData.applicationType === "CATEGORY" && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Select Categories *</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                      {categories.map((cat) => (
                        <label key={cat._id} className="flex items-center p-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.categories.includes(cat._id)}
                            onChange={() => toggleCategory(cat._id)}
                            className="w-4 h-4"
                          />
                          <span className="ml-2 text-sm text-gray-700">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Selection */}
                {formData.applicationType === "ONE_PRODUCT" && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Select Products *</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {products.map((prod) => (
                        <label key={prod._id} className="flex items-center p-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.products.includes(prod._id)}
                            onChange={() => toggleProduct(prod._id)}
                            className="w-4 h-4"
                          />
                          <span className="ml-2 text-sm text-gray-700">{prod.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date Range */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Promotion Period</h3>
                  
                  {/* Indefinite Option */}
                  <div className="mb-4">
                    <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer" style={{
                      borderColor: formData.indefinite ? "#06b6d4" : "#e5e7eb",
                      backgroundColor: formData.indefinite ? "#ecf9fb" : "white",
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.indefinite}
                        onChange={(e) => setFormData({ ...formData, indefinite: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="ml-2 font-semibold text-gray-700"> Indefinite (Never Expires)</span>
                    </label>
                  </div>

                  {/* Date Inputs - Hidden when Indefinite */}
                  {!formData.indefinite && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date *
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          End Date *
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Message when Indefinite is Selected */}
                  {formData.indefinite && (
                    <div className="p-4 bg-cyan-50 border-2 border-cyan-300 rounded-lg text-center">
                      <p className="text-cyan-900 font-semibold">
                         This promotion will run indefinitely starting from today
                      </p>
                    </div>
                  )}
                </div>

                {/* Active Status */}
                <div>
                  <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="ml-2 text-sm font-semibold text-gray-700">Promotion is Active</span>
                  </label>
                </div>

                {/* Display Settings */}
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-cyan-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Display Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.displayAbovePrice}
                          onChange={(e) => setFormData({ ...formData, displayAbovePrice: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="ml-2 text-sm font-semibold text-gray-700">Show Promotion Above Product Price</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Priority Level (0 = highest)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold"
                  >
                    {editing ? "Update" : "Create"} Promotion
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Promotions List */}
          <div className="grid grid-cols-1 gap-4">
            {promotions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <p className="text-lg text-gray-600">No promotions yet. Create one to get started!</p>
              </div>
            ) : (
              promotions.map((promo) => (
                <div key={promo._id} className="bg-white rounded-lg shadow-lg p-6 border-l-4" style={{
                  borderColor: promo.active ? "#06b6d4" : "#ccc"
                }}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{promo.name}</h3>
                      <p className="text-sm text-gray-600">{promo.description}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${promo.valueType === "DISCOUNT" ? (promo.discountType === "PERCENTAGE" ? "text-green-600" : "text-green-600") : (promo.discountType === "PERCENTAGE" ? "text-orange-600" : "text-orange-600")}`}>
                        {promo.valueType === "DISCOUNT" ? "-" : "+"}{promo.discountValue}{promo.discountType === "PERCENTAGE" ? "%" : ""}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${promo.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {promo.active ? "Active" : "Inactive"}
                      </span>
                      <div className="text-xs text-gray-600 mt-1">{promo.valueType === "DISCOUNT" ? " Discount" : " Increment"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Customer Types</p>
                      <p className="font-semibold text-gray-900">{promo.targetCustomerTypes?.join(", ") || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Apply To</p>
                      <p className="font-semibold text-gray-900">{promo.applicationType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Period</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(promo.startDate).toLocaleDateString()} {promo.indefinite ? "-  Never expires" : `- ${new Date(promo.endDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Times Used</p>
                      <p className="font-semibold text-gray-900">
                        {promo.timesUsed || 0}{promo.maxUses ? `/${promo.maxUses}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm bg-cyan-50 p-3 rounded border border-cyan-200">
                    <div>
                      <p className="text-gray-600">Display Above Price</p>
                      <p className="font-semibold text-cyan-600">
                        {promo.displayAbovePrice ? " Yes" : " No"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Priority Level</p>
                      <p className="font-semibold text-gray-900">{promo.priority || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Max Uses</p>
                      <p className="font-semibold text-gray-900">{promo.maxUses || "Unlimited"}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(promo)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(promo._id)}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
}
