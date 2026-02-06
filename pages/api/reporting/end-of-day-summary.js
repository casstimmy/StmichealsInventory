import { mongooseConnect } from "@/lib/mongodb";
import EndOfDayReport from "@/models/EndOfDayReport";
import { buildLocationCache, resolveLocationName } from "@/lib/serverLocationHelper";

/**
 * GET /api/reporting/end-of-day-summary
 * Get end-of-day analytics - SIMPLIFIED DIRECT DB QUERIES
 * 
 * Query params:
 * - period: "day" | "week" | "month" | "year"
 * - locationId: (optional) specific location
 * - storeId: (optional) specific store
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await mongooseConnect();
    console.log("✅ MongoDB Connected");

    const { period = "month", locationId, storeId } = req.query;

    // Build filter
    const filter = {};
    if (storeId) filter.storeId = storeId;
    if (locationId) filter.locationId = locationId;

    // Calculate date range
    const now = new Date();
    let dateGte = new Date();
    let dateLte = null; // For yesterday filter

    if (period === "today") {
      dateGte.setHours(0, 0, 0, 0);
    } else if (period === "yesterday") {
      dateGte.setDate(dateGte.getDate() - 1);
      dateGte.setHours(0, 0, 0, 0);
      dateLte = new Date();
      dateLte.setDate(dateLte.getDate() - 1);
      dateLte.setHours(23, 59, 59, 999);
    } else if (period === "day") {
      dateGte.setDate(dateGte.getDate() - 1);
    } else if (period === "week") {
      dateGte.setDate(dateGte.getDate() - 7);
    } else if (period === "thisWeek") {
      const dayOfWeek = dateGte.getDay();
      const diff = dateGte.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      dateGte.setDate(diff);
      dateGte.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      dateGte.setMonth(dateGte.getMonth() - 1);
    } else if (period === "thisMonth") {
      dateGte.setDate(1);
      dateGte.setHours(0, 0, 0, 0);
    } else if (period === "year") {
      dateGte.setFullYear(dateGte.getFullYear() - 1);
    } else if (period === "thisYear") {
      dateGte.setMonth(0);
      dateGte.setDate(1);
      dateGte.setHours(0, 0, 0, 0);
    }

    filter.closedAt = dateLte ? { $gte: dateGte, $lte: dateLte } : { $gte: dateGte };

    console.log("📊 Filter:", JSON.stringify(filter, null, 2));
    console.log("📅 Date Range:", { from: dateGte, to: dateLte || now });

    // DIRECT QUERY - Simple find without complex population
    const reports = await EndOfDayReport.find(filter)
      .sort({ closedAt: -1 })
      .lean();

    console.log(`📋 Found ${reports.length} EOD reports`);

    if (reports.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          period,
          totals: {
            reports: 0,
            sales: 0,
            transactions: 0,
            variance: 0,
            averageVariancePercentage: 0,
          },
          status: { reconciled: 0, varianceNoted: 0 },
          byLocation: [],
          byStaff: [],
          tenderBreakdown: {},
          dailyData: [],
        },
        reports: [],
      });
    }

    // Build location cache ONCE using centralized helper
    const locationCache = await buildLocationCache();
    console.log(`✅ Location cache built with ${Object.keys(locationCache).length} entries`);

    // Enrich reports with location names using centralized helper
    const enrichedReports = reports.map(report => {
      const locationName = resolveLocationName(report.locationId, locationCache);
      
      return {
        ...report,
        locationName: locationName,
      };
    });

    console.log(`✅ Enriched ${enrichedReports.length} reports with location names`);

    // Calculate summary statistics
    const totalSales = enrichedReports.reduce((sum, r) => sum + (r.totalSales || 0), 0);
    const totalTransactions = enrichedReports.reduce((sum, r) => sum + (r.transactionCount || 0), 0);
    const totalVariance = enrichedReports.reduce((sum, r) => sum + (r.variance || 0), 0);
    const reconciled = enrichedReports.filter((r) => r.status === "RECONCILED").length;
    const varianceNoted = enrichedReports.filter((r) => r.status === "VARIANCE_NOTED").length;

    // Group by location
    const byLocation = {};
    enrichedReports.forEach((report) => {
      const locName = report.locationName || "Unknown";
      if (!byLocation[locName]) {
        byLocation[locName] = {
          location: locName,
          reports: 0,
          totalSales: 0,
          transactions: 0,
          variance: 0,
        };
      }
      byLocation[locName].reports += 1;
      byLocation[locName].totalSales += report.totalSales || 0;
      byLocation[locName].transactions += report.transactionCount || 0;
      byLocation[locName].variance += report.variance || 0;
    });

    // Group by staff
    const byStaff = {};
    enrichedReports.forEach((report) => {
      const staffName = report.staffName || "Unknown";
      if (!byStaff[staffName]) {
        byStaff[staffName] = {
          staff: staffName,
          reports: 0,
          totalSales: 0,
          transactions: 0,
          variance: 0,
        };
      }
      byStaff[staffName].reports += 1;
      byStaff[staffName].totalSales += report.totalSales || 0;
      byStaff[staffName].transactions += report.transactionCount || 0;
      byStaff[staffName].variance += report.variance || 0;
    });

    // Build tender breakdown
    const tenderSummary = {};
    enrichedReports.forEach((report) => {
      if (report.tenderBreakdown && typeof report.tenderBreakdown === "object") {
        Object.entries(report.tenderBreakdown).forEach(([tender, amount]) => {
          tenderSummary[tender] = (tenderSummary[tender] || 0) + amount;
        });
      }
    });

    // Aggregate by date
    const byDate = {};
    enrichedReports.forEach((report) => {
      const dateKey = new Date(report.closedAt).toISOString().split("T")[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = {
          date: dateKey,
          reports: 0,
          sales: 0,
          transactions: 0,
          variance: 0,
          reconciled: 0,
          varianceNoted: 0,
        };
      }
      byDate[dateKey].reports += 1;
      byDate[dateKey].sales += report.totalSales || 0;
      byDate[dateKey].transactions += report.transactionCount || 0;
      byDate[dateKey].variance += report.variance || 0;
      if (report.status === "RECONCILED") byDate[dateKey].reconciled += 1;
      if (report.status === "VARIANCE_NOTED") byDate[dateKey].varianceNoted += 1;
    });

    const dailyData = Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date));

    const summary = {
      period,
      dateRange: {
        from: dateGte,
        to: now,
      },
      totals: {
        reports: enrichedReports.length,
        sales: totalSales,
        transactions: totalTransactions,
        variance: totalVariance,
        averageVariancePercentage:
          enrichedReports.length > 0
            ? (
                enrichedReports.reduce((sum, r) => sum + (r.variancePercentage || 0), 0) /
                enrichedReports.length
              ).toFixed(2)
            : 0,
      },
      status: {
        reconciled,
        varianceNoted,
      },
      byLocation: Object.values(byLocation),
      byStaff: Object.values(byStaff),
      tenderBreakdown: tenderSummary,
      dailyData,
    };

    console.log(`✅ Generated summary with ${enrichedReports.length} reports`);

    return res.status(200).json({
      success: true,
      summary,
      reports: enrichedReports,
    });
  } catch (error) {
    console.error("❌ Error fetching EOD summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch end-of-day summary",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
