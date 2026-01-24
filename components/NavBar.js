import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faRightFromBracket, faBell } from '@fortawesome/free-solid-svg-icons';

const TopBar = ({ user, logout }) => {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'stock', 'expiring'

  useEffect(() => {
    // Fetch notifications data periodically
    const fetchNotifications = async () => {
      try {
        // Fetch low stock from products
        const productsRes = await fetch("/api/products");
        if (productsRes.ok) {
          const data = await productsRes.json();
          const productList = data.data || data;
          const products = Array.isArray(productList) ? productList : [];
          
          const lowStockCount = products.filter(p => p.quantity < (p.minStock || 10)).length;
          setLowStockCount(lowStockCount);
        }

        // Fetch expiring batches from the same endpoint as expiration-report
        const batchesRes = await fetch("/api/stock-movement/batches-with-expiry");
        if (batchesRes.ok) {
          const batchData = await batchesRes.json();
          
          // Handle different API response formats
          let batchList = [];
          if (Array.isArray(batchData)) {
            batchList = batchData;
          } else if (batchData.data && Array.isArray(batchData.data)) {
            batchList = batchData.data;
          } else if (batchData.batches && Array.isArray(batchData.batches)) {
            batchList = batchData.batches;
          }
          
          // Calculate expiring count (batches expiring within 30 days, but not already expired)
          const now = new Date();
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          
          const expiringBatches = batchList.filter(batch => {
            if (!batch.expiryDate) return false;
            const expiryDate = new Date(batch.expiryDate);
            // Include critical (≤7 days) and warning (8-30 days) statuses
            return expiryDate > now && expiryDate <= thirtyDaysFromNow;
          });
          
          setExpiringCount(expiringBatches.length);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setLowStockCount(0);
        setExpiringCount(0);
      }
    };

    fetchNotifications();
    // Refresh every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  // Function to get initials
  const getInitials = (name) =>
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  return (
    <div className="fixed top-0 w-full z-50 flex items-center justify-between gap-2 sm:gap-3 md:gap-0 py-2 md:py-3 px-2 sm:px-3 md:px-8 bg-gradient-to-r from-white to-gray-50 shadow-lg border-b border-gray-200 h-12 md:h-16">
      {/* Left Section: Back Office Text - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-3 w-full md:w-auto">
        <div className="w-8 md:w-10 h-8 md:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
          <FontAwesomeIcon icon={faStore} className="w-4 md:w-6 h-4 md:h-6 text-white" />
        </div>
        <h2 className="text-gray-900 text-lg md:text-2xl font-bold tracking-tight">Back Office</h2>
      </div>

      {/* Mobile Logo Icon - Shown only on mobile */}
      <div className="md:hidden flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
          <FontAwesomeIcon icon={faStore} className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Right Section: Profile and Icons */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-6 w-auto justify-end flex-shrink-0">
        {/* Unified Notification Icon */}
        {(lowStockCount > 0 || expiringCount > 0) && (
          <div className="relative">
            <button 
              className="relative p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300"
              onClick={() => setShowNotifications(!showNotifications)}
              title="View notifications"
            >
              <FontAwesomeIcon icon={faBell} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600 hover:text-blue-600 transition-colors" />
              {(lowStockCount + expiringCount) > 0 && (
                <span className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-red-500 rounded-full absolute -top-1 -right-1 shadow-sm flex items-center justify-center text-white text-xs font-bold">
                  {(lowStockCount + expiringCount) > 9 ? '9+' : (lowStockCount + expiringCount)}
                </span>
              )}
            </button>

            {/* Unified Notification Center Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    🔔 Notifications
                    <span className="ml-auto bg-white/30 px-2 py-0.5 rounded-full text-xs">
                      {lowStockCount + expiringCount}
                    </span>
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${
                      activeTab === 'all'
                        ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    All ({lowStockCount + expiringCount})
                  </button>
                  {lowStockCount > 0 && (
                    <button
                      onClick={() => setActiveTab('stock')}
                      className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${
                        activeTab === 'stock'
                          ? 'bg-white text-yellow-600 border-b-2 border-yellow-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Stock ({lowStockCount})
                    </button>
                  )}
                  {expiringCount > 0 && (
                    <button
                      onClick={() => setActiveTab('expiring')}
                      className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${
                        activeTab === 'expiring'
                          ? 'bg-white text-orange-600 border-b-2 border-orange-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Expiring ({expiringCount})
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {/* All Notifications */}
                  {(activeTab === 'all' || activeTab === 'stock') && lowStockCount > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="text-xl">⚠️</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">Low Stock Alert</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {lowStockCount} product{lowStockCount > 1 ? 's' : ''} below minimum stock level
                          </p>
                          <a
                            href="/stock/management"
                            onClick={() => setShowNotifications(false)}
                            className="inline-block mt-2 text-xs font-semibold text-yellow-700 hover:text-yellow-900 underline"
                          >
                            View Details →
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expiring Notifications */}
                  {(activeTab === 'all' || activeTab === 'expiring') && expiringCount > 0 && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="text-xl">⏰</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">Expiration Alert</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {expiringCount} batch{expiringCount > 1 ? 'es' : ''} expiring within 30 days
                          </p>
                          <a
                            href="/stock/expiration-report"
                            onClick={() => setShowNotifications(false)}
                            className="inline-block mt-2 text-xs font-semibold text-orange-700 hover:text-orange-900 underline"
                          >
                            View Details →
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Notifications Message */}
                  {activeTab !== 'all' && lowStockCount === 0 && expiringCount === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-600">✓ No notifications for this category</p>
                    </div>
                  )}

                  {activeTab === 'stock' && lowStockCount === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-600">✓ All stock levels are healthy</p>
                    </div>
                  )}

                  {activeTab === 'expiring' && expiringCount === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-600">✓ No expiring products</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
                  <a
                    href="/stock/expiration-report"
                    onClick={() => setShowNotifications(false)}
                    className="block text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                  >
                    View Expiration Report →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Section - Compact on mobile */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 pl-1 sm:pl-2 md:pl-6 border-l border-gray-200">
          {/* Profile Image or Placeholder */}
          <div className="relative group">
            <div className="w-7 sm:w-8 md:w-10 h-7 sm:h-8 md:h-10 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-full shadow-md group-hover:shadow-lg transition-all text-xs sm:text-sm md:text-lg font-bold flex-shrink-0">
              {getInitials(user?.name) || 'U'}
            </div>
          </div>

          {/* User Info - Hidden on mobile, shown on sm+ */}
          <div className="flex-col hidden sm:flex md:flex">
            <span className="text-gray-900 font-semibold text-xs md:text-sm">
              {user?.name || 'User'}
            </span>
            <span className="text-xs text-gray-500 capitalize">{user?.role || 'staff'}</span>
          </div>

          {/* Logout Button - Icon on mobile, icon+text on md+ */}
          <button
            onClick={logout}
            className="flex items-center gap-0.5 sm:gap-1 md:gap-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs md:text-sm px-1.5 sm:px-2 md:px-4 py-1.5 sm:py-2 rounded-lg shadow-sm transition duration-200 font-medium border border-red-200 hover:border-red-300 flex-shrink-0 whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline md:inline">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;