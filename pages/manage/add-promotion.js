"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import axios from "axios";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function AddPromotion() {
  const router = useRouter();
  // Promotion Details
  const [promoData, setPromoData] = useState({
    name: "",
    description: "",
    promotionDuration: "between-dates", // between-dates, between-times, both
    promoStart: "",
    promoEnd: "",
    promoStartTime: "",
    promoEndTime: "",
    mealDeal: false,
    mealDealGroups: "",
    dealType: "X For Y", // X For Y, Percentage, Fixed Price
    requiredQuantity: "",
    discountAmount: "",
    mixAndMatch: false,
    notUsedInConjunction: true,
    enabled: true,
    daysEnabled: {
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
      sat: true,
      sun: true,
    },
    customerType: "None",
  });

  // Products and Categories
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [filterCategoryTerm, setFilterCategoryTerm] = useState("");
  const [filterProductTerm, setFilterProductTerm] = useState("");
  const [addedItems, setAddedItems] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Fetch categories and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          axios.get("/api/categories"),
          axios.get("/api/products"),
        ]);
        const catData = Array.isArray(catRes.data)
          ? catRes.data
          : catRes.data?.data || [];
        const prodData = Array.isArray(prodRes.data)
          ? prodRes.data
          : prodRes.data?.data || [];
        setCategories(catData);
        setProducts(prodData);
        setFilteredCategories(catData);
        setFilteredProducts(prodData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // Handle promotion data changes
  const handlePromoChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (name.startsWith("days")) {
        const day = name.replace("days", "").toLowerCase();
        setPromoData((prev) => ({
          ...prev,
          daysEnabled: {
            ...prev.daysEnabled,
            [day]: checked,
          },
        }));
      } else {
        setPromoData((prev) => ({ ...prev, [name]: checked }));
      }
    } else {
      setPromoData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Filter categories
  const handleCategoryFilter = (e) => {
    const term = e.target.value;
    setFilterCategoryTerm(term);
    const filtered = categories.filter((cat) =>
      cat.name.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredCategories(filtered);
  };

  // Filter products
  const handleProductFilter = (e) => {
    const term = e.target.value;
    setFilterProductTerm(term);
    const filtered = products.filter((prod) =>
      prod.name.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  // Add category to promotion
  const handleAddCategory = () => {
    if (!selectedCategory) {
      alert("Please select a category");
      return;
    }
    const category = categories.find((c) => c._id === selectedCategory);
    if (!addedItems.find((item) => item._id === selectedCategory && item.type === "category")) {
      setAddedItems((prev) => [
        ...prev,
        { ...category, type: "category", tempId: Date.now() },
      ]);
      setSelectedCategory("");
    }
  };

  // Add product to promotion
  const handleAddProduct = () => {
    if (!selectedProduct) {
      alert("Please select a product");
      return;
    }
    const product = products.find((p) => p._id === selectedProduct);
    if (!addedItems.find((item) => item._id === selectedProduct && item.type === "product")) {
      setAddedItems((prev) => [
        ...prev,
        { ...product, type: "product", tempId: Date.now() },
      ]);
      setSelectedProduct("");
    }
  };

  // Remove item from promotion
  const handleRemoveItem = (tempId) => {
    setAddedItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  // Submit promotion
  const handleSubmit = async () => {
    if (!promoData.name) {
      alert("Please enter promotion name");
      return;
    }
    if (addedItems.length === 0) {
      alert("Please add at least one product or category");
      return;
    }

    try {
      const daysArray = Object.entries(promoData.daysEnabled)
        .filter(([_, enabled]) => enabled)
        .map(([day, _]) => {
          const dayMap = {
            mon: "Mon",
            tue: "Tue",
            wed: "Wed",
            thu: "Thu",
            fri: "Fri",
            sat: "Sat",
            sun: "Sun",
          };
          return dayMap[day];
        })
        .join(", ");

      const promotionPayload = {
        name: promoData.name,
        description: promoData.description,
        promoStart: promoData.promoStart ? new Date(promoData.promoStart) : null,
        promoEnd: promoData.promoEnd ? new Date(promoData.promoEnd) : null,
        promoStartTime: promoData.promotionDuration.includes("time")
          ? promoData.promoStartTime
          : null,
        promoEndTime: promoData.promotionDuration.includes("time")
          ? promoData.promoEndTime
          : null,
        mealDeal: promoData.mealDeal,
        mealDealGroups: promoData.mealDeal ? promoData.mealDealGroups : null,
        dealType: promoData.dealType,
        requiredQuantity: promoData.requiredQuantity,
        promoPrice: promoData.discountAmount,
        mixAndMatch: promoData.mixAndMatch,
        notUsedInConjunction: promoData.notUsedInConjunction,
        enabled: promoData.enabled,
        daysEnabled: daysArray,
        customerType: promoData.customerType,
        isPromotion: true,
        applicableItems: addedItems.map((item) => ({
          id: item._id,
          type: item.type,
          name: item.name,
        })),
      };

      // Create promotion for each product
      for (const item of addedItems) {
        if (item.type === "product") {
          await axios.put("/api/products", {
            _id: item._id,
            ...promotionPayload,
          });
        }
      }

      alert("Promotion created successfully!");
      // Reset form
      setPromoData({
        name: "",
        description: "",
        promotionDuration: "between-dates",
        promoStart: "",
        promoEnd: "",
        promoStartTime: "",
        promoEndTime: "",
        mealDeal: false,
        mealDealGroups: "",
        dealType: "X For Y",
        requiredQuantity: "",
        discountAmount: "",
        mixAndMatch: false,
        notUsedInConjunction: true,
        enabled: true,
        daysEnabled: {
          mon: true,
          tue: true,
          wed: true,
          thu: true,
          fri: true,
          sat: true,
          sun: true,
        },
        customerType: "None",
      });
      setAddedItems([]);
      // Redirect to promotions list
      router.push("/manage/promotions");
    } catch (err) {
      console.error("Error creating promotion:", err);
      alert("Error creating promotion!");
    }
  };

  return (
    <Layout>
      <div className="p-6 bg-gradient-to-b from-white to-blue-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add a Promotion</h1>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            HELP
          </span>
        </div>

        {/* Promotion Section */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Promotion</h2>

          <div className="space-y-6">
            {/* Name Field */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className="col-span-3 text-sm font-semibold text-gray-700 pt-3">
                Name
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  name="name"
                  value={promoData.name}
                  onChange={handlePromoChange}
                  placeholder="Appears on Till and Receipts"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Appears on Till and Receipts
                </p>
              </div>
            </div>

            {/* Description Field */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className="col-span-3 text-sm font-semibold text-gray-700 pt-3">
                Description
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  name="description"
                  value={promoData.description}
                  onChange={handlePromoChange}
                  placeholder="Appears on reports"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Appears on reports</p>
              </div>
            </div>

            {/* Promotion Duration */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className="col-span-3 text-sm font-semibold text-gray-700 pt-3">
                Promotion Duration
              </label>
              <div className="col-span-9 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="promotionDuration-dates"
                    checked={
                      promoData.promotionDuration === "between-dates" ||
                      promoData.promotionDuration === "both"
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (promoData.promotionDuration === "between-times") {
                          setPromoData((prev) => ({
                            ...prev,
                            promotionDuration: "both",
                          }));
                        } else {
                          setPromoData((prev) => ({
                            ...prev,
                            promotionDuration: "between-dates",
                          }));
                        }
                      } else {
                        setPromoData((prev) => ({
                          ...prev,
                          promotionDuration: "between-times",
                        }));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-gray-700">Between Dates</label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="promotionDuration-times"
                    checked={
                      promoData.promotionDuration === "between-times" ||
                      promoData.promotionDuration === "both"
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (promoData.promotionDuration === "between-dates") {
                          setPromoData((prev) => ({
                            ...prev,
                            promotionDuration: "both",
                          }));
                        } else {
                          setPromoData((prev) => ({
                            ...prev,
                            promotionDuration: "between-times",
                          }));
                        }
                      } else {
                        setPromoData((prev) => ({
                          ...prev,
                          promotionDuration: "between-dates",
                        }));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-gray-700">Between Times</label>
                </div>
                <p className="text-xs text-gray-500">
                  Promotion only active between two dates or times
                </p>
              </div>
            </div>

            {/* From and To Dates */}
            {(promoData.promotionDuration === "between-dates" ||
              promoData.promotionDuration === "both") && (
              <>
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-sm font-semibold text-gray-700">
                    From and To Dates
                  </label>
                  <div className="col-span-9 flex gap-4">
                    <input
                      type="date"
                      name="promoStart"
                      value={promoData.promoStart}
                      onChange={handlePromoChange}
                      className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      name="promoEnd"
                      value={promoData.promoEnd}
                      onChange={handlePromoChange}
                      className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* From and To Times */}
            {(promoData.promotionDuration === "between-times" ||
              promoData.promotionDuration === "both") && (
              <>
                <div className="grid grid-cols-12 gap-4 items-center">
                  <label className="col-span-3 text-sm font-semibold text-gray-700">
                    From and To Times
                  </label>
                  <div className="col-span-9 flex gap-4">
                    <input
                      type="time"
                      name="promoStartTime"
                      value={promoData.promoStartTime}
                      onChange={handlePromoChange}
                      className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="time"
                      name="promoEndTime"
                      value={promoData.promoEndTime}
                      onChange={handlePromoChange}
                      className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Meal Deal */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-sm font-semibold text-gray-700">
                Meal Deal
              </label>
              <div className="col-span-9">
                <input
                  type="checkbox"
                  name="mealDeal"
                  checked={promoData.mealDeal}
                  onChange={handlePromoChange}
                  className="w-4 h-4"
                />
              </div>
            </div>

            {/* Number of Meal Deal Groups */}
            {promoData.mealDeal && (
              <div className="grid grid-cols-12 gap-4 items-center">
                <label className="col-span-3 text-sm font-semibold text-gray-700">
                  Number of Meal Deal Groups
                </label>
                <div className="col-span-9">
                  <input
                    type="number"
                    name="mealDealGroups"
                    value={promoData.mealDealGroups}
                    onChange={handlePromoChange}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Type Dropdown */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-sm font-semibold text-gray-700">
                Type
              </label>
              <div className="col-span-9">
                <select
                  name="dealType"
                  value={promoData.dealType}
                  onChange={handlePromoChange}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>X For Y</option>
                  <option>Percentage Discount</option>
                  <option>Fixed Price</option>
                  <option>Free Item</option>
                </select>
              </div>
            </div>

            {/* Required Quantity and Amount */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-sm font-semibold text-gray-700">
                Required Quantity and Amount
              </label>
              <div className="col-span-9 flex gap-3 items-center">
                <span className="text-sm font-medium">Buy</span>
                <input
                  type="number"
                  name="requiredQuantity"
                  value={promoData.requiredQuantity}
                  onChange={handlePromoChange}
                  className="w-20 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">For</span>
                <input
                  type="number"
                  name="discountAmount"
                  value={promoData.discountAmount}
                  onChange={handlePromoChange}
                  className="w-20 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Mix and Match */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-sm font-semibold text-gray-700">
                Mix and Match
              </label>
              <div className="col-span-9">
                <input
                  type="checkbox"
                  name="mixAndMatch"
                  checked={promoData.mixAndMatch}
                  onChange={handlePromoChange}
                  className="w-4 h-4"
                />
              </div>
            </div>

            {/* Not to be used in conjunction */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className="col-span-3 text-sm font-semibold text-gray-700 pt-3">
                Not to be used in conjunction with any other offers
              </label>
              <div className="col-span-9">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="notUsedInConjunction"
                    checked={promoData.notUsedInConjunction}
                    onChange={handlePromoChange}
                    className="w-4 h-4 mt-1"
                  />
                  <p className="text-sm text-gray-600">
                    Customer type discounts are exempt and will further reduce the promotional offer.
                  </p>
                </div>
              </div>
            </div>

            {/* Enabled */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-sm font-semibold text-gray-700">
                Enabled
              </label>
              <div className="col-span-9">
                <input
                  type="checkbox"
                  name="enabled"
                  checked={promoData.enabled}
                  onChange={handlePromoChange}
                  className="w-4 h-4"
                />
              </div>
            </div>

            {/* Days Enabled */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className="col-span-3 text-sm font-semibold text-gray-700 pt-3">
                Days Enabled
              </label>
              <div className="col-span-9">
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: "mon", label: "Mon" },
                    { key: "tue", label: "Tue" },
                    { key: "wed", label: "Wed" },
                    { key: "thu", label: "Thu" },
                    { key: "fri", label: "Fri" },
                    { key: "sat", label: "Sat" },
                    { key: "sun", label: "Sun" },
                  ].map((day) => (
                    <div key={day.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name={`days${day.label}`}
                        checked={promoData.daysEnabled[day.key]}
                        onChange={handlePromoChange}
                        className="w-4 h-4"
                      />
                      <label className="text-sm text-gray-700">
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Type */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 text-sm font-semibold text-gray-700">
                Customer Type
              </label>
              <div className="col-span-9">
                <select
                  name="customerType"
                  value={promoData.customerType}
                  onChange={handlePromoChange}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>None</option>
                  <option>Retail</option>
                  <option>Wholesale</option>
                  <option>VIP</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  If the chosen Customer Type has a discount applied, this will
                  further reduce the promotional offer price.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Category or Product Section */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Add a Category or a Product to this Promotion
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            You can add a category or a product, or a combination of both, to a
            promotion. To do this use the dropdowns to select a category or
            product and click the green arrow to add it to the promotion.
          </p>

          {/* Filter Categories */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Filter Categories
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search categories..."
                value={filterCategoryTerm}
                onChange={handleCategoryFilter}
                className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                SEARCH
              </button>
            </div>
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Category
            </label>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category...</option>
                {filteredCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddCategory}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                ADD
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selecting a category in the dropdown menu will filter the product
              dropdown menu. You can filter the products present in the dropdown
              below by searching by name in the box below.
            </p>
          </div>

          {/* Filter Products */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Filter Products
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search products..."
                value={filterProductTerm}
                onChange={handleProductFilter}
                className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                SEARCH
              </button>
            </div>
          </div>

          {/* Product Selection */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Product
            </label>
            <div className="flex gap-2">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select product...</option>
                {filteredProducts.map((prod) => (
                  <option key={prod._id} value={prod._id}>
                    {prod.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddProduct}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                ADD
              </button>
            </div>
          </div>

          {/* Added Items List */}
          {addedItems.length > 0 && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Promotion Items
              </h3>
              <div className="space-y-2">
                {addedItems.map((item) => (
                  <div
                    key={item.tempId}
                    className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({item.type === "category" ? "Category" : "Product"})
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.tempId)}
                      className="text-red-600 hover:text-red-700 text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Link
            href="/manage/promotions"
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            CANCEL
          </Link>
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            ADD
          </button>
        </div>
      </div>
    </Layout>
  );
}
