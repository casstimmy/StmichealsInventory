import { mongooseConnect } from "@/lib/mongodb";
import Vendor from "@/models/Vendor";
import { authMiddleware, isStaff } from "@/lib/auth-middleware";

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
      const vendors = await Vendor.find(filter).sort({ companyName: 1 }).lean();
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
        products: products || [],
      });

      return res.status(201).json({ success: true, vendor });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
