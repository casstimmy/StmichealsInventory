import Layout from "@/components/Layout";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { Loader } from "@/components/ui";
import useProgress from "@/lib/useProgress";
import { useIndexedDBCache } from "@/lib/useIndexedDBCache";
import { getCachedCategories } from "@/lib/categoriesCache";

const LOCATION_FILTER_KEY = "stockManagement:locationFilter";
const CARD_FILTER_KEY = "stockManagement:cardFilter";

function normalizeLocationValue(value) {
  return String(value || "").trim().toLowerCase();
}

function isDerivedChild(product) {
  return product?.isChildProduct && product?.packType !== "pack";
}

function matchesStockState(product, stockFilter) {
  if (stockFilter === "all") {
    return true;
  }

  if (isDerivedChild(product)) {
    return false;
  }

  const quantity = Number(product?.quantity) || 0;
  const minStock = Number(product?.minStock) || 0;

  if (stockFilter === "wellStocked") {
    return quantity > minStock;
  }

  if (stockFilter === "critical") {
    return quantity < minStock / 2;
  }

  if (stockFilter === "lowStock") {
    return quantity < minStock;
  }

  return true;
}

export default function StockManagement() {
  const router = useRouter();
  const queryLocation = typeof router.query.location === "string" ? router.query.location : "";

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
  const [refreshing, setRefreshing] = useState(false);
  const [categoryMap, setCategoryMap] = useState({});
  const [availableLocations, setAvailableLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(
    typeof window !== "undefined"
      ? sessionStorage.getItem(LOCATION_FILTER_KEY) || queryLocation || "all"
      : queryLocation || "all"
  );
  const [selectedStockFilter, setSelectedStockFilter] = useState(
    typeof window !== "undefined"
      ? sessionStorage.getItem(CARD_FILTER_KEY) || "all"
      : "all"
  );

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
    let isMounted = true;

    fetch("/api/setup/get")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) {
          return;
        }

        const storeLocations = Array.isArray(data?.store?.locations)
          ? data.store.locations
              .map((locationValue) => locationValue?.name || locationValue)
              .map((locationValue) => String(locationValue || "").trim())
              .filter(Boolean)
          : [];

        setAvailableLocations(storeLocations);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!queryLocation) return;
    setSelectedLocation(queryLocation);
  }, [queryLocation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(LOCATION_FILTER_KEY, selectedLocation || "all");
  }, [selectedLocation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(CARD_FILTER_KEY, selectedStockFilter || "all");
  }, [selectedStockFilter]);

  useEffect(() => {
    if (productsLoading && !refreshing) {
      setLoading(true);
    } else {
      setLoading(false);
    }
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
  }, [cachedProducts, productsLoading, productsError, start, onFetch, onProcess, complete, refreshing]);

  const locationOptions = useMemo(() => {
    const seenLocations = new Map();

    [...availableLocations, ...products.flatMap((product) => product.locations || [])]
      .map((locationValue) => String(locationValue || "").trim())
      .filter(Boolean)
      .forEach((locationValue) => {
        const normalizedValue = normalizeLocationValue(locationValue);
        if (!seenLocations.has(normalizedValue)) {
          seenLocations.set(normalizedValue, locationValue);
        }
      });

    return Array.from(seenLocations.values()).sort((leftValue, rightValue) => leftValue.localeCompare(rightValue));
  }, [availableLocations, products]);

  const locationScopedItems = useMemo(() => {
    return products.filter((item) => {
      const normalizedLocationFilter = normalizeLocationValue(selectedLocation);
      if (normalizedLocationFilter === "all") {
        return true;
      }

      const productLocations = Array.isArray(item.locations)
        ? item.locations.map((locationValue) => normalizeLocationValue(locationValue)).filter(Boolean)
        : [];

      if (normalizedLocationFilter === "unassigned") {
        return productLocations.length === 0;
      }

      return productLocations.includes(normalizedLocationFilter);
    });
  }, [products, selectedLocation]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return locationScopedItems.filter((item) => {
      if (!matchesStockState(item, selectedStockFilter)) {
        return false;
      }

      const categoryLabel = categoryMap[item.category] || item.category || "";
      if (!term) {
        return true;
      }

      return (
        item.name?.toLowerCase().includes(term) ||
        categoryLabel.toLowerCase().includes(term)
      );
    });
  }, [locationScopedItems, selectedStockFilter, searchTerm, categoryMap]);

  const totalStock = useMemo(
    () =>
      locationScopedItems
        .filter((item) => !isDerivedChild(item))
        .reduce((sum, item) => sum + (item.quantity || 0), 0),
    [locationScopedItems]
  );
  const parentProducts = useMemo(
    () => locationScopedItems.filter((p) => !isDerivedChild(p)),
    [locationScopedItems]
  );
  const totalWellStocked = useMemo(
    () => parentProducts.filter((p) => (p.quantity || 0) > (p.minStock || 0)).length,
    [parentProducts]
  );
  const totalCritical = useMemo(
    () => parentProducts.filter((p) => (p.quantity || 0) < (p.minStock || 0) / 2).length,
    [parentProducts]
  );
  const lowStockCount = useMemo(
    () => parentProducts.filter((p) => p.quantity < (p.minStock || 0)).length,
    [parentProducts]
  );

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
        <header className="page-header">
          <h1 className="page-title">Stock Management</h1>
          <p className="page-subtitle">Monitor all stock levels and alerts in real-time.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/stock/stock-take" className="btn-action-primary">
              Start Stock Take
            </Link>
            <Link href="/stock/add?reason=Operational%20Loss" className="btn-action-danger">
              Record Operational Loss
            </Link>
            <button
              type="button"
              onClick={async () => {
                setRefreshing(true);
                try {
                  await refreshProducts();
                } finally {
                  setRefreshing(false);
                }
              }}
              disabled={refreshing}
              className="btn-action-secondary"
            >
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
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
              <StatCard
                label="Total Stock"
                value={`${parseFloat(totalStock.toFixed(2))} units`}
                active={selectedStockFilter === "all"}
                onClick={() => setSelectedStockFilter("all")}
              />
              <StatCard
                label="Well Stocked"
                value={`${totalWellStocked} products`}
                active={selectedStockFilter === "wellStocked"}
                onClick={() => setSelectedStockFilter("wellStocked")}
              />
              <StatCard
                label="Critical Level"
                value={`${totalCritical} products`}
                active={selectedStockFilter === "critical"}
                onClick={() => setSelectedStockFilter("critical")}
              />
              <StatCard
                label="Low Stock Alerts"
                value={lowStockCount}
                highlight
                active={selectedStockFilter === "lowStock"}
                onClick={() => setSelectedStockFilter("lowStock")}
              />
            </section>

            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="search-input-wrapper max-w-xl flex-1">
                  <input
                    type="text"
                    placeholder="Search by product or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input !pl-4"
                  />
                </div>
                <select
                  className="form-select max-w-xs"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="all">All Locations</option>
                  <option value="unassigned">Unassigned</option>
                  {locationOptions.map((locationValue) => (
                    <option key={locationValue} value={locationValue}>
                      {locationValue}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedLocation("all");
                    setSelectedStockFilter("all");
                  }}
                  className="btn-action-secondary"
                >
                  Clear Filters
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Showing {filteredItems.length} of {locationScopedItems.length} products
              </p>
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
                        No products match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((product) => {
                      const qty = product.quantity ?? 0;
                      const isChild = isDerivedChild(product);
                      const status = isChild
                        ? "Linked"
                        : qty < 0
                          ? "Negative Stock"
                          : qty === 0
                          ? "Out of Stock"
                          : qty < (product.minStock || 0)
                          ? "Low Stock"
                          : "In Stock";

                      return (
                        <tr key={product._id} className={`hover:bg-gray-50 ${isChild ? "bg-blue-50/40" : qty < 0 ? "bg-red-50" : ""}`}>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {product.name || "N/A"}
                            {isChild && <span className="ml-2 text-xs text-blue-600 font-normal">(unit from pack)</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-700">{categoryMap[product.category] || product.category || "Uncategorized"}</td>
                          <td className={`px-6 py-4 font-semibold ${qty < 0 ? "text-red-600" : "text-gray-900"}`}>
                            {parseFloat(qty.toFixed(2))}
                          </td>
                          <td className="px-6 py-4 text-gray-700">{product.minStock ?? 0}</td>
                          <td className="px-6 py-4">{formatCurrency(product.costPrice || 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                          <td
                            className={`px-6 py-4 font-semibold ${
                              status === "Linked"
                                ? "text-blue-600"
                                : status === "In Stock"
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

function StatCard({ label, value, highlight = false, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`stat-card w-full text-center transition-all duration-200 hover:-translate-y-0.5 ${
        highlight ? "border-2 border-amber-400" : ""
      } ${active ? "ring-2 ring-sky-300 border-sky-400 bg-sky-50" : ""}`}
    >
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value mt-2">{value}</p>
    </button>
  );
}

