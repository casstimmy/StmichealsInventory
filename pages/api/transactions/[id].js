import { mongooseConnect } from "@/lib/mongoose";
import { Transaction } from "@/models/Transactions";

export default async function handler(req, res) {
  await mongooseConnect();

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Transaction ID is required" });
  }

  if (req.method === "PUT") {
    try {
      const { status, refundReason } = req.body;

      // Validate the status
      const validStatuses = ["held", "completed", "refunded"];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (refundReason) updateData.refundReason = refundReason;

      // If marking as refunded, set refundedAt timestamp
      if (status === "refunded") {
        updateData.refundedAt = new Date();
      }

      const transaction = await Transaction.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      return res.status(200).json({ success: true, transaction });
    } catch (err) {
      console.error("Error updating transaction:", err);
      return res.status(500).json({ error: "Failed to update transaction" });
    }
  }

  if (req.method === "GET") {
    try {
      const transaction = await Transaction.findById(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      return res.status(200).json(transaction);
    } catch (err) {
      console.error("Error fetching transaction:", err);
      return res.status(500).json({ error: "Failed to fetch transaction" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
