"use client";

import Layout from "@/components/Layout";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function CustomerSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]);

  useEffect(() => {
    fetchAllCustomers();
  }, []);

  async function fetchAllCustomers() {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setAllCustomers(data.customers || []);
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  }

  function handleSearch(query) {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = allCustomers.filter(customer => 
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.email.toLowerCase().includes(query.toLowerCase()) ||
      customer.phone.includes(query)
    );

    setSearchResults(filtered);
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-3 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900">Customer Search</h1>
            <Link href="/manage/customers">
              <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">
                ← Back to Customers
              </button>
            </Link>
          </div>

          {/* Search Box */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:border-cyan-600 focus:outline-none"
              />
              <span className="absolute right-4 top-3.5 text-2xl">🔍</span>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 ? (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-100 border-b p-4">
                <p className="font-semibold text-gray-900">
                  Found {searchResults.length} customer{searchResults.length !== 1 ? 's' : ''}
                </p>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-900">Phone</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-900">Address</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-900">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((customer) => (
                    <tr key={customer._id} className="border-b border-gray-200 hover:bg-cyan-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{customer.name}</td>
                      <td className="px-6 py-4 text-gray-700">{customer.email}</td>
                      <td className="px-6 py-4 text-gray-700">{customer.phone}</td>
                      <td className="px-6 py-4 text-gray-700">{customer.address || "N/A"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          customer.type === "VIP" ? "bg-purple-100 text-purple-800" :
                          customer.type === "NEW" ? "bg-blue-100 text-blue-800" :
                          customer.type === "BULK_BUYER" ? "bg-orange-100 text-orange-800" :
                          customer.type === "INACTIVE" ? "bg-gray-100 text-gray-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {customer.type || "REGULAR"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : searchQuery ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center text-yellow-800">
              <p className="text-lg">No customers found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center text-blue-800">
              <p className="text-lg">👆 Start typing to search customers</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
