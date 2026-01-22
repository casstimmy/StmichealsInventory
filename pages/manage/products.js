// pages/manage/products.js  (or your route file)
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import Layout from "@/components/Layout";
import axios from "axios";
import Link from "next/link";
import useSWR, { mutate } from "swr";

const entriesPerPageDefault = 20;

// --- fetcher for SWR (uses axios so your existing endpoints stay the same)
const fetcher = (url) => axios.get(url).then((r) => r.data);

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export default function Products() {
  // SWR-backed product list (cached & revalidated in background)
  const { data: productsData, error } = useSWR("/api/products", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60000,
  });

  // categories
  const { data: categoriesData } = useSWR("/api/categories", fetcher, {
    dedupingInterval: 60000,
  });

  // local UI state
  const [allProducts, setAllProducts] = useState([]); // full list (from SWR)
  const [filteredProducts, setFilteredProducts] = useState([]); // after search/filter
  const [categoryMap, setCategoryMap] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [editableProduct, setEditableProduct] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  // pagination / lazy load
  const [entriesPerPage] = useState(entriesPerPageDefault);
  const [visibleCount, setVisibleCount] = useState(entriesPerPageDefault);

  // highlighted product id (persisted so when you go to edit page and back it stays)
  const [highlightedId, setHighlightedId] = useState(
    typeof window !== "undefined" ? sessionStorage.getItem("products:highlight") : null
  );

  // refs
  const searchRef = useRef();

  // Initialize from SWR when data arrives
  useEffect(() => {
    const list = Array.isArray(productsData) ? productsData : productsData?.data || [];
    setAllProducts(list);
    setFilteredProducts(list);
  }, [productsData]);

  // categories -> map
  useEffect(() => {
    const catList = Array.isArray(categoriesData) ? categoriesData : categoriesData?.data || [];
    const map = (catList || []).reduce((acc, c) => {
      acc[c._id] = c.name;
      return acc;
    }, {});
    setCategoryMap(map);
  }, [categoriesData]);

  // Keep highlightedId in sessionStorage so it's preserved when navigating away & back
  useEffect(() => {
    if (highlightedId) sessionStorage.setItem("products:highlight", highlightedId);
    else sessionStorage.removeItem("products:highlight");
  }, [highlightedId]);

  // Debounced search over the cached allProducts (safe - products array guarded)
  const debouncedFilter = useCallback(
    debounce((term) => {
      const t = term.trim().toLowerCase();
      if (!t) {
        setFilteredProducts(allProducts);
        setVisibleCount(entriesPerPage);
        return;
      }
      const filtered = (Array.isArray(allProducts) ? allProducts : []).filter((p) =>
        [
          p.name,
          p.barcode,
          p.description,
          categoryMap[p.category],
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(t))
      );
      setFilteredProducts(filtered);
      setVisibleCount(entriesPerPage);
    }, 250),
    [allProducts, categoryMap, entriesPerPage]
  );

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearchTerm(v);
    debouncedFilter(v);
  };

  // Inline edit handlers
  const handleEditClick = (index, product) => {
    setEditIndex(index);
    setEditableProduct({ ...product });
    setProperties(product.properties || []);
    // set highlight now so when user leaves/returns it remains
    setHighlightedId(product._id);
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditableProduct({});
    setProperties([]);
    // keep highlight (helpful) — comment out to clear highlight on cancel
    // setHighlightedId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditableProduct((prev) => {
      const newValue = type === "checkbox" ? checked : value;
      const updated = { ...prev, [name]: newValue };
      if (["costPrice", "margin", "taxRate"].includes(name)) {
        const cost = parseFloat(updated.costPrice || 0);
        const margin = parseFloat(updated.margin || 0);
        const tax = parseFloat(updated.taxRate || 0);
        updated.salePriceIncTax = calculateSalePrice(cost, margin, tax);
      }
      return updated;
    });
  };

  const handleCategoryChange = (value) =>
    setEditableProduct((prev) => ({ ...prev, category: value }));

  const handleUpdateClick = async (_id) => {
    try {
      const updatedProduct = { ...editableProduct, properties };
      await axios.put("/api/products", { ...updatedProduct, _id });

      // update local cached arrays immediately (optimistic update)
      setFilteredProducts((prev) =>
        prev.map((p) => (p._id === _id ? { ...p, ...updatedProduct } : p))
      );
      setAllProducts((prev) => prev.map((p) => (p._id === _id ? { ...p, ...updatedProduct } : p)));

      // revalidate SWR cache for /api/products
      mutate("/api/products");

      // close edit mode & highlight the updated product
      setEditIndex(null);
      setHighlightedId(_id);
      // ensure the updated item is visible (if not in current page, expand visible area)
      const indexInFiltered = (filteredProducts || []).findIndex((p) => p._id === _id);
      if (indexInFiltered >= 0) {
        const pageNeeded = Math.floor(indexInFiltered / entriesPerPage) + 1;
        const neededVisible = pageNeeded * entriesPerPage;
        if (visibleCount < neededVisible) setVisibleCount(neededVisible);
      }
    } catch (err) {
      console.error("Failed to update product", err);
      alert("Failed to update product.");
    }
  };

  const handleDeleteClick = async (_id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`/api/products?id=${_id}`);
      setFilteredProducts((prev) => prev.filter((p) => p._id !== _id));
      setAllProducts((prev) => prev.filter((p) => p._id !== _id));
      mutate("/api/products");
      if (highlightedId === _id) setHighlightedId(null);
    } catch (err) {
      console.error("delete failed", err);
      alert("Delete failed.");
    }
  };

  // properties management helpers (kept from your original)
  const addProperty = () => setProperties((prev) => [...prev, { propName: "", propValue: "" }]);
  const removeProperty = (i) => setProperties((prev) => prev.filter((_, idx) => idx !== i));
  const handlePropertyChange = (i, key, value) =>
    setProperties((prev) => {
      const updated = [...prev];
      updated[i][key] = value;
      return updated;
    });

  const calculateSalePrice = (cost, margin, tax) =>
    (cost * (1 + margin / 100) * (1 + tax / 100)).toFixed(2);

  const formatCurrency = (num) =>
    `₦${new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0)}`;

  // Lazy loading (Load more) — visible slice
  const visibleProducts = Array.isArray(filteredProducts)
    ? filteredProducts.slice(0, visibleCount)
    : [];

  // load more helper
  const loadMore = () => {
    setVisibleCount((v) => Math.min((filteredProducts?.length || 0), v + entriesPerPage));
  };

  // If SWR returns error, show basic message
  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <h2 className="text-xl text-red-600">Failed to load products</h2>
          <p className="text-sm text-gray-600">{String(error)}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-3 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Products</h1>

          {/* When linking to product creation, set highlight to newly created product if you want.
              For edit page navigation, we store highlight in sessionStorage below via onClick handler. */}
          <Link
            href="../products/new"
            className="mt-2 sm:mt-0 w-full sm:w-auto inline-block py-2 px-5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm transition text-center"
          >
            + Add Product
          </Link>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search products..."
              className="w-full border border-gray-300 bg-white py-2 pl-9 pr-4 rounded-lg text-sm focus:ring-2 focus:ring-cyan-600 focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Table - Responsive wrapper */}
        <div className="overflow-x-auto rounded-2xl shadow border border-gray-200 bg-white">
          <table className="min-w-full text-xs md:text-sm divide-y divide-blue-100">
            <thead className="bg-cyan-600 text-white text-left text-xs md:text-sm">
              <tr>
                <th className="p-2 md:p-3"></th>
                <th className="p-2 md:p-3">Advanced</th>
                <th className="p-2 md:p-3">Name</th>
                <th className="p-2 md:p-3 hidden sm:table-cell">Description</th>
                <th className="p-2 md:p-3">Cost</th>
                <th className="p-2 md:p-3">Tax %</th>
                <th className="p-2 md:p-3">Sale</th>
                <th className="p-2 md:p-3 hidden sm:table-cell">Margin</th>
                <th className="p-2 md:p-3 hidden lg:table-cell">Barcode</th>
                <th className="p-2 md:p-3 hidden lg:table-cell">Properties</th>
                <th className="p-2 md:p-3">Category</th>
                <th className="p-2 md:p-3 hidden sm:table-cell">Promo</th>
                <th className="p-2 md:p-3">Delete</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-blue-50">
              {visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-6 text-center text-gray-500 italic">
                    No products found.
                  </td>
                </tr>
              ) : (
                visibleProducts.map((p, idx) => {
                  // calculate the real index inside filteredProducts (useful for editIndex)
                  const realIndex = idx;
                  const isHighlighted = highlightedId && highlightedId === p._id;
                  return (
                    <tr
                      key={p._id}
                      className={`transition cursor-pointer ${expandedRow === realIndex ? "bg-gray-50" : ""} ${
                        isHighlighted ? "ring-2 ring-blue-200 bg-gray-50" : ""
                      }`}
                      onClick={() => setExpandedRow(expandedRow === realIndex ? null : realIndex)}
                    >
                      <td className="p-2">
                        {editIndex === realIndex ? (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleUpdateClick(p._id)}
                              className="w-16 py-1 bg-green-600 text-white rounded text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelClick}
                              className="w-16 py-1 bg-gray-300 text-gray-700 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(realIndex, p);
                            }}
                            className="py-1 px-2 md:px-3 border border-cyan-600 text-cyan-700 hover:bg-gray-500 hover:text-white rounded text-xs"
                          >
                            Edit
                          </button>
                        )}
                      </td>

                      <td className="p-2">
                        <Link
                          href={`/products/edit/${p._id}`}
                          onClick={() => {
                            // persist highlight so when returning the row is still highlighted
                            sessionStorage.setItem("products:highlight", p._id);
                          }}
                        >
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="py-1 px-2 md:px-3 border border-gray-300 text-cyan-600 hover:bg-cyan-600 hover:text-white rounded text-xs transition"
                          >
                            Adv
                          </button>
                        </Link>
                      </td>

                      <td className="p-2 font-semibold text-xs md:text-sm">
                        {editIndex === realIndex ? (
                          <input
                            name="name"
                            value={editableProduct.name || ""}
                            onChange={handleChange}
                            className="w-32 md:w-36 border p-1 rounded text-xs"
                          />
                        ) : (
                          p.name
                        )}
                      </td>

                      <td className="p-2 hidden sm:table-cell max-w-[150px] truncate text-xs">{p.description}</td>

                      <td className="p-2 text-xs md:text-sm">
                        {editIndex === realIndex ? (
                          <input
                            name="costPrice"
                            value={editableProduct.costPrice || ""}
                            onChange={handleChange}
                            type="number"
                            className="w-16 md:w-20 border p-1 rounded text-xs"
                          />
                        ) : (
                          formatCurrency(p.costPrice)
                        )}
                      </td>

                      <td className="p-2 text-xs md:text-sm">
                        {editIndex === realIndex ? (
                          <input
                            name="taxRate"
                            value={editableProduct.taxRate || ""}
                            onChange={handleChange}
                            type="number"
                            className="w-14 md:w-16 border p-1 rounded text-xs"
                          />
                        ) : (
                          p.taxRate
                        )}
                      </td>

                      <td className="p-2 text-gray-900 font-semibold text-xs md:text-sm">
                        {editIndex === realIndex ? (
                          <input
                            name="salePriceIncTax"
                            value={editableProduct.salePriceIncTax || ""}
                            onChange={handleChange}
                            type="number"
                            className="w-16 md:w-20 border p-1 rounded text-xs"
                          />
                        ) : (
                          formatCurrency(p.salePriceIncTax)
                        )}
                      </td>

                      <td className="p-2 hidden sm:table-cell text-xs">{p.margin}</td>
                      <td className="p-2 hidden lg:table-cell text-xs">{p.barcode}</td>

                      <td className="p-2 hidden lg:table-cell text-gray-600 text-xs">
                        {p.properties?.length > 0
                          ? p.properties.map((pr) => `${pr.propName}: ${pr.propValue}`).join(", ")
                          : "—"}
                      </td>

                      <td className="p-2 text-xs md:text-sm">{categoryMap[p.category] || "—"}</td>

                      <td className="p-2 hidden sm:table-cell text-xs">
                        {p.isPromotion ? (
                          <span className="text-green-600 font-semibold">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>

                      <td className="p-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(p._id);
                          }}
                          className="py-1 px-2 md:px-3 bg-red-50 text-red-700 border border-red-300 hover:bg-red-600 hover:text-white rounded text-xs"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Load more / Pagination controls */}
        <div className="flex justify-center items-center mt-6 flex-wrap gap-2">
          {visibleCount < (filteredProducts?.length || 0) ? (
            <button
              onClick={loadMore}
              className="px-4 py-2 bg-white border border-gray-400 rounded-md hover:bg-gray-50 text-sm"
            >
              Load more
            </button>
          ) : (
            <div className="text-sm text-gray-500">End of list</div>
          )}
        </div>
      </div>
    </Layout>
  );
}

