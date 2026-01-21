import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faExclamationTriangle, 
  faCheckCircle,
  faSearch,
  faDownload,
  faClock,
  faBox
} from '@fortawesome/free-solid-svg-icons';

export default function ExpirationReport() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'critical', 'warning', 'ok'
  const [sortBy, setSortBy] = useState('daysRemaining'); // 'daysRemaining', 'expiryDate', 'name'

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        
        const data = await res.json();
        console.log('Fetched data:', data);
        
        // Handle different API response formats
        let productList = [];
        if (Array.isArray(data)) {
          productList = data;
        } else if (data.data && Array.isArray(data.data)) {
          productList = data.data;
        } else if (data.products && Array.isArray(data.products)) {
          productList = data.products;
        }
        
        console.log('Processed product list:', productList);
        console.log('Total products:', productList.length);
        
        // Get all products, not just those with expiryDate
        const allProducts = productList.map(p => {
          // Ensure expiryDate is properly formatted - handle both Date objects and strings
          let expiryDate = null;
          
          if (p.expiryDate) {
            if (typeof p.expiryDate === 'string') {
              // If it's a string like "2025-12-31" or ISO date, use it directly
              expiryDate = p.expiryDate.split('T')[0]; // Remove time portion if present
            } else if (p.expiryDate instanceof Date) {
              // If it's a Date object, convert to YYYY-MM-DD
              expiryDate = p.expiryDate.toISOString().split('T')[0];
            } else if (typeof p.expiryDate === 'object' && p.expiryDate.$date) {
              // If it's a MongoDB Date object { $date: ... }, handle it
              expiryDate = new Date(p.expiryDate.$date).toISOString().split('T')[0];
            }
          }
          
          console.log(`Product: ${p.name}, Raw expiryDate: ${p.expiryDate}, Formatted: ${expiryDate}`);
          
          return {
            ...p,
            expiryDate: expiryDate,
          };
        });
        
        // Filter to only include products with expiry dates
        const expiringProducts = allProducts.filter(p => p.expiryDate);
        console.log(`Found ${expiringProducts.length} products with expiry dates out of ${allProducts.length} total`);
        
        setProducts(expiringProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calculate days remaining and status
  const processedProducts = useMemo(() => {
    const now = new Date();
    
    return products.map(product => {
      const expiryDate = new Date(product.expiryDate);
      const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      let status = 'ok';
      if (daysRemaining <= 0) status = 'expired';
      else if (daysRemaining <= 7) status = 'critical';
      else if (daysRemaining <= 30) status = 'warning';
      
      return {
        ...product,
        daysRemaining,
        status,
        expiryDate: expiryDate.toISOString().split('T')[0],
      };
    });
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...processedProducts]; // Create a copy to avoid mutations

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'daysRemaining') {
        // Sort by days remaining (urgent/expired first)
        const daysA = a.daysRemaining !== undefined ? a.daysRemaining : Infinity;
        const daysB = b.daysRemaining !== undefined ? b.daysRemaining : Infinity;
        return daysA - daysB;
      } else if (sortBy === 'expiryDate') {
        // Sort by expiry date (earliest first)
        const dateA = new Date(a.expiryDate || '9999-12-31');
        const dateB = new Date(b.expiryDate || '9999-12-31');
        return dateA - dateB;
      } else if (sortBy === 'name') {
        // Sort alphabetically by name
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return filtered;
  }, [processedProducts, filterStatus, searchTerm, sortBy]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    return {
      total: processedProducts.length,
      expired: processedProducts.filter(p => p.status === 'expired').length,
      critical: processedProducts.filter(p => p.status === 'critical').length,
      warning: processedProducts.filter(p => p.status === 'warning').length,
      ok: processedProducts.filter(p => p.status === 'ok').length,
    };
  }, [processedProducts]);

  // Get status badge styling
  const getStatusStyles = (status) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'critical':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ok':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'expired':
        return 'Expired';
      case 'critical':
        return 'Critical (≤7 days)';
      case 'warning':
        return 'Warning (8-30 days)';
      case 'ok':
        return 'OK (>30 days)';
      default:
        return 'Unknown';
    }
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['Product Name', 'SKU', 'Expiry Date', 'Days Remaining', 'Status', 'Quantity', 'Location'];
    const rows = filteredProducts.map(p => [
      p.name || 'N/A',
      p.sku || 'N/A',
      p.expiryDate,
      p.daysRemaining,
      getStatusLabel(p.status),
      p.quantity || 0,
      p.location || 'N/A',
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `expiration-report-${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-cyan-600" />
                  Product Expiration Report
                </h1>
                <p className="text-gray-600 mt-2">Monitor and manage products approaching their expiration dates</p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition shadow-md"
              >
                <FontAwesomeIcon icon={faDownload} className="w-5 h-5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {/* Total Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-cyan-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FontAwesomeIcon icon={faBox} className="text-4xl text-cyan-200" />
              </div>
            </div>

            {/* Expired Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-red-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Expired</p>
                  <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
                </div>
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-red-200" />
              </div>
            </div>

            {/* Critical Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-orange-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Critical (≤7 days)</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.critical}</p>
                </div>
                <FontAwesomeIcon icon={faClock} className="text-4xl text-orange-200" />
              </div>
            </div>

            {/* Warning Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-yellow-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Warning (8-30 days)</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.warning}</p>
                </div>
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-yellow-200" />
              </div>
            </div>

            {/* OK Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">OK (&gt;30 days)</p>
                  <p className="text-3xl font-bold text-green-600">{stats.ok}</p>
                </div>
                <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-200" />
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Products</label>
                <div className="relative">
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    className="absolute left-3 top-3 text-gray-400 w-5 h-5"
                  />
                  <input
                    type="text"
                    placeholder="Search by name, SKU, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">All Products</option>
                  <option value="expired">Expired</option>
                  <option value="critical">Critical (≤7 days)</option>
                  <option value="warning">Warning (8-30 days)</option>
                  <option value="ok">OK (&gt;30 days)</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="daysRemaining">Days Remaining (Urgent First)</option>
                  <option value="expiryDate">Expiry Date</option>
                  <option value="name">Product Name</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <p className="text-gray-600 text-lg">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-6xl text-green-400 mb-4" />
                <p className="text-gray-600 text-lg">No products found matching your criteria</p>
                {searchTerm && <p className="text-gray-500 text-sm mt-2">Try adjusting your search terms</p>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Product Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">SKU</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Expiry Date</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Days Remaining</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Location</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, idx) => (
                      <tr 
                        key={idx} 
                        className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                          product.status === 'expired' ? 'bg-red-50' :
                          product.status === 'critical' ? 'bg-orange-50' :
                          product.status === 'warning' ? 'bg-yellow-50' :
                          ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{product.name || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{product.sku || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{product.expiryDate}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold ${
                            product.daysRemaining <= 0 ? 'text-red-600' :
                            product.daysRemaining <= 7 ? 'text-orange-600' :
                            product.daysRemaining <= 30 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {product.daysRemaining} {product.daysRemaining === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(product.status)}`}>
                            {getStatusLabel(product.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                          {product.quantity || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{product.location || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{product.category || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer with count */}
            {filteredProducts.length > 0 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{filteredProducts.length}</span> of <span className="font-semibold">{stats.total}</span> products
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Status Legend</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">Expired</span>
                <span className="text-sm text-gray-600">Product has already expired</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">Critical</span>
                <span className="text-sm text-gray-600">Expires within 7 days</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">Warning</span>
                <span className="text-sm text-gray-600">Expires within 30 days</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">OK</span>
                <span className="text-sm text-gray-600">Expires after 30 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
