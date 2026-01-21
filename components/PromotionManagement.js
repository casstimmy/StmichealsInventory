"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";

export default function PromotionManagement() {
  const [promotions, setPromotions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editablePromotion, setEditablePromotion] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [promoPrice, setPromoPrice] = useState("");
  const [promoStart, setPromoStart] = useState("");
  const [promoEnd, setPromoEnd] = useState("");

  /* =======================
     FETCH PROMOTIONS
  ======================= */
  const fetchPromotions = async () => {
    try {
      const res = await axios.get("/api/products");
      const products = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const promoProducts = products.filter(
        (p) => p.isPromotion === true
      );
      setPromotions(promoProducts);
    } catch (err) {
      console.error("Error fetching promotions:", err);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/products");
      setAllProducts(
        Array.isArray(res.data) ? res.data : res.data?.data || []
      );
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  /* =======================
     HANDLERS
  ======================= */
  const handleSearch = () => {
    const filtered = promotions.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setPromotions(filtered);
  };

  const handleEditClick = (index, promo) => {
    setEditIndex(index);
    setEditablePromotion({
      ...promo,
      promoStart: promo.promoStart
        ? promo.promoStart.slice(0, 10)
        : "",
      promoEnd: promo.promoEnd
        ? promo.promoEnd.slice(0, 16)
        : "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditablePromotion((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateClick = async (_id) => {
    try {
      await axios.put("/api/products", {
        ...editablePromotion,
        promoStart: editablePromotion.promoStart
          ? new Date(editablePromotion.promoStart)
          : null,
        promoEnd: editablePromotion.promoEnd
          ? new Date(editablePromotion.promoEnd)
          : null,
      });

      fetchPromotions();
      setEditIndex(null);
    } catch (err) {
      console.error("Failed to update promotion:", err);
      alert("Error updating promotion!");
    }
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditablePromotion({});
  };

  const handleDeleteClick = async (_id) => {
    if (!window.confirm("Remove promotion from this product?")) return;
    try {
      await axios.put("/api/products", {
        _id,
        isPromotion: false,
        promoPrice: null,
        promoStart: null,
        promoEnd: null,
      });
      setPromotions((prev) => prev.filter((p) => p._id !== _id));
    } catch (err) {
      console.error("Failed to remove promotion:", err);
    }
  };

  /* =======================
     MODAL
  ======================= */
  const openModal = () => {
    fetchProducts();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setPromoPrice("");
    setPromoStart("");
    setPromoEnd("");
    setIsModalOpen(false);
  };

  const handleSavePromotion = async () => {
    if (!selectedProduct || !promoPrice) {
      alert("Please select a product and enter a promo price");
      return;
    }

    try {
      await axios.put("/api/products", {
        _id: selectedProduct._id,
        isPromotion: true,
        promoPrice: Number(promoPrice),
        promoStart: promoStart ? new Date(promoStart) : null,
        promoEnd: promoEnd ? new Date(promoEnd) : null,
      });

      fetchPromotions();
      closeModal();
    } catch (err) {
      console.error("Error saving promotion:", err);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-white to-blue-50 p-6">
      {/* Header */}
      <div className="flex justify-between mb-6">
        <h2 className="text-3xl font-bold text-blue-900">Promotions</h2>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          + Add Promotion
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 text-left">Product</th>
              <th className="p-3">Promo Price</th>
              <th className="p-3">Start</th>
              <th className="p-3">End</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promo, index) => (
              <tr key={promo._id} className="border-b">
                <td className="p-3 font-semibold">{promo.name}</td>

                <td className="p-3">
                  {editIndex === index ? (
                    <input
                      name="promoPrice"
                      type="number"
                      value={editablePromotion.promoPrice || ""}
                      onChange={handleChange}
                      className="border p-1 rounded w-24"
                    />
                  ) : (
                    `₦${promo.promoPrice}`
                  )}
                </td>

                <td className="p-3">
                  {editIndex === index ? (
                    <input
                      type="date"
                      name="promoStart"
                      value={editablePromotion.promoStart || ""}
                      onChange={handleChange}
                      className="border p-1 rounded"
                    />
                  ) : (
                    promo.promoStart
                      ? new Date(promo.promoStart).toLocaleDateString()
                      : "-"
                  )}
                </td>

                <td className="p-3">
                  {editIndex === index ? (
                    <input
                      type="datetime-local"
                      name="promoEnd"
                      value={editablePromotion.promoEnd || ""}
                      onChange={handleChange}
                      className="border p-1 rounded"
                    />
                  ) : (
                    promo.promoEnd
                      ? new Date(promo.promoEnd).toLocaleString()
                      : "-"
                  )}
                </td>

                <td className="p-3 flex gap-2">
                  {editIndex === index ? (
                    <>
                      <button
                        onClick={() => handleUpdateClick(promo._id)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelClick}
                        className="bg-gray-400 text-white px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditClick(index, promo)}
                        className="border px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(promo._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Promotion</h3>

            <select
              className="border p-2 w-full mb-3"
              onChange={(e) =>
                setSelectedProduct(
                  allProducts.find((p) => p._id === e.target.value)
                )
              }
            >
              <option value="">Select product</option>
              {allProducts.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Promo Price"
              className="border p-2 w-full mb-3"
              value={promoPrice}
              onChange={(e) => setPromoPrice(e.target.value)}
            />

            <input
              type="date"
              className="border p-2 w-full mb-3"
              value={promoStart}
              onChange={(e) => setPromoStart(e.target.value)}
            />

            <input
              type="datetime-local"
              className="border p-2 w-full mb-4"
              value={promoEnd}
              onChange={(e) => setPromoEnd(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-400 text-white rounded">
                Cancel
              </button>
              <button onClick={handleSavePromotion} className="px-4 py-2 bg-blue-600 text-white rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
