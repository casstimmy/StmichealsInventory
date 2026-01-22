/**
 * Logo Caching Utility
 * Fetches store logo from database and caches it in localStorage
 * for fast subsequent loads
 */

const LOGO_CACHE_KEY = 'store_logo';
const LOGO_CACHE_EXPIRY_KEY = 'store_logo_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get logo from cache or fetch from database
 * @returns {Promise<string|null>} Logo URL or null if not found
 */
export async function getStoreLogo() {
  try {
    // Check if logo exists in localStorage and is still valid
    const cachedLogo = localStorage.getItem(LOGO_CACHE_KEY);
    const cacheExpiry = localStorage.getItem(LOGO_CACHE_EXPIRY_KEY);
    
    if (cachedLogo && cacheExpiry && new Date().getTime() < parseInt(cacheExpiry)) {
      console.log('Loading logo from cache');
      return cachedLogo;
    }

    // Fetch from database
    console.log('Fetching logo from database');
    const response = await fetch('/api/setup/get', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch store data');
    }

    const data = await response.json();
    
    if (data.success && data.store?.logo) {
      const logo = data.store.logo;
      
      // Cache the logo
      localStorage.setItem(LOGO_CACHE_KEY, logo);
      localStorage.setItem(LOGO_CACHE_EXPIRY_KEY, (new Date().getTime() + CACHE_DURATION).toString());
      
      return logo;
    }

    return null;
  } catch (error) {
    console.error('Error fetching store logo:', error);
    // Try to return cached logo even if expired
    const cachedLogo = localStorage.getItem(LOGO_CACHE_KEY);
    return cachedLogo || null;
  }
}

/**
 * Clear logo cache
 */
export function clearLogoCache() {
  localStorage.removeItem(LOGO_CACHE_KEY);
  localStorage.removeItem(LOGO_CACHE_EXPIRY_KEY);
}

/**
 * Get store name from cache or fetch from database
 * @returns {Promise<string|null>} Store name or null
 */
export async function getStoreName() {
  try {
    const response = await fetch('/api/setup/get', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch store data');
    }

    const data = await response.json();
    return data.success && data.store?.storeName ? data.store.storeName : null;
  } catch (error) {
    console.error('Error fetching store name:', error);
    return null;
  }
}
