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
        .populate("staffId")
        .lean();

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
          const locId = loc._id?.toString?.();
          if (locId) {
            locationMap[locId] = loc.name;
          }
          
          // Map by name
          if (loc.name) {
            locationMap[loc.name] = loc.name;
          }
        });
      }
      locationMap["vendor"] = "Vendor";
      locationMap["Vendor"] = "Vendor";

      console.log("Total stock movements found:", data.length);

      const movements = [];
      
      for (let i = 0; i < data.length; i++) {
        const m = data[i];
        try {
          // Validate that document exists and has required fields
          if (!m || typeof m !== 'object') {
            console.warn(`[${i}] Invalid movement document (not an object):`, m);
            continue;
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
              console.warn(`[${i}] Error calculating totalCostPrice:`, calcErr.message);
              totalCostPrice = 0;
            }
          }

          // Map location IDs to names - handle both string and ObjectId
          // Handle null fromLocationId (indicates vendor/external source)
          let fromLocationId = m.fromLocationId;
          let toLocationId = m.toLocationId;
          
          // Convert ObjectId to string if needed
          if (fromLocationId && typeof fromLocationId === 'object') {
            fromLocationId = fromLocationId.toString ? fromLocationId.toString() : String(fromLocationId);
          }
          if (toLocationId && typeof toLocationId === 'object') {
            toLocationId = toLocationId.toString ? toLocationId.toString() : String(toLocationId);
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

          // Map products safely
          let mappedProducts = [];
          if (m.products && Array.isArray(m.products)) {
            mappedProducts = m.products.map(p => ({
              productId: p.productId?._id ? p.productId._id.toString() : (p.productId || p.id || "Unknown"),
              productName: p.productId?.name || "Unknown",
              quantity: p.quantity || 0,
              costPrice: p.productId?.costPrice || 0,
              expiryDate: p.expiryDate || null,
            }));
          }

          const movement = {
            _id: m._id ? m._id.toString() : m._id,
            transRef: m.transRef || "Unknown", 
            fromLocationId: fromLocationName,
            toLocationId: toLocationName,
            sender: fromLocationName,
            receiver: toLocationName,
            reason: m.reason || "Unknown",
            staff: m.staffId || m.staff || null,
            staffName: m.staffId?.name || "N/A",
            dateSent: m.dateSent || m.createdAt,
            dateReceived: m.dateReceived || m.updatedAt,
            totalCostPrice,
            status: m.status || "Received",
            barcode: m.barcode || m.transRef || "",
            productCount: mappedProducts.length,
            totalQuantity: mappedProducts.reduce((sum, p) => sum + (p.quantity || 0), 0),
            products: mappedProducts,
          };
          
          movements.push(movement);
        } catch (err) {
          console.error(`[${i}] Error mapping movement document:`, err.message, "Document:", m);
          // Still add a basic movement object to prevent data loss
          try {
            movements.push({
              _id: m._id ? m._id.toString() : "Unknown",
              transRef: m.transRef || "Unknown",
              fromLocationId: "Vendor",
              toLocationId: "Unknown",
              sender: "Vendor",
              receiver: "Unknown",
              reason: m.reason || "Unknown",
              staff: null,
              staffName: "N/A",
              dateSent: m.dateSent || m.createdAt,
              dateReceived: m.dateReceived || m.updatedAt,
              totalCostPrice: m.totalCostPrice || 0,
              status: m.status || "Received",
              barcode: m.barcode || m.transRef || "",
              productCount: 0,
              totalQuantity: 0,
              products: [],
            });
          } catch (fallbackErr) {
            console.error(`[${i}] Failed to create fallback movement:`, fallbackErr.message);
          }
        }
      }

      console.log("Mapped movements count:", movements.length);
      return res.status(200).json(movements);
    } catch (error) {
      console.error("Fetch stock movement failed:", error);
      return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}

