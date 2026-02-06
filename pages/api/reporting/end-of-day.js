import { mongooseConnect } from "../../../lib/mongodb";
import EndOfDayReport from "../../../models/EndOfDayReport";
import { buildLocationCache, resolveLocationName } from "../../../lib/serverLocationHelper";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    const { locationId, storeId, startDate, endDate, limit = 50, page = 1 } = req.query;

    // Build filter
    const filter = {};
    
    if (storeId) {
      filter.storeId = storeId;
    }
    
    if (locationId) {
      filter.locationId = locationId;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    console.log("📊 Fetching EndOfDay reports with filter:", filter);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Don't populate locationId - keep it as ID and resolve name separately
    const reports = await EndOfDayReport.find(filter)
      .populate("storeId", "storeName")
      .populate("staffId", "name")
      .sort({ closedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Build location cache and resolve names
    const locationCache = await buildLocationCache();
    const enrichedReports = await Promise.all(
      reports.map(async (report) => ({
        ...report,
        locationId: String(report.locationId),
        locationName: await resolveLocationName(report.locationId, locationCache, report.storeId),
      }))
    );

    const total = await EndOfDayReport.countDocuments(filter);

    console.log(`📊 Found ${enrichedReports.length} EndOfDay reports`);

    return res.status(200).json({
      success: true,
      reports: enrichedReports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching EndOfDay reports:", error.message);
    return res.status(500).json({
      message: "Failed to fetch EndOfDay reports",
      error: error.message,
    });
  }
}
