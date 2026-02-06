import nodemailer from "nodemailer";
import path from "path";
import { mongooseConnect } from "@/lib/mongoose";
import EndOfDayReport from "@/models/EndOfDayReport";
import Product from "@/models/Product";
import Store from "@/models/Store";
import Transaction from "@/models/Transactions";
import Expense from "@/models/Expense";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  try {
    // Auth check - Allow JWT or CRON_SECRET
    if (process.env.NODE_ENV === "production") {
      const key = req.query.key;
      const auth = req.headers.authorization;

      // Check for CRON_SECRET in query or header
      if (key === process.env.CRON_SECRET || auth === `Bearer ${process.env.CRON_SECRET}`) {
        console.log("[TEST MAIL] ✅ Authorized via CRON_SECRET");
      } else if (auth && auth.startsWith("Bearer ")) {
        // Verify JWT token for admin users
        try {
          const token = auth.substring(7);
          jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
          console.log("[TEST MAIL] ✅ Authorized via JWT token");
        } catch (tokenErr) {
          console.log("[TEST MAIL] ❌ Invalid JWT token:", tokenErr.message);
          return res.status(401).json({ error: "Unauthorized" });
        }
      } else {
        console.log("[TEST MAIL] ❌ No valid authorization");
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    if (req.method !== "POST" && req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log('[TEST MAIL] Generating comprehensive daily report...');
    
    const { FROM_EMAIL, EMAIL_USER, EMAIL_PASS } = process.env;
    console.log('[TEST MAIL] ENV:', { FROM_EMAIL, EMAIL_USER });
    
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.log('[TEST MAIL] Missing email credentials');
      return res.status(500).json({
        error: "Missing EMAIL_USER or EMAIL_PASS in .env",
        hint: "Check your Gmail credentials and app password",
      });
    }

    // Connect to database
    await mongooseConnect();
    console.log('[TEST MAIL] Connected to MongoDB');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // =====================
    // FETCH ALL DATA
    // =====================

    // 1. Get Store with locations
    const stores = await Store.find().lean();
    const storesMap = {};
    const locationsMap = {};
    stores.forEach(store => {
      storesMap[store._id.toString()] = store;
      if (store.locations) {
        store.locations.forEach(loc => {
          locationsMap[loc._id.toString()] = loc.name;
          locationsMap[loc.name] = loc.name; // Also map by name
        });
      }
    });

    // Get all location names for report
    const allLocations = [];
    stores.forEach(store => {
      if (store.locations) {
        store.locations.forEach(loc => {
          if (loc.isActive !== false) {
            allLocations.push({ id: loc._id.toString(), name: loc.name });
          }
        });
      }
    });

    // 2. Get EOD reports for today
    const eodReports = await EndOfDayReport.find({
      closedAt: { $gte: today, $lt: tomorrow }
    }).lean();
    console.log(`[TEST MAIL] Found ${eodReports.length} EOD reports`);

    // 3. Get transactions for today
    const transactions = await Transaction.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: "completed"
    }).lean();
    console.log(`[TEST MAIL] Found ${transactions.length} transactions`);

    // 4. Get expenses for today
    const expenses = await Expense.find({
      $or: [
        { createdAt: { $gte: today, $lt: tomorrow } },
        { expenseDate: { $gte: today, $lt: tomorrow } }
      ]
    }).lean();
    console.log(`[TEST MAIL] Found ${expenses.length} expenses`);

    // 5. Get all products for stock report
    const allProducts = await Product.find().lean();
    console.log(`[TEST MAIL] Found ${allProducts.length} products`);

    // =====================
    // PROCESS EOD DATA
    // =====================
    const eodByLocation = {};
    const tenderBreakdownByLocation = {};

    eodReports.forEach(report => {
      // Get location name
      let locationName = "Unknown";
      const store = storesMap[report.storeId?.toString()];
      if (store && store.locations && report.locationId) {
        const location = store.locations.find(
          loc => loc._id.toString() === report.locationId.toString()
        );
        if (location) locationName = location.name;
      }

      // Aggregate EOD by location
      if (!eodByLocation[locationName]) {
        eodByLocation[locationName] = {
          location: locationName,
          totalSales: 0,
          transactionCount: 0,
          variance: 0,
          openingBalance: 0,
          closingBalance: 0,
        };
      }
      eodByLocation[locationName].totalSales += report.totalSales || 0;
      eodByLocation[locationName].transactionCount += report.transactionCount || 0;
      eodByLocation[locationName].variance += report.variance || 0;
      eodByLocation[locationName].openingBalance += report.openingBalance || 0;
      eodByLocation[locationName].closingBalance += report.expectedClosingBalance || 0;

      // Process tender breakdown
      if (!tenderBreakdownByLocation[locationName]) {
        tenderBreakdownByLocation[locationName] = {};
      }
      if (report.tenderBreakdown) {
        // Handle both Map and Object formats
        const tenders = report.tenderBreakdown instanceof Map 
          ? Object.fromEntries(report.tenderBreakdown) 
          : report.tenderBreakdown;
        
        Object.entries(tenders).forEach(([tender, amount]) => {
          tenderBreakdownByLocation[locationName][tender] = 
            (tenderBreakdownByLocation[locationName][tender] || 0) + Number(amount || 0);
        });
      }
    });

    // =====================
    // PROCESS TRANSACTIONS FOR SALES BY LOCATION
    // =====================
    const salesByLocation = {};
    const tenderTotals = {};

    transactions.forEach(tx => {
      const locName = locationsMap[tx.location] || tx.location || "Unknown";
      
      if (!salesByLocation[locName]) {
        salesByLocation[locName] = {
          location: locName,
          totalSales: 0,
          transactionCount: 0,
          itemsSold: 0,
        };
      }
      salesByLocation[locName].totalSales += tx.total || 0;
      salesByLocation[locName].transactionCount += 1;
      
      // Count items sold
      if (tx.items && Array.isArray(tx.items)) {
        tx.items.forEach(item => {
          salesByLocation[locName].itemsSold += item.qty || item.quantity || 0;
        });
      }

      // Aggregate tender totals
      const tender = tx.tenderType || "CASH";
      tenderTotals[tender] = (tenderTotals[tender] || 0) + (tx.total || 0);
    });

    // =====================
    // PROCESS EXPENSES BY LOCATION
    // =====================
    const expensesByLocation = {};
    let totalExpenses = 0;

    expenses.forEach(exp => {
      const locName = exp.locationName || "Unassigned";
      
      if (!expensesByLocation[locName]) {
        expensesByLocation[locName] = {
          location: locName,
          totalAmount: 0,
          count: 0,
          categories: {},
        };
      }
      expensesByLocation[locName].totalAmount += exp.amount || 0;
      expensesByLocation[locName].count += 1;
      totalExpenses += exp.amount || 0;

      // Track by category
      const catName = exp.categoryName || "Uncategorized";
      expensesByLocation[locName].categories[catName] = 
        (expensesByLocation[locName].categories[catName] || 0) + (exp.amount || 0);
    });

    // =====================
    // PROCESS STOCK BY LOCATION
    // =====================
    const stockByLocation = {};
    
    // Initialize all locations
    allLocations.forEach(loc => {
      stockByLocation[loc.name] = {
        location: loc.name,
        totalUnits: 0,
        totalCostValue: 0,
        totalSaleValue: 0,
        productCount: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
      };
    });

    // Process products - check for inventory by location
    allProducts.forEach(product => {
      const costPrice = product.costPrice || 0;
      const salePrice = product.salePriceIncTax || 0;
      const minStock = product.minStock || 5;

      // Check if product has location-based inventory
      if (product.inventory && typeof product.inventory === 'object') {
        Object.entries(product.inventory).forEach(([locId, qty]) => {
          const locName = locationsMap[locId];
          if (locName && stockByLocation[locName]) {
            const quantity = Number(qty) || 0;
            stockByLocation[locName].totalUnits += quantity;
            stockByLocation[locName].totalCostValue += quantity * costPrice;
            stockByLocation[locName].totalSaleValue += quantity * salePrice;
            stockByLocation[locName].productCount += 1;
            
            if (quantity === 0) {
              stockByLocation[locName].outOfStockItems += 1;
            } else if (quantity <= minStock) {
              stockByLocation[locName].lowStockItems += 1;
            }
          }
        });
      } else {
        // Single location or no location tracking - add to first location
        const qty = product.quantity || 0;
        if (allLocations.length > 0 && stockByLocation[allLocations[0].name]) {
          stockByLocation[allLocations[0].name].totalUnits += qty;
          stockByLocation[allLocations[0].name].totalCostValue += qty * costPrice;
          stockByLocation[allLocations[0].name].totalSaleValue += qty * salePrice;
          stockByLocation[allLocations[0].name].productCount += 1;
          
          if (qty === 0) {
            stockByLocation[allLocations[0].name].outOfStockItems += 1;
          } else if (qty <= minStock) {
            stockByLocation[allLocations[0].name].lowStockItems += 1;
          }
        }
      }
    });

    // =====================
    // CALCULATE TOTALS
    // =====================
    const totalSales = Object.values(salesByLocation).reduce((sum, l) => sum + l.totalSales, 0);
    const totalTransactionCount = Object.values(salesByLocation).reduce((sum, l) => sum + l.transactionCount, 0);
    const totalVariance = Object.values(eodByLocation).reduce((sum, l) => sum + l.variance, 0);
    const totalStockValue = Object.values(stockByLocation).reduce((sum, l) => sum + l.totalSaleValue, 0);
    const totalStockCost = Object.values(stockByLocation).reduce((sum, l) => sum + l.totalCostValue, 0);

    // =====================
    // BUILD HTML REPORT
    // =====================
    const formatMoney = (val) => `₦${Number(val || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; max-width: 900px; margin: 0 auto;">
        
        <!-- HEADER -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
          <table style="width: 100%;">
            <tr>
              <td style="width: 70px; vertical-align: middle;">
                <img src="cid:businessLogo" alt="St. Micheals" style="width: 60px; height: 60px; border-radius: 8px; background: white; padding: 5px;" onerror="this.style.display='none'" />
              </td>
              <td style="vertical-align: middle; padding-left: 15px;">
                <h1 style="margin: 0; font-size: 24px;">Daily Business Report</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">St. Micheals Inventory System</p>
              </td>
            </tr>
          </table>
          <p style="margin: 15px 0 0 0; opacity: 0.9;">${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 5px 0 0 0; opacity: 0.7; font-size: 12px;">Generated: ${new Date().toLocaleString()}</p>
        </div>

        <!-- QUICK SUMMARY CARDS -->
        <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 150px; background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #059669;">
            <p style="margin: 0; color: #666; font-size: 12px;">TOTAL SALES</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #059669;">${formatMoney(totalSales)}</p>
          </div>
          <div style="flex: 1; min-width: 150px; background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #666; font-size: 12px;">TRANSACTIONS</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #3b82f6;">${totalTransactionCount}</p>
          </div>
          <div style="flex: 1; min-width: 150px; background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #666; font-size: 12px;">TOTAL EXPENSES</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #dc2626;">${formatMoney(totalExpenses)}</p>
          </div>
          <div style="flex: 1; min-width: 150px; background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #666; font-size: 12px;">STOCK VALUE</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #f59e0b;">${formatMoney(totalStockValue)}</p>
          </div>
        </div>

        <!-- EOD SUMMARY BY LOCATION -->
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
          <h2 style="color: #3b82f6; margin-top: 0; font-size: 18px;">💰 End-of-Day Summary by Location</h2>
          ${Object.keys(eodByLocation).length === 0 ? 
            '<p style="color: #999; font-style: italic;">No EOD reports available for today</p>' :
            `<table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f0f9ff;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #3b82f6; font-size: 13px;">Location</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #3b82f6; font-size: 13px;">Sales</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #3b82f6; font-size: 13px;">Transactions</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #3b82f6; font-size: 13px;">Variance</th>
                </tr>
              </thead>
              <tbody>
                ${Object.values(eodByLocation).map(loc => `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: 600;">${loc.location}</td>
                    <td style="padding: 12px; text-align: right; color: #059669; font-weight: 600;">${formatMoney(loc.totalSales)}</td>
                    <td style="padding: 12px; text-align: right;">${loc.transactionCount}</td>
                    <td style="padding: 12px; text-align: right; color: ${loc.variance > 0 ? '#dc2626' : loc.variance < 0 ? '#f59e0b' : '#059669'}; font-weight: 600;">${formatMoney(loc.variance)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`
          }
        </div>

        <!-- TENDER BREAKDOWN BY LOCATION -->
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #8b5cf6;">
          <h2 style="color: #8b5cf6; margin-top: 0; font-size: 18px;">💳 Tender Breakdown by Location</h2>
          ${Object.keys(tenderBreakdownByLocation).length === 0 ? 
            '<p style="color: #999; font-style: italic;">No tender data available for today</p>' :
            Object.entries(tenderBreakdownByLocation).map(([location, tenders]) => `
              <div style="margin-bottom: 15px; padding: 15px; background: #f9fafb; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">📍 ${location}</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                  ${Object.entries(tenders).map(([tender, amount]) => `
                    <div style="background: white; padding: 10px 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                      <span style="color: #666; font-size: 12px;">${tender}</span>
                      <span style="display: block; font-weight: bold; color: #1f2937;">${formatMoney(amount)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')
          }
          
          <!-- Total Tender Summary -->
          ${Object.keys(tenderTotals).length > 0 ? `
            <div style="margin-top: 15px; padding: 15px; background: #ede9fe; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #6d28d9; font-size: 14px;">📊 Overall Tender Totals</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${Object.entries(tenderTotals).map(([tender, amount]) => `
                  <div style="background: white; padding: 10px 15px; border-radius: 6px; border: 1px solid #c4b5fd;">
                    <span style="color: #666; font-size: 12px;">${tender}</span>
                    <span style="display: block; font-weight: bold; color: #6d28d9;">${formatMoney(amount)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- STOCK REPORT BY LOCATION -->
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
          <h2 style="color: #f59e0b; margin-top: 0; font-size: 18px;">📦 Stock Report by Location</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #fffbeb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #f59e0b; font-size: 13px;">Location</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #f59e0b; font-size: 13px;">Units</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #f59e0b; font-size: 13px;">Cost Value</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #f59e0b; font-size: 13px;">Sale Value</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #f59e0b; font-size: 13px;">Low Stock</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #f59e0b; font-size: 13px;">Out of Stock</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(stockByLocation).filter(s => s.productCount > 0).map(stock => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px; font-weight: 600;">${stock.location}</td>
                  <td style="padding: 12px; text-align: right;">${stock.totalUnits.toLocaleString()}</td>
                  <td style="padding: 12px; text-align: right; color: #666;">${formatMoney(stock.totalCostValue)}</td>
                  <td style="padding: 12px; text-align: right; color: #059669; font-weight: 600;">${formatMoney(stock.totalSaleValue)}</td>
                  <td style="padding: 12px; text-align: right; color: ${stock.lowStockItems > 0 ? '#f59e0b' : '#059669'}; font-weight: 600;">${stock.lowStockItems}</td>
                  <td style="padding: 12px; text-align: right; color: ${stock.outOfStockItems > 0 ? '#dc2626' : '#059669'}; font-weight: 600;">${stock.outOfStockItems}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #fef3c7; font-weight: bold;">
                <td style="padding: 12px;">TOTAL</td>
                <td style="padding: 12px; text-align: right;">${Object.values(stockByLocation).reduce((s, l) => s + l.totalUnits, 0).toLocaleString()}</td>
                <td style="padding: 12px; text-align: right;">${formatMoney(totalStockCost)}</td>
                <td style="padding: 12px; text-align: right; color: #059669;">${formatMoney(totalStockValue)}</td>
                <td style="padding: 12px; text-align: right;">${Object.values(stockByLocation).reduce((s, l) => s + l.lowStockItems, 0)}</td>
                <td style="padding: 12px; text-align: right;">${Object.values(stockByLocation).reduce((s, l) => s + l.outOfStockItems, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- SALES BY LOCATION -->
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #059669;">
          <h2 style="color: #059669; margin-top: 0; font-size: 18px;">🛒 Sales by Location (Today)</h2>
          ${Object.keys(salesByLocation).length === 0 ? 
            '<p style="color: #999; font-style: italic;">No sales recorded for today</p>' :
            `<table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #ecfdf5;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #059669; font-size: 13px;">Location</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #059669; font-size: 13px;">Sales Total</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #059669; font-size: 13px;">Transactions</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #059669; font-size: 13px;">Items Sold</th>
                </tr>
              </thead>
              <tbody>
                ${Object.values(salesByLocation).map(loc => `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: 600;">${loc.location}</td>
                    <td style="padding: 12px; text-align: right; color: #059669; font-weight: 600;">${formatMoney(loc.totalSales)}</td>
                    <td style="padding: 12px; text-align: right;">${loc.transactionCount}</td>
                    <td style="padding: 12px; text-align: right;">${loc.itemsSold}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`
          }
        </div>

        <!-- EXPENSES BY LOCATION -->
        <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
          <h2 style="color: #dc2626; margin-top: 0; font-size: 18px;">💸 Expenses by Location (Today)</h2>
          ${Object.keys(expensesByLocation).length === 0 ? 
            '<p style="color: #999; font-style: italic;">No expenses recorded for today</p>' :
            `<table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #fef2f2;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dc2626; font-size: 13px;">Location</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dc2626; font-size: 13px;">Total Amount</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dc2626; font-size: 13px;">Count</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dc2626; font-size: 13px;">Categories</th>
                </tr>
              </thead>
              <tbody>
                ${Object.values(expensesByLocation).map(loc => `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: 600;">${loc.location}</td>
                    <td style="padding: 12px; text-align: right; color: #dc2626; font-weight: 600;">${formatMoney(loc.totalAmount)}</td>
                    <td style="padding: 12px; text-align: right;">${loc.count}</td>
                    <td style="padding: 12px; font-size: 12px; color: #666;">
                      ${Object.entries(loc.categories).map(([cat, amt]) => `${cat}: ${formatMoney(amt)}`).join(', ')}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="background: #fee2e2; font-weight: bold;">
                  <td style="padding: 12px;">TOTAL EXPENSES</td>
                  <td style="padding: 12px; text-align: right; color: #dc2626;">${formatMoney(totalExpenses)}</td>
                  <td style="padding: 12px; text-align: right;">${expenses.length}</td>
                  <td style="padding: 12px;"></td>
                </tr>
              </tfoot>
            </table>`
          }
        </div>

        <!-- DAY SUMMARY -->
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; margin-bottom: 25px; font-size: 22px; text-align: center; letter-spacing: 0.5px;">📈 Day Summary</h2>
          
          <!-- Main Metrics Grid -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
            <!-- Gross Sales -->
            <div style="background: rgba(255, 255, 255, 0.15); padding: 18px; border-radius: 8px; border-left: 4px solid rgba(255, 255, 255, 0.4); backdrop-filter: blur(10px);">
              <p style="margin: 0; opacity: 0.85; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">💰 Gross Sales</p>
              <p style="margin: 12px 0 0 0; font-size: 28px; font-weight: bold; line-height: 1;">${formatMoney(totalSales)}</p>
              <p style="margin: 8px 0 0 0; opacity: 0.7; font-size: 11px;">${totalTransactionCount} transactions</p>
            </div>

            <!-- Total Expenses -->
            <div style="background: rgba(255, 255, 255, 0.15); padding: 18px; border-radius: 8px; border-left: 4px solid rgba(255, 255, 255, 0.4); backdrop-filter: blur(10px);">
              <p style="margin: 0; opacity: 0.85; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">💸 Total Expenses</p>
              <p style="margin: 12px 0 0 0; font-size: 28px; font-weight: bold; line-height: 1;">${formatMoney(totalExpenses)}</p>
              <p style="margin: 8px 0 0 0; opacity: 0.7; font-size: 11px;">${expenses.length} expense items</p>
            </div>

            <!-- Net Profit -->
            <div style="background: rgba(255, 255, 255, 0.15); padding: 18px; border-radius: 8px; border-left: 4px solid rgba(255, 255, 255, 0.4); backdrop-filter: blur(10px);">
              <p style="margin: 0; opacity: 0.85; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">📊 Net Profit</p>
              <p style="margin: 12px 0 0 0; font-size: 28px; font-weight: bold; line-height: 1;">${formatMoney(totalSales - totalExpenses)}</p>
              <p style="margin: 8px 0 0 0; opacity: 0.7; font-size: 11px;">Sales minus expenses</p>
            </div>

            <!-- Cash Variance -->
            <div style="background: rgba(255, 255, 255, 0.15); padding: 18px; border-radius: 8px; border-left: 4px solid rgba(255, 255, 255, 0.4); backdrop-filter: blur(10px);">
              <p style="margin: 0; opacity: 0.85; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">⚖️ Cash Variance</p>
              <p style="margin: 12px 0 0 0; font-size: 28px; font-weight: bold; line-height: 1; color: ${totalVariance > 0 ? '#fbbf24' : totalVariance < 0 ? '#ef4444' : '#ffffff'};">${formatMoney(totalVariance)}</p>
              <p style="margin: 8px 0 0 0; opacity: 0.7; font-size: 11px;">${totalVariance > 0 ? '↑ Surplus' : totalVariance < 0 ? '↓ Deficit' : 'Balanced'}</p>
            </div>
          </div>

          <!-- Divider -->
          <div style="border-top: 2px solid rgba(255, 255, 255, 0.25); margin: 20px 0;"></div>

          <!-- Secondary Metrics -->
         
           <div style="display: flex; flex-wrap: wrap; gap: 10px;"> 
            <!-- Stock Value -->
            <div style="text-align: center; padding: 12px;">
              <p style="margin: 0; opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Stock Value</p>
              <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold;">${formatMoney(totalStockValue)}</p>
            </div>

            <!-- Locations Active -->
            <div style="text-align: center; padding: 12px;">
              <p style="margin: 0; opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Locations</p>
              <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold;">${allLocations.length}</p>
            </div>

            <!-- Profit Margin -->
            <div style="text-align: center; padding: 12px;">
              <p style="margin: 0; opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Profit Margin</p>
              <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold;">${totalSales > 0 ? ((((totalSales - totalExpenses) / totalSales) * 100).toFixed(1)) : '0'}%</p>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">This is an automated daily report from St. Micheals Inventory System</p>
          <p style="color: #059669; font-size: 12px; margin: 5px 0;">✅ Report generated successfully</p>
        </div>
      </div>
    `;

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });

    const testEmailTo = process.env.TEST_EMAIL || FROM_EMAIL || EMAIL_USER;

    console.log("📧 Sending daily report email to:", testEmailTo);
    
    // Logo path for embedding
    const logoPath = path.join(process.cwd(), "public/images/st-micheals-logo.png");
    let attachments = [];
    
    try {
      const fs = await import("fs");
      if (fs.existsSync(logoPath)) {
        attachments.push({
          filename: "logo.png",
          path: logoPath,
          cid: "businessLogo",
        });
      }
    } catch (logoErr) {
      console.log("[TEST MAIL] Logo not found, sending without embedded image");
    }
    
    const emailResponse = await transporter.sendMail({
      from: EMAIL_USER,
      to: testEmailTo,
      subject: `Daily Business Report - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | St. Micheals`,
      html: mailHtml,
      attachments,
    });
    
    console.log("✅ Email sent successfully:", emailResponse.messageId);
    
    return res.status(200).json({
      message: "Daily report sent successfully!",
      sentTo: testEmailTo,
      messageId: emailResponse.messageId,
      timestamp: new Date().toISOString(),
      summary: {
        totalSales,
        totalTransactions: totalTransactionCount,
        totalExpenses,
        netPosition: totalSales - totalExpenses,
        stockValue: totalStockValue,
        variance: totalVariance,
        locationsCount: allLocations.length,
        eodReportsCount: eodReports.length,
      },
    });

  } catch (err) {
    console.error("❌ Error generating daily report:", err);
    return res.status(500).json({
      error: "Failed to generate daily report",
      message: err.message,
      hint: "Check EMAIL_USER/EMAIL_PASS configuration and database connection",
    });
  }
}
