import { mongooseConnect } from "@/lib/mongodb";
import Product from "@/models/Product"; // default import
import Order from "@/models/Order";
import Transaction from "@/models/Transactions";

export default async function handler(req, res) {
  await mongooseConnect();
  const { id } = req.query;

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { status, deliveryPerson } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const allowedStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    // Fetch order
    const order = await Order.findById(id).populate("customer");
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Prevent re-delivery
    if (order.status === "Delivered" && status === "Delivered") {
      return res.status(400).json({ error: "Order already marked as Delivered" });
    }

    // Update order status
    order.status = status;

    // Attach delivery person if provided
    if (deliveryPerson && (status === "Shipped" || status === "Delivered")) {
      order.deliveryPerson = deliveryPerson;
    }

    await order.save();

    // If delivered, create transaction + update stock and product metrics
    if (status === "Delivered") {
      const items = (order.cartProducts || [])
        .map((item) => ({
          name: item.name,
          qty: item.quantity || 0,
          salePriceIncTax: item.price,
          productId: item.productId,
        }))
        .filter((item) => item.productId && item.qty > 0);

      console.log("Items in transaction:", items);

      // Create transaction
      await Transaction.create({
        tenderType: "online",
        amountPaid: order.total,
        total: order.total,
        staff: "online",
        location: "online", // Location stored as string
        device: "Web",
        discount: 0,
        discountReason: null,
        customerName: order.shippingDetails?.name || order.customer?.name || "Online User",
        transactionType: "pos",
        status: "completed",
        change: 0,
        items,
      });

      // Update product metrics safely
      for (const item of items) {
        try {
          const updated = await Product.findByIdAndUpdate(
            item.productId,
            {
              $inc: {
                quantity: -item.qty,                     // decrease stock
                totalUnitsSold: item.qty,               // increment total units sold
                totalRevenue: item.salePriceIncTax * item.qty, // increment total revenue
              },
              $set: { lastSoldAt: new Date() },
              $push: {
                salesHistory: {
                  orderId: order._id,
                  quantity: item.qty,
                  salePrice: item.salePriceIncTax,
                  soldAt: new Date(),
                },
              },
            },
            { new: true }
          );

          if (!updated) console.warn(`Product not found: ${item.productId}`);
        } catch (err) {
          console.error(`Failed to update product metrics for ${item.productId}:`, err);
        }
      }
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("❌ Order update failed:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
