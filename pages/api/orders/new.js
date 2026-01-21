import { mongooseConnect } from "@/lib/mongodb";
import Order from "@/models/Order";

export default async function handler(req, res) {
  await mongooseConnect();

  try {
    const newOrders = await Order.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("_id createdAt shippingDetails customer");

    const formatted = newOrders.map((o) => ({
      _id: o._id,
      customerName:
        o.shippingDetails?.name || o.customer?.name || "Online Customer",
      createdAt: o.createdAt,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Failed to fetch new orders:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

