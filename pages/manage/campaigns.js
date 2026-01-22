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
      <div className="min-h-screen bg-gray-50 p-3 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900">Marketing Campaigns</h1>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditing(null);
                setFormData({
                  name: "",
                  description: "",
                  discount: 0,
                  targetCustomers: "all",
                  startDate: "",
                  endDate: "",
                });
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold"
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
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editing ? "Edit Campaign" : "Create New Campaign"}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Campaign Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                  required
                />
                <input
                  type="number"
                  placeholder="Discount (%)"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                  min="0"
                  max="100"
                />
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="md:col-span-2 border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                  rows="3"
                />
                <select
                  value={formData.targetCustomers}
                  onChange={(e) => setFormData({ ...formData, targetCustomers: e.target.value })}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                >
                  <option value="all">All Customers</option>
                  <option value="vip">VIP Customers</option>
                  <option value="new">New Customers</option>
                  <option value="inactive">Inactive Customers</option>
                </select>
                <div></div>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                  required
                />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-cyan-600 focus:outline-none"
                  required
                />
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold"
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
                        targetCustomers: "all",
                        startDate: "",
                        endDate: "",
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Campaigns Grid */}
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-lg text-gray-600">No campaigns yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-600">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{campaign.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                  <div className="space-y-2 mb-4 text-sm">
                    <p><span className="font-semibold">Discount:</span> {campaign.discount}%</p>
                    <p><span className="font-semibold">Target:</span> {campaign.targetCustomers}</p>
                    <p><span className="font-semibold">Period:</span> {campaign.startDate} to {campaign.endDate}</p>
                  </div>
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => handleEdit(campaign)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
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
