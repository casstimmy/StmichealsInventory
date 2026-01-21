// pages/api/expenses/analysis.js
import PDFDocument from "pdfkit";
import { mongooseConnect } from "@/lib/mongodb";
import Expense from "@/models/Expense";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    const expenses = await Expense.find()
      .sort({ createdAt: -1 })
      .lean();

    const totalSpent = expenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0
    );

    // Group by category
    const categoryTotals = {};
    expenses.forEach((exp) => {
      const category = exp.categoryName || "Uncategorized";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + Number(exp.amount);
    });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ExpenseReport.pdf"'
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Logo (safe path)
    const logoPath = path.join(
      process.cwd(),
      "public/images/st-micheals-logo.png"
    );

    try {
      doc.image(logoPath, 50, 40, { width: 60 });
    } catch (_) {}

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(26)
      .fillColor("#1D4ED8")
      .text("Expense Report", { align: "center" })
      .moveDown(2);

    // Summary
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#000")
      .text("Summary", { underline: true })
      .moveDown(0.5);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Total Expenses: ₦${totalSpent.toLocaleString()}`)
      .moveDown(0.5);

    doc.text("Category Breakdown:");
    Object.entries(categoryTotals).forEach(([name, amount]) => {
      doc.text(`• ${name}: ₦${amount.toLocaleString()}`);
    });

    doc.moveDown(1.5);

    // Details
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#1D4ED8")
      .text("Expense Details", { underline: true })
      .moveDown(1);

    expenses.forEach((exp, index) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#111827")
        .text(`${index + 1}. ${exp.title}`);

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#374151")
        .text(`Amount: ₦${Number(exp.amount).toLocaleString()}`)
        .text(`Category: ${exp.category?.name || "Uncategorized"}`)
        .text(`Location: ${exp.location || "N/A"}`)
        .text(
          `Date: ${new Date(exp.createdAt).toLocaleDateString()}`
        );

      if (exp.description) {
        doc.text(`Note: ${exp.description}`);
      }

      doc.moveDown(1);
    });

    // Footer
    doc
      .fontSize(9)
      .fillColor("#9CA3AF")
      .text(
        `Generated on ${new Date().toLocaleString()}`,
        50,
        doc.page.height - 50,
        { align: "center", width: 500 }
      );

    doc.end();
  } catch (error) {
    console.error("Expense analysis PDF error:", error);
    res.status(500).json({
      message: "Failed to generate expense report",
    });
  }
}

