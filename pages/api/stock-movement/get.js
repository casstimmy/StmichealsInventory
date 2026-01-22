// /pages/api/stock-movement/get.js

import { mongooseConnect } from "@/lib/mongodb";
import StockMovement from "@/models/StockMovement";
import Product from "@/models/Product";
import Store from "@/models/Store";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const data = await StockMovement.find({})
        .sort({ createdAt: -1 })
        .populate("products.productId")
        .populate("staffId");

      // Fetch store to get location names
      const store = await Store.findOne({}).lean();
      const locations = store?.locations || [];
      
      // Create location map - handle both by index and by ObjectId
      const locationMap = {};
      if (locations && locations.length > 0) {
        locations.forEach((loc, idx) => {
          // Map by index (how they're sent from the form)
          locationMap[idx.toString()] = loc.name;
          locationMap[idx] = loc.name;
          
          // Map by ObjectId
          const locId = loc._id?.toString();
          if (locId) {
            locationMap[locId] = loc.name;
          }
          
          // Map by name
          locationMap[loc.name] = loc.name;
        });
      }
      locationMap["vendor"] = "Vendor";
      locationMap["Vendor"] = "Vendor";

      const movements = data.map((m) => {
        try {
          // Validate that document exists and has required fields
          if (!m || typeof m !== 'object') {
            console.warn("Invalid movement document:", m);
            return null;
          }

          // Use stored totalCostPrice if available, otherwise calculate
          let totalCostPrice = m.totalCostPrice || 0;
          
          if (totalCostPrice === 0 && m.products && Array.isArray(m.products) && m.products.length > 0) {
            try {
              totalCostPrice = m.products.reduce((sum, p) => {
                const cost = p.productId?.costPrice || 0;
                const qty = p.quantity || 0;
                return sum + (cost * qty);
              }, 0);
            } catch (calcErr) {
              console.warn("Error calculating totalCostPrice:", calcErr);
              totalCostPrice = 0;
            }
          }

          // Map location IDs to names - handle both string and ObjectId
          // Handle null fromLocationId (indicates vendor/external source)
          let fromLocationId = m.fromLocationId;
          let toLocationId = m.toLocationId;
          
          // Convert ObjectId to string if needed
          if (fromLocationId && typeof fromLocationId === 'object' && fromLocationId.toString) {
            fromLocationId = fromLocationId.toString();
          }
          if (toLocationId && typeof toLocationId === 'object' && toLocationId.toString) {
            toLocationId = toLocationId.toString();
          }
          
          // Default handling for null/undefined values
          let fromLocationName = "Unknown";
          if (fromLocationId === null || fromLocationId === undefined) {
            fromLocationName = "Vendor";
          } else if (fromLocationId === "") {
            fromLocationName = "Vendor";
          } else {
            // Try to find in location map
            fromLocationName = locationMap[fromLocationId];
            if (!fromLocationName && fromLocationId) {
              // Try as integer index
              const idx = parseInt(fromLocationId);
              if (!isNaN(idx)) {
                fromLocationName = locationMap[idx.toString()] || locationMap[idx];
              }
            }
            fromLocationName = fromLocationName || fromLocationId || "Unknown";
          }
          
          let toLocationName = "Unknown";
          if (toLocationId === null || toLocationId === undefined) {
            toLocationName = "Unknown";
          } else if (toLocationId === "") {
            toLocationName = "Unknown";
          } else {
            toLocationName = locationMap[toLocationId];
            if (!toLocationName && toLocationId) {
              // Try as integer index
              const idx = parseInt(toLocationId);
              if (!isNaN(idx)) {
                toLocationName = locationMap[idx.toString()] || locationMap[idx];
              }
            }
            toLocationName = toLocationName || toLocationId || "Unknown";
          }

          return {
            _id: m._id,
            transRef: m.transRef, 
            fromLocationId: fromLocationName,
            toLocationId: toLocationName,
            sender: fromLocationName, // Keep for backward compatibility
            receiver: toLocationName, // Keep for backward compatibility
            reason: m.reason || "Unknown",
            staff: m.staffId || m.staff,
            staffName: m.staffId?.name || "N/A",
            dateSent: m.dateSent || m.createdAt,
            dateReceived: m.dateReceived || m.updatedAt,
            totalCostPrice,
            status: m.status || "Received",
            barcode: m.barcode || m.transRef || "",
            productCount: m.products?.length || 0,
            totalQuantity: m.products && Array.isArray(m.products) ? m.products.reduce((sum, p) => sum + (p.quantity || 0), 0) : 0,
            products: m.products && Array.isArray(m.products) && m.products.length > 0 ? m.products.map(p => ({
              productId: p.productId?._id || p.id,
              productName: p.productId?.name || "Unknown",
              quantity: p.quantity || 0,
              costPrice: p.productId?.costPrice || 0,
            })) : [],
          };
        } catch (err) {
          console.error("Error mapping movement document:", m, err);
          return null;
        }
      }).filter(m => m !== null); // Filter out any null/failed mappings

      return res.status(200).json(movements);
    } catch (error) {
      console.error("Fetch stock movement failed:", error);
      return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}

