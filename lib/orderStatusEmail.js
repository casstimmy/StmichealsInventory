import Store from "@/models/Store";
import { createMailTransport, getMailFromAddress } from "@/lib/mail";

const DEFAULT_BRAND_NAME = "St's Micheals";

const getOrderContactDetails = (order) => {
  const shippingDetails = order?.shippingDetails || {};
  const customerSnapshot = order?.customerSnapshot || {};
  const customer = order?.customer || {};

  return {
    name: shippingDetails.name || customerSnapshot.name || customer.name || "",
    email: shippingDetails.email || customerSnapshot.email || customer.email || "",
    phone: shippingDetails.phone || customerSnapshot.phone || customer.phone || "",
    address: shippingDetails.address || customerSnapshot.address || customer.address || "",
    city: shippingDetails.city || customerSnapshot.city || customer.city || "",
  };
};

const getOrderItems = (order) => {
  if (Array.isArray(order?.cartProducts) && order.cartProducts.length > 0) {
    return order.cartProducts;
  }

  return Array.isArray(order?.items) ? order.items : [];
};

const resolveBaseUrl = () =>
  [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.SITE_URL,
  ].find((value) => typeof value === "string" && value.trim()) || "";

const resolveLogoUrl = (logoPath = "") => {
  const candidate = String(process.env.LOGO_URL || logoPath || "").trim();
  if (!candidate) {
    return "";
  }

  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    return "";
  }

  try {
    return new URL(candidate.startsWith("/") ? candidate : `/${candidate}`, baseUrl).toString();
  } catch {
    return "";
  }
};

async function getBranding() {
  try {
    const store = await Store.findOne({}).lean();
    return {
      brandName:
        store?.companyDisplayName ||
        store?.companyName ||
        store?.storeName ||
        DEFAULT_BRAND_NAME,
      logoUrl: resolveLogoUrl(store?.logo),
      contactEmail: store?.email || process.env.EMAIL_USER || "",
      website: store?.website || "",
      storeName: store?.storeName || store?.companyDisplayName || DEFAULT_BRAND_NAME,
    };
  } catch {
    return {
      brandName: DEFAULT_BRAND_NAME,
      logoUrl: resolveLogoUrl(""),
      contactEmail: process.env.EMAIL_USER || "",
      website: "",
      storeName: DEFAULT_BRAND_NAME,
    };
  }
}

function buildEmailHtml({
  order,
  accentColor,
  subjectLine,
  headline,
  intro,
  statusLabel,
  branding,
}) {
  const contact = getOrderContactDetails(order);
  const items = getOrderItems(order);
  const logoMarkup = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${branding.brandName}" style="max-width: 88px; max-height: 88px; display: block; margin: 0 auto 14px; object-fit: contain;" />`
    : "";
  const itemsMarkup = items
    .map((item) => {
      const quantity = Number(item?.quantity || item?.qty || 0);
      const price = Number(item?.price || item?.salePriceIncTax || 0);
      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; color: #18181b;">${item?.name || "Item"}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; text-align: center; color: #52525b;">${quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e4e4e7; text-align: right; color: #18181b;">₦${price.toLocaleString("en-NG")}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f5; padding: 24px; color: #18181b;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 30px rgba(24, 24, 27, 0.08);">
        <div style="padding: 28px 24px 20px; text-align: center; border-bottom: 1px solid #e4e4e7; background: #ffffff;">
          ${logoMarkup}
          <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a;">${branding.storeName}</div>
          <h1 style="margin: 12px 0 8px; font-size: 28px; line-height: 1.2; color: #111827;">${headline}</h1>
          <p style="margin: 0; font-size: 15px; color: #52525b;">${subjectLine}</p>
          <div style="margin-top: 16px; display: inline-flex; align-items: center; justify-content: center; padding: 7px 14px; border-radius: 999px; background: ${accentColor}14; color: ${accentColor}; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
            ${statusLabel}
          </div>
        </div>

        <div style="padding: 28px 24px 30px;">
          <p style="margin: 0 0 12px; font-size: 16px; color: #18181b;">Hi <strong>${order?.customer?.name || contact?.name || "Customer"}</strong>,</p>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.65; color: #52525b;">${intro}</p>

          <div style="border: 1px solid #e4e4e7; border-radius: 14px; padding: 16px 18px; background: #fafafa; margin-bottom: 24px;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.16em; color: #71717a; margin-bottom: 8px;">Order Summary</div>
            <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; font-size: 14px; color: #3f3f46;">
              <span>Order ID</span>
              <strong>${order?._id}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; font-size: 14px; color: #3f3f46;">
              <span>Status</span>
              <strong>${statusLabel}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; font-size: 14px; color: #3f3f46;">
              <span>Payment</span>
              <strong>${order?.paymentStatus || "Pending"}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 12px; font-size: 14px; color: #3f3f46;">
              <span>Fulfilment</span>
              <strong>${order?.locationName || "Assigned from Admin"}</strong>
            </div>
          </div>

          <div style="border: 1px solid #e4e4e7; border-radius: 14px; padding: 18px;">
            <h2 style="margin: 0 0 14px; font-size: 18px; color: #18181b;">Items</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr>
                  <th style="padding: 0 0 10px; text-align: left; color: #71717a; font-weight: 600; border-bottom: 1px solid #d4d4d8;">Item</th>
                  <th style="padding: 0 0 10px; text-align: center; color: #71717a; font-weight: 600; border-bottom: 1px solid #d4d4d8;">Qty</th>
                  <th style="padding: 0 0 10px; text-align: right; color: #71717a; font-weight: 600; border-bottom: 1px solid #d4d4d8;">Price</th>
                </tr>
              </thead>
              <tbody>${itemsMarkup}</tbody>
            </table>
            <div style="display: flex; justify-content: space-between; gap: 12px; padding-top: 16px; margin-top: 16px; border-top: 1px solid #d4d4d8; font-size: 16px; color: #3f3f46;">
              <span>Total</span>
              <strong>₦${Number(order?.total || 0).toLocaleString("en-NG")}</strong>
            </div>
          </div>

          <div style="margin-top: 24px; border: 1px solid #e4e4e7; border-radius: 14px; padding: 18px; background: #fafafa;">
            <h2 style="margin: 0 0 12px; font-size: 18px; color: #18181b;">Delivery Details</h2>
            <p style="margin: 0 0 6px; font-size: 14px; color: #52525b;"><strong style="color: #18181b;">Name:</strong> ${contact?.name || "N/A"}</p>
            <p style="margin: 0 0 6px; font-size: 14px; color: #52525b;"><strong style="color: #18181b;">Phone:</strong> ${contact?.phone || "N/A"}</p>
            <p style="margin: 0; font-size: 14px; color: #52525b;"><strong style="color: #18181b;">Address:</strong> ${contact?.address || "N/A"}${contact?.city ? `, ${contact.city}` : ""}</p>
          </div>

          <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.7; color: #71717a;">
            Need help with this order? Reply to this email${branding.contactEmail ? ` or contact ${branding.contactEmail}` : ""}${branding.website ? `, or visit ${branding.website}` : ""}.
          </p>
        </div>
      </div>
    </div>
  `;
}

async function sendOrderLifecycleEmail({ order, subjectLine, headline, intro, statusLabel, accentColor }) {
  const contact = getOrderContactDetails(order);
  const recipient = contact.email || order?.customer?.email || "";
  const transporter = createMailTransport();

  if (!recipient || !transporter) {
    return "skipped";
  }

  const branding = await getBranding();

  try {
    await transporter.sendMail({
      from: getMailFromAddress(branding.brandName),
      to: recipient,
      subject: subjectLine,
      html: buildEmailHtml({
        order,
        accentColor,
        subjectLine,
        headline,
        intro,
        statusLabel,
        branding,
      }),
    });

    return "sent";
  } catch (error) {
    console.error("Order status email failed:", error.message);
    return "failed";
  }
}

export async function sendOrderProcessingEmail(order) {
  return sendOrderLifecycleEmail({
    order,
    subjectLine: "Your order is now being processed",
    headline: "We have started processing your order",
    intro: "Your order has been received into our fulfilment workflow and is now being prepared. We will notify you again once delivery has been completed.",
    statusLabel: "Processing",
    accentColor: "#b45309",
  });
}

export async function sendOrderShippedEmail(order) {
  return sendOrderLifecycleEmail({
    order,
    subjectLine: "Your order has been shipped",
    headline: "Your order is on the way",
    intro: "Your order has left our fulfilment desk and is now on the way to you.",
    statusLabel: "Shipped",
    accentColor: "#1d4ed8",
  });
}

export async function sendOrderDeliveredEmail(order) {
  return sendOrderLifecycleEmail({
    order,
    subjectLine: "Your order has been delivered",
    headline: "Delivery completed successfully",
    intro: "Your order has now been marked as delivered. Thank you for shopping with us.",
    statusLabel: "Delivered",
    accentColor: "#0f766e",
  });
}

export async function sendOrderCancelledEmail(order) {
  return sendOrderLifecycleEmail({
    order,
    subjectLine: "Your order has been cancelled",
    headline: "Your order has been cancelled",
    intro: "This order has been cancelled. If you need help or think this is a mistake, please contact us so we can assist.",
    statusLabel: "Cancelled",
    accentColor: "#b91c1c",
  });
}