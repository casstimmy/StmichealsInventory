// pages/api/stock-movement/batches-with-expiry.js
import mongoose from "mongoose";
import { mongooseConnect } from "@/lib/mongodb";
import StockMovement from "@/models/StockMovement";
import Product from "@/models/Product";
import Store from "@/models/Store";
import { Category } from "@/models/Category";

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
    let productsProcessed = 0;
    let productsWithExpiryDates = 0;

    for (const movement of stockMovements) {
      if (!movement.products || movement.products.length === 0) {
        continue;
      }

      // Get location name from toLocationId
      let locationName = "Unknown";
      if (movement.toLocationId) {
        try {
          const store = await Store.findOne(
            { "locations._id": movement.toLocationId },
            { "locations.$": 1 }
          ).lean();
          
          if (store && store.locations && store.locations.length > 0) {
            locationName = store.locations[0].name || "Unknown";
          }
        } catch (err) {
          console.error(`Error fetching location ${movement.toLocationId}:`, err);
        }
      } else if (movement.reason === "Restock") {
        locationName = "Vendor";
      }

      // Process each product in the batch
      for (const productItem of movement.products) {
        const product = productItem.productId;
        productsProcessed++;
        
        if (!product) {
          console.warn(`Null product in batch ${movement.transRef}, item:`, productItem);
          continue;
        }

        // Fetch category name if category is stored as ID
        let categoryName = "Top Level";
        if (product.category && product.category !== "Top Level") {
          try {
            // Check if category is a valid ObjectId
            if (mongoose.Types.ObjectId.isValid(product.category)) {
              const categoryDoc = await Category.findById(product.category).lean();
              if (categoryDoc) {
                categoryName = categoryDoc.name;
              } else {
                categoryName = product.category; // Fallback to ID if not found
              }
            } else {
              // If not an ID, assume it's already a name
              categoryName = product.category;
            }
          } catch (err) {
            console.error(`Error fetching category ${product.category}:`, err);
            categoryName = product.category || "Top Level";
          }
        }

        // Check for expiry date - first from batch item, then from product document
        // Priority: batch expiryDate > product expiryDate
        let expiryDate = null;
        if (productItem.expiryDate) {
          expiryDate = productItem.expiryDate;
        } else if (product.expiryDate) {
          expiryDate = product.expiryDate;
        }

        const hasExpiryDate = expiryDate && expiryDate !== null;
        if (hasExpiryDate) {
          productsWithExpiryDates++;
        }

        // Only include products with expiry dates in batch report
        if (hasExpiryDate && productItem.quantity > 0) {
          batches.push({
            batchId: movement.transRef || movement._id.toString(),
            transRef: movement.transRef,
            productId: product._id,
            productName: product.name || "Unknown Product",
            category: categoryName,
            locationId: movement.toLocationId,
            locationName: locationName,
            expiryDate: expiryDate,
            quantity: productItem.quantity || 0,
            costPrice: productItem.costPrice || 0,
            dateReceived: movement.dateReceived || movement.dateSent,
            status: movement.status,
            reason: movement.reason,
          });

          console.log(
            `✅ Batch: ${movement.transRef}, Product: ${product.name}, Location: ${locationName}, Expiry: ${expiryDate}, Qty: ${productItem.quantity}`
          );
        } else if (!hasExpiryDate) {
          console.log(
            `ℹ️ Product ${product.name} (Batch: ${movement.transRef}) has no expiry date`
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

    console.log(`Found ${batches.length} batches with expiry dates (${productsWithExpiryDates}/${productsProcessed} products have expiry dates)`);

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
