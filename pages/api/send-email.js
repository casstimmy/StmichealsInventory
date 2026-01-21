import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const { status, customer } = req.body;

  if (!customer || !status)
    return res
      .status(400)
      .json({ message: "Missing status or customer info" });

  // Dynamic message setup
  let subject, header, message, color;

  switch (status.toLowerCase()) {
    case "received":
      subject = "Order Received - St's Micheals";
      header = "Your Order Has Been Received!";
      message = `We’ve received your order <strong>${customer.orderId}</strong> and our team is preparing it for shipment.`;
      color = "#1e3a8a";
      break;
    case "shipped":
      subject = "Order Shipped - St's Micheals";
      header = "Good News! Your Order Is On The Way 🚚";
      message = `Your order <strong>${customer.orderId}</strong> has been shipped and is on its way to you.`;
      color = "#059669";
      break;
    case "delivered":
      subject = "Order Delivered - St's Micheals";
      header = "Your Order Has Been Delivered 🎉";
      message = `We’re excited to let you know your order <strong>${customer.orderId}</strong> has been successfully delivered.`;
      color = "#1e40af";
      break;
    case "salary":
      subject = "Salary Information - St's Micheals";
      header = "Your Salary Report";
      message = `Here is your staff salary information for the current period.`;
      color = "#0369a1";
      break;
    default:
      subject = "Order Update - St's Micheals";
      header = "Your Order Has Been Received!";
      message = `We’ve received your order <strong>${customer.orderId}</strong> and our team is preparing it for shipment.`;
      color = "#1e3a8a";
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let htmlBody;

  if (status.toLowerCase() === "salary") {
    htmlBody = `
    <div style="font-family: 'Segoe UI', sans-serif; background: #f9fafb; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="background: ${color}; color: white; padding: 20px; text-align: center;">
          <img src="${process.env.LOGO_URL || 'https://via.placeholder.com/150'}" alt="St's Micheals Logo" style="max-width: 100px; margin-bottom: 10px;">
          <h2 style="margin: 0;">St's Micheals</h2>
          <p style="margin: 0;">${header}</p>
        </div>

        <div style="padding: 25px;">
          <p>Hi <strong>${customer.name}</strong>,</p>
          <p>${message}</p>

          <h3 style="margin-top: 25px;">💰 Salary Information</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Staff Name</th>
                <th style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Salary</th>
              </tr>
            </thead>
            <tbody>
              ${(customer.products || [])
                .map(
                  (p) => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${p.name}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">₦${typeof p.price === 'number' ? p.price.toLocaleString() : p.price}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>

          <p style="margin-top: 20px;"><strong>Total Salary:</strong> ₦${typeof customer.total === 'number' ? customer.total.toLocaleString() : customer.total}</p>

          <p style="margin-top: 30px;">Thank you for your attention with <strong>St's Micheals</strong>!</p>

          <p style="font-size: 12px; color: #6b7280;">If you have any questions, reply to this email or contact us at mandmintegrityfashion@gmail.com.</p>
        </div>
      </div>
    </div>
    `;
  } else {
    htmlBody = `
    <div style="font-family: 'Segoe UI', sans-serif; background: #f9fafb; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="background: ${color}; color: white; padding: 20px; text-align: center;">
          <img src="${process.env.LOGO_URL || 'https://via.placeholder.com/150'}" alt="St's Micheals Logo" style="max-width: 100px; margin-bottom: 10px;">
          <h2 style="margin: 0;">St's Micheals</h2>
          <p style="margin: 0;">${header}</p>
        </div>

        <div style="padding: 25px;">
          <p>Hi <strong>${customer.name}</strong>,</p>
          <p>${message}</p>

          <h3 style="margin-top: 25px;">📦 Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Item</th>
                <th style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Qty</th>
                <th style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${(customer.products || [])
                .map(
                  (p) => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${p.name}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${p.quantity}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">₦${typeof p.price === 'number' ? p.price.toLocaleString() : p.price}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>

          <p style="margin-top: 20px;"><strong>Total Paid:</strong> ₦${typeof customer.total === 'number' ? customer.total.toLocaleString() : customer.total}</p>
          <p><strong>Status:</strong> ${status}</p>

          <h3 style="margin-top: 25px;">📍 Delivery Details</h3>
          <p>
            ${customer.shippingDetails?.name || customer.name}<br/>
            ${customer.shippingDetails?.address || "No address provided"}<br/>
            ${customer.shippingDetails?.city || ""}<br/>
            Phone: ${customer.shippingDetails?.phone || "N/A"}
          </p>

          <p style="margin-top: 30px;">Thank you for shopping with <strong>St's Micheals</strong>!</p>

          <p style="font-size: 12px; color: #6b7280;">If you have any questions, reply to this email or contact us at StMicheals.food@gmail.com.</p>
        </div>
      </div>
    </div>
    `;
  }

  try {
    await transporter.sendMail({
      from: `"St's Micheals" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject,
      html: htmlBody,
    });

    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Email send failed:", error);
    return res
      .status(500)
      .json({ message: "Failed to send email", error: error.message });
  }
}

