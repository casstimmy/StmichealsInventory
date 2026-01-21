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
        // Use stored totalCostPrice if available, otherwise calculate
        let totalCostPrice = m.totalCostPrice || 0;
        
        if (totalCostPrice === 0 && m.products && m.products.length > 0) {
          totalCostPrice = m.products.reduce((sum, p) => {
            const cost = p.productId?.costPrice || 0;
            return sum + cost * p.quantity;
          }, 0);
        }

        // Map location IDs to names - handle both string and ObjectId
        const fromLocationId = m.fromLocationId?.toString?.() || m.fromLocationId || m.fromLocation || "";
        const toLocationId = m.toLocationId?.toString?.() || m.toLocationId || m.toLocation || "";
        
        // Try multiple lookup strategies for location names
        let fromLocationName = locationMap[fromLocationId];
        if (!fromLocationName && fromLocationId) {
          // Try as integer index
          const idx = parseInt(fromLocationId);
          if (!isNaN(idx)) {
            fromLocationName = locationMap[idx.toString()] || locationMap[idx];
          }
        }
        fromLocationName = fromLocationName || fromLocationId || "Unknown";
        
        let toLocationName = locationMap[toLocationId];
        if (!toLocationName && toLocationId) {
          // Try as integer index
          const idx = parseInt(toLocationId);
          if (!isNaN(idx)) {
            toLocationName = locationMap[idx.toString()] || locationMap[idx];
          }
        }
        toLocationName = toLocationName || toLocationId || "Unknown";

        return {
          _id: m._id,
          transRef: m.transRef, 
          fromLocationId: fromLocationName,
          toLocationId: toLocationName,
          sender: fromLocationName, // Keep for backward compatibility
          receiver: toLocationName, // Keep for backward compatibility
          reason: m.reason,
          staff: m.staffId || m.staff,
          staffName: m.staffId?.name || "N/A",
          dateSent: m.dateSent || m.createdAt,
          dateReceived: m.dateReceived || m.updatedAt,
          totalCostPrice,
          status: m.status || "Received",
          barcode: m.barcode || m.transRef || "",
          productCount: m.products?.length || 0,
          totalQuantity: m.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0,
          products: m.products && m.products.length > 0 ? m.products.map(p => ({
            productId: p.productId?._id || p.id,
            productName: p.productId?.name,
            quantity: p.quantity,
            costPrice: p.productId?.costPrice || 0,
          })) : [],
        };
      });

      return res.status(200).json(movements);
    } catch (error) {
      console.error("Fetch stock movement failed:", error);
      return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}

