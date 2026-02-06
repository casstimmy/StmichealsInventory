// lib/serverLocationHelper.js
// Server-side location helper for API routes

import Store from "@/models/Store";

/**
 * Builds a comprehensive location cache from all stores in the database
 * Returns a map of locationId (string) -> locationName
 * 
 * This handles:
 * - ObjectId lookups (converted to string)
 * - Index-based lookups (0, 1, 2, etc.)
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

    // Build comprehensive cache from all stores
    for (const store of stores) {
      if (!store.locations || !Array.isArray(store.locations)) {
        console.warn(`⚠️ Store ${store._id} has no locations array`);
        continue;
      }

      store.locations.forEach((loc, idx) => {
        if (!loc) {
          console.warn(`⚠️ Store ${store._id} has null/undefined location at index ${idx}`);
          return;
        }

        const locId = loc._id?.toString?.() || loc._id;
        const locName = loc.name || `Location ${idx + 1}`;

        if (locId) {
          // Map by ObjectId string
          locationCache[locId] = locName;
          
          // Also map by lowercase for case-insensitive matching
          locationCache[locId.toLowerCase()] = locName;
          
          totalLocations++;
          console.log(`  ✅ Cached location: ${locId.substring(0, 8)}... = "${locName}"`);
        }

        // Map by index (how some forms send data)
        locationCache[idx.toString()] = locName;
        locationCache[idx] = locName;

        // Map by name (for backwards compatibility)
        if (locName) {
          locationCache[locName] = locName;
          locationCache[locName.toLowerCase()] = locName;
        }
      });
    }

    console.log(`✅ Built location cache with ${totalLocations} locations (${Object.keys(locationCache).length} cache entries)`);
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
    const locationIdStr = locationId.toString ? locationId.toString() : String(locationId);

    const location = store.locations.find(loc => {
      const locIdStr = loc._id?.toString?.() || loc._id;
      return locIdStr === locationIdStr || locIdStr === locationId;
    });

    if (location) {
      console.log(`✅ Found location via store lookup: ${location.name}`);
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

  // Convert to string for lookup
  let lookupKey = locationId;
  if (typeof locationId === 'object' && locationId.toString) {
    lookupKey = locationId.toString();
  } else {
    lookupKey = String(locationId);
  }

  // Empty string
  if (lookupKey === "" || lookupKey === "null" || lookupKey === "undefined") {
    return locationCache["vendor"] ? "Vendor" : "Unknown";
  }

  // Direct lookup
  if (locationCache[lookupKey]) {
    return locationCache[lookupKey];
  }

  // Try lowercase
  if (locationCache[lookupKey.toLowerCase()]) {
    return locationCache[lookupKey.toLowerCase()];
  }

  // Try as integer index
  const idx = parseInt(lookupKey);
  if (!isNaN(idx) && locationCache[idx]) {
    return locationCache[idx];
  }

  // Last resort: if storeId provided, query directly from database
  if (storeId) {
    const directLookup = await resolveLocationFromStore(storeId, locationId);
    if (directLookup !== "Unknown") {
      return directLookup;
    }
  }

  // Return the original value if it looks like a name, otherwise Unknown
  if (lookupKey.length > 20) {
    // Looks like an ObjectId that wasn't found
    console.warn(`⚠️ Location not found in cache: ${lookupKey}`);
    return "Unknown";
  }

  // Might be a name already
  return lookupKey || "Unknown";
}
    return locationCache[lookupKey];
  }

  // Try lowercase
  if (locationCache[lookupKey.toLowerCase()]) {
    return locationCache[lookupKey.toLowerCase()];
  }

  // Try as integer index
  const idx = parseInt(lookupKey);
  if (!isNaN(idx) && locationCache[idx]) {
    return locationCache[idx];
  }

  // Return the original value if it looks like a name, otherwise Unknown
  if (lookupKey.length > 20) {
    // Looks like an ObjectId that wasn't found
    console.warn(`⚠️ Location not found in cache: ${lookupKey}`);
    return "Unknown";
  }

  // Might be a name already
  return lookupKey || "Unknown";
}

/**
 * Helper to enrich an array of objects with location names
 * @param {Array} items - Array of objects with locationId field
 * @param {string} idField - The field name containing the location ID (default: 'locationId')
 * @param {string} nameField - The field name to set with the location name (default: 'locationName')
 * @returns {Array} The items with locationName populated
 */
export async function enrichWithLocationNames(items, idField = 'locationId', nameField = 'locationName') {
  if (!items || items.length === 0) return items;

  const locationCache = await buildLocationCache();

  return items.map(item => ({
    ...item,
    [nameField]: resolveLocationName(item[idField], locationCache),
  }));
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
        store.locations.forEach(loc => {
          locations.push({
            id: loc._id?.toString?.() || loc._id,
            name: loc.name || "Unknown",
          });
        });
      }
    }

    return locations;
  } catch (err) {
    console.error("❌ Error getting all locations:", err);
    return [];
  }
}
