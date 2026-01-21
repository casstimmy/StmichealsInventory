import mongoose from "mongoose";
import Tender from "@/models/Tender";
import { mongooseConnect } from "@/lib/mongodb";

async function connectDB() {
  await mongooseConnect();
}

export default async function handler(req, res) {
  const { id } = req.query;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid tender ID",
    });
  }

  try {
    await connectDB();

    if (req.method === "GET") {
      // Get single tender
      const tender = await Tender.findById(id);

      if (!tender) {
        return res.status(404).json({
          success: false,
          message: "Tender not found",
        });
      }

      return res.status(200).json({
        success: true,
        tender,
      });
    }

    if (req.method === "PUT") {
      // Update tender
      const { name, description, buttonColor, tillOrder, classification } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Tender name is required",
        });
      }

      // Check if another tender has this name
      const existingTender = await Tender.findOne({ 
        name, 
        _id: { $ne: id } 
      });

      if (existingTender) {
        return res.status(400).json({
          success: false,
          message: "A tender with this name already exists",
        });
      }

      const tender = await Tender.findByIdAndUpdate(
        id,
        {
          name,
          description: description || "",
          buttonColor: buttonColor || "#FF69B4",
          tillOrder: tillOrder || 1,
          classification: classification || "Other",
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!tender) {
        return res.status(404).json({
          success: false,
          message: "Tender not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Tender updated successfully",
        tender,
      });
    }

    if (req.method === "DELETE") {
      // Delete tender
      const tender = await Tender.findByIdAndDelete(id);

      if (!tender) {
        return res.status(404).json({
          success: false,
          message: "Tender not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Tender deleted successfully",
        tender,
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error("Error in tender API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
