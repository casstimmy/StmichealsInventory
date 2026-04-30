import { mongooseConnect } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Transaction from "@/models/Transactions";
import { authMiddleware, isAdmin, isStaff } from "@/lib/auth-middleware";
import { applyInventoryDelta } from "@/lib/transaction-utils";

export default async function handler(req, res) {
  const authError = authMiddleware(req, res);
  if (authError) return authError;

  if (!isStaff(req)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  await mongooseConnect();
  const { id } = req.query;

  if (req.method === "DELETE") {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    try {
      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      if (order.status !== "Cancelled") {
        return res.status(400).json({ error: "Only cancelled orders can be deleted" });
      }

      await order.deleteOne();
      return res.status(200).json({ success: true, message: "Order deleted" });
    } catch (error) {
      console.error("Order delete failed:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { status, deliveryPerson } = req.body || {};

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    const order = await Order.findById(id).populate("customer");
    if (!order) return res.status(404).json({ error: "Order not found" });

    const prevStatus = order.status;
    if (prevStatus === "Delivered" && status === "Delivered") {
      return res.status(400).json({ error: "Order already marked as Delivered" });
    }

    if (status === "Delivered" && prevStatus !== "Delivered") {
      const externalId = `order:${order._id.toString()}`;
      const existingTx = await Transaction.findOne({ externalId });

      if (!existingTx) {
        const items = (order.cartProducts || [])
          .map((item) => ({
            name: item.name,
            qty: Number(item.quantity || 0),
            quantity: Number(item.quantity || 0),
            salePriceIncTax: Number(item.price || 0),
            price: Number(item.price || 0),
            productId: item.productId,
          }))
          .filter((item) => item.productId && item.qty > 0);

        const transaction = await Transaction.create({
          tenderType: "online",
          amountPaid: Number(order.total || 0),
          total: Number(order.total || 0),
          subtotal: Number(order.subtotal || order.total || 0),
          tax: 0,
          staff: null,
          staffName: "online",
          location: "online",
          device: "Web",
          discount: 0,
          discountReason: null,
          customerName:
            order.shippingDetails?.name || order.customer?.name || "Online User",
          transactionType: "pos",
          status: "completed",
          change: 0,
          items,
          externalId,
          dedupeKey: externalId,
        });

        await applyInventoryDelta(items, "decrement");
        transaction.inventoryUpdated = true;
        await transaction.save();

        for (const item of items) {
          try {
            await Product.findByIdAndUpdate(item.productId, {
              $push: {
                salesHistory: {
                  orderId: order._id,
                  quantity: item.qty,
                  salePrice: item.salePriceIncTax,
                  soldAt: new Date(),
                },
              },
            });
          } catch (error) {
            console.warn("Failed to append product salesHistory:", error?.message);
          }
        }
      }
    }

    const updatePayload = {
      status,
    };

    if (deliveryPerson && (status === "Shipped" || status === "Delivered")) {
      updatePayload.deliveryPerson = {
        name: deliveryPerson.name || "",
        phone: deliveryPerson.phone || "",
      };
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("customer")
      .lean();

    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Order update failed:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
