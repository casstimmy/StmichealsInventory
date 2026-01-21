import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faRightFromBracket, faBell, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const TopBar = ({ user, logout }) => {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState('stock'); // 'stock' or 'expiring'

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

  // Function to get initials
  const getInitials = (name) =>
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  return (
    <div className="fixed top-0 w-full z-20 flex justify-between items-center py-4 px-8 bg-gradient-to-r from-white to-gray-50 shadow-lg border-b border-gray-200">
      {/* Left Section: Back Office Text */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
          <FontAwesomeIcon icon={faStore} className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-gray-900 text-2xl font-bold tracking-tight">Back Office</h2>
      </div>

      {/* Right Section: Profile and Icons */}
      <div className="flex items-center gap-6">
        {/* Notification Icon with Low Stock Alert */}
        <div className="relative group">
          <button 
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300"
            onClick={() => setShowAlert(!showAlert)}
            title="Low stock alerts"
          >
            <FontAwesomeIcon icon={faBell} className="w-6 h-6 text-gray-600 hover:text-blue-600 transition-colors" />
            {lowStockCount > 0 && (
              <span className="w-6 h-6 bg-red-500 rounded-full absolute top-0 right-0 shadow-sm flex items-center justify-center text-white text-xs font-bold">
                {lowStockCount > 9 ? '9+' : lowStockCount}
              </span>
            )}
          </button>

          {/* Alert Dropdown */}
          {showAlert && lowStockCount > 0 && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">⚠️</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Low Stock Alert</p>
                  <p className="text-xs text-gray-600">{lowStockCount} product(s) below minimum</p>
                </div>
              </div>
              <div className="text-xs text-gray-600 mb-3">
                <p>Products are running low on stock. Please review inventory management.</p>
              </div>
              <a 
                href="/stock/management"
                className="inline-block w-full text-center bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-2 rounded font-medium transition-colors text-sm border border-yellow-200"
              >
                View Stock Details
              </a>
            </div>
          )}
        </div>

        {/* Expiration Alert Icon */}
        {expiringCount > 0 && (
          <div className="relative group">
            <button 
              className="relative p-2 hover:bg-orange-50 rounded-lg transition-colors duration-300"
              onClick={() => setShowAlert(!showAlert)}
              title="Products expiring soon"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6 text-orange-600 hover:text-orange-700 transition-colors" />
              {expiringCount > 0 && (
                <span className="w-6 h-6 bg-orange-500 rounded-full absolute top-0 right-0 shadow-sm flex items-center justify-center text-white text-xs font-bold">
                  {expiringCount > 9 ? '9+' : expiringCount}
                </span>
              )}
            </button>

            {/* Expiration Alert Dropdown */}
            {showAlert && expiringCount > 0 && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-bold">⏰</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Expiration Alert</p>
                    <p className="text-xs text-gray-600">{expiringCount} product(s) expiring soon</p>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  <p>Products are expiring within the next 30 days. Please review expiry dates.</p>
                </div>
                <a 
                  href="/stock/management"
                  className="inline-block w-full text-center bg-orange-50 hover:bg-orange-100 text-orange-700 py-2 rounded font-medium transition-colors text-sm border border-orange-200"
                >
                  View Expiry Details
                </a>
              </div>
            )}
          </div>
        )}

        {/* Profile Section */}
        <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
          {/* Profile Image or Placeholder */}
          <div className="relative group">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-full shadow-md group-hover:shadow-lg transition-all text-lg font-bold">
              {getInitials(user?.name) || 'U'}
            </div>
          </div>

          {/* User Info */}
          <div className="flex flex-col hidden sm:flex">
            <span className="text-gray-900 font-semibold text-sm">
              {user?.name || 'User'}
            </span>
            <span className="text-xs text-gray-500 capitalize">{user?.role || 'staff'}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-sm px-4 py-2 rounded-lg shadow-sm transition duration-200 font-medium border border-red-200 hover:border-red-300"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
