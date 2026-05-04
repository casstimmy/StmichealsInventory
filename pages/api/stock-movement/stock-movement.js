import { mongooseConnect } from "@/lib/mongodb";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";
import { deriveChildQty } from "@/lib/syncPackQty";
import { isValidObjectId } from "mongoose";
import { authMiddleware, isStaff } from "@/lib/auth-middleware";
import { sanitizeMultilineText, sanitizePlainText } from "@/lib/textSanitizers";

export default async function handler(req, res) {
  const authError = authMiddleware(req, res);
  if (authError) return authError;

  if (!isStaff(req)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { fromLocationId, toLocationId, staffId, reason, products, notes, vendorName } = req.body;
  const isOperationalLoss = reason === "Operational Loss";

  /* =========================
     BASIC VALIDATION
  ========================= */
  if (!fromLocationId || !reason || (!isOperationalLoss && !toLocationId)) {
    return res.status(400).json({
      message: isOperationalLoss
        ? "Missing required fields: fromLocationId, reason"
        : "Missing required fields: fromLocationId, toLocationId, reason",
    });
  }

  if (typeof fromLocationId !== "string" || (!isOperationalLoss && typeof toLocationId !== "string")) {
    return res.status(400).json({
      message: isOperationalLoss
        ? "fromLocationId must be a string"
        : "fromLocationId and toLocationId must be strings",
    });
  }

  // Handle special cases and validate ObjectId format
  const isFromLocationVendor = fromLocationId.toLowerCase() === "vendor" || fromLocationId === "vendor";
  const isToLocationVendor = typeof toLocationId === "string" && (toLocationId.toLowerCase() === "vendor" || toLocationId === "vendor");
  
  // Validate that actual location IDs (non-vendor) are valid ObjectIds
  if (!isFromLocationVendor && !isValidObjectId(fromLocationId)) {
    return res.status(400).json({
      message: `Invalid fromLocationId format: "${fromLocationId}". Must be a valid location ID or "vendor" for external stock.`,
    });
  }

  if (isOperationalLoss && isFromLocationVendor) {
    return res.status(400).json({
      message: "Operational loss must be recorded against a real stock location.",
    });
  }

  if (!isOperationalLoss && !isToLocationVendor && !isValidObjectId(toLocationId)) {
    return res.status(400).json({
      message: `Invalid toLocationId format: "${toLocationId}". Must be a valid location ID or "vendor" for returns.`,
    });
  }

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      message: "Products must be a non-empty array",
    });
  }

  try {
    await mongooseConnect();

    /* =========================
       VALIDATE PRODUCTS
    ========================= */
    let totalCostPrice = 0;
    const productsToCreate = [];

    for (const item of products) {
      const { id, quantity, expiryDate } = item;

      if (!id || typeof quantity !== "number" || quantity < 1) {
        return res.status(400).json({
          message:
            "Invalid product format. Each product must have id and quantity >= 1",
          product: item,
        });
      }

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message: `Invalid product ID format: ${id}`,
        });
      }

      const product = await Product.findById(id).select("_id costPrice isStockManaged isChildProduct packType");
      if (!product) {
        return res.status(404).json({
          message: `Product not found with ID: ${id}`,
        });
      }

      // Only true derived children (unit from pack) cannot have independent stock movements
      if (product.isChildProduct && product.packType !== "pack") {
        return res.status(400).json({
          message: `"${product.name || id}" is a unit product linked to a pack. Adjust the pack product instead.`,
        });
      }

      totalCostPrice += (product.costPrice || 0) * quantity;

      productsToCreate.push({
        productId: id,
        quantity,
        expiryDate: expiryDate || null,
        notes: item.notes || "",
        isStockManaged: product.isStockManaged !== false,
      });
    }

    /* =========================
       CREATE STOCK MOVEMENT
    ========================= */
    const transRef = Date.now().toString();
    const now = new Date();

    const movement = await StockMovement.create({
      transRef,
      fromLocationId: isFromLocationVendor ? null : fromLocationId,
      vendorName: isFromLocationVendor ? sanitizePlainText(vendorName) : "",
      toLocationId: isOperationalLoss || isToLocationVendor ? null : toLocationId,
      staffId: staffId || null,
      reason,
      status: "Received",
      totalCostPrice,
      dateSent: now,
      dateReceived: now,
      barcode: transRef,
      products: productsToCreate,
      notes: sanitizeMultilineText(notes),
    });

    /* =========================
       UPDATE PRODUCT STOCK
       (ALLOW NEGATIVE STOCK)
    ========================= */
    // Process updates without negative stock restriction
    const bulkOps = productsToCreate
      .filter(({ isStockManaged }) => isStockManaged)
      .map(({ productId, quantity }) => {
      let qtyChange = 0;

      if (reason === "Restock") {
        qtyChange = quantity;
      } else if (reason === "Return") {
        qtyChange = -quantity;
      } else if (reason === "Adjustment" || reason === "Operational Loss") {
        // Adjustment reduces stock (e.g., expired product write-off)
        qtyChange = -quantity;
      } else if (reason === "Transfer") {
        qtyChange = 0; // ❗ NO GLOBAL STOCK CHANGE
      }

        return {
          updateOne: {
            filter: { _id: productId },
            update: { $inc: { quantity: qtyChange } },
          },
        };
      });

    if (bulkOps.length > 0) {
      const bulkResult = await Product.bulkWrite(bulkOps);
      console.log("📦 Stock update result:", bulkResult);

      // Sync parent-child quantities for all affected products
      for (const { productId } of productsToCreate.filter(p => p.isStockManaged)) {
        await deriveChildQty(productId);
      }
      
      // Check for low stock items and send notification
      const updatedProducts = await Product.find({
        _id: { $in: productsToCreate.map(p => p.productId) }
      });
      
      const lowStockItems = updatedProducts.filter(
        p => p.quantity < (p.minStock || 0) && p.quantity >= 0
      );
      
      if (lowStockItems.length > 0) {
        console.log("⚠️ Low stock alert for:", lowStockItems.map(p => p.name).join(", "));
        
        // Trigger email notification for low stock
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/notify-low-stock`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
            },
            body: JSON.stringify({ 
              products: lowStockItems,
              movementId: movement._id 
            }),
          }).catch(err => console.warn("⚠️ Low stock email notification failed:", err.message));
        } catch (emailErr) {
          console.warn("⚠️ Could not send low stock notification:", emailErr.message);
        }
      }
    }

    /* =========================
       SUCCESS RESPONSE
    ========================= */
    return res.status(201).json({
      success: true,
      message: "Stock movement saved successfully",
      data: {
        movementId: movement._id,
        transRef,
        totalCostPrice,
      },
    });
  } catch (err) {
    console.error("❌ Stock movement error:", err);
    
    // Handle validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        message: "Validation failed",
        details: messages,
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
    
    return res.status(500).json({
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
}

