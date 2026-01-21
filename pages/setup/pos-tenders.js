"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import Loader from "@/components/Loader";

export default function PosTenders() {
  const [tenders, setTenders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTender, setEditingTender] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    buttonColor: "#FF69B4",
    tillOrder: 1,
    classification: "Other",
  });

  useEffect(() => {
    initializeAndFetch();
  }, []);

  const initializeAndFetch = async () => {
    try {
      setLoading(true);
      
      // First, try to seed default tenders if database is empty
      try {
        await fetch("/api/setup/seed-tenders", { method: "POST" });
      } catch (seedErr) {
        console.warn("Seed attempt failed, proceeding with fetch:", seedErr);
      }

      // Then fetch tenders
      fetchTenders();
      fetchLocations();
    } catch (err) {
      console.error("Initialization error:", err);
      setLoading(false);
    }
  };

  const fetchTenders = async () => {
    try {
      setLoading(true);
      // Fetch tenders from API
      const res = await fetch("/api/setup/tenders");
      const data = await res.json();
      
      if (data.success && data.tenders && Array.isArray(data.tenders)) {
        // Sort by tillOrder to maintain order
        const sortedTenders = [...data.tenders].sort((a, b) => (a.tillOrder || 0) - (b.tillOrder || 0));
        setTenders(sortedTenders);
        setError("");
      } else {
        setError("Failed to load tenders from database");
        setTenders([]);
      }
    } catch (err) {
      console.error("Error fetching tenders:", err);
      setError("Failed to load tenders. Please refresh the page.");
      setTenders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      // Fetch locations from Store API
      const res = await fetch("/api/setup/get");
      const data = await res.json();
      
      let locationsList = [];
      
      if (data.store && data.store.locations) {
        locationsList = data.store.locations;
      }
      
      setLocations(locationsList);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  };

  const handleAddTender = () => {
    setFormData({
      name: "",
      description: "",
      buttonColor: "#FF69B4",
      tillOrder: tenders.length + 1,
      classification: "Other",
    });
    setEditingTender(null);
    setShowAddModal(true);
  };

  const handleEditTender = (tender) => {
    setFormData(tender);
    setEditingTender(tender._id);
    setShowEditModal(true);
  };

  const handleSaveTender = async () => {
    try {
      setSaving(true);
      setError("");
      
      if (!formData.name.trim()) {
        setError("Tender name is required");
        setSaving(false);
        return;
      }

      let response;
      if (editingTender) {
        // Update existing tender
        response = await fetch(`/api/setup/tenders/${editingTender}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Add new tender
        response = await fetch("/api/setup/tenders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      }

      const data = await response.json();

      if (data.success) {
        if (editingTender) {
          setSuccess("Tender updated successfully!");
        } else {
          setSuccess("Tender added successfully!");
        }
        setShowAddModal(false);
        setShowEditModal(false);
        
        // Refresh tenders list from database
        await fetchTenders();
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to save tender");
      }
    } catch (err) {
      console.error("Error saving tender:", err);
      setError("Failed to save tender");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTender = async (tenderId) => {
    if (window.confirm("Are you sure you want to delete this tender?")) {
      try {
        setSaving(true);
        const res = await fetch(`/api/setup/tenders/${tenderId}`, {
          method: "DELETE",
        });
        const data = await res.json();

        if (data.success) {
          setSuccess("Tender deleted successfully!");
          await fetchTenders();
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError(data.message || "Failed to delete tender");
        }
      } catch (err) {
        console.error("Error deleting tender:", err);
        setError("Failed to delete tender");
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader size="lg" text="Loading tenders..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Tender Types</h1>
            <button
              onClick={handleAddTender}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              ADD TENDER TYPE
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          {/* Active Tender Types Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Active Tender Types</h2>
            <p className="text-gray-600 text-sm mb-4">View, edit and delete your tender types.</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold">EDIT</th>
                    <th className="px-6 py-3 text-left font-bold">NAME</th>
                    <th className="px-6 py-3 text-left font-bold">DESCRIPTION</th>
                    <th className="px-6 py-3 text-left font-bold">BUTTON COLOUR</th>
                    <th className="px-6 py-3 text-left font-bold">TILL ORDER</th>
                    <th className="px-6 py-3 text-left font-bold">CLASSIFICATION</th>
                    <th className="px-6 py-3 text-left font-bold">STATUS</th>
                    <th className="px-6 py-3 text-center font-bold">DELETE</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders.map((tender, idx) => (
                    <tr key={tender._id} className={`border-b border-gray-200 hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleEditTender(tender)}
                          className="text-cyan-600 hover:text-cyan-700 font-bold text-sm"
                        >
                          EDIT
                        </button>
                      </td>
                      <td className="px-6 py-3 font-bold text-gray-900">{tender.name}</td>
                      <td className="px-6 py-3 text-gray-700">{tender.description}</td>
                      <td className="px-6 py-3 text-center">
                        <div
                          className="w-6 h-6 rounded-full mx-auto border border-gray-300"
                          style={{ backgroundColor: tender.buttonColor }}
                        ></div>
                      </td>
                      <td className="px-6 py-3 text-gray-700">{tender.tillOrder}</td>
                      <td className="px-6 py-3 text-gray-700">{tender.classification}</td>
                      <td className="px-6 py-3 text-center">
                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleDeleteTender(tender._id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm transition"
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Add/Edit Tender Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingTender ? "Edit Tender" : "Add New Tender"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tender Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter tender name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Button Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.buttonColor}
                    onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.buttonColor}
                    onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Till Order
                </label>
                <input
                  type="number"
                  value={formData.tillOrder}
                  onChange={(e) => setFormData({ ...formData, tillOrder: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  min={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classification
                </label>
                <select
                  value={formData.classification}
                  onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 rounded-lg transition"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveTender}
                disabled={saving}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
              >
                {saving ? "SAVING..." : "SAVE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

