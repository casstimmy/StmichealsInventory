// pages/api/stock-take/[id].js
import { mongooseConnect } from "@/lib/mongodb";
import StockTake from "@/models/StockTake";
import Product from "@/models/Product";
import { authMiddleware, isStaff } from "@/lib/auth-middleware";
import { isValidObjectId } from "mongoose";

export default async function handler(req, res) {
  const authError = authMiddleware(req, res);
  if (authError) return authError;
  if (!isStaff(req)) {
    return res.status(403).json({ success: false, message: "Insufficient permissions" });
  }

  const { id } = req.query;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid stock take ID" });
  }

  await mongooseConnect();

  /* ========== GET — Single stock take (with items) ========== */
  if (req.method === "GET") {
    try {
      const stockTake = await StockTake.findById(id).lean();
      if (!stockTake) return res.status(404).json({ success: false, message: "Stock take not found" });
      return res.status(200).json({ success: true, stockTake });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /* ========== PUT — Update stock take ========== */
  if (req.method === "PUT") {
    try {
      const stockTake = await StockTake.findById(id);
      if (!stockTake) return res.status(404).json({ success: false, message: "Stock take not found" });

      const { action, items, approvedBy } = req.body;

      // Action: start counting
      if (action === "start") {
        if (stockTake.status !== "draft") {
          return res.status(400).json({ success: false, message: "Can only start a draft stock take" });
        }
        stockTake.status = "in-progress";
        stockTake.startedAt = new Date();
        await stockTake.save();
        return res.status(200).json({ success: true, message: "Stock take started" });
      }

      // Action: update counted quantities
      if (action === "update-counts") {
        if (!["draft", "in-progress"].includes(stockTake.status)) {
          return res.status(400).json({ success: false, message: "Cannot update counts in current status" });
        }
        if (stockTake.status === "draft") {
          stockTake.status = "in-progress";
          stockTake.startedAt = stockTake.startedAt || new Date();
        }

        if (Array.isArray(items)) {
          for (const update of items) {
            const item = stockTake.items.id(update._id);
            if (!item) continue;
            if (update.countedQty !== undefined && update.countedQty !== null) {
              item.countedQty = Number(update.countedQty);
              item.variance = item.countedQty - item.systemQty;
              item.varianceValue = item.variance * item.costPrice;
              item.status = "counted";
              item.countedAt = new Date();
              item.countedBy = update.countedBy || req.user?.name || "";
            }
            if (update.notes !== undefined) item.notes = update.notes;
          }
        }

        // Recalculate summary
        recalcSummary(stockTake);
        await stockTake.save();
        return res.status(200).json({ success: true, message: "Counts updated", stockTake: stockTake.toObject() });
      }

      // Action: complete (finalize)
      if (action === "complete") {
        if (stockTake.status !== "in-progress") {
          return res.status(400).json({ success: false, message: "Can only complete an in-progress stock take" });
        }
        recalcSummary(stockTake);
        stockTake.status = "completed";
        stockTake.completedAt = new Date();
        await stockTake.save();
        return res.status(200).json({ success: true, message: "Stock take completed" });
      }

      // Action: approve & apply adjustments
      if (action === "approve") {
        if (stockTake.status !== "completed") {
          return res.status(400).json({ success: false, message: "Can only approve a completed stock take" });
        }
        stockTake.status = "approved";
        stockTake.approvedBy = approvedBy || req.user?.name || "";
        stockTake.approvedAt = new Date();
        await stockTake.save();
        return res.status(200).json({ success: true, message: "Stock take approved" });
      }

      // Action: apply inventory adjustments
      if (action === "apply-adjustments") {
        if (stockTake.status !== "approved") {
          return res.status(400).json({ success: false, message: "Stock take must be approved before applying adjustments" });
        }
        if (stockTake.adjustmentApplied) {
          return res.status(400).json({ success: false, message: "Adjustments already applied" });
        }

        const bulkOps = [];
        for (const item of stockTake.items) {
          if (item.status === "counted" && item.countedQty !== null && item.variance !== 0) {
            bulkOps.push({
              updateOne: {
                filter: { _id: item.productId },
                update: { $set: { quantity: item.countedQty } },
              },
            });
          }
        }

        if (bulkOps.length > 0) {
          await Product.bulkWrite(bulkOps);
        }

        stockTake.adjustmentApplied = true;
        stockTake.adjustedAt = new Date();
        await stockTake.save();

        return res.status(200).json({
          success: true,
          message: `Adjustments applied to ${bulkOps.length} product(s)`,
          adjustedCount: bulkOps.length,
        });
      }

      // Action: cancel
      if (action === "cancel") {
        if (["approved"].includes(stockTake.status) && stockTake.adjustmentApplied) {
          return res.status(400).json({ success: false, message: "Cannot cancel after adjustments are applied" });
        }
        stockTake.status = "cancelled";
        await stockTake.save();
        return res.status(200).json({ success: true, message: "Stock take cancelled" });
      }

      return res.status(400).json({ success: false, message: "Unknown action" });
    } catch (err) {
      console.error("Stock take PUT error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /* ========== DELETE ========== */
  if (req.method === "DELETE") {
    try {
      const stockTake = await StockTake.findById(id);
      if (!stockTake) return res.status(404).json({ success: false, message: "Stock take not found" });
      if (stockTake.adjustmentApplied) {
        return res.status(400).json({ success: false, message: "Cannot delete a stock take with applied adjustments" });
      }
      await StockTake.deleteOne({ _id: id });
      return res.status(200).json({ success: true, message: "Stock take deleted" });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

function recalcSummary(st) {
  const items = st.items || [];
  st.totalItems = items.length;
  st.countedItems = items.filter((i) => i.status === "counted").length;
  st.totalSystemQty = items.reduce((s, i) => s + (i.systemQty || 0), 0);
  st.totalCountedQty = items.filter((i) => i.countedQty !== null).reduce((s, i) => s + i.countedQty, 0);
  st.totalVariance = items.filter((i) => i.countedQty !== null).reduce((s, i) => s + i.variance, 0);
  st.totalVarianceValue = items.filter((i) => i.countedQty !== null).reduce((s, i) => s + i.varianceValue, 0);
  st.positiveVariance = items.filter((i) => i.variance > 0).reduce((s, i) => s + i.variance, 0);
  st.negativeVariance = items.filter((i) => i.variance < 0).reduce((s, i) => s + Math.abs(i.variance), 0);
  st.accuracyRate = st.totalItems > 0 ? Math.round((items.filter((i) => i.countedQty !== null && i.variance === 0).length / st.totalItems) * 100) : 0;
}
