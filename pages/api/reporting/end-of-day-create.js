import { mongooseConnect } from "@/lib/mongodb";
import EndOfDayReport from "@/models/EndOfDayReport";
import Transaction from "@/models/Transactions";
import Store from "@/models/Store";

/**
 * POST /api/reporting/end-of-day
 * Create or close an end-of-day report
 * 
 * Request body:
 * {
 *   action: "create" | "close",
 *   storeId: string,
 *   locationId: string,
 *   staffId: string,
 *   staffName: string,
 *   openingBalance: number (for create action),
 *   physicalCount: number (for close action),
 *   closingNotes: string,
 *   closedBy: string (staff ID of manager closing)
 * }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    const {
      action,
      storeId,
      locationId,
      staffId,
      staffName,
      openingBalance,
      physicalCount,
      closingNotes,
      closedBy,
    } = req.body;

    if (!action || !storeId || !locationId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: action, storeId, locationId",
      });
    }

    if (action === "create") {
      // Create a new end-of-day report (till opening)
      console.log(`📊 Creating new EOD report for location ${locationId}`);

      if (!staffId || !staffName) {
        return res.status(400).json({
          success: false,
          message: "Staff ID and name required for opening till",
        });
      }

      if (openingBalance === undefined || openingBalance === null) {
        return res.status(400).json({
          success: false,
          message: "Opening balance required",
        });
      }

      const newReport = await EndOfDayReport.create({
        storeId,
        locationId,
        staffId,
        staffName,
        openingBalance,
        openedAt: new Date(),
        tenderBreakdown: new Map(),
      });

      console.log(`✅ EOD report created: ${newReport._id}`);

      return res.status(201).json({
        success: true,
        message: "Till opened successfully",
        report: newReport,
      });
    } else if (action === "close") {
      // Close an end-of-day report (till closing & reconciliation)
      console.log(`📊 Closing EOD report for location ${locationId}`);

      if (physicalCount === undefined || physicalCount === null) {
        return res.status(400).json({
          success: false,
          message: "Physical count required for closing till",
        });
      }

      // Find the open report for this location (today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const openReport = await EndOfDayReport.findOne({
        locationId,
        date: { $gte: today },
        closedAt: null, // Not yet closed
      });

      if (!openReport) {
        return res.status(404).json({
          success: false,
          message: "No open till found for this location today",
        });
      }

      // Fetch all transactions for this location from opening to now
      // Get the location name from the Store to match transaction location field
      const store = await Store.findById(storeId).select("locations").lean();
      let locationName = null;
      if (store && store.locations) {
        const location = store.locations.find(
          (loc) => loc._id.toString() === locationId.toString()
        );
        locationName = location?.name;
      }

      // Query transactions by location name (string) since that's how they're stored
      const transactions = await Transaction.find({
        $or: [
          { location: locationName }, // Match by location name (string)
          { location: locationId }, // Also try by location ID
        ],
        createdAt: { $gte: openReport.openedAt },
        status: "completed", // Only count completed transactions
      }).lean();

      console.log(`📊 Found ${transactions.length} transactions for ${locationName || locationId}`);
      transactions.forEach((tx) => {
        console.log(`   - ${tx.tenderType}: ₦${tx.total} on ${new Date(tx.createdAt).toLocaleString()}`);
      });

      // Calculate sales summary
      const totalSales = transactions.reduce((sum, tx) => sum + (tx.total || 0), 0);
      const transactionCount = transactions.length;

      // Build tender breakdown from transactions
      const tenderBreakdown = new Map();
      transactions.forEach((tx) => {
        const tender = tx.tenderType || "CASH";
        const current = tenderBreakdown.get(tender) || 0;
        tenderBreakdown.set(tender, current + (tx.amountPaid || tx.total || 0));
      });

      // Calculate expected balance
      const expectedClosingBalance = openReport.openingBalance + totalSales;

      // Calculate variance
      const variance = physicalCount - expectedClosingBalance;
      const variancePercentage =
        expectedClosingBalance > 0
          ? (variance / expectedClosingBalance) * 100
          : 0;

      // Determine status based on variance
      const status = Math.abs(variance) < 1 ? "RECONCILED" : "VARIANCE_NOTED";

      // Update the report
      const closedReport = await EndOfDayReport.findByIdAndUpdate(
        openReport._id,
        {
          closedAt: new Date(),
          closedBy,
          physicalCount,
          totalSales,
          transactionCount,
          tenderBreakdown,
          expectedClosingBalance,
          variance,
          variancePercentage,
          closingNotes,
          status,
          updatedAt: new Date(),
        },
        { new: true }
      ).populate("staffId", "name").populate("closedBy", "name");

      console.log(`✅ EOD report closed: ${closedReport._id}`);
      console.log(`📊 Summary - Sales: ${totalSales}, Variance: ${variance}, Status: ${status}`);

      return res.status(200).json({
        success: true,
        message: "Till closed successfully",
        report: closedReport,
        summary: {
          totalSales,
          transactionCount,
          expectedClosingBalance,
          physicalCount,
          variance,
          variancePercentage,
          status,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'create' or 'close'",
      });
    }
  } catch (error) {
    console.error("❌ Error in EOD API:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to process end-of-day",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
