import { mongooseConnect } from '../../../lib/mongodb';
import EndOfDayReport from '../../../models/EndOfDayReport';
import { buildLocationCache, resolveLocationName } from '../../../lib/serverLocationHelper';


export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await mongooseConnect();
    const { reportId } = req.query;

    if (!reportId) {
      return res.status(400).json({ message: "Report ID is required" });
    }

    console.log("📊 Fetching EndOfDay report:", reportId);

    const report = await EndOfDayReport.findById(reportId)
      .populate("storeId", "storeName")
      .populate("staffId", "name")
      .populate("tillId")
      .lean();

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Resolve location name from ID
    const locationCache = await buildLocationCache();
    const locationName = await resolveLocationName(report.locationId, locationCache, report.storeId);

    console.log("✅ Report fetched successfully");

    return res.status(200).json({
      success: true,
      report: {
        ...report,
        locationId: String(report.locationId), // Ensure it's a string
        locationName: locationName, // Add resolved location name
      },
    });
  } catch (error) {
    console.error("❌ Error fetching EndOfDay report:", error.message);
    return res.status(500).json({
      message: "Failed to fetch EndOfDay report",
      error: error.message,
    });
  }
}
