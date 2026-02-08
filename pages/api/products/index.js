import { mongooseConnect, withRetry } from "@/lib/mongodb";
import Product from "@/models/Product";

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

export default async function handler(req, res) {
  const { method } = req;
  await mongooseConnect();

  try {
    /* =====================
       GET PRODUCTS
    ===================== */
    if (method === "GET") {
      const { id, search, expired, minimal, page, limit: limitParam } = req.query;

      // Skip maintenance tasks for minimal/fast queries
      if (!minimal) {
        await disableExpiredPromotions();
        await markExpiredProducts();
      }

      if (id) {
        const product = await Product.findById(id);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }
        return res.json({ success: true, data: product });
      }

      const filter = {};

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { barcode: { $regex: search, $options: "i" } },
        ];
      }

      if (expired === "true") filter.isExpired = true;
      if (expired === "false") filter.isExpired = false;

      // Minimal mode for stock management - only essential fields
      if (minimal === "true") {
        const products = await Product.find(filter)
          .select('name quantity minStock category barcode costPrice salePriceIncTax')
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

      const deleted = await Product.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.json({
        success: true,
        message: "Product deleted successfully",
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

