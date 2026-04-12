import { mongooseConnect } from "@/lib/mongodb";
import Vendor from "@/models/Vendor";
import Product from "@/models/Product";
import { authMiddleware, isStaff } from "@/lib/auth-middleware";
import { isValidObjectId } from "mongoose";

async function createChildProductsForPacks(products) {
  const createdChildren = [];
  for (const vp of products) {
    if (vp.packType === "pack" && vp.product && vp.qtyPerPack > 1) {
      const parentProduct = await Product.findById(vp.product).lean();
      if (!parentProduct) continue;
      const existingChild = await Product.findOne({
        parentProduct: parentProduct._id,
        qtyPerPack: vp.qtyPerPack,
        isChildProduct: true,
      }).lean();
      if (existingChild) {
        createdChildren.push(existingChild);
        continue;
      }
      const childCostPrice = (vp.price || parentProduct.costPrice) * vp.qtyPerPack;
      const child = await Product.create({
        name: `${parentProduct.name} (Pack of ${vp.qtyPerPack})`,
        description: `Pack of ${vp.qtyPerPack} - ${parentProduct.name}`,
        costPrice: childCostPrice,
        taxRate: parentProduct.taxRate || 0,
        salePriceIncTax: 0,
        category: parentProduct.category,
        isStockManaged: parentProduct.isStockManaged,
        isChildProduct: true,
        parentProduct: parentProduct._id,
        packType: "pack",
        qtyPerPack: vp.qtyPerPack,
      });
      createdChildren.push(child);
    }
  }
  return createdChildren;
}

export default async function handler(req, res) {
  const authError = authMiddleware(req, res);
  if (authError) return authError;
  if (!isStaff(req)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  const { id } = req.query;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid vendor ID" });
  }

  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const vendor = await Vendor.findById(id).lean();
      if (!vendor) return res.status(404).json({ error: "Vendor not found" });
      return res.status(200).json({ success: true, vendor });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "PUT") {
    try {
      // Auto-create child products for any new pack items
      if (Array.isArray(req.body.products)) {
        await createChildProductsForPacks(req.body.products);
      }
      const vendor = await Vendor.findByIdAndUpdate(id, req.body, { new: true });
      if (!vendor) return res.status(404).json({ error: "Vendor not found" });
      return res.status(200).json({ success: true, vendor });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const vendor = await Vendor.findByIdAndDelete(id);
      if (!vendor) return res.status(404).json({ error: "Vendor not found" });
      return res.status(200).json({ success: true, message: "Vendor deleted" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
