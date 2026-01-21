import { mongooseConnect } from "@/lib/mongodb";
import Order from "@/models/Order";
import Transaction from "@/models/Transactions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  await mongooseConnect();

  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Missing orderId" });
  }

  try {
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Map items to match itemSchema format
    const items = (order.items || []).map((product) => ({
      productId: product.productId || null, // fallback if productId is missing
      name: product.name,
      salePriceIncTax: product.price,
      qty: product.quantity,
    }));

    // Create transaction document
    const transaction = await Transaction.create({
      tenderType: "online",
      amountPaid: order.total,
      total: order.total,
      staff: "online",
      location: "online", // Location stored as string
      device: "WEB",
      tableName: "OrderCheckout",
      discount: 0,
      discountReason: "",
      customerName: order.customer?.name || "Online Customer",
      transactionType: "pos",
      status: "completed",
      change: 0,
      items,
    });

    return res.status(201).json({ message: "Transaction created", transaction });
  } catch (error) {
    console.error("Transaction creation failed:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

