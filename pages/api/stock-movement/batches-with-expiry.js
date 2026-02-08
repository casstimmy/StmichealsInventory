// pages/api/stock-movement/batches-with-expiry.js
// Optimized: Pre-cached categories, filtered query, no N+1 queries

import mongoose from "mongoose";
import { mongooseConnect, withRetry } from "@/lib/mongodb";
import StockMovement from "@/models/StockMovement";
import Product from "@/models/Product";
import { Category } from "@/models/Category";
import { buildLocationCache } from "@/lib/serverLocationHelper";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const batches = await withRetry(async () => {
      // Build caches ONCE at the start (parallel fetch)
      const [locationCache, allCategories] = await Promise.all([
        buildLocationCache(),
        Category.find({}).select('_id name').lean()
      ]);

      // Build category cache map
      const categoryCache = {};
      allCategories.forEach(cat => {
        categoryCache[cat._id.toString()] = cat.name;
      });

      // Fetch only movements that have products with expiry dates
      // Use aggregation for better performance
      const stockMovements = await StockMovement.find({
        'products.expiryDate': { $exists: true, $ne: null }
      })
        .select('transRef toLocationId fromLocationId reason status dateReceived dateSent products')
        .populate({
          path: "products.productId",
          model: Product,
          select: "name category expiryDate _id",
        })
        .lean();

      // Process batches efficiently
      const batchList = [];

      for (const movement of stockMovements) {
        if (!movement.products?.length) continue;

        // Resolve location name from cache
        let locationName = "Unknown";
        if (movement.toLocationId) {
          locationName = locationCache[movement.toLocationId.toString()] || "Unknown";
        } else if (movement.reason === "Restock") {
          locationName = "Vendor";
        } else if (movement.fromLocationId) {
          locationName = locationCache[movement.fromLocationId.toString()] || "Vendor";
        }

        // Process each product
        for (const productItem of movement.products) {
          const product = productItem.productId;
          if (!product) continue;

          // Get expiry date (batch item takes priority)
          const expiryDate = productItem.expiryDate || product.expiryDate;
          if (!expiryDate || productItem.quantity <= 0) continue;

          // Get category name from cache (no DB call!)
          let categoryName = "Top Level";
          if (product.category && product.category !== "Top Level") {
            const catId = product.category.toString();
            categoryName = categoryCache[catId] || product.category;
          }

          batchList.push({
            batchId: movement.transRef || movement._id.toString(),
            transRef: movement.transRef,
            productId: product._id,
            productName: product.name || "Unknown Product",
            category: categoryName,
            locationId: movement.toLocationId,
            locationName,
            expiryDate,
            quantity: productItem.quantity || 0,
            costPrice: productItem.costPrice || 0,
            dateReceived: movement.dateReceived || movement.dateSent,
            status: movement.status,
            reason: movement.reason,
          });
        }
      }

      // Sort by expiry date (earliest first)
      batchList.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      return batchList;
    });

    return res.status(200).json({
      success: true,
      data: batches,
      count: batches.length,
    });
  } catch (error) {
    console.error("Error fetching batches with expiry:", error);
    return res.status(500).json({
      error: "Failed to fetch batch data",
      details: error.message,
    });
  }
}
