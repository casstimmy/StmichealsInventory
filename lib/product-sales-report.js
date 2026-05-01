function toSafeNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeProductId(productId) {
  if (typeof productId === "string" && productId.trim()) {
    return productId.trim();
  }

  if (productId && typeof productId.toString === "function") {
    const stringValue = productId.toString().trim();
    return stringValue || null;
  }

  return null;
}

function getItemIdentity(item = {}) {
  const productId = normalizeProductId(item.productId);
  if (productId) {
    return { key: `product:${productId}`, productId };
  }

  const normalizedName = String(item.name || "").trim().toLowerCase();
  if (normalizedName) {
    return { key: `name:${normalizedName}`, productId: null };
  }

  return { key: null, productId: null };
}

export function aggregateProductSales(transactions = []) {
  const productMap = new Map();

  (Array.isArray(transactions) ? transactions : []).forEach((transaction) => {
    (Array.isArray(transaction?.items) ? transaction.items : []).forEach((item) => {
      const { key, productId } = getItemIdentity(item);
      if (!key) return;

      const qty = toSafeNumber(item?.qty ?? item?.quantity, 0);
      if (qty <= 0) return;

      const unitPrice = toSafeNumber(item?.salePriceIncTax ?? item?.price, 0);
      const nextName = String(item?.name || "").trim() || "Unknown";
      const existing = productMap.get(key);

      if (existing) {
        existing.unitsSold += qty;
        existing.totalSales += unitPrice * qty;

        if ((!existing.name || existing.name === "Unknown") && nextName) {
          existing.name = nextName;
        }

        if (!existing.productId && productId) {
          existing.productId = productId;
        }

        return;
      }

      productMap.set(key, {
        key,
        productId,
        name: nextName,
        unitsSold: qty,
        totalSales: unitPrice * qty,
      });
    });
  });

  return Array.from(productMap.values()).sort((a, b) => b.totalSales - a.totalSales);
}