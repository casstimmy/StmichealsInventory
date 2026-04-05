import { mongooseConnect } from "@/lib/mongodb";
import Vendor from "@/models/Vendor";
import { authMiddleware, isStaff } from "@/lib/auth-middleware";
import { isValidObjectId } from "mongoose";

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
