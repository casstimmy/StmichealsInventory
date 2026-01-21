// Mock tender assignments storage
let tenderAssignments = {
  "1": {
    "1": 3,
    "2": 3,
    "3": 3,
    "4": 3,
    "5": 3,
  },
  "2": {
    "1": 1,
    "2": 1,
    "3": 1,
    "4": 1,
    "5": 1,
  },
};

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // Get tender assignments
      return res.status(200).json({
        success: true,
        tenderAssignments,
      });
    }

    if (req.method === "POST") {
      // Save tender assignments
      const { deviceTenders } = req.body;

      if (!deviceTenders) {
        return res.status(400).json({
          success: false,
          message: "Device tenders data is required",
        });
      }

      // Update assignments
      tenderAssignments = deviceTenders;

      return res.status(200).json({
        success: true,
        message: "Tender assignments saved successfully",
        tenderAssignments,
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error("Error in tender assignments API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

