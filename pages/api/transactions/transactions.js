import mongoose from "mongoose";
import Transaction from "@/models/Transactions";
import Staff from "@/models/Staff";
import Store from "@/models/Store";
import { mongooseConnect } from "@/lib/mongodb";

async function connectDB() {
  await mongooseConnect();
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    return handlePOST(req, res);
  } else if (req.method === "GET") {
    return handleGET(req, res);
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}

async function handlePOST(req, res) {
  try {
    await connectDB();

    const { items, total, staffId, staffName, location, device, tenders, tenderType, discount, tax, subtotal, amountPaid, change } = req.body;

    // Normalize items: POS sends {price, quantity} but model expects {salePriceIncTax, qty}
    const normalizedItems = (items || []).map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price, // Keep original for reference
      quantity: item.quantity, // Keep original for reference
      salePriceIncTax: item.price, // Normalize for reports
      qty: item.quantity, // Normalize for reports
    }));

    const transaction = await Transaction.create({
      items: normalizedItems,
      total: total || 0,
      subtotal: subtotal || 0,
      tax: tax || 0,
      discount: discount || 0,
      amountPaid: amountPaid || 0,
      change: change || 0,
      tenderType: tenderType || "CASH",
      staff: staffId || null,
      location: location || "Default Location",
      device: device || "POS",
      tableName: null,
      transactionType: "pos",
      status: "completed",
      discountReason: "",
      customerName: null,
    });

    console.log("✅ Transaction saved:", transaction._id);
    return res.status(201).json({ 
      success: true, 
      message: "Transaction saved", 
      transaction 
    });
  } catch (err) {
    console.error("Transaction POST API error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to save transaction",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
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

    // Location is now stored as string, no need to map ObjectIds
    const enrichedTransactions = transactions.map((tx) => ({
      ...tx,
      location: tx.location || "online",
    }));

    /* ---------- KPIs ---------- */
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

    /* ---------- Top Products ---------- */
    const productSalesMap = {};
    enrichedTransactions.forEach((tx) => {
      if (!tx.items || !Array.isArray(tx.items)) return;
      tx.items.forEach((item) => {
        if (!item || !item.name) return;
        if (!productSalesMap[item.name]) {
          productSalesMap[item.name] = { qty: 0, total: 0 };
        }
        // Use salePriceIncTax or price, fall back to 0
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

    /* ---------- Sales by Staff ---------- */
    const byStaff = {};
    enrichedTransactions.forEach((tx) => {
      const staff = tx.staff?.name || "Unknown";
      byStaff[staff] = (byStaff[staff] || 0) + (tx.total || 0);
    });

    /* ---------- Sales by Location ---------- */
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
      byLocation: Object.entries(byLocation).map(([location, total]) => ({
        location,
        total,
      })),
    });
  } catch (err) {
    console.error("Transaction GET API error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
}

