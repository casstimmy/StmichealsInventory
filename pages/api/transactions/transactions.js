import Transaction from "@/models/Transactions";
import { mongooseConnect } from "@/lib/mongodb";
import { authMiddleware, isStaff } from "@/lib/auth-middleware";
import {
  normalizeItems,
  normalizeTenderPayments,
  applyInventoryDelta,
  toSafeNumber,
} from "@/lib/transaction-utils";

async function connectDB() {
  await mongooseConnect();
}

export default async function handler(req, res) {
  const authError = authMiddleware(req, res);
  if (authError) return authError;

  if (req.method === "POST") {
    if (!isStaff(req)) {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient permissions" });
    }
    return handlePOST(req, res);
  }

  if (req.method === "GET") {
    return handleGET(req, res);
  }

  return res.status(405).json({ message: "Method not allowed" });
}

async function handlePOST(req, res) {
  try {
    await connectDB();

    const {
      items,
      total,
      staffId,
      staffName,
      location,
      device,
      tenders,
      tenderPayments: requestTenderPayments,
      tenderType,
      discount,
      tax,
      subtotal,
      amountPaid,
      change,
      status: requestStatus,
      externalId: requestExternalId,
      dedupeKey: requestDedupeKey,
      createdAt,
    } = req.body || {};

    const normalizedItems = normalizeItems(items);
    if (!normalizedItems.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction: at least one item is required",
      });
    }

    const normalizedTenderPayments = normalizeTenderPayments(
      requestTenderPayments || tenders
    );
    const tenderPaymentsTotal = normalizedTenderPayments.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );

    const safeTotal = toSafeNumber(total, 0);
    const safeSubtotal = toSafeNumber(subtotal, safeTotal);
    const safeTax = toSafeNumber(tax, 0);
    const safeDiscount = toSafeNumber(discount, 0);
    const safeAmountPaid = toSafeNumber(
      amountPaid,
      tenderPaymentsTotal > 0 ? tenderPaymentsTotal : safeTotal
    );
    const safeChange = toSafeNumber(change, Math.max(safeAmountPaid - safeTotal, 0));

    const status =
      requestStatus && ["held", "completed", "refunded"].includes(requestStatus)
        ? requestStatus
        : "completed";

    const primaryTender =
      tenderType ||
      normalizedTenderPayments[0]?.tenderName ||
      normalizedTenderPayments[0]?.tenderType ||
      "CASH";

    const parsedCreatedAt = createdAt ? new Date(createdAt) : new Date();
    const safeCreatedAt = Number.isNaN(parsedCreatedAt.getTime())
      ? new Date()
      : parsedCreatedAt;

    const safeStaffId =
      typeof staffId === "string" && /^[a-fA-F0-9]{24}$/.test(staffId)
        ? staffId
        : null;

    const normalizedLocation = String(
      location || req.user?.location || "Default Location"
    ).trim();
    const normalizedStaffName = String(
      staffName || req.user?.name || "Unknown"
    ).trim();

    const externalId = requestExternalId
      ? String(requestExternalId).trim()
      : null;
    const dedupeKey = requestDedupeKey
      ? String(requestDedupeKey).trim()
      : externalId;

    const transactionPayload = {
      items: normalizedItems,
      total: safeTotal,
      subtotal: safeSubtotal,
      tax: safeTax,
      discount: safeDiscount,
      amountPaid: safeAmountPaid,
      change: safeChange,
      tenderType: primaryTender,
      tenderPayments: normalizedTenderPayments,
      staff: safeStaffId,
      staffName: normalizedStaffName,
      location: normalizedLocation,
      device: device || "POS",
      tableName: null,
      transactionType: "pos",
      status,
      discountReason: "",
      customerName: null,
      createdAt: safeCreatedAt,
      externalId: externalId || undefined,
      dedupeKey: dedupeKey || undefined,
    };

    let transaction;
    try {
      transaction = await Transaction.create(transactionPayload);
    } catch (error) {
      const isDuplicateInsert =
        error?.code === 11000 &&
        (error?.keyPattern?.externalId || error?.keyPattern?.dedupeKey);

      if (!isDuplicateInsert) throw error;

      const existing = await Transaction.findOne({
        $or: [
          externalId ? { externalId } : null,
          dedupeKey ? { dedupeKey } : null,
        ].filter(Boolean),
      }).lean();

      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "Transaction already synced",
        transaction: existing || null,
      });
    }

    if (status === "completed") {
      await applyInventoryDelta(normalizedItems, "decrement");
      transaction.inventoryUpdated = true;
      await transaction.save();
    }

    return res.status(201).json({
      success: true,
      message: "Transaction saved",
      transaction,
    });
  } catch (err) {
    console.error("Transaction POST API error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to save transaction",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}

async function handleGET(req, res) {
  try {
    await connectDB();

    const transactions = await Transaction.find()
      .populate("staff", "name")
      .sort({ createdAt: -1 })
      .lean();

    const enrichedTransactions = transactions.map((tx) => ({
      ...tx,
      location: tx.location || "online",
    }));

    const totalSales = enrichedTransactions.reduce(
      (sum, tx) => sum + (tx.total || 0),
      0
    );

    const totalTransactions = enrichedTransactions.length;

    const summary = {
      totalSales,
      totalTransactions,
      averageTransactionValue:
        totalTransactions > 0 ? totalSales / totalTransactions : 0,
    };

    const productSalesMap = {};
    enrichedTransactions.forEach((tx) => {
      if (!tx.items || !Array.isArray(tx.items)) return;
      tx.items.forEach((item) => {
        if (!item || !item.name) return;
        if (!productSalesMap[item.name]) {
          productSalesMap[item.name] = { qty: 0, total: 0 };
        }
        const price = item.salePriceIncTax || item.price || 0;
        const qty = item.qty || item.quantity || 0;
        productSalesMap[item.name].qty += qty;
        productSalesMap[item.name].total += qty * price;
      });
    });

    const topProducts = Object.entries(productSalesMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const byStaff = {};
    enrichedTransactions.forEach((tx) => {
      const staff = tx.staff?.name || tx.staffName || "Unknown";
      byStaff[staff] = (byStaff[staff] || 0) + (tx.total || 0);
    });

    const byLocation = {};
    enrichedTransactions.forEach((tx) => {
      const loc = tx.location || "Unknown";
      byLocation[loc] = (byLocation[loc] || 0) + (tx.total || 0);
    });

    return res.status(200).json({
      success: true,
      transactions: enrichedTransactions,
      summary,
      topProducts,
      byStaff: Object.entries(byStaff).map(([staff, total]) => ({
        staff,
        total,
      })),
      byLocation: Object.entries(byLocation).map(([locationName, total]) => ({
        location: locationName,
        total,
      })),
    });
  } catch (err) {
    console.error("Transaction GET API error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}
