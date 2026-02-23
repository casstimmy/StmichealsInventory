import { mongooseConnect, withRetry } from "@/lib/mongodb";
import Product from "@/models/Product";
import { Category } from "@/models/Category";

/* =====================
   AUTO-DISABLE EXPIRED PROMOTIONS
===================== */
async function disableExpiredPromotions() {
  const now = new Date();

  await Product.updateMany(
    {
      isPromotion: true,
      promoEnd: { $lt: now },
    },
    {
      $set: {
        isPromotion: false,
        promoPrice: null,
        promoStart: null,
        promoEnd: null,
      },
    }
  );
}

/* =====================
   AUTO-MARK EXPIRED PRODUCTS
===================== */
async function markExpiredProducts() {
  const now = new Date();

  await Product.updateMany(
    {
      expiryDate: { $lt: now },
      isExpired: false,
    },
    {
      $set: { isExpired: true },
    }
  );
}

async function syncRoomCategoryProductFlags() {
  const roomCategories = await Category.find({
    name: { $in: [/^room$/i, /^rooms$/i] },
  })
    .select("_id")
    .lean();
  const roomCategoryIds = roomCategories.map((c) => String(c._id));

  await Product.updateMany(
    {
      $or: [
        { category: { $in: roomCategoryIds } },
        { category: { $in: ["room", "rooms", "Room", "Rooms"] } },
      ],
    },
    {
      $set: {
        isStockManaged: false,
        quantity: 0,
      },
    }
  );
}

function isRoomName(value = "") {
  const normalized = String(value).trim().toLowerCase();
  return normalized === "room" || normalized === "rooms";
}

async function resolveStockManagedFromCategory(categoryIdOrName, requestedValue) {
  if (!categoryIdOrName) {
    return typeof requestedValue === "boolean" ? requestedValue : true;
  }
  if (isRoomName(categoryIdOrName)) return false;

  try {
    const category = await Category.findById(categoryIdOrName).select("name isStockManaged").lean();
    if (!category) return typeof requestedValue === "boolean" ? requestedValue : true;
    if (isRoomName(category.name)) return false;
    if (typeof requestedValue === "boolean") return requestedValue;
    if (typeof category.isStockManaged === "boolean") return category.isStockManaged;
  } catch {
    // Category lookup can fail for non-ObjectId values like "Top Level"
  }
  return typeof requestedValue === "boolean" ? requestedValue : true;
}

export default async function handler(req, res) {
  const { method } = req;
  await mongooseConnect();

  try {
    /* =====================
       GET PRODUCTS
    ===================== */
    if (method === "GET") {
      const {
        id,
        search,
        expired,
        minimal,
        page,
        limit: limitParam,
        archived,
        stockManaged,
      } = req.query;

      await syncRoomCategoryProductFlags();

      // Skip maintenance tasks for minimal/fast queries
      if (!minimal) {
        await disableExpiredPromotions();
        await markExpiredProducts();
      }

      if (id) {
        const idFilter = {};
        if (archived === "true") idFilter.isArchived = true;
        if (archived === "false") idFilter.isArchived = false;
        if (archived !== "true" && archived !== "false") idFilter.isArchived = { $ne: true };

        const product = await Product.findOne({ _id: id, ...idFilter });
        if (!product) {
          return res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }
        return res.json({ success: true, data: product });
      }

      const filter = {};
      if (archived === "true") filter.isArchived = true;
      else if (archived === "false") filter.isArchived = false;
      else filter.isArchived = { $ne: true };

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { barcode: { $regex: search, $options: "i" } },
        ];
      }

      if (expired === "true") filter.isExpired = true;
      if (expired === "false") filter.isExpired = false;
      if (stockManaged === "true") filter.isStockManaged = true;
      if (stockManaged === "false") filter.isStockManaged = false;

      // Minimal mode for stock management - only essential fields
      if (minimal === "true") {
        filter.isStockManaged = true;
        const products = await Product.find(filter)
          .select("name quantity minStock category barcode costPrice salePriceIncTax isStockManaged")
          .sort({ name: 1 })
          .lean();
        return res.json({ success: true, data: products });
      }

      // Pagination support
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(limitParam) || 100));
      const skip = (pageNum - 1) * limit;

      // Full query with pagination
      const [products, total] = await Promise.all([
        Product.find(filter)
          .select('+expiryDate')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(filter)
      ]);

      res.setHeader('X-Total-Count', total);
      res.setHeader('X-Page', pageNum);
      res.setHeader('X-Total-Pages', Math.ceil(total / limit));
      
      return res.json({ success: true, data: products, total });
    }

    /* =====================
       CREATE PRODUCT
    ===================== */
    if (method === "POST") {
      const body = req.body;
      body.isArchived = false;
      body.archivedAt = null;
      body.archivedReason = "";

      body.isStockManaged = await resolveStockManagedFromCategory(
        body.category,
        body.isStockManaged
      );
      if (!body.isStockManaged) body.quantity = 0;

      if (body.expiryDate) {
        body.expiryDate = new Date(body.expiryDate);
        body.isExpired = body.expiryDate < new Date();
      }

      const product = await Product.create(body);

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    }

    /* =====================
       UPDATE PRODUCT
    ===================== */
    if (method === "PUT") {
      const {
        _id,
        restore,
        isPromotion,
        promoStart,
        promoEnd,
        promoPrice,
        expiryDate,
      } = req.body;

      if (!_id) {
        return res.status(400).json({
          success: false,
          message: "Product ID required",
        });
      }

      /* 🔒 Promotion Validation */
      if (isPromotion) {
        if (!promoPrice || !promoStart || !promoEnd) {
          return res.status(400).json({
            success: false,
            message: "Promo price, start date, and end date are required",
          });
        }

        if (new Date(promoEnd) <= new Date(promoStart)) {
          return res.status(400).json({
            success: false,
            message: "Promo end date must be after start date",
          });
        }

        const overlap = await Product.findOne({
          _id,
          isPromotion: true,
          promoEnd: { $gte: new Date(promoStart) },
          promoStart: { $lte: new Date(promoEnd) },
        });

        if (overlap) {
          return res.status(400).json({
            success: false,
            message: "Promotion dates overlap with existing promotion",
          });
        }
      }

      const updateData = {
        ...req.body,
      };

      if (restore) {
        updateData.isArchived = false;
        updateData.archivedAt = null;
        updateData.archivedReason = "";
      } else if (updateData.isArchived) {
        updateData.archivedAt = updateData.archivedAt || new Date();
      }

      if (
        Object.prototype.hasOwnProperty.call(updateData, "category") ||
        Object.prototype.hasOwnProperty.call(updateData, "isStockManaged")
      ) {
        updateData.isStockManaged = await resolveStockManagedFromCategory(
          updateData.category,
          updateData.isStockManaged
        );
        if (!updateData.isStockManaged) updateData.quantity = 0;
      }

      if (promoStart) updateData.promoStart = new Date(promoStart);
      if (promoEnd) updateData.promoEnd = new Date(promoEnd);

      if (expiryDate) {
        updateData.expiryDate = new Date(expiryDate);
        updateData.isExpired = new Date(expiryDate) < new Date();
      }

      const updated = await Product.findByIdAndUpdate(
        _id,
        updateData,
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.json({
        success: true,
        message: "Product updated successfully",
        data: updated,
      });
    }

    /* =====================
       DELETE PRODUCT
    ===================== */
    if (method === "DELETE") {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Product ID required",
        });
      }

      const deleted = await Product.findByIdAndUpdate(
        id,
        {
          isArchived: true,
          archivedAt: new Date(),
          archivedReason: "manual-delete",
          quantity: 0,
        },
        { new: true }
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.json({
        success: true,
        message: "Product archived successfully",
      });
    }

    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`,
    });
  } catch (error) {
    console.error("❌ Product API Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

