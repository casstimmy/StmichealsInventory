// pages/manage/products.js  (or your route file)
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Search } from "lucide-react";
import Layout from "@/components/Layout";
import { formatCurrency as formatCurrencyValue } from "@/lib/format";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { useIndexedDBCache, clearCache } from "@/lib/useIndexedDBCache";
import { getCachedCategories } from "@/lib/categoriesCache";
import { calculateMarginPercent } from "@/lib/pricing";
import { Loader } from "@/components/ui";

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
  const router = useRouter();
  const fetchProducts = useCallback(() => fetcher("/api/products"), []);

  // ========== SMART CACHING STRATEGY ==========
  // Products: IndexedDB cache with 30-minute TTL (frequently changes)
  // + SWR background revalidation (only if cache expired)
  const { data: cachedProducts, loading: productsLoading, error: productsError, refresh: refreshProducts } = useIndexedDBCache(
    "products_cache",
    fetchProducts,
    30 // 30 minutes TTL
  );

  // ========== LOCAL UI STATE ==========
  const [allProducts, setAllProducts] = useState([]); // full list (from cache)
  const [filteredProducts, setFilteredProducts] = useState([]); // after search/filter
  const [categoryMap, setCategoryMap] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [editableProduct, setEditableProduct] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true); // Track first load
  const [isRefreshingList, setIsRefreshingList] = useState(false);
  const [savingProductId, setSavingProductId] = useState(null);
  const [isOpeningAddProduct, setIsOpeningAddProduct] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // pagination / lazy load
  const [entriesPerPage] = useState(entriesPerPageDefault);
  const [visibleCount, setVisibleCount] = useState(entriesPerPageDefault);

  // highlighted product id (persisted so when you go to edit page and back it stays)
  const [highlightedId, setHighlightedId] = useState(
    typeof window !== "undefined" ? sessionStorage.getItem("products:highlight") : null
  );

  // refs
  const searchRef = useRef();

  const categoryOptions = useMemo(() => {
    const seen = new Set();
    const rows = [];
    (Array.isArray(allProducts) ? allProducts : []).forEach((p) => {
      const id = p?.category;
      if (!id || seen.has(id)) return;
      seen.add(id);
      rows.push({ id, label: categoryMap[id] || "Uncategorized" });
    });
    return rows.sort((a, b) => a.label.localeCompare(b.label));
  }, [allProducts, categoryMap]);

  const applyFilters = useCallback((term, categoryId) => {
    const t = term.trim().toLowerCase();
    const filtered = (Array.isArray(allProducts) ? allProducts : []).filter((p) => {
      const matchesCategory = categoryId === "all" ? true : p.category === categoryId;
      if (!matchesCategory) return false;
      if (!t) return true;
      return [p.name, p.barcode, p.description, categoryMap[p.category]]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(t));
    });
    setFilteredProducts(filtered);
    setVisibleCount(entriesPerPage);
  }, [allProducts, categoryMap, entriesPerPage]);

  // Initialize from cache when data arrives
  useEffect(() => {
    if (productsLoading) {
      setIsInitializing(true);
      return;
    }
    const list = Array.isArray(cachedProducts) ? cachedProducts : cachedProducts?.data || [];
    setAllProducts(list);
    const t = searchTerm.trim().toLowerCase();
    const filtered = list.filter((p) => {
      const matchesCategory = selectedCategory === "all" ? true : p.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!t) return true;
      return [p.name, p.barcode, p.description, categoryMap[p.category]]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(t));
    });
    setFilteredProducts(filtered);
    setIsInitializing(false);
  }, [cachedProducts, productsLoading, searchTerm, selectedCategory, categoryMap]);

  const loadCategories = useCallback(async () => {
    try {
      const catList = await getCachedCategories();
      const map = (Array.isArray(catList) ? catList : []).reduce((acc, c) => {
        acc[c._id] = c.name;
        return acc;
      }, {});
      setCategoryMap(map);
    } catch {
      setCategoryMap({});
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const onFocus = () => loadCategories();
    const onStorage = (event) => {
      if (event.key === "categories_cache_version") {
        loadCategories();
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadCategories]);

  // Keep highlightedId in sessionStorage so it's preserved when navigating away & back
  useEffect(() => {
    if (highlightedId) sessionStorage.setItem("products:highlight", highlightedId);
    else sessionStorage.removeItem("products:highlight");
  }, [highlightedId]);

  // Warm the add-product route bundle to make navigation faster.
  useEffect(() => {
    router.prefetch("/products/new");
  }, [router]);

  // Force refresh after add/edit flow redirects back to this page
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("products:refresh") !== "1") return;

    sessionStorage.removeItem("products:refresh");
    (async () => {
      await clearCache("products_cache");
      await refreshProducts();
      mutate("/api/products");
      await loadCategories();
    })();
  }, [refreshProducts, loadCategories]);

  // Debounced search over the cached allProducts (safe - products array guarded)
  const debouncedFilter = useCallback(
    debounce((term) => {
      applyFilters(term, selectedCategory);
    }, 250),
    [applyFilters, selectedCategory]
  );

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearchTerm(v);
    debouncedFilter(v);
  };

  const handleCategoryFilterChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    applyFilters(searchTerm, value);
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
    // keep highlight (helpful)  comment out to clear highlight on cancel
    // setHighlightedId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditableProduct((prev) => {
      const newValue = type === "checkbox" ? checked : value;
      const updated = { ...prev, [name]: newValue };
      const cost = parseFloat(updated.costPrice || 0);
      const margin = parseFloat(updated.margin || 0);
      const tax = parseFloat(updated.taxRate || 0);
      const sale = parseFloat(updated.salePriceIncTax || 0);

      if (name === "margin") {
        const marginRatio = margin / 100;
        const saleExTax = cost * (1 + marginRatio);
        const saleIncTax = saleExTax * (1 + tax / 100);
        updated.salePriceIncTax = Number.isFinite(saleIncTax) ? saleIncTax.toFixed(2) : "0.00";
      }
      if (["costPrice", "taxRate", "salePriceIncTax"].includes(name)) {
        updated.margin = calculateMarginPercent(cost, sale, tax, true).toFixed(2);
      }
      return updated;
    });
  };

  const handleUpdateClick = async (_id) => {
    try {
      setSavingProductId(_id);
      const updatedProduct = { ...editableProduct, properties };
      const response = await axios.put("/api/products", { ...updatedProduct, _id });
      const saved = response?.data?.data || { ...updatedProduct, _id };

      // update local cached arrays immediately (optimistic update)
      setFilteredProducts((prev) =>
        prev.map((p) => (p._id === _id ? { ...p, ...saved } : p))
      );
      setAllProducts((prev) => prev.map((p) => (p._id === _id ? { ...p, ...saved } : p)));

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
    } finally {
      setSavingProductId(null);
    }
  };

  const handleDeleteClick = async (_id) => {
    if (!window.confirm("Are you sure you want to archive this product?")) return;
    try {
      await axios.delete(`/api/products?id=${_id}`);
      setFilteredProducts((prev) => prev.filter((p) => p._id !== _id));
      setAllProducts((prev) => prev.filter((p) => p._id !== _id));
      
      // Invalidate cache and refresh
      await clearCache("products_cache");
      await refreshProducts();
      
      mutate("/api/products");
      await loadCategories();
      if (highlightedId === _id) setHighlightedId(null);
      alert("Product archived successfully.");
    } catch (err) {
      console.error("delete failed", err);
      alert("Archive failed.");
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

  const formatCurrency = (num) => formatCurrencyValue(num || 0);

  // Lazy loading (Load more)  visible slice
  const visibleProducts = Array.isArray(filteredProducts)
    ? filteredProducts.slice(0, visibleCount)
    : [];

  // load more helper
  const loadMore = () => {
    setVisibleCount((v) => Math.min((filteredProducts?.length || 0), v + entriesPerPage));
  };

  if (productsError) {
    return (
      <Layout>
        <div className="p-6">
          <h2 className="text-xl text-red-600">Failed to load products</h2>
          <p className="text-sm text-gray-600">{String(productsError)}</p>
          <button 
            onClick={() => refreshProducts()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  // Show initial loading state
  if (isInitializing) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <Loader size="md" text="Loading products..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
        {/* Header */}
        <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="page-title">Products</h1>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={async () => {
                try {
                  setIsRefreshingList(true);
                  await refreshProducts();
                  await loadCategories();
                } finally {
                  setIsRefreshingList(false);
                }
              }}
              className="btn-action-secondary flex items-center gap-2"
              title="Refresh products from server"
              disabled={isRefreshingList}
            >
               {isRefreshingList ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpeningAddProduct(true);
                router.push("/products/new");
              }}
              disabled={isOpeningAddProduct}
              className="btn-action-primary w-full sm:w-auto text-center disabled:opacity-60"
            >
              {isOpeningAddProduct ? "Opening..." : "+ Add Product"}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="search-input-wrapper max-w-md">
              <Search className="search-input-icon" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products..."
                className="search-input"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <select
              className="form-select max-w-xs"
              value={selectedCategory}
              onChange={handleCategoryFilterChange}
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table - Responsive wrapper */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="!px-2"></th>
                <th className="!px-2">Adv</th>
                <th>Name</th>
                <th className="hidden sm:table-cell">Description</th>
                <th>Cost</th>
                <th>Tax %</th>
                <th>Sale</th>
                <th className="hidden sm:table-cell">Margin</th>
                <th className="hidden lg:table-cell">Barcode</th>
                <th>Min Stock</th>
                <th className="hidden lg:table-cell">Properties</th>
                <th>Category</th>
                <th className="hidden sm:table-cell">Promo</th>
                <th className="!px-2">Arch</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {productsLoading ? (
                <tr>
                  <td colSpan={14} className="p-8 text-center">
                    <Loader size="sm" text="Loading product list..." />
                  </td>
                </tr>
              ) : visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-6 text-center text-gray-500 italic">
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
                              type="button"
                              onClick={() => handleUpdateClick(p._id)}
                              className="w-16 py-1 bg-green-600 text-white rounded text-xs"
                              disabled={savingProductId === p._id}
                            >
                              {savingProductId === p._id ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancelClick}
                              className="w-16 py-1 bg-gray-300 text-gray-700 rounded text-xs"
                              disabled={savingProductId === p._id}
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
                            className="py-1 px-2 md:px-3 border border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white rounded text-xs"
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
                            className="py-1 px-2 md:px-3 border border-gray-300 text-blue-600 hover:bg-blue-600 hover:text-white rounded text-xs transition"
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
                            onWheel={(e) => e.currentTarget.blur()}
                            type="number"
                            className="w-16 md:w-20 border p-1 rounded text-xs"
                          />
                        ) : (
                          formatCurrency(p.costPrice)
                        )}
                      </td>

                      <td className="p-2 text-xs md:text-sm">
                        {editIndex === realIndex ? (
                          <select
                            name="taxRate"
                            value={editableProduct.taxRate || ""}
                            onChange={handleChange}
                            className="w-16 md:w-20 border p-1 rounded text-xs"
                          >
                            <option value="4.5">4.5%</option>
                            <option value="7.5">7.5%</option>
                          </select>
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
                            onWheel={(e) => e.currentTarget.blur()}
                            type="number"
                            className="w-16 md:w-20 border p-1 rounded text-xs"
                          />
                        ) : (
                          formatCurrency(p.salePriceIncTax)
                        )}
                      </td>

                      <td className="p-2 hidden sm:table-cell text-xs">
                        {editIndex === realIndex ? (
                          <input
                            name="margin"
                            value={editableProduct.margin || ""}
                            onChange={handleChange}
                            onWheel={(e) => e.currentTarget.blur()}
                            type="number"
                            className="w-14 md:w-16 border p-1 rounded text-xs"
                          />
                        ) : (
                          p.margin
                        )}
                      </td>
                      <td className="p-2 hidden lg:table-cell text-xs">{p.barcode}</td>

                      <td className="p-2 text-xs md:text-sm">
                        {editIndex === realIndex ? (
                          <input
                            name="minStock"
                            value={editableProduct.minStock ?? ""}
                            onChange={handleChange}
                            onWheel={(e) => e.currentTarget.blur()}
                            type="number"
                            className="w-16 md:w-20 border p-1 rounded text-xs"
                          />
                        ) : (
                          p.minStock ?? ""
                        )}
                      </td>

                      <td className="p-2 hidden lg:table-cell text-gray-600 text-xs">
                        {p.properties?.length > 0
                          ? p.properties.map((pr) => `${pr.propName}: ${pr.propValue}`).join(", ")
                          : ""}
                      </td>

                      <td className="p-2 text-xs md:text-sm">{categoryMap[p.category] || ""}</td>

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
                          Arch
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
              className="btn-action-secondary"
            >
              Load more ({(filteredProducts?.length || 0) - visibleCount} remaining)
            </button>
          ) : (
            <div className="text-sm text-gray-500 py-2"> End of list </div>
          )}
        </div>
        </div>
      </div>
    </Layout>
  );
}

