/**
 * Shared date filter utility for consistent time range filtering across all pages
 */

export function isInTimeRange(txDate, timeRange) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const txN = new Date(txDate);
  txN.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - txN) / 86400000);

  switch (timeRange) {
    case "today":
      return diff === 0;
    case "yesterday":
      return diff === 1;
    case "thisWeek": {
      const d = today.getDay();
      const ws = new Date(today);
      ws.setDate(today.getDate() - (d === 0 ? 6 : d - 1));
      return txN >= ws;
    }
    case "thisMonth":
      return txN >= new Date(today.getFullYear(), today.getMonth(), 1);
    case "lastWeek": {
      const d = today.getDay();
      const lws = new Date(today);
      lws.setDate(today.getDate() - (d === 0 ? 6 : d - 1) - 7);
      const lwe = new Date(lws);
      lwe.setDate(lws.getDate() + 6);
      return txN >= lws && txN <= lwe;
    }
    case "lastMonth":
      return (
        txN >= new Date(today.getFullYear(), today.getMonth() - 1, 1) &&
        txN <= new Date(today.getFullYear(), today.getMonth(), 0)
      );
    case "thisYear":
      return txN >= new Date(today.getFullYear(), 0, 1);
    case "lastYear":
      return (
        txN >= new Date(today.getFullYear() - 1, 0, 1) &&
        txN <= new Date(today.getFullYear() - 1, 11, 31)
      );
    default: {
      const daysMap = {
        last7: 7,
        last14: 14,
        last30: 30,
        last60: 60,
        last90: 90,
        last365: 365,
      };
      return diff <= (daysMap[timeRange] || 30);
    }
  }
}

/**
 * Check if a date falls within a custom date range
 */
export function isInDateRange(txDate, startDate, endDate) {
  const tx = new Date(txDate);
  tx.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return tx >= start && tx <= end;
}
