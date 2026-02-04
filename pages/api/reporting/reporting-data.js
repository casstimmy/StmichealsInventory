import { mongooseConnect } from "@/lib/mongodb";
import Transaction from "@/models/Transactions";
import Product from "@/models/Product";
import Store from "@/models/Store";
import {
  format,
  subDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachHourOfInterval,
} from "date-fns";

/* ---------------------------------------------
   SIMPLE IN-MEMORY CACHE
---------------------------------------------- */
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function getCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}

function setCache(key, data) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

/* ---------------------------------------------
   API HANDLER
---------------------------------------------- */
export default async function handler(req, res) {
  try {
    await mongooseConnect();

    const {
      location = "All",
      days = 30,
      period = "day",
    } = req.query;

    const cacheKey = JSON.stringify({ location, days, period });
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const now = new Date();
    let cutoffDate = subDays(now, Number(days));
    
    // For "Today" (days=0), set cutoff to start of today
    if (Number(days) === 0) {
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }
    // For "Yesterday" (days=1), set cutoff to start of yesterday and end before today
    else if (Number(days) === 1) {
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    }

    /* ---------------------------------------------
       PERIOD FORMAT
    ---------------------------------------------- */
    const periodConfig = {
      day: { fn: eachDayOfInterval, fmt: "yyyy-MM-dd" },
      week: { fn: eachWeekOfInterval, fmt: "yyyy-'W'II" },
      month: { fn: eachMonthOfInterval, fmt: "yyyy-MM" },
      hourly: { fn: eachHourOfInterval, fmt: "yyyy-MM-dd HH:00" },
    };

    const { fn, fmt } = periodConfig[period.toLowerCase()] || periodConfig.day;

    const periods = fn({ start: cutoffDate, end: now }).map((d) =>
      format(d, fmt)
    );

    /* ─────────────────────────────────────────
       QUERY TRANSACTIONS (LOCATIONS AS STRINGS)
       ───────────────────────────────────────── */

    /* ─────────────────────────────────────────
       QUERY TRANSACTIONS (LOCATIONS AS STRINGS)
       ───────────────────────────────────────── */
    // Locations are now stored as strings (location name or 'online')
    const queryFilter = {
      createdAt: { $gte: cutoffDate },
    };

    // Handle location filter - locations are strings now
    if (location !== "All") {
      queryFilter.location = location;
    }

    const transactions = await Transaction.find(queryFilter)
      .lean();

    /* ---------------------------------------------
       MAP STRUCTURES
    ---------------------------------------------- */
    const salesMap = {};
    const txMap = {};
    const salesByLocation = {};
    const salesByTender = {};
    const productSales = {};

    let totalSales = 0;
    let totalTransactions = 0;

    /* ---------------------------------------------
       PROCESS TRANSACTIONS
    ---------------------------------------------- */
    for (const tx of transactions) {
      const key = format(new Date(tx.createdAt), fmt);

      salesMap[key] = (salesMap[key] || 0) + (tx.total || 0);
      txMap[key] = (txMap[key] || 0) + 1;

      // Handle location - location is now stored as a string (name)
      if (tx.location) {
        const locationName = typeof tx.location === 'string' ? tx.location : tx.location.toString();
        salesByLocation[locationName] =
          (salesByLocation[locationName] || 0) + tx.total;
      } else {
        // Online transactions (no location)
        salesByLocation["online"] = (salesByLocation["online"] || 0) + tx.total;
      }

      // Handle tenders - support both split payments (new) and single tender (legacy)
      if (tx.tenderPayments && tx.tenderPayments.length > 0) {
        // New split payment format
        tx.tenderPayments.forEach((payment) => {
          const tenderName = payment.tenderName || "Unknown";
          salesByTender[tenderName] = (salesByTender[tenderName] || 0) + (payment.amount || 0);
        });
      } else if (tx.tenderType) {
        // Legacy single tender format
        salesByTender[tx.tenderType] =
          (salesByTender[tx.tenderType] || 0) + tx.total;
      }

      tx.items?.forEach((item) => {
        if (!item.name) return;
        productSales[item.name] =
          (productSales[item.name] || 0) + (item.qty || 0);
      });

      totalSales += tx.total || 0;
      totalTransactions += 1;
    }

    /* ---------------------------------------------
       NORMALIZED TIME SERIES
    ---------------------------------------------- */
    const salesData = periods.map((p) => salesMap[p] || 0);
    const transactionQty = periods.map((p) => txMap[p] || 0);

    /* ---------------------------------------------
       BEST SELLING PRODUCTS
    ---------------------------------------------- */
    const bestSellingProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    /* ---------------------------------------------
       LOW STOCK COUNT
    ---------------------------------------------- */
    const lowStockItems = await Product.countDocuments({ stock: { $lte: 10 } });

    const response = {
      dates: periods,
      salesData,
      transactionQty,
      salesByLocation,
      salesByTender,
      bestSellingProducts,
      summary: {
        totalSales,
        totalTransactions,
        averageTransaction:
          totalTransactions > 0
            ? Number((totalSales / totalTransactions).toFixed(2))
            : 0,
        lowStockItems,
        grossMargin: totalSales * 0.35, // Assume 35% gross margin
        operatingMargin: ((totalSales * 0.35) - (totalSales * 0.15)) / totalSales * 100, // 35% gross - 15% operating expenses
      },
    };

    setCache(cacheKey, response);
    return res.json(response);
  } catch (error) {
    console.error("REPORTING API ERROR:", error);
    return res.status(500).json({
      error: "Failed to load reporting data",
    });
  }
}

