// lib/serverLocationHelper.js
// Server-side location helper for API routes

import Store from "@/models/Store";

/**
 * Safely converts any value to a string for cache lookup
 * Handles ObjectId, BSON ObjectId, strings, etc.
 */
function toStringId(value) {
  if (!value) return null;
  
  // If it's already a string, return it
  if (typeof value === 'string') return value;
  
  // If it has a toString method (ObjectId, BSON ObjectId)
  if (typeof value === 'object') {
    // Check for _id property (nested object)
    if (value._id) {
      return toStringId(value._id);
    }
    // Use toString for ObjectId
    if (value.toString && typeof value.toString === 'function') {
      const str = value.toString();
      // Avoid "[object Object]"
      if (str !== '[object Object]') {
        return str;
      }
    }
    // Try JSON stringify as last resort
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  
  return String(value);
}

/**
 * Builds a comprehensive location cache from all stores in the database
 * Returns a map of locationId (string) -> locationName
 * 
 * This handles:
 * - ObjectId lookups (converted to string)
 * - Name-based lookups (for backwards compatibility)
 * - Special cases like "Vendor", null, undefined
 */
export async function buildLocationCache() {
  const locationCache = {
    // Special cases
    "vendor": "Vendor",
    "Vendor": "Vendor",
    "null": "Vendor",
    "undefined": "Unknown",
    "": "Unknown",
  };

  try {
    // Fetch ALL stores to get ALL locations
    const stores = await Store.find({}).select("storeName locations").lean();
    
    if (!stores || stores.length === 0) {
      console.warn("⚠️ No stores found in database");
      return locationCache;
    }

    let totalLocations = 0;

    console.log(`📍 Processing ${stores.length} store(s) for location cache...`);

    // Build comprehensive cache from all stores
    for (const store of stores) {
      console.log(`  📦 Store: ${store.storeName || store._id}`);
      
      if (!store.locations || !Array.isArray(store.locations)) {
        console.warn(`  ⚠️ Store ${store._id} has no locations array`);
        continue;
      }

      console.log(`    Found ${store.locations.length} location(s)`);

      for (const loc of store.locations) {
        if (!loc) {
          console.warn(`    ⚠️ Null/undefined location`);
          continue;
        }

        // Convert ObjectId to string using helper
        const locId = toStringId(loc._id);
        const locName = loc.name || "Unnamed Location";

        console.log(`    📍 Location: _id=${locId}, name="${locName}"`);

        if (locId && locId.length === 24) {
          // Valid 24-char ObjectId string
          locationCache[locId] = locName;
          locationCache[locId.toLowerCase()] = locName;
          totalLocations++;
          console.log(`    ✅ Cached: "${locId}" → "${locName}"`);
        } else if (locId) {
          // Non-standard ID format
          locationCache[locId] = locName;
          console.log(`    ✅ Cached (non-ObjectId): "${locId}" → "${locName}"`);
          totalLocations++;
        }

        // Map by name (for backwards compatibility)
        if (locName && locName !== "Unnamed Location") {
          locationCache[locName] = locName;
          locationCache[locName.toLowerCase()] = locName;
        }
      }
    }

    console.log(`✅ Built location cache with ${totalLocations} locations (${Object.keys(locationCache).length} cache entries)`);
    
    // Debug: Print all cache keys 
    console.log("📋 Cache keys:", Object.keys(locationCache).filter(k => k.length === 24));
    
    return locationCache;

  } catch (err) {
    console.error("❌ Error building location cache:", err);
    return locationCache;
  }
}

/**
 * Direct location lookup by storeId and locationId
 * Used as fallback when buildLocationCache doesn't find a location
 */
export async function resolveLocationFromStore(storeId, locationId) {
  if (!storeId || !locationId) {
    return "Unknown";
  }

  try {
    const store = await Store.findById(storeId).select("locations").lean();
    
    if (!store || !store.locations || !Array.isArray(store.locations)) {
      console.warn(`⚠️ Store ${storeId} not found or has no locations`);
      return "Unknown";
    }

    // Convert locationId to string for comparison
    const locationIdStr = toStringId(locationId);
    console.log(`🔍 Direct store lookup: storeId=${storeId}, locationId=${locationIdStr}`);

    const location = store.locations.find(loc => {
      const locIdStr = toStringId(loc._id);
      console.log(`  Comparing: ${locIdStr} === ${locationIdStr} ? ${locIdStr === locationIdStr}`);
      return locIdStr === locationIdStr;
    });

    if (location) {
      console.log(`✅ Found location via direct store lookup: ${location.name}`);
      return location.name || "Unknown";
    }

    console.warn(`⚠️ Location ${locationIdStr} not found in store ${storeId}`);
    return "Unknown";

  } catch (err) {
    console.error(`❌ Error resolving location from store:`, err);
    return "Unknown";
  }
}

/**
 * Resolves a location ID to a location name
 * @param {string|ObjectId|number|null|undefined} locationId - The location identifier
 * @param {Object} locationCache - Pre-built location cache (from buildLocationCache)
 * @param {string|ObjectId} storeId - Optional storeId for fallback lookup
 * @returns {Promise<string>} The location name, or "Unknown" if not found
 */
export async function resolveLocationName(locationId, locationCache, storeId = null) {
  // Handle null/undefined
  if (locationId === null || locationId === undefined) {
    return "Vendor";
  }

  // Convert to string for lookup using helper
  const lookupKey = toStringId(locationId);
  
  console.log(`🔍 resolveLocationName: input=${typeof locationId === 'object' ? 'Object' : locationId}, lookupKey=${lookupKey}`);

  // Empty string or special values
  if (!lookupKey || lookupKey === "" || lookupKey === "null" || lookupKey === "undefined") {
    return "Vendor";
  }

  // Direct lookup
  if (locationCache[lookupKey]) {
    console.log(`  ✅ Found in cache: "${lookupKey}" → "${locationCache[lookupKey]}"`);
    return locationCache[lookupKey];
  }

  // Try lowercase
  const lowerKey = lookupKey.toLowerCase();
  if (locationCache[lowerKey]) {
    console.log(`  ✅ Found in cache (lowercase): "${lowerKey}" → "${locationCache[lowerKey]}"`);
    return locationCache[lowerKey];
  }

  console.log(`  ⚠️ Not found in cache, trying fallback...`);
  console.log(`  Cache has ${Object.keys(locationCache).length} entries`);

  // Last resort: if storeId provided, query directly from database
  if (storeId) {
    console.log(`  🔍 Trying direct store lookup with storeId=${storeId}`);
    const directLookup = await resolveLocationFromStore(storeId, locationId);
    if (directLookup !== "Unknown") {
      return directLookup;
    }
  }

  // Return the original value if it looks like a name (short), otherwise Unknown
  if (lookupKey.length <= 20 && !/^[0-9a-f]{24}$/i.test(lookupKey)) {
    // Might be a name already
    console.log(`  ℹ️ Returning as-is (might be name): "${lookupKey}"`);
    return lookupKey;
  }

  // Looks like an ObjectId that wasn't found
  console.warn(`  ❌ Location ID not found: ${lookupKey}`);
  return "Unknown";
}

/**
 * Helper to enrich an array of objects with location names
 * @param {Array} items - Array of objects with locationId field
 * @param {string} idField - The field name containing the location ID (default: 'locationId')
 * @param {string} nameField - The field name to set with the location name (default: 'locationName')
 * @returns {Promise<Array>} The items with locationName populated
 */
export async function enrichWithLocationNames(items, idField = 'locationId', nameField = 'locationName') {
  if (!items || items.length === 0) return items;

  const locationCache = await buildLocationCache();

  // Use Promise.all to properly await all async resolveLocationName calls
  return Promise.all(items.map(async (item) => ({
    ...item,
    [nameField]: await resolveLocationName(item[idField], locationCache),
  })));
}

/**
 * Get all locations as a simple array
 * @returns {Array<{id: string, name: string}>} Array of location objects
 */
export async function getAllLocations() {
  try {
    const stores = await Store.find({}).select("locations").lean();
    const locations = [];

    for (const store of stores) {
      if (store.locations && Array.isArray(store.locations)) {
        for (const loc of store.locations) {
          locations.push({
            id: toStringId(loc._id),
            name: loc.name || "Unknown",
          });
        }
      }
    }

    return locations;
  } catch (err) {
    console.error("❌ Error getting all locations:", err);
    return [];
  }
}
