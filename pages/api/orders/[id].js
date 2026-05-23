import { mongooseConnect } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Transaction from "@/models/Transactions";
import mongoose from "mongoose";
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
    const { status, deliveryPerson, locationId, locationName } = req.body || {};
    const hasStatusUpdate = status !== undefined;
    const hasLocationIdUpdate = locationId !== undefined;
    const hasLocationNameUpdate = locationName !== undefined;
    const hasLocationUpdate = hasLocationIdUpdate || hasLocationNameUpdate;

    if (!hasStatusUpdate && !hasLocationUpdate) {
      return res.status(400).json({ error: "Status or location is required" });
    }

    if (hasStatusUpdate && !status) {
      return res.status(400).json({ error: "Status is required" });
    }

    if (hasLocationIdUpdate && locationId && !mongoose.Types.ObjectId.isValid(locationId)) {
      return res.status(400).json({ error: "Invalid locationId" });
    }

    const allowedStatuses = [
      "Pending Payment",
      "Inventory Reserved",
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Reservation Expired",
    ];
    if (hasStatusUpdate && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    const order = await Order.findById(id).populate("customer");
    if (!order) return res.status(404).json({ error: "Order not found" });

    const prevStatus = order.status;
    const nextStatus = hasStatusUpdate ? status : prevStatus;
    const nextLocationName = hasLocationNameUpdate
      ? String(locationName || "").trim()
      : order.locationName || "";

    if (
      hasStatusUpdate &&
      prevStatus === "Delivered" &&
      nextStatus === "Delivered" &&
      !hasLocationUpdate
    ) {
      return res.status(400).json({ error: "Order already marked as Delivered" });
    }

    if (nextStatus === "Delivered" && prevStatus !== "Delivered") {
      // Guard: if inventory was already finalized by another system (e.g. Paystack), skip deduction
      if (order.inventoryFinalizedBy) {
        console.log(`Order ${order._id} inventory already finalized by '${order.inventoryFinalizedBy}' — skipping deduction`);
      } else {
        const externalId = `order:${order._id.toString()}`;
        const existingTx = await Transaction.findOne({ externalId });

        if (!existingTx) {
          const orderItems = Array.isArray(order.cartProducts) && order.cartProducts.length
            ? order.cartProducts
            : order.items || [];

          const items = orderItems
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
            staffName: "Online",
            location: nextLocationName || "online",
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

          // Clear the online reservation on each product so the webpage's available-stock
          // calculation (quantity - reservedQuantity) becomes accurate again.
          for (const item of items) {
            try {
              // Use an aggregation pipeline update to safely floor at 0
              await Product.updateOne(
                { _id: item.productId },
                [{ $set: { reservedQuantity: { $max: [0, { $subtract: ["$reservedQuantity", item.qty] }] } } }]
              );
            } catch (err) {
              console.warn("Failed to clear reservedQuantity for product:", item.productId, err?.message);
            }
          }

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

          // Mark the order so no other system tries to deduct inventory again
          await Order.findByIdAndUpdate(id, { $set: { inventoryFinalizedBy: "admin" } });
        }
      }
    }

    const updatePayload = {};

    if (hasStatusUpdate) {
      updatePayload.status = nextStatus;
    }

    if (deliveryPerson && (nextStatus === "Shipped" || nextStatus === "Delivered")) {
      updatePayload.deliveryPerson = {
        name: deliveryPerson.name || "",
        phone: deliveryPerson.phone || "",
      };
    }

    if (hasLocationIdUpdate) {
      updatePayload.locationId = locationId || null;
    }

    if (hasLocationNameUpdate) {
      updatePayload.locationName = nextLocationName;
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

    if (hasLocationUpdate && nextStatus === "Delivered") {
      const externalId = `order:${id.toString()}`;
      await Transaction.findOneAndUpdate(
        { externalId },
        { $set: { location: nextLocationName || "online" } }
      );
    }

    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Order update failed:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
