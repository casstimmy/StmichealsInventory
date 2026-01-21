import mongoose from "mongoose";
import Tender from "@/models/Tender";
import { mongooseConnect } from "@/lib/mongodb";

async function connectDB() {
  await mongooseConnect();
}

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === "GET") {
      // Get all tenders
      const tenders = await Tender.find().sort({ tillOrder: 1 });
      return res.status(200).json({
        success: true,
        tenders,
      });
    }

    if (req.method === "POST") {
      // Create new tender
      const { name, description, buttonColor, tillOrder, classification } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Tender name is required",
        });
      }

      // Check if tender with this name already exists
      const existingTender = await Tender.findOne({ name });
      if (existingTender) {
        return res.status(400).json({
          success: false,
          message: "A tender with this name already exists",
        });
      }

      const newTender = await Tender.create({
        name,
        description: description || "",
        buttonColor: buttonColor || "#FF69B4",
        tillOrder: tillOrder || 1,
        classification: classification || "Other",
      });

      return res.status(201).json({
        success: true,
        message: "Tender created successfully",
        tender: newTender,
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error("Error in tenders API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

