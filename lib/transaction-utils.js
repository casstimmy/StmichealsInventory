import mongoose from "mongoose";
import Product from "@/models/Product";

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function normalizeItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const qty = toNumber(item?.qty ?? item?.quantity, 0);
      const salePriceIncTax = toNumber(
        item?.salePriceIncTax ?? item?.price,
        0
      );

      return {
        productId: item?.productId || item?._id || null,
        name: item?.name || "Unnamed item",
        price: salePriceIncTax,
        quantity: qty,
        salePriceIncTax,
        qty,
      };
    })
    .filter((item) => item.qty > 0);
}

export function normalizeTenderPayments(tenders) {
  if (!Array.isArray(tenders)) return [];

  return tenders
    .map((payment) => ({
      tenderType: String(
        payment?.tenderType || payment?.type || payment?.name || ""
      ).trim(),
      tenderName: String(payment?.tenderName || payment?.name || "").trim(),
      amount: toNumber(payment?.amount, 0),
    }))
    .filter((payment) => payment.amount > 0);
}

export function summarizeItems(items) {
  const byProduct = new Map();

  for (const item of items) {
    const productId =
      item?.productId?.toString?.() ||
      (typeof item?.productId === "string" ? item.productId : null);
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) continue;

    const existing = byProduct.get(productId) || { qty: 0, revenue: 0 };
    const qty = toNumber(item?.qty ?? item?.quantity, 0);
    const price = toNumber(item?.salePriceIncTax ?? item?.price, 0);

    existing.qty += qty;
    existing.revenue += qty * price;
    byProduct.set(productId, existing);
  }

  return byProduct;
}

export async function applyInventoryDelta(items, direction = "decrement") {
  const byProduct = summarizeItems(items);
  if (!byProduct.size) {
    return { matchedCount: 0, modifiedCount: 0 };
  }

  const multiplier = direction === "increment" ? 1 : -1;

  const operations = Array.from(byProduct.entries()).map(([productId, data]) => {
    const qtyDelta = data.qty * multiplier;
    const update = {
      $inc: {
        quantity: qtyDelta,
      },
      $set: {
        lastSoldAt: new Date(),
      },
    };

    if (direction === "decrement") {
      update.$inc.totalUnitsSold = data.qty;
      update.$inc.totalRevenue = data.revenue;
    } else {
      update.$inc.totalUnitsSold = -data.qty;
      update.$inc.totalRevenue = -data.revenue;
    }

    return {
      updateOne: {
        filter: { _id: productId, isStockManaged: { $ne: false } },
        update,
      },
    };
  });

  const result = await Product.bulkWrite(operations, { ordered: false });
  return {
    matchedCount: result.matchedCount || 0,
    modifiedCount: result.modifiedCount || 0,
  };
}

export function toSafeNumber(value, fallback = 0) {
  return toNumber(value, fallback);
}
