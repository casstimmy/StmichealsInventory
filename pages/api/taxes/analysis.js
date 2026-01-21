// pages/api/taxes/analysis.js
import { mongooseConnect } from "@/lib/mongodb";
import Transaction from "@/models/Transactions";
import Expense from "@/models/Expense";

// Nigeria Tax Laws 2024/2025 - Finance Act 2023
const getTaxBand = (revenue) => {
  if (revenue <= 25_000_000) return { band: "Small (Exempted)", rate: 0 };
  if (revenue <= 100_000_000) return { band: "Medium", rate: 20 };
  return { band: "Large", rate: 30 };
};

const calculateTaxableIncome = (revenue, expenses) => {
  // Taxable income = Revenue - Expenses (or 5% standard deduction if no expenses)
  return expenses ? revenue - expenses : revenue * 0.95;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔄 Tax analysis API called");
    
    // Test database connection
    console.log("🔌 Attempting to connect to database...");
    await mongooseConnect();
    console.log("✅ Connected to database");
    const { period = "last-month" } = req.query;
    console.log("📅 Period:", period);

    // Build date filter
    let dateFilter = {};
    const now = new Date();

    if (period === "this-year") {
      // This year (from Jan 1 to today)
      const yearStart = new Date(now.getFullYear(), 0, 1);
      console.log("📅 This year from", yearStart, "to", now);
      dateFilter = {
        createdAt: {
          $gte: yearStart,
          $lte: now,
        },
      };
    } else if (period === "last-year") {
      // Last year: Jan 1 of last year to Dec 31 of last year
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear(), 0, 0); // Dec 31 of last year
      console.log("📅 Last year from", lastYearStart, "to", lastYearEnd);
      dateFilter = {
        createdAt: {
          $gte: lastYearStart,
          $lte: lastYearEnd,
        },
      };
    } else if (period === "this-quarter") {
      // This quarter (from start of quarter to today)
      const quarter = Math.floor(now.getMonth() / 3);
      const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
      console.log("📅 This quarter from", quarterStart, "to", now);
      dateFilter = {
        createdAt: {
          $gte: quarterStart,
          $lte: now,
        },
      };
    } else if (period === "last-quarter") {
      // Last quarter: 3 months ago to today
      const lastQuarterStart = new Date(now);
      lastQuarterStart.setMonth(now.getMonth() - 3);
      console.log("📅 Last 3 months from", lastQuarterStart, "to", now);
      dateFilter = {
        createdAt: {
          $gte: lastQuarterStart,
          $lte: now,
        },
      };
    } else if (period === "this-month") {
      // This month (from 1st of month to today)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      console.log("📅 This month from", monthStart, "to", now);
      dateFilter = {
        createdAt: {
          $gte: monthStart,
          $lte: now,
        },
      };
    } else {
      // Default: last month (30 days ago to today)
      const lastMonthStart = new Date(now);
      lastMonthStart.setDate(now.getDate() - 30);
      console.log("📅 Last 30 days from", lastMonthStart, "to", now);
      dateFilter = {
        createdAt: {
          $gte: lastMonthStart,
          $lte: now,
        },
      };
    }

    console.log("📊 Querying transactions...");
    const transactions = await Transaction.find(dateFilter).lean().exec();
    console.log("✅ Found transactions:", transactions?.length || 0);

    console.log("📊 Querying expenses...");
    const expenses = await Expense.find(dateFilter).lean().exec();
    console.log("✅ Found expenses:", expenses?.length || 0);

    // Calculate totals
    const totalRevenue = transactions?.reduce((sum, t) => sum + (Number(t.total) || 0), 0) || 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0;

    // Tax calculations
    const taxBandInfo = getTaxBand(totalRevenue);
    const vatRate = 7.5;
    const nhlRate = 0.5;

    const taxableIncome = calculateTaxableIncome(totalRevenue, totalExpenses);
    const companyIncomeTax = (taxableIncome * taxBandInfo.rate) / 100;
    const vatOnSales = (totalRevenue * vatRate) / 100;
    const nhlAmount = (totalRevenue * nhlRate) / 100;
    const totalTaxLiability = companyIncomeTax + vatOnSales + nhlAmount;

    // Build breakdown by period
    const monthlyData = {};
    
    if (transactions && Array.isArray(transactions)) {
      transactions.forEach((t) => {
        const date = new Date(t.createdAt);
        const monthKey = date.toLocaleString("default", { month: "long", year: "numeric" });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            income: 0,
            expenses: 0,
            vat: 0,
            cit: 0,
            nhl: 0,
          };
        }

        monthlyData[monthKey].income += Number(t.total) || 0;
      });
    }

    if (expenses && Array.isArray(expenses)) {
      expenses.forEach((e) => {
        const date = new Date(e.createdAt || e.expenseDate);
        const monthKey = date.toLocaleString("default", { month: "long", year: "numeric" });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            income: 0,
            expenses: 0,
            vat: 0,
            cit: 0,
            nhl: 0,
          };
        }

        monthlyData[monthKey].expenses += Number(e.amount) || 0;
      });
    }

    // Calculate taxes per month
    const breakdown = Object.values(monthlyData).map((item) => {
      const monthTaxableIncome = calculateTaxableIncome(item.income, item.expenses);
      const monthTaxBand = getTaxBand(item.income);

      return {
        ...item,
        vat: Math.round((item.income * vatRate) / 100),
        cit: Math.round((monthTaxableIncome * monthTaxBand.rate) / 100),
        nhl: Math.round((item.income * nhlRate) / 100),
      };
    });

    console.log("✅ Tax analysis completed");

    return res.status(200).json({
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      band: taxBandInfo.band,
      citRate: taxBandInfo.rate,
      taxableIncome,
      companyIncomeTax,
      vatOnSales,
      vatRate,
      nhlAmount,
      nhlRate,
      totalTaxLiability,
      breakdown: breakdown.length > 0 ? breakdown : [],
      period,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Tax analysis error caught");
    console.error("Error message:", error?.message);
    console.error("Error name:", error?.name);
    console.error("Error type:", typeof error);
    console.error("Full error:", error);
    
    if (error?.stack) {
      console.error("Stack trace:");
      console.error(error.stack);
    }
    
    return res.status(500).json({
      error: "Failed to generate tax analysis",
      message: error?.message || "Unknown error",
      type: error?.name || "Unknown",
    });
  }
}

