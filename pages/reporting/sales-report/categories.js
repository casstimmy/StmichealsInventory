import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

export default function CategoriesSales() {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("last30");
  const [location, setLocation] = useState("All");
  const [device, setDevice] = useState("All");
  const [staff, setStaff] = useState("All");
  const [allLocations, setAllLocations] = useState([]);
  const [allStaff, setAllStaff] = useState([]);

  // Helper function to normalize and compare IDs across different formats
  function normalizeId(id) {
    if (!id) return '';
    const str = id.toString ? id.toString() : String(id);
    return str.trim().toLowerCase();
  }

  function getProductCategory(productId, productMap) {
    if (!productId) return "Uncategorized";
    
    const normalizedProdId = normalizeId(productId);
    
    // Try direct lookup first
    if (productMap[normalizedProdId]) {
      return productMap[normalizedProdId].category;
    }
    
    // Search through all products for matching ID
    for (const [key, prod] of Object.entries(productMap)) {
      if (normalizeId(key) === normalizedProdId) {
        return prod.category;
      }
    }
    
    return "Uncategorized";
  }

  useEffect(() => {
    fetchAllFilters();
  }, []);

  useEffect(() => {
    fetchCategoryData();
  }, [timeRange, location, device, staff]);

  async function fetchAllFilters() {
    try {
      const transRes = await fetch("/api/transactions/transactions");
      const transData = await transRes.json();
      const allTransactions = transData.transactions || [];

      // Extract available locations and staff
      const locSet = new Set();
      const staffSet = new Set();

      allTransactions.forEach((tx) => {
        if (tx.location) locSet.add(tx.location);
        if (tx.staff?.name) staffSet.add(tx.staff.name);
      });

      const locations = Array.from(locSet).sort();
      const staffList = Array.from(staffSet).sort();

      setAllLocations(locations);
      setAllStaff(staffList);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchCategoryData() {
    try {
      setLoading(true);
      
      // Fetch all transactions
      const transRes = await fetch("/api/transactions/transactions");
      const transData = await transRes.json();
      let allTransactions = transData.transactions || [];

      // Fetch all products to get category information
      const prodRes = await fetch("/api/products");
      const prodData = await prodRes.json();
      const products = prodData.data || prodData || [];
      
      // Fetch all categories to map IDs to names
      const catRes = await fetch("/api/categories");
      const catData = await catRes.json();
      const categories = catData.data || catData || [];
      
      // Create category map (ID -> Name)
      const categoryNameMap = {};
      (Array.isArray(categories) ? categories : []).forEach((cat) => {
        if (cat && cat._id) {
          const normalizedId = normalizeId(cat._id);
          categoryNameMap[normalizedId] = cat.name || "Unknown";
        }
      });
      
      console.log("Fetched categories:", categories.length);
      console.log("Category map:", categoryNameMap);
      
      // Create product map with category - normalize all ID formats
      const productMap = {};
      (Array.isArray(products) ? products : []).forEach((prod) => {
        if (!prod || !prod._id) return;
        const normalizedId = normalizeId(prod._id);
        
        // Get category name - could be string or ObjectId reference
        let category = "Top Level";
        if (prod.category) {
          const catId = normalizeId(prod.category);
          category = categoryNameMap[catId] || String(prod.category) || "Top Level";
        }
        
        productMap[normalizedId] = {
          name: prod.name,
          category: category,
          salePriceIncTax: prod.salePriceIncTax || 0,
        };
      });
      
      console.log("Product map size:", Object.keys(productMap).length);
      console.log("Sample product map entry:", Object.entries(productMap)[0]);

      // Apply filters after setting up product map
      allTransactions = allTransactions.filter((tx) => {
        // Status filter
        if (!["completed", "refunded"].includes(tx.status)) return false;
        
        // Location filter
        if (location !== "All" && tx.location !== location) return false;
        
        // Device filter
        if (device !== "All" && tx.device !== device) return false;
        
        // Staff filter
        if (staff !== "All" && tx.staff?.name !== staff) return false;
        
        // Time range filter
        const txDate = new Date(tx.createdAt);
        const today = new Date();
        const daysDiff = Math.floor((today - txDate) / (1000 * 60 * 60 * 24));
        
        const daysMap = {
          today: 0,
          yesterday: 1,
          last7: 7,
          last14: 14,
          last30: 30,
          last60: 60,
          last90: 90,
          thisWeek: 7,
          thisMonth: 30,
          lastWeek: 14,
          lastMonth: 60,
          last365: 365,
        };
        
        return daysDiff <= (daysMap[timeRange] || 30);
      });

      // Build transaction-level category breakdown
      const transactionsWithCategories = allTransactions
        .map((tx) => {
          // Group items by category within this transaction
          const categoryBreakdown = {};
          let transactionTotal = 0;

          tx.items?.forEach((item) => {
            const category = getProductCategory(item.productId, productMap);
            const itemTotal = item.salePriceIncTax * item.qty || 0;

            if (!categoryBreakdown[category]) {
              categoryBreakdown[category] = {
                category,
                units: 0,
                sales: 0,
              };
            }

            categoryBreakdown[category].units += item.qty || 0;
            categoryBreakdown[category].sales += itemTotal;
            transactionTotal += itemTotal;
          });

          return {
            id: tx._id,
            date: new Date(tx.createdAt).toLocaleDateString('en-NG'),
            time: new Date(tx.createdAt).toLocaleTimeString('en-NG'),
            staff: tx.staff?.name || "Unknown",
            location: tx.location || "Online",
            device: tx.device || "-",
            total: transactionTotal,
            categories: Object.values(categoryBreakdown),
          };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(transactionsWithCategories);

      // Aggregate sales by category from all transactions
      const categoryMap = {};
      
      allTransactions.forEach((tx) => {
        tx.items?.forEach((item) => {
          const category = getProductCategory(item.productId, productMap);
          
          if (!categoryMap[category]) {
            categoryMap[category] = {
              name: category,
              sales: 0,
              units: 0,
            };
          }

          categoryMap[category].sales += item.salePriceIncTax * item.qty || 0;
          categoryMap[category].units += item.qty || 0;
        });
      });

      // Convert to array and sort by sales descending
      const categoryList = Object.values(categoryMap)
        .sort((a, b) => b.sales - a.sales);

      setCategories(categoryList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <svg className="animate-spin h-12 w-12 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading category data...</p>
        </div>
      </div>
    </Layout>
  );

  const totalSales = categories.reduce((sum, c) => sum + c.sales, 0);
  const topCategory = categories[0];

  return (
    <Layout title="Sales by Categories">
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mb-6 text-sm">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700">Home</Link>
          <span className="mx-2 text-gray-400">›</span>
          <Link href="/reporting" className="text-cyan-600 hover:text-cyan-700">Reporting</Link>
          <span className="mx-2 text-gray-400">›</span>
          <span className="text-gray-600">Categories</span>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏷 Sales by Categories</h1>
          <p className="text-gray-600">Category-wise performance and trends</p>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Show data from */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Show data from</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7">Last 7 Days</option>
                <option value="last14">Last 14 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="last60">Last 60 Days</option>
                <option value="last90">Last 90 Days</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="lastWeek">Last Week</option>
                <option value="lastMonth">Last Month</option>
                <option value="last365">Last Year</option>
              </select>
            </div>

            {/* Filter by Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              >
                <option value="All">All Locations</option>
                {allLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Filter by Device */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Device</label>
              <select
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              >
                <option value="All">All Devices</option>
                <option value="POS">POS</option>
                <option value="Mobile">Mobile</option>
              </select>
            </div>

            {/* Filter by Staff */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Staff</label>
              <select
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              >
                <option value="All">All Staff</option>
                {allStaff.map((staffName) => (
                  <option key={staffName} value={staffName}>{staffName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Categories" value={categories.length} icon="🏷" color="red" />
          <StatCard title="Total Sales" value={`₦${(totalSales).toLocaleString('en-NG', {maximumFractionDigits: 0})}`} icon="💰" color="pink" />
          <StatCard title="Top Category" value={topCategory?.name} icon="🏆" color="rose" />
          <StatCard title="Total Units" value={categories.reduce((sum, c) => sum + c.units, 0).toLocaleString()} icon="📦" color="orange" />
        </div>

        {/* DOUGHNUT CHART */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sales Distribution by Category</h2>
          <div className="h-[400px]">
            <Doughnut
              data={{
                labels: categories.map(c => c.name),
                datasets: [{
                  data: categories.map(c => c.sales),
                  backgroundColor: ["#dc2626", "#f43f5e", "#f97316", "#fbbf24", "#10b981", "#0ea5e9"],
                  borderColor: "#fff",
                  borderWidth: 2,
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "right", labels: { padding: 20 } },
                },
              }}
            />
          </div>
        </div>

        {/* BAR CHART */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Category Sales Comparison</h2>
          <div className="h-[400px]">
            <Bar
              data={{
                labels: categories.map(c => c.name),
                datasets: [{
                  label: "Sales (₦)",
                  data: categories.map(c => c.sales),
                  backgroundColor: "#06B6D4",
                  borderRadius: 8,
                  borderSkipped: false,
                }]
              }}
              options={{
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } },
              }}
            />
          </div>
        </div>

        {/* CATEGORIES TABLE */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Rank</th>
                <th className="px-6 py-3 text-left font-semibold">Category</th>
                <th className="px-6 py-3 text-right font-semibold">Total Sales</th>
                <th className="px-6 py-3 text-right font-semibold">Units Sold</th>
                <th className="px-6 py-3 text-right font-semibold">% of Total</th>
                <th className="px-6 py-3 text-right font-semibold">Avg/Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((category, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-3 font-bold text-red-600">#{idx + 1}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{category.name}</td>
                  <td className="px-6 py-3 text-right font-semibold">₦{category.sales.toLocaleString('en-NG')}</td>
                  <td className="px-6 py-3 text-right">{category.units.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{((category.sales / totalSales) * 100).toFixed(1)}%</td>
                  <td className="px-6 py-3 text-right text-gray-600">₦{(category.sales / category.units).toLocaleString('en-NG', {maximumFractionDigits: 0})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TRANSACTIONS BY CATEGORY BREAKDOWN */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-800">Transaction Sales by Product Categories</h2>
            <p className="text-gray-600 text-sm mt-1">Breakdown of each transaction showing category-wise product sales</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Staff</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Location</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Device</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Categories & Items</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.length > 0 ? transactions.map((tx, idx) => (
                  <tr key={tx.id} className={idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50 hover:bg-gray-100"}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{tx.date}</div>
                      <div className="text-xs text-gray-500">{tx.time}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{tx.staff}</td>
                    <td className="px-4 py-3 text-gray-700">{tx.location}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        tx.device === 'POS' ? 'bg-cyan-100 text-gray-900' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {tx.device}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {tx.categories.map((cat, catIdx) => (
                          <div key={catIdx} className="text-xs">
                            <div className="font-semibold text-gray-800">{cat.category}</div>
                            <div className="text-gray-600">
                              {cat.units} unit{cat.units !== 1 ? 's' : ''} • ₦{cat.sales.toLocaleString('en-NG', {maximumFractionDigits: 0})}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      ₦{tx.total.toLocaleString('en-NG', {maximumFractionDigits: 0})}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorMap = {
    red: "bg-red-50 border-red-200 text-red-700",
    pink: "bg-pink-50 border-pink-200 text-pink-700",
    rose: "bg-rose-50 border-rose-200 text-rose-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
  }[color];

  return (
    <div className={`${colorMap} border-2 rounded-lg p-6 shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl opacity-20">{icon}</div>
      </div>
    </div>
  );
}

