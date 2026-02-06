/**
 * Categories Cache Utility
 * Simple localStorage cache (rarely changes)
 * TTL: 24 hours
 * Fallback: API fetch
 */

const CACHE_KEY = "categories_cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get cached categories (localStorage backed)
 * @returns {Promise<Array>} Array of category objects
 */
export async function getCachedCategories() {
  // Check localStorage cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      const age = Date.now() - data.timestamp;
      
      if (age < data.ttl) {
        console.log("[CATEGORIES CACHE] ✅ Using localStorage cache");
        return data.categories;
      }
    }
  } catch (err) {
    console.warn("[CATEGORIES CACHE] localStorage parse error:", err);
  }

  // Cache miss or expired - fetch from API
  try {
    console.log("[CATEGORIES CACHE] 🔄 Fetching from API");
    const res = await fetch("/api/categories");
    if (!res.ok) throw new Error("Failed to fetch categories");
    
    const categories = await res.json();
    
    // Validate response is array
    const catArray = Array.isArray(categories) ? categories : 
                     categories.categories && Array.isArray(categories.categories) ? categories.categories :
                     [];
    
    // Cache in localStorage
    const cacheEntry = {
      categories: catArray,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    console.log("[CATEGORIES CACHE] ✅ Fetched and cached (${catArray.length} items)");
    
    return catArray;
  } catch (err) {
    console.error("[CATEGORIES CACHE] ❌ Failed to fetch:", err);
    
    // Return empty array as fallback
    return [];
  }
}

/**
 * Get category map (id -> name)
 * @returns {Promise<Object>} Map of category ID to name
 */
export async function getCachedCategoryMap() {
  const categories = await getCachedCategories();
  const map = {};
  
  categories.forEach(cat => {
    if (cat._id) {
      map[cat._id] = cat.name || "Uncategorized";
    }
  });
  
  return map;
}

/**
 * Get category by ID
 * @param {string} categoryId - Category ID to lookup
 * @returns {Promise<Object>} Category object or null
 */
export async function getCategoryById(categoryId) {
  const categories = await getCachedCategories();
  return categories.find(cat => cat._id === categoryId) || null;
}

/**
 * Clear categories cache
 */
export function clearCategoriesCache() {
  localStorage.removeItem(CACHE_KEY);
  console.log("[CATEGORIES CACHE] 🧹 Cache cleared");
}

/**
 * Refresh categories from API
 */
export async function refreshCategoriesCache() {
  clearCategoriesCache();
  return getCachedCategories();
}

/**
 * Create a new category (and invalidate cache)
 * @param {Object} categoryData - New category data
 * @returns {Promise<Object>} Created category
 */
export async function createCategoryAndRefresh(categoryData) {
  try {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryData),
    });
    
    if (!res.ok) throw new Error("Failed to create category");
    
    clearCategoriesCache(); // Invalidate cache
    return await res.json();
  } catch (err) {
    console.error("[CATEGORIES CACHE] Create failed:", err);
    throw err;
  }
}

/**
 * Update category (and invalidate cache)
 * @param {string} categoryId - Category ID
 * @param {Object} updates - Updated fields
 * @returns {Promise<Object>} Updated category
 */
export async function updateCategoryAndRefresh(categoryId, updates) {
  try {
    const res = await fetch(`/api/categories/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    
    if (!res.ok) throw new Error("Failed to update category");
    
    clearCategoriesCache(); // Invalidate cache
    return await res.json();
  } catch (err) {
    console.error("[CATEGORIES CACHE] Update failed:", err);
    throw err;
  }
}
