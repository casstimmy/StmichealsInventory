import nodemailer from "nodemailer";
import { mongooseConnect } from "@/lib/mongoose";
import EndOfDayReport from "@/models/EndOfDayReport";
import Product from "@/models/Product";
import Store from "@/models/Store";
import StockMovement from "@/models/StockMovement";

export default async function handler(req, res) {
  try {
    // Auth check for production
    if (process.env.NODE_ENV === "production") {
      const key = req.query.key;
      console.log("[TEST MAIL] Received key:", key);
      console.log("[TEST MAIL] Server CRON_SECRET:", process.env.CRON_SECRET);
      if (key && key === process.env.CRON_SECRET) {
        // Allow
      } else {
        const auth = req.headers.authorization;
        console.log("[TEST MAIL] Received Authorization header:", auth);
        if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
          console.log("[TEST MAIL] 401 Unauthorized triggered");
          return res.status(401).send("Unauthorized");
        }
      }
    }

    if (req.method !== "POST" && req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log('[TEST MAIL] Testing mail system and generating daily report...');
    
    const { FROM_EMAIL } = process.env;
    console.log('[TEST MAIL] ENV:', { FROM_EMAIL });
    
    if (!FROM_EMAIL) {
      console.log('[TEST MAIL] Missing FROM_EMAIL');
      return res.status(500).json({
        error: "Missing FROM_EMAIL in .env",
      });
    }

    // Connect to database
    await mongooseConnect();
    console.log('[TEST MAIL] Connected to MongoDB');

    // Get today's EOD data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const eodReports = await EndOfDayReport.find({
      closedAt: { $gte: today, $lt: tomorrow }
    }).lean();

    console.log(`[TEST MAIL] Found ${eodReports.length} EOD reports for today`);

    // Get Store with locations
    const stores = await Store.find().select("storeName locations").lean();
    const storesMap = {};
    stores.forEach(store => {
      storesMap[store._id.toString()] = store;
    });

    // Enrich EOD reports with location names
    const enrichedEodReports = eodReports.map(report => {
      const store = storesMap[report.storeId?.toString()];
      if (store && store.locations && report.locationId) {
        const location = store.locations.find(
          loc => loc._id.toString() === report.locationId.toString()
        );
        if (location) {
          return {
            ...report,
            locationName: location.name,
          };
        }
      }
      return {
        ...report,
        locationName: "Unknown",
      };
    });

    // Calculate EOD summary
    const totalSales = enrichedEodReports.reduce((sum, r) => sum + (r.totalSales || 0), 0);
    const totalTransactions = enrichedEodReports.reduce((sum, r) => sum + (r.transactionCount || 0), 0);
    const totalVariance = enrichedEodReports.reduce((sum, r) => sum + (r.variance || 0), 0);

    // Get stock by location
    const stockByLocation = {};
    const allProducts = await Product.find().lean();
    
    stores.forEach(store => {
      if (store.locations) {
        store.locations.forEach(location => {
          const locId = location._id.toString();
          stockByLocation[location.name] = {
            location: location.name,
            totalItems: 0,
            lowStockItems: 0,
            outOfStockItems: 0,
          };
        });
      }
    });

    // Count products by location
    allProducts.forEach(product => {
      if (product.inventory && typeof product.inventory === 'object') {
        Object.entries(product.inventory).forEach(([locId, qty]) => {
          // Find location name from stores
          for (const store of stores) {
            if (store.locations) {
              const location = store.locations.find(l => l._id.toString() === locId);
              if (location) {
                const locName = location.name;
                if (stockByLocation[locName]) {
                  stockByLocation[locName].totalItems += Number(qty || 0);
                  
                  const lowThreshold = product.lowStockThreshold || 10;
                  if (qty > 0 && qty <= lowThreshold) {
                    stockByLocation[locName].lowStockItems++;
                  }
                  if (qty === 0) {
                    stockByLocation[locName].outOfStockItems++;
                  }
                }
                break;
              }
            }
          }
        });
      }
    });

    // Create comprehensive HTML report
    const mailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; max-width: 800px; margin: 0 auto;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #1f2937; border-bottom: 3px solid #059669; padding-bottom: 10px;">📊 Daily Business Report</h1>
          <p style="color: #666; margin: 5px 0;"><b>Date:</b> ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="color: #666; margin: 5px 0;"><b>Generated:</b> ${new Date().toLocaleString()}</p>
        </div>

        <!-- EOD SUMMARY -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
          <h2 style="color: #3b82f6; margin-top: 0;">💰 End-of-Day Summary</h2>
          ${enrichedEodReports.length === 0 ? 
            '<p style="color: #999;">No EOD reports available for today</p>' :
            `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <thead>
                <tr style="background: #f0f9ff;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #3b82f6;">Location</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #3b82f6;">Sales</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #3b82f6;">Transactions</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #3b82f6;">Variance</th>
                </tr>
              </thead>
              <tbody>
                ${enrichedEodReports.map(report => `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px;">${report.locationName}</td>
                    <td style="padding: 10px; text-align: right;"><b>₦${(report.totalSales || 0).toLocaleString('en-NG')}</b></td>
                    <td style="padding: 10px; text-align: right;">${report.transactionCount || 0}</td>
                    <td style="padding: 10px; text-align: right; color: ${(report.variance || 0) > 0 ? '#dc2626' : '#059669'};"><b>₦${(report.variance || 0).toLocaleString('en-NG')}</b></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 6px;">
              <p style="margin: 5px 0;"><b>Total Sales:</b> ₦${totalSales.toLocaleString('en-NG')}</p>
              <p style="margin: 5px 0;"><b>Total Transactions:</b> ${totalTransactions}</p>
              <p style="margin: 5px 0;"><b>Total Variance:</b> <span style="color: ${totalVariance > 0 ? '#dc2626' : '#059669'};">₦${totalVariance.toLocaleString('en-NG')}</span></p>
            </div>
            `
          }
        </div>

        <!-- STOCK REPORT BY LOCATION -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
          <h2 style="color: #f59e0b; margin-top: 0;">📦 Stock Report by Location</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #fffbeb;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #f59e0b;">Location</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #f59e0b;">Total Items</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #f59e0b;">Low Stock</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #f59e0b;">Out of Stock</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(stockByLocation).map(stock => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px;"><b>${stock.location}</b></td>
                  <td style="padding: 10px; text-align: right;">${stock.totalItems.toLocaleString('en-NG')}</td>
                  <td style="padding: 10px; text-align: right; color: ${stock.lowStockItems > 0 ? '#f59e0b' : '#059669'};"><b>${stock.lowStockItems}</b></td>
                  <td style="padding: 10px; text-align: right; color: ${stock.outOfStockItems > 0 ? '#dc2626' : '#059669'};"><b>${stock.outOfStockItems}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- FOOTER -->
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">This is an automated daily report from your Inventory Admin System</p>
          <p style="color: #999; font-size: 12px; margin: 5px 0;">✅ Mail system is working correctly</p>
        </div>
      </div>
    `;

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: FROM_EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const testEmailTo = process.env.TEST_EMAIL || FROM_EMAIL;

    console.log("📧 Sending daily report email via Nodemailer to:", testEmailTo);
    try {
      const emailResponse = await transporter.sendMail({
        from: FROM_EMAIL,
        to: testEmailTo,
        subject: `📊 Daily Business Report - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        html: mailHtml,
      });
      console.log("✅ Email sent successfully:", emailResponse.messageId);
      return res.status(200).json({
        message: "Daily report sent successfully!",
        sentTo: testEmailTo,
        messageId: emailResponse.messageId,
        timestamp: new Date().toISOString(),
        report: {
          eodReportsCount: enrichedEodReports.length,
          totalSales,
          totalTransactions,
          stockLocations: Object.keys(stockByLocation).length,
        },
      });
    } catch (error) {
      console.error("❌ Nodemailer error:", error);
      return res.status(500).json({
        error: "Failed to send report email",
        details: error.message,
      });
    }
  } catch (err) {
    console.error("❌ Error generating daily report:", err);
    return res.status(500).json({
      error: "Failed to generate daily report",
      message: err.message,
      hint: "Check EMAIL_USER/EMAIL_PASS configuration and ensure you have enabled Gmail app password",
    });
  }
}
