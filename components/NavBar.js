import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faRightFromBracket, faBell, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui';

const TopBar = ({ user, logout }) => {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);
  const [showExpiringAlert, setShowExpiringAlert] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    // Fetch low stock count periodically
    const fetchLowStockCount = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) {
          console.warn(`API returned status ${res.status} for /api/products`);
          return;
        }
        const data = await res.json();
        const productList = data.data || data;
        const products = Array.isArray(productList) ? productList : [];
        
        const count = products.filter(p => p.quantity < (p.minStock || 10)).length;
        setLowStockCount(count);

        // Check for products close to expiring (within 30 days)
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const expiringProducts = products.filter(p => {
          if (!p.expiryDate) return false;
          const expiryDate = new Date(p.expiryDate);
          return expiryDate <= thirtyDaysFromNow && expiryDate > now;
        });
        
        setExpiringCount(expiringProducts.length);
      } catch (err) {
        console.error("Error fetching stock count:", err);
        setLowStockCount(0);
        setExpiringCount(0);
      }
    };

    fetchLowStockCount();
    // Refresh every 2 minutes
    const interval = setInterval(fetchLowStockCount, 120000);
    return () => clearInterval(interval);
  }, []);

  // Handle logout with loading state
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
    } finally {
      setLogoutLoading(false);
    }
  };

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
        {/* Notification Icon with Low Stock Alert */}
        {lowStockCount > 0 && (
          <div className="relative group">
            <button 
              className="relative p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300"
              onClick={() => setShowLowStockAlert(!showLowStockAlert)}
              title="Low stock alerts"
              aria-label={`Low stock alert: ${lowStockCount} products`}
              aria-expanded={showLowStockAlert}
            >
              <FontAwesomeIcon icon={faBell} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600 hover:text-blue-600 transition-colors" />
              <span className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-red-500 rounded-full absolute -top-1 -right-1 shadow-sm flex items-center justify-center text-white text-xs font-bold">
                {lowStockCount > 9 ? '9+' : lowStockCount}
              </span>
            </button>

            {/* Alert Dropdown - Mobile responsive */}
            {showLowStockAlert && (
              <div className="absolute right-0 mt-2 w-72 md:w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 text-sm" role="alert">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600 font-bold text-sm">⚠️</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-xs md:text-sm">Low Stock Alert</p>
                    <p className="text-xs text-gray-600">{lowStockCount} product(s) below minimum</p>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  <p>Products are running low on stock. Please review inventory.</p>
                </div>
                <Link 
                  href="/stock/management"
                  className="inline-block w-full text-center bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-2 rounded font-medium transition-colors text-xs border border-yellow-200"
                  onClick={() => setShowLowStockAlert(false)}
                >
                  View Stock Details
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Expiration Alert Icon */}
        {expiringCount > 0 && (
          <div className="relative group">
            <button 
              className="relative p-1 sm:p-2 hover:bg-orange-50 rounded-lg transition-colors duration-300"
              onClick={() => setShowExpiringAlert(!showExpiringAlert)}
              title="Products expiring soon"
              aria-label={`Expiration alert: ${expiringCount} products`}
              aria-expanded={showExpiringAlert}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-600 hover:text-orange-700 transition-colors" />
              <span className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-orange-500 rounded-full absolute -top-1 -right-1 shadow-sm flex items-center justify-center text-white text-xs font-bold">
                {expiringCount > 9 ? '9+' : expiringCount}
              </span>
            </button>

            {/* Expiration Alert Dropdown - Mobile responsive */}
            {showExpiringAlert && (
              <div className="absolute right-0 mt-2 w-72 md:w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 text-sm" role="alert">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold text-sm">⏰</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-xs md:text-sm">Expiration Alert</p>
                    <p className="text-xs text-gray-600">{expiringCount} product(s) expiring soon</p>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  <p>Products expiring within the next 30 days. Please review expiry dates.</p>
                </div>
                <Link 
                  href="/stock/management"
                  className="inline-block w-full text-center bg-orange-50 hover:bg-orange-100 text-orange-700 py-2 rounded font-medium transition-colors text-xs border border-orange-200"
                  onClick={() => setShowExpiringAlert(false)}
                >
                  View Expiry Details
                </Link>
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
          <Button
            variant="danger"
            size="sm"
            disabled={logoutLoading}
            onClick={handleLogout}
            className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0 whitespace-nowrap"
            aria-label="Log out"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline md:inline">
              {logoutLoading ? 'Logging out...' : 'Log Out'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
