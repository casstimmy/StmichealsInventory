"use client";

import Layout from "@/components/Layout";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discount: 0,
    targetCustomers: "all",
    targetCategories: "all",
    targetProducts: "all",
    targetLocations: "all",
    startDate: "",
    endDate: "",
  });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      // This would fetch campaigns from API when backend is ready
      // For now, just load from localStorage
      const saved = localStorage.getItem("campaigns");
      if (saved) {
        setCampaigns(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.startDate || !formData.endDate) {
      setError("Campaign name, start date, and end date are required");
      return;
    }

    let updatedCampaigns;
    if (editing) {
      updatedCampaigns = campaigns.map(c =>
        c.id === editing ? { ...formData, id: editing, updatedAt: new Date().toISOString() } : c
      );
    } else {
      updatedCampaigns = [
        ...campaigns,
        { ...formData, id: Date.now().toString(), createdAt: new Date().toISOString() },
      ];
    }

    setCampaigns(updatedCampaigns);
    localStorage.setItem("campaigns", JSON.stringify(updatedCampaigns));
    setSuccess(`Campaign ${editing ? "updated" : "created"} successfully!`);
    setFormData({
      name: "",
      description: "",
      discount: 0,
      targetCustomers: "all",
      targetCategories: "all",
      targetProducts: "all",
      targetLocations: "all",
      startDate: "",
      endDate: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  function handleEdit(campaign) {
    setFormData(campaign);
    setEditing(campaign.id);
    setShowForm(true);
  }

  function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    localStorage.setItem("campaigns", JSON.stringify(updated));
    setSuccess("Campaign deleted successfully!");
  }

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Marketing Campaigns</h1>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditing(null);
                setFormData({
                  name: "",
                  description: "",
                  discount: 0,
                  targetCustomers: "all",
                  targetCategories: "all",
                  targetProducts: "all",
                  targetLocations: "all",
                  startDate: "",
                  endDate: "",
                });
              }}
              className="btn-action-primary"
            >
              + Create Campaign
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
            <div className="content-card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editing ? "Edit Campaign" : "Create New Campaign"}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Campaign Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Discount"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    className="form-input pr-10"
                    min="0"
                    max="100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">%</span>
                </div>
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input md:col-span-2"
                  rows="3"
                />

                {/* Target Scope */}
                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-sky-500 rounded"></span>
                    Campaign Targets
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Target Customers</label>
                  <select
                    value={formData.targetCustomers}
                    onChange={(e) => setFormData({ ...formData, targetCustomers: e.target.value })}
                    className="form-select"
                  >
                    <option value="all">All Customers</option>
                    <option value="vip">VIP Customers</option>
                    <option value="new">New Customers</option>
                    <option value="inactive">Inactive Customers</option>
                    <option value="bulk_buyer">Bulk Buyers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Target Categories</label>
                  <select
                    value={formData.targetCategories}
                    onChange={(e) => setFormData({ ...formData, targetCategories: e.target.value })}
                    className="form-select"
                  >
                    <option value="all">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="food">Food & Beverages</option>
                    <option value="accessories">Accessories</option>
                    <option value="home">Home & Living</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Target Products</label>
                  <select
                    value={formData.targetProducts}
                    onChange={(e) => setFormData({ ...formData, targetProducts: e.target.value })}
                    className="form-select"
                  >
                    <option value="all">All Products</option>
                    <option value="selected">Selected Products Only</option>
                    <option value="new_arrivals">New Arrivals</option>
                    <option value="clearance">Clearance Items</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Target Locations</label>
                  <select
                    value={formData.targetLocations}
                    onChange={(e) => setFormData({ ...formData, targetLocations: e.target.value })}
                    className="form-select"
                  >
                    <option value="all">All Locations</option>
                    <option value="online">Online Only</option>
                    <option value="instore">In-Store Only</option>
                  </select>
                </div>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="form-input"
                  required
                />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="form-input"
                  required
                />
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="btn-action-primary flex-1"
                  >
                    {editing ? "Update" : "Create"} Campaign
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                      setFormData({
                        name: "",
                        description: "",
                        discount: 0,
                        targetCustomers: "all",                        targetCategories: "all",
                        targetProducts: "all",
                        targetLocations: "all",                        startDate: "",
                        endDate: "",
                      });
                    }}
                    className="btn-action-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Campaigns Grid */}
          {campaigns.length === 0 ? (
            <div className="content-card text-center py-12">
              <p className="text-lg text-gray-500">No campaigns yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="content-card border-l-4 border-sky-600">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                  <div className="mb-3">
                    <span className="inline-block bg-sky-100 text-sky-800 text-xl font-bold px-3 py-1 rounded-lg">
                      {campaign.discount}% OFF
                    </span>
                  </div>
                  <div className="space-y-2 mb-4 text-sm">
                    <p><span className="font-medium">Customers:</span> <span className="capitalize">{campaign.targetCustomers || "all"}</span></p>
                    <p><span className="font-medium">Categories:</span> <span className="capitalize">{campaign.targetCategories || "all"}</span></p>
                    <p><span className="font-medium">Products:</span> <span className="capitalize">{campaign.targetProducts || "all"}</span></p>
                    <p><span className="font-medium">Locations:</span> <span className="capitalize">{campaign.targetLocations || "all"}</span></p>
                    <p><span className="font-medium">Period:</span> {campaign.startDate} to {campaign.endDate}</p>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(campaign)}
                      className="btn-action-primary flex-1 text-sm py-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="btn-action-danger flex-1 text-sm py-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
