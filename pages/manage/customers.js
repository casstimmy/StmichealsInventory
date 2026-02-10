"use client";

import Layout from "@/components/Layout";
import { Loader } from "@/components/ui";
import useProgress from "@/lib/useProgress";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { progress, start, onFetch, onProcess, complete } = useProgress();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", type: "REGULAR" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      start();
      onFetch();
      const res = await fetch("/api/customers");
      const data = await res.json();
      onProcess();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers");
    } finally {
      complete();
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email || !formData.phone) {
      setError("Name, email, and phone are required");
      return;
    }

    try {
      const url = editing ? `/api/customers/${editing}` : "/api/customers";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save customer");
      }

      setSuccess(`Customer ${editing ? "updated" : "created"} successfully!`);
      setFormData({ name: "", email: "", phone: "", address: "" });
      setEditing(null);
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(customer) {
    setFormData(customer);
    setEditing(customer._id);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete customer");
      }

      setSuccess("Customer deleted successfully!");
      fetchCustomers();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader size="lg" text="Loading customers..." progress={progress} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
          {/* Header */}
          <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="page-title">Customers</h1>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditing(null);
                setFormData({ name: "", email: "", phone: "", address: "", type: "REGULAR" });
              }}
              className="btn-action-primary w-full sm:w-auto"
            >
              + Add Customer
            </button>
          </div>

          {/* Search Bar */}
          <div className="content-card mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input w-full pl-10"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-500 mt-2">
                Found {customers.filter(c =>
                  c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.phone?.includes(searchQuery)
                ).length} result(s)
              </p>
            )}
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Link href="/manage/customers">
              <div className="content-card hover:shadow-md cursor-pointer border-l-4 border-l-sky-600 transition-shadow">
                <p className="font-bold text-gray-900 text-sm md:text-base">📋 Customers</p>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Manage all customers</p>
              </div>
            </Link>
            <Link href="/manage/campaigns">
              <div className="content-card hover:shadow-md cursor-pointer border-l-4 border-l-sky-600 transition-shadow">
                <p className="font-bold text-gray-900 text-sm md:text-base">📢 Campaigns</p>
                <p className="text-xs md:text-sm text-gray-600 mt-1">Create marketing campaigns</p>
              </div>
            </Link>
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
            <div className="content-card mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                {editing ? "Edit Customer" : "Add New Customer"}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-input"
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="form-select"
                >
                  <option value="REGULAR">Regular Customer</option>
                  <option value="VIP">VIP Customer</option>
                  <option value="NEW">New Customer</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="BULK_BUYER">Bulk Buyer</option>
                </select>
                <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="btn-action-primary flex-1"
                  >
                    {editing ? "Update" : "Create"} Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                      setFormData({ name: "", email: "", phone: "", address: "", type: "REGULAR" });
                    }}
                    className="btn-action-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Customers Table */}
          <div className="data-table-container">
            {customers.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-title">No customers found</p>
                <p className="empty-state-description">Create one to get started!</p>
              </div>
            ) : (() => {
              const filtered = customers.filter(c =>
                !searchQuery ||
                c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.phone?.includes(searchQuery)
              );
              return filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-lg font-medium">No customers match &quot;{searchQuery}&quot;</p>
                  <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="hidden sm:table-cell">Email</th>
                    <th className="hidden lg:table-cell">Phone</th>
                    <th className="hidden xl:table-cell">Address</th>
                    <th>Type</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => (
                    <tr key={customer._id}>
                      <td className="font-semibold text-gray-900">{customer.name}</td>
                      <td className="hidden sm:table-cell">{customer.email}</td>
                      <td className="hidden lg:table-cell">{customer.phone}</td>
                      <td className="hidden xl:table-cell">{customer.address || "N/A"}</td>
                      <td className="text-center">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                          customer.type === "VIP" ? "bg-purple-100 text-purple-800" :
                          customer.type === "NEW" ? "bg-blue-100 text-blue-800" :
                          customer.type === "BULK_BUYER" ? "bg-orange-100 text-orange-800" :
                          customer.type === "INACTIVE" ? "bg-gray-100 text-gray-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {customer.type || "REGULAR"}
                        </span>
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-blue-600 hover:text-blue-900 font-semibold mr-1 md:mr-3 text-xs md:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer._id)}
                          className="text-red-600 hover:text-red-900 font-semibold text-xs md:text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              );
            })()}
        </div>
      </div>
      </div>
    </Layout>
  );
}
