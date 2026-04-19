import { mongooseConnect } from "@/lib/mongodb";
import Vendor from "@/models/Vendor";
import Product from "@/models/Product";
import { authMiddleware, isStaff } from "@/lib/auth-middleware";

async function createChildProductsForPacks(products) {
  const createdChildren = [];
  for (const vp of products) {
    if (vp.packType === "pack" && vp.product && vp.qtyPerPack > 1) {
      const parentProduct = await Product.findById(vp.product).lean();
      if (!parentProduct) continue;
      // Check if child already exists for this parent with same qtyPerPack
      const existingChild = await Product.findOne({
        parentProduct: parentProduct._id,
        qtyPerPack: vp.qtyPerPack,
        isChildProduct: true,
      }).lean();
      if (existingChild) {
        createdChildren.push(existingChild);
        continue;
      }
      // Cost price = parent cost * qty per pack
      const childCostPrice = (vp.price || parentProduct.costPrice) * vp.qtyPerPack;
      const child = await Product.create({
        name: `${parentProduct.name} (Pack of ${vp.qtyPerPack})`,
        description: `Pack of ${vp.qtyPerPack} - ${parentProduct.name}`,
        costPrice: childCostPrice,
        taxRate: parentProduct.taxRate || 0,
        salePriceIncTax: 0, // to be set manually
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

  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const { active } = req.query;
      const filter = {};
      if (active === "true") filter.isActive = true;
      const vendors = await Vendor.find(filter).populate("products.product", "name costPrice salePriceIncTax packType qtyPerPack barcode").sort({ companyName: 1 }).lean();
      return res.status(200).json({ success: true, vendors });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const { companyName, vendorRep, repPhone, email, address, mainProduct, bankName, accountName, accountNumber, products } = req.body;

      if (!companyName) {
        return res.status(400).json({ error: "Company name is required" });
      }

      // Auto-create child products for pack items
      const safeProducts = Array.isArray(products) ? products : [];
      const createdChildren = await createChildProductsForPacks(safeProducts);

      const vendor = await Vendor.create({
        companyName,
        vendorRep: vendorRep || "",
        repPhone: repPhone || "",
        email: email || "",
        address: address || "",
        mainProduct: mainProduct || "",
        bankName: bankName || "",
        accountName: accountName || "",
        accountNumber: accountNumber || "",
        products: safeProducts,
      });

      return res.status(201).json({ success: true, vendor, createdChildren });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
