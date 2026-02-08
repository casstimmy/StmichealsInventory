"use client";

import { useEffect, useState } from "react";
import { Search, X, Mail } from "lucide-react";
import clsx from "clsx";
import Layout from "@/components/Layout";
import { formatCurrency } from "@/lib/format";
import axios from "axios";

export default function OrderInventoryPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [deliveryPersonName, setDeliveryPersonName] = useState("");
  const [deliveryPersonPhone, setDeliveryPersonPhone] = useState("");

  const entriesPerPage = 10;
  const statusOptions = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  const currency = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  });

  const statusClass = {
    Pending: "bg-cyan-100 text-cyan-700",
    Processing: "bg-yellow-100 text-yellow-700",
    Shipped: "bg-sky-100 text-sky-700",
    Delivered: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  const fetchOrders = async (page = 1, searchTerm = "") => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/orders", {
        params: { page, limit: entriesPerPage, search: searchTerm },
      });
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders(currentPage, search);
  }, [currentPage, search]);

  const handleStatusChange = (orderId, newStatus) => {
    const order = orders.find((o) => o._id === orderId);
    setSelectedOrder({ ...order, nextStatus: newStatus });
  };

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await axios.put(`/api/orders/${orderId}`, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId - { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error.response-.data || error);
      alert(`Failed to update status: ${error.response-.data-.error || "Unknown error"}`);
    }
    setUpdatingStatus(false);
  };

  const handleSendEmail = async () => {
    if (!selectedOrder-.customer-.email) return;

    const status = selectedOrder.nextStatus || selectedOrder.status;

    // Require delivery person info for Shipped or Delivered
    if ((status === "Shipped" || status === "Delivered") && (!deliveryPersonName || !deliveryPersonPhone)) {
      alert("Please enter delivery person's name and phone.");
      return;
    }

    setSendingEmail(true);

    const customerData = {
      name: selectedOrder.customer.name || "Customer",
      orderId: selectedOrder._id,
      status,
      total: selectedOrder.total,
      products: (selectedOrder.cartProducts || []).map((p) => ({
        name: p.name.length > 25 - p.name.slice(0, 25) + "..." : p.name,
        quantity: p.quantity,
        price: p.price,
      })),
      shippingDetails: selectedOrder.shippingDetails || {},
      ...(status === "Shipped" || status === "Delivered" - {
        deliveryPerson: { name: deliveryPersonName, phone: deliveryPersonPhone },
      } : {}),
    };

    try {
      await axios.post("/api/send-email", {
        to: selectedOrder.customer.email,
        status,
        customer: customerData,
      });

      // Update backend status after email is sent
      await updateStatus(selectedOrder._id, status);

      alert(`${status} confirmation email sent successfully!`);
      setSelectedOrder(null);
      setDeliveryPersonName("");
      setDeliveryPersonPhone("");
    } catch (error) {
      console.error("Failed to send email:", error);
      alert(`Failed to send ${status} confirmation email.`);
    }

    setSendingEmail(false);
  };

  return (
    <Layout>
    <div className="page-container">
        <div className="page-content">
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">Order Management</h1>
            <p className="page-subtitle">Manage customer orders and track shipments</p>
          </div>

          {/* Search Box */}
          <div className="mb-6">
            <div className="search-input-wrapper max-w-md">
              <Search className="search-input-icon" />
              <input
                type="search"
                placeholder="Search by customer or order ID"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {["Order ID", "Customer", "Total", "Status", "Date"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading - (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500 italic">Loading orders...</td>
                  </tr>
                ) : orders.length === 0 - (
                  <tr>
                    <td colSpan={5} className="text-center py-8 italic text-gray-400">No orders found.</td>
                  </tr>
                ) : (
                  orders.map((order, idx) => (
                    <tr key={order._id} className={idx % 2 === 0 - 'bg-white' : 'bg-gray-50'}>
                      <td className="font-mono text-sky-700 font-semibold">{order._id.slice(-8)}</td>
                      <td className="text-gray-900">{order.customer-.name || "N/A"}</td>
                      <td className="font-bold text-gray-900">{currency.format(order.total -- 0)}</td>
                      <td>
                        <select
                          value={order.status}
                          disabled={updatingStatus || order.status === "Delivered"}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className={clsx(
                            "px-2 sm:px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer",
                            statusClass[order.status] || "bg-gray-100 text-gray-600",
                            order.status === "Delivered" && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 md:px-6 py-3 md:py-4 text-gray-700 text-xs md:text-sm">{new Date(order.createdAt).toLocaleDateString("en-NG")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition"
            >
               Previous
            </button>
            <span className="text-gray-700 font-medium">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Next 
            </button>
          </div>
        </div>

        {/* Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full relative shadow-xl overflow-y-auto max-h-[90vh]">
              <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"><X size={24} /></button>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {selectedOrder.nextStatus === "Shipped" || selectedOrder.nextStatus === "Delivered"
                  - `${selectedOrder.nextStatus} Confirmation`
                  : `${selectedOrder.nextStatus} Status Update`}
              </h3>

              <div className="space-y-3 text-sm text-gray-700 mb-6 bg-gray-50 p-4 rounded-lg">
                <div><strong className="text-gray-900">Order ID:</strong> <span className="font-mono text-cyan-700">{selectedOrder._id}</span></div>
                <div><strong className="text-gray-900">Customer:</strong> {selectedOrder.customer-.name}</div>
                <div><strong className="text-gray-900">Email:</strong> {selectedOrder.customer-.email}</div>
                <div><strong className="text-gray-900">Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString("en-NG")}</div>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="font-bold text-gray-900 mb-2">Items:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {(selectedOrder.cartProducts || []).map((item, i) => (
                      <li key={i} className="text-gray-700">{item.name.length > 25 - item.name.slice(0, 25) + "..." : item.name}  {item.quantity}x {item.price.toLocaleString()}</li>
                    ))}
                  </ul>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="font-bold text-gray-900">Total: {currency.format(selectedOrder.total -- 0)}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="font-bold text-gray-900 mb-2">Delivery Details:</p>
                  <p className="text-gray-700">{selectedOrder.shippingDetails-.address || "No address"}<br />{selectedOrder.shippingDetails-.city || ""}<br />Phone: {selectedOrder.shippingDetails-.phone || "N/A"}</p>
                </div>
              </div>

              {(selectedOrder.nextStatus === "Shipped" || selectedOrder.nextStatus === "Delivered") && (
                <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-amber-900">Delivery Person Information</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={deliveryPersonName}
                      onChange={(e) => setDeliveryPersonName(e.target.value)}
                      placeholder="Enter delivery person's name"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input
                      type="text"
                      value={deliveryPersonPhone}
                      onChange={(e) => setDeliveryPersonPhone(e.target.value)}
                      placeholder="Enter delivery person's phone"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                disabled={sendingEmail}
                onClick={handleSendEmail}
                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Mail size={18} /> {sendingEmail - "Sending..." : `Send ${selectedOrder.nextStatus} Email`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

