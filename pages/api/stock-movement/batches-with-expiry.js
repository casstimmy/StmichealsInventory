// pages/api/stock-movement/batches-with-expiry.js
import mongoose from "mongoose";
import { mongooseConnect } from "@/lib/mongodb";
import StockMovement from "@/models/StockMovement";
import Product from "@/models/Product";
import Store from "@/models/Store";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    // Fetch all stock movements with products that have expiry dates
    const stockMovements = await StockMovement.find({})
      .populate({
        path: "products.productId",
        model: Product,
        select: "+expiryDate category name",
      })
      .lean();

    console.log(`Fetched ${stockMovements.length} stock movements from database`);

    // Transform stock movements into batch entries with expiry information
    const batches = [];

    for (const movement of stockMovements) {
      if (!movement.products || movement.products.length === 0) {
        continue;
      }

      // Get location name from toLocationId
      let locationName = "Unknown";
      if (movement.toLocationId) {
        const store = await Store.findOne(
          { "locations._id": movement.toLocationId },
          { "locations.$": 1 }
        ).lean();
        
        if (store && store.locations && store.locations.length > 0) {
          locationName = store.locations[0].name || "Unknown";
        }
      }

      // Process each product in the batch
      for (const productItem of movement.products) {
        const product = productItem.productId;
        
        // Only include if product has an expiry date
        if (product && product.expiryDate) {
          batches.push({
            batchId: movement.transRef || movement._id.toString(),
            transRef: movement.transRef,
            productId: product._id,
            productName: product.name || "Unknown Product",
            category: product.category || "Top Level",
            locationId: movement.toLocationId,
            locationName: locationName,
            expiryDate: product.expiryDate,
            quantity: productItem.quantity || 0,
            costPrice: productItem.costPrice || 0,
            dateReceived: movement.dateReceived || movement.dateSent,
            status: movement.status,
            reason: movement.reason,
          });

          console.log(
            `Batch: ${movement.transRef}, Product: ${product.name}, Location: ${locationName}, Expiry: ${product.expiryDate}, Qty: ${productItem.quantity}`
          );
        }
      }
    }

    // Sort by expiry date (earliest first)
    batches.sort((a, b) => {
      const dateA = new Date(a.expiryDate);
      const dateB = new Date(b.expiryDate);
      return dateA - dateB;
    });

    console.log(`Found ${batches.length} batches with expiry dates`);

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
