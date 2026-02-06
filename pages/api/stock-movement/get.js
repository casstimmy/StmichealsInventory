// /pages/api/stock-movement/get.js

import { mongooseConnect } from "@/lib/mongodb";
import StockMovement from "@/models/StockMovement";
import Product from "@/models/Product";
import Staff from "@/models/Staff";
import { buildLocationCache, resolveLocationName } from "@/lib/serverLocationHelper";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const data = await StockMovement.find({})
        .sort({ createdAt: -1 })
        .populate("products.productId")
        .populate("staffId")
        .lean();

      // Build location cache using centralized helper
      const locationCache = await buildLocationCache();
      console.log(`✅ Location cache built with ${Object.keys(locationCache).length} entries`);

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

          // Resolve location names using centralized helper
          let fromLocationName = "Vendor";
          let toLocationName = "Unknown";
          
          if (m.fromLocationId === null || m.fromLocationId === undefined || m.fromLocationId === "") {
            fromLocationName = "Vendor";
          } else {
            fromLocationName = await resolveLocationName(m.fromLocationId, locationCache);
          }
          
          if (m.toLocationId !== null && m.toLocationId !== undefined && m.toLocationId !== "") {
            toLocationName = await resolveLocationName(m.toLocationId, locationCache);
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

