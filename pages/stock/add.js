import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { Loader } from "@/components/ui";

export default function StockMovementAdd() {
  const router = useRouter();
  
  const [locations, setLocations] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [reasons] = useState(["Restock", "Transfer", "Return"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [staff, setStaff] = useState("");
  const [reason, setReason] = useState("");

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantityInput, setQuantityInput] = useState(1);
  const [expiryDateInput, setExpiryDateInput] = useState("");
  const [addedProducts, setAddedProducts] = useState([]);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    fetch("/api/setup/setup")
      .then((res) => res.json())
      .then((data) => {
        if (data?.store?.locations) {
          const locs = data.store.locations.map((loc) => ({
            _id: loc._id,
            name: loc.name || loc,
          }));
          setLocations(locs);
        }
      })
      .catch(err => console.error("Error fetching locations:", err));

    fetch("/api/staff")
      .then((res) => res.json())
      .then(data => {
        const staffArray = Array.isArray(data) ? data : (data.data || []);
        setStaffList(staffArray);
      })
      .catch(err => console.error("Error fetching staff:", err));
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const trimmed = searchTerm.trim();
      if (trimmed.length >= 2) {
        setLoadingSearch(true);
        fetch(`/api/products?search=${encodeURIComponent(trimmed)}`)
          .then((res) => res.json())
          .then(data => {
            const productList = data.data || (Array.isArray(data) ? data : []);
            setProducts(Array.isArray(productList) ? productList : []);
          })
          .catch(err => {
            console.error("Error searching products:", err);
            setProducts([]);
          })
          .finally(() => setLoadingSearch(false));
      } else {
        setProducts([]);
        setLoadingSearch(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchTerm(""); // Clear search term to close dropdown without triggering search
    setProducts([]);
  };

  const updateProductQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setAddedProducts((prev) =>
      prev.map((p) =>
        p._id === productId
          ? { ...p, quantity: newQuantity }
          : p
      )
    );
  };

  const addProduct = () => {
    if (!selectedProduct) return;

    const existing = addedProducts.find((p) => p._id === selectedProduct._id);
    if (existing) {
      setAddedProducts((prev) =>
        prev.map((p) =>
          p._id === existing._id
            ? { ...p, quantity: p.quantity + quantityInput, expiryDate: expiryDateInput }
            : p
        )
      );
    } else {
      setAddedProducts((prev) => [
        ...prev,
        { ...selectedProduct, quantity: quantityInput, expiryDate: expiryDateInput },
      ]);
    }

    setSearchTerm("");
    setQuantityInput(1);
    setExpiryDateInput("");
    setSelectedProduct(null);
  };

  const removeProduct = (id) => {
    setAddedProducts((prev) => prev.filter((p) => p._id !== id));
  };

  const handleAddToStock = async () => {
  if (
    !fromLocation ||
    !toLocation ||
    !staff ||
    !reason ||
    addedProducts.length === 0
  ) {
    alert("Please complete all fields and add at least one product.");
    return;
  }

  try {
    setIsSubmitting(true);
    const totalCostPrice = addedProducts.reduce(
      (sum, p) => sum + (p.costPrice || 0) * p.quantity,
      0
    );

    const transRef = Date.now().toString();

    const payload = {
      transRef,
      fromLocationId: fromLocation,
      toLocationId: toLocation,
      staffId: staff || null,
      reason,
      status: "Received",
      totalCostPrice,
      barcode: transRef,
      dateSent: new Date().toISOString(),
      dateReceived: new Date().toISOString(),
      products: addedProducts.map((p) => ({
        id: p._id,
        quantity: p.quantity,
        expiryDate: p.expiryDate || null,
      })),
    };

    console.log("📤 Sending payload:", payload);

    const res = await fetch("/api/stock-movement/stock-movement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("📥 Response status:", res.status);
    const result = await res.json();
    console.log("📥 Response body:", result);
    
    if (!res.ok) {
      console.error("❌ API Error:", result);
      throw new Error(result?.message || result?.error || `Server error: ${res.status}`);
    }

    console.log("✅ Stock movement saved successfully");
    alert("Stock movement added successfully!");
    
    // Reset form
    setFromLocation("");
    setToLocation("");
    setStaff("");
    setReason("");
    setAddedProducts([]);
    setSearchTerm("");
    setQuantityInput(1);
    setExpiryDateInput("");
    setSelectedProduct(null);
    
    // Redirect after a short delay to show success message
    setTimeout(() => {
      console.log("🔄 Redirecting to /stock/movement");
      router.push("/stock/movement");
    }, 1500);
  } catch (err) {
    console.error("❌ Stock movement error:", err.message);
    alert("Error saving stock movement: " + err.message);
  } finally {
    setIsSubmitting(false);
  }
};

  const totalCost = addedProducts.reduce(
    (sum, p) => sum + (p.costPrice || 0) * p.quantity,
    0
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Create Stock Movement</h1>
          <p className="text-sm md:text-base text-gray-600">Transfer inventory between locations with full tracking and approval workflow</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Section 1: Movement Details */}
          <div className="p-4 md:p-8 border-b border-gray-200">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-cyan-600 rounded-full"></div>
              Movement Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Dropdown
                label="From Location"
                value={fromLocation}
                onChange={setFromLocation}
                options={[{ _id: "vendor", name: "🏭 Vendor" }, ...locations]}
                required
              />

              <Dropdown
                label="To Location"
                value={toLocation}
                onChange={setToLocation}
                options={locations}
                required
              />

              <Dropdown
                label="Responsible Staff"
                value={staff}
                onChange={setStaff}
                options={staffList}
                required
              />

              <Dropdown
                label="Reason for Transfer"
                value={reason}
                onChange={setReason}
                options={reasons.map((r) => ({ name: r, _id: r }))}
                required
              />
            </div>
          </div>

          {/* Section 2: Product Selection */}
          <div className="p-4 md:p-8 border-b border-gray-200">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
              Add Products
            </h2>

            <div className="space-y-4">
              {/* Product Search */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search by Product Name or Barcode
                </label>
                <input
                  className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500 transition"
                  placeholder="Type to search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedProduct(null);
                  }}
                />
                {loadingSearch && (
                  <div className="absolute top-12 left-0 w-full bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg">
                    <Loader size="sm" text="Searching..." />
                  </div>
                )}
                {!loadingSearch && products.length > 0 && (
                  <ul className="absolute top-12 left-0 z-10 bg-white border-2 border-gray-300 w-full max-h-64 overflow-y-auto rounded-lg shadow-lg">
                    {products.map((product) => (
                      <li
                        key={product._id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition"
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">{product.name}</span>
                          <span className="text-sm text-gray-600">₦{(product.salePriceIncTax || 0).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Stock: {product.quantity || 0} units</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Selected Product Display */}
              {selectedProduct && (
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg border-2 border-cyan-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Selected Product:</p>
                      <p className="text-lg font-bold text-gray-900">{selectedProduct.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Available Stock: <span className="font-semibold text-gray-900">{selectedProduct.quantity || 0} units</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Cost Price: <span className="font-semibold text-cyan-700">₦{(selectedProduct.costPrice || 0).toLocaleString()}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-red-500 hover:text-red-700 font-semibold text-sm"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}

              {/* Quantity and Expiry Date Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 items-end">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantityInput((q) => Math.max(q - 1, 1))}
                      className="bg-gray-100 hover:bg-gray-200 text-lg w-10 h-10 flex items-center justify-center transition"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="flex-1 text-center text-lg font-semibold border-0 focus:outline-none"
                      value={quantityInput}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val === "") {
                          setQuantityInput("");
                        } else {
                          const num = parseInt(val);
                          if (!isNaN(num) && num > 0) {
                            setQuantityInput(num);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        if (quantityInput === "" || isNaN(quantityInput)) {
                          setQuantityInput(1);
                        }
                      }}
                    />
                    <button
                      onClick={() => setQuantityInput((q) => q + 1)}
                      className="bg-gray-100 hover:bg-gray-200 text-lg w-10 h-10 flex items-center justify-center transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500 transition"
                    value={expiryDateInput}
                    onChange={(e) => setExpiryDateInput(e.target.value)}
                  />
                </div>

                <button
                  onClick={addProduct}
                  disabled={!selectedProduct}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition h-10"
                >
                  Add Product
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Added Products */}
          <div className="p-4 md:p-8">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
              Products to Transfer ({addedProducts.length})
            </h2>

            {addedProducts.length > 0 ? (
              <div className="space-y-2 md:space-y-3 mb-6">
                {addedProducts.map((product, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-3 md:p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm md:text-base">{product.name}</p>
                      <p className="text-xs md:text-sm text-gray-600">Cost: ₦{(product.costPrice || 0).toLocaleString()}</p>
                      {product.expiryDate && (
                        <p className="text-xs md:text-sm text-amber-600 font-medium">Expires: {new Date(product.expiryDate).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <button
                          onClick={() => updateProductQuantity(product._id, product.quantity - 1)}
                          className="bg-gray-50 hover:bg-gray-100 w-8 h-8 flex items-center justify-center transition"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-semibold text-gray-900">{product.quantity}</span>
                        <button
                          onClick={() => updateProductQuantity(product._id, product.quantity + 1)}
                          className="bg-gray-50 hover:bg-gray-100 w-8 h-8 flex items-center justify-center transition"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-semibold text-gray-900 min-w-fit">
                        ₦{(product.costPrice * product.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeProduct(product._id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg transition font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-600">No products added yet. Search and add products above.</p>
              </div>
            )}

            {/* Summary Card */}
            {addedProducts.length > 0 && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 md:p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Total Cost Price</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900\">₦{totalCost.toLocaleString()}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs md:text-sm text-gray-600 mb-1\">Total Items</p>
                    <p className="text-2xl md:text-3xl font-bold text-cyan-600\">{addedProducts.reduce((sum, p) => sum + p.quantity, 0)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-end">
              <button
                onClick={() => router.push("/stock/movement")}
                className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToStock}
                disabled={isSubmitting || addedProducts.length === 0 || !fromLocation || !toLocation || !reason}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-semibold transition shadow-md"
              >
                {isSubmitting ? "Creating..." : "Create Stock Movement"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Dropdown({ label, value, onChange, options, required = false }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <select
        className="w-full border-2 border-gray-300 px-4 py-2 rounded-lg focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500 transition bg-white font-medium text-gray-800"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Select {label.toLowerCase()}...</option>
        {options.map((opt) => (
          <option key={opt._id} value={opt._id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}

