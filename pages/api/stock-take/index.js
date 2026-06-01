// pages/api/stock-take/index.js
import { mongooseConnect } from "@/lib/mongodb";
import StockTake from "@/models/StockTake";
import Product from "@/models/Product";
import { authMiddleware, isStaff } from "@/lib/auth-middleware";

function generateRef() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ST-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rand}`;
}

function buildStockTakeTitle(locationName) {
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return [dateLabel, locationName].filter(Boolean).join(" - ");
}

export default async function handler(req, res) {
  const authError = authMiddleware(req, res);
  if (authError) return authError;
  if (!isStaff(req)) {
    return res.status(403).json({ success: false, message: "Insufficient permissions" });
  }

  await mongooseConnect();

  /* ========== GET — List stock takes ========== */
  if (req.method === "GET") {
    try {
      const { status, location, limit = 50, page = 1 } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (location) filter.locationName = location;

      const skip = (Number(page) - 1) * Number(limit);
      const [stockTakes, total] = await Promise.all([
        StockTake.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .select("-items")
          .lean(),
        StockTake.countDocuments(filter),
      ]);

      return res.status(200).json({ success: true, stockTakes, total });
    } catch (err) {
      console.error("Stock take GET error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /* ========== POST — Create new stock take ========== */
  if (req.method === "POST") {
    try {
      const { locationId, locationName, createdBy } = req.body;

      if (!locationName || !createdBy) {
        return res.status(400).json({ success: false, message: "locationName and createdBy are required" });
      }

      const title = buildStockTakeTitle(locationName);

      // Build product filter — exclude derived child products (unit products auto-created from packs)
      // A derived child has isChildProduct=true AND packType != "pack"
      const productFilter = { isArchived: { $ne: true }, isStockManaged: true };

      const products = await Product.find(productFilter)
        .select("name barcode category quantity costPrice packType qtyPerPack isChildProduct parentProduct")
        .lean();

      const items = [];
      for (const p of products) {
        const isDerivedChild = p.isChildProduct && p.packType !== "pack";
        if (isDerivedChild) continue; // Skip unit products derived from packs

        // Regular entry (packs for pack products, units for unit products)
        items.push({
          productId: p._id,
          productName: p.name,
          barcode: p.barcode || "",
          category: p.category || "",
          systemQty: p.quantity || 0,
          countedQty: null,
          variance: 0,
          varianceValue: 0,
          costPrice: p.costPrice || 0,
          status: "pending",
          countType: "standard",
        });

        // For pack products, add a second entry for loose units
        if (p.packType === "pack" && (p.qtyPerPack || 1) > 1) {
          items.push({
            productId: p._id,
            productName: `${p.name} (Loose Units)`,
            barcode: p.barcode ? `${p.barcode}-LU` : "",
            category: p.category || "",
            systemQty: 0, // No separate system qty — loose units are part of the pack count
            countedQty: null,
            variance: 0,
            varianceValue: 0,
            costPrice: Math.round(((p.costPrice || 0) / (p.qtyPerPack || 1)) * 100) / 100,
            status: "pending",
            countType: "loose-units",
            qtyPerPack: p.qtyPerPack || 1,
          });
        }
      }

      const stockTake = await StockTake.create({
        reference: generateRef(),
        title,
        description: "",
        locationId: locationId || null,
        locationName,
        type: "full",
        category: "",
        items,
        totalItems: items.length,
        totalSystemQty: items.reduce((s, i) => s + i.systemQty, 0),
        createdBy: createdBy || req.user?.name || "",
        status: "draft",
      });

      return res.status(201).json({ success: true, stockTake: { ...stockTake.toObject(), items: undefined }, id: stockTake._id });
    } catch (err) {
      console.error("Stock take POST error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
