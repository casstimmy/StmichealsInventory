import Layout from "@/components/Layout";
import { formatCurrency } from "@/lib/format";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader } from "@/components/ui";
import useProgress from "@/lib/useProgress";
import { useIndexedDBCache } from "@/lib/useIndexedDBCache";
import { getCachedCategories } from "@/lib/categoriesCache";

export default function StockManagement() {
  const fetchStockProducts = useCallback(async () => {
    const res = await fetch("/api/products?minimal=true");
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch products");
    }
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  }, []);

  const { data: cachedProducts, loading: productsLoading, error: productsError, refresh: refreshProducts } =
    useIndexedDBCache("stock_products_cache", fetchStockProducts, 15);

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { progress, start, onFetch, onProcess, complete } = useProgress();
  const [error, setError] = useState(null);
  const [categoryMap, setCategoryMap] = useState({});

  useEffect(() => {
    async function loadCategories() {
      try {
        const categories = await getCachedCategories();
        const map = {};
        categories.forEach(cat => {
          map[cat._id] = cat.name;
        });
        setCategoryMap(map);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    setLoading(productsLoading);
    if (productsError) {
      setError(productsError || "Failed to load data");
      setProducts([]);
      return;
    }
    setError(null);
    start();
    onFetch();
    const list = Array.isArray(cachedProducts) ? cachedProducts : [];
    setProducts(list);
    onProcess();
    complete();
  }, [cachedProducts, productsLoading, productsError, start, onFetch, onProcess, complete]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter((item) => {
      const categoryLabel = categoryMap[item.category] || item.category || "";
      return (
        item.name?.toLowerCase().includes(term) ||
        categoryLabel.toLowerCase().includes(term)
      );
    });
  }, [products, searchTerm, categoryMap]);

  const totalStock = useMemo(
    () => products.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [products]
  );
  const totalIncoming = useMemo(
    () => products.filter((p) => (p.quantity || 0) > (p.minStock || 0)).length,
    [products]
  );
  const totalOutgoing = useMemo(
    () => products.filter((p) => (p.quantity || 0) < (p.minStock || 0) / 2).length,
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => p.quantity < (p.minStock || 0)).length,
    [products]
  );

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
        <header className="page-header">
          <h1 className="page-title">Stock Management</h1>
          <p className="page-subtitle">Monitor all stock levels and alerts in real-time.</p>
          <button
            type="button"
            onClick={() => refreshProducts()}
            className="btn-action-secondary mt-3"
          >
            Refresh Data
          </button>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-semibold">Error: {error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader size="md" text="Loading stock data..." progress={progress} />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Stock" value={`${totalStock} units`} />
              <StatCard label="Well Stocked" value={`${totalIncoming} products`} />
              <StatCard label="Critical Level" value={`${totalOutgoing} products`} />
              <StatCard label="Low Stock Alerts" value={lowStockCount} highlight />
            </section>

            <div className="mb-6">
              <div className="search-input-wrapper max-w-xl">
                <input
                  type="text"
                  placeholder="Search by product or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input !pl-4"
                />
              </div>
            </div>

            <section className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {["Name", "Category", "Stock Qty", "Min Stock", "Unit Cost", "Status"].map((header) => (
                      <th key={header}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((product) => {
                      const qty = product.quantity ?? 0;
                      const status =
                        qty < 0
                          ? "Negative Stock"
                          : qty === 0
                          ? "Out of Stock"
                          : qty < (product.minStock || 0)
                          ? "Low Stock"
                          : "In Stock";

                      return (
                        <tr key={product._id} className={`hover:bg-gray-50 ${qty < 0 ? "bg-red-50" : ""}`}>
                          <td className="px-6 py-4 font-medium text-gray-900">{product.name || "N/A"}</td>
                          <td className="px-6 py-4 text-gray-700">{categoryMap[product.category] || product.category || "Uncategorized"}</td>
                          <td className={`px-6 py-4 font-semibold ${qty < 0 ? "text-red-600" : "text-gray-900"}`}>
                            {qty}
                          </td>
                          <td className="px-6 py-4 text-gray-700">{product.minStock ?? 0}</td>
                          <td className="px-6 py-4">{formatCurrency(product.costPrice || 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                          <td
                            className={`px-6 py-4 font-semibold ${
                              status === "In Stock"
                                ? "text-green-600"
                                : status === "Low Stock"
                                ? "text-yellow-600"
                                : status === "Negative Stock"
                                ? "text-red-700"
                                : "text-red-600"
                            }`}
                          >
                            {status}
                          </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
            </section>
          </>
        )}
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, highlight = false }) {
  return (
    <div
      className={`stat-card text-center ${
        highlight ? "border-2 border-amber-400" : ""
      }`}
    >
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value mt-2">{value}</p>
    </div>
  );
}

