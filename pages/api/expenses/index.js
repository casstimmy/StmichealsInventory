// pages/api/expenses/index.js
import { mongooseConnect } from "@/lib/mongodb";
import Expense from "@/models/Expense";

export default async function handler(req, res) {
  await mongooseConnect();

  try {
    /* ---------------- GET EXPENSES ---------------- */
    if (req.method === "GET") {
      const expenses = await Expense.find()
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        expenses,
      });
    }

    /* ---------------- CREATE EXPENSE ---------------- */
    if (req.method === "POST") {
      const {
        title,
        amount,
        categoryId,
        categoryName,
        description,
        locationId,
        locationName,
      } = req.body;

      if (!title || !amount || !categoryName) {
        return res.status(400).json({
          success: false,
          message: "Title, amount and category name are required",
        });
      }

      const expense = await Expense.create({
        title,
        amount: Number(amount),
        categoryId: categoryId || null,
        categoryName,
        description: description || "",
        locationId: locationId || null,
        locationName: locationName || "",
      });

      return res.status(201).json({
        success: true,
        expense,
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Expense API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

