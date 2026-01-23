"use client";

import Layout from "@/components/Layout";
import { Loader } from "@/components/ui";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", type: "REGULAR" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers");
    } finally {
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
        <Loader size="lg" text="Loading customers..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-3 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Customers</h1>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditing(null);
                setFormData({ name: "", email: "", phone: "", address: "", type: "REGULAR" });
              }}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm md:text-base"
            >
              + Add Customer
            </button>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
            <Link href="/manage/customers">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg cursor-pointer border-l-4 border-blue-600">
                <p className="font-bold text-gray-900 text-sm md:text-base">📋 Customers</p>
                <p className="text-xs md:text-sm text-gray-600">Manage all customers</p>
              </div>
            </Link>
            <Link href="/manage/customer-search">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg cursor-pointer border-l-4 border-blue-600">
                <p className="font-bold text-gray-900 text-sm md:text-base">🔍 Customer Search</p>
                <p className="text-xs md:text-sm text-gray-600">Find customers quickly</p>
              </div>
            </Link>
            <Link href="/manage/campaigns">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg cursor-pointer border-l-4 border-blue-600">
                <p className="font-bold text-gray-900 text-sm md:text-base">📢 Campaigns</p>
                <p className="text-xs md:text-sm text-gray-600">Create marketing campaigns</p>
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
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editing ? "Edit Customer" : "Add New Customer"}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                >
                  <option value="REGULAR">Regular Customer</option>
                  <option value="VIP">VIP Customer</option>
                  <option value="NEW">New Customer</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="BULK_BUYER">Bulk Buyer</option>
                </select>
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold"
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
                    className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Customers Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
            {customers.length === 0 ? (
              <div className="p-4 md:p-6 text-center text-gray-600">
                <p className="text-base md:text-lg">No customers found. Create one to get started!</p>
              </div>
            ) : (
              <table className="w-full text-xs md:text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left font-bold text-gray-900">Name</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left font-bold text-gray-900 hidden sm:table-cell">Email</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left font-bold text-gray-900 hidden lg:table-cell">Phone</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left font-bold text-gray-900 hidden xl:table-cell">Address</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left font-bold text-gray-900">Type</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-center font-bold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-2 md:px-6 py-2 md:py-4 font-semibold text-gray-900 text-xs md:text-sm">{customer.name}</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-gray-700 hidden sm:table-cell text-xs md:text-sm">{customer.email}</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-gray-700 hidden lg:table-cell text-xs md:text-sm">{customer.phone}</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-gray-700 hidden xl:table-cell text-xs md:text-sm">{customer.address || "N/A"}</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                        <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
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
            )}
        </div>
      </div>
      </div>
    </Layout>
  );
}
