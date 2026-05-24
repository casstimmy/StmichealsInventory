import { mongooseConnect } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Transaction from "@/models/Transactions";
import mongoose from "mongoose";
import { authMiddleware, isAdmin, isStaff } from "@/lib/auth-middleware";
import { applyInventoryDelta, normalizeItems } from "@/lib/transaction-utils";
import {
  sendOrderCancelledEmail,
  sendOrderDeliveredEmail,
  sendOrderProcessingEmail,
  sendOrderShippedEmail,
} from "@/lib/orderStatusEmail";

const ONLINE_TENDER_NAME = "ONLINE";

const getOrderItems = (order) => {
  if (Array.isArray(order?.cartProducts) && order.cartProducts.length > 0) {
    return order.cartProducts;
  }

  return Array.isArray(order?.items) ? order.items : [];
};

const getOrderCustomerName = (order) =>
  order?.shippingDetails?.name || order?.customerSnapshot?.name || order?.customer?.name || "Online User";

const clearReservedInventory = async (items = []) => {
  for (const item of items) {
    const productId = item?.productId;
    const qty = Number(item?.qty || item?.quantity || 0);

    if (!productId || qty <= 0) {
      continue;
    }

    try {
      await Product.updateOne(
        { _id: productId },
        [{ $set: { reservedQuantity: { $max: [0, { $subtract: ["$reservedQuantity", qty] }] } } }]
      );
    } catch (error) {
      console.warn("Failed to clear reservedQuantity for product:", productId, error?.message);
    }
  }
};

const appendSalesHistory = async (items = [], orderId) => {
  for (const item of items) {
    try {
      await Product.findByIdAndUpdate(item.productId, {
        $push: {
          salesHistory: {
            orderId,
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
};

async function sendStatusEmail({ previousStatus, nextStatus, order }) {
  if (!order || previousStatus === nextStatus) {
    return "skipped";
  }

  switch (nextStatus) {
    case "Processing":
      return sendOrderProcessingEmail(order);
    case "Shipped":
      return sendOrderShippedEmail(order);
    case "Delivered":
      return sendOrderDeliveredEmail(order);
    case "Cancelled":
      return sendOrderCancelledEmail(order);
    default:
      return "skipped";
  }
}

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
    const externalId = `order:${order._id.toString()}`;
    let linkedTransaction = null;
    let transactionCreated = false;

    if (
      hasStatusUpdate &&
      prevStatus === "Delivered" &&
      nextStatus === "Delivered" &&
      !hasLocationUpdate
    ) {
      return res.status(400).json({ error: "Order already marked as Delivered" });
    }

    if (nextStatus === "Delivered" && prevStatus !== "Delivered") {
      const items = normalizeItems(getOrderItems(order));
      linkedTransaction = await Transaction.findOne({ externalId });

      if (!linkedTransaction) {
        if (!items.length) {
          return res.status(400).json({ error: "Order has no valid items to complete" });
        }

        linkedTransaction = await Transaction.create({
          tenderType: ONLINE_TENDER_NAME,
          tenderPayments: [{
            tenderType: ONLINE_TENDER_NAME,
            tenderName: ONLINE_TENDER_NAME,
            amount: Number(order.total || 0),
          }],
          amountPaid: Number(order.total || 0),
          total: Number(order.total || 0),
          subtotal: Number(order.subtotal || order.total || 0),
          tax: 0,
          staff: null,
          staffName: "Online",
          location: nextLocationName || order.locationName || "online",
          device: "Web",
          discount: 0,
          discountReason: null,
          customerName: getOrderCustomerName(order),
          transactionType: "pos",
          status: "completed",
          change: 0,
          items,
          externalId,
          dedupeKey: externalId,
          inventoryUpdated: Boolean(order.inventoryFinalizedBy),
        });

        transactionCreated = true;
      }

      if (!order.inventoryFinalizedBy) {
        await applyInventoryDelta(items, "decrement");
        await clearReservedInventory(items);
        linkedTransaction.inventoryUpdated = true;
        await linkedTransaction.save();
      } else {
        console.log(`Order ${order._id} inventory already finalized by '${order.inventoryFinalizedBy}' — skipping deduction`);
        if (linkedTransaction.inventoryUpdated !== true) {
          linkedTransaction.inventoryUpdated = true;
          await linkedTransaction.save();
        }
      }

      if (transactionCreated) {
        await appendSalesHistory(items, order._id);
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

    if (nextStatus === "Delivered") {
      updatePayload.paid = true;
      updatePayload.paymentStatus = "Paid";
      updatePayload.paymentReference = order.paymentReference || String(linkedTransaction?._id || "");
      updatePayload.reservationStatus = "finalized";
      updatePayload.reservationReleasedAt = order.reservationReleasedAt || new Date();
      updatePayload.finalizedAt = order.finalizedAt || new Date();
      updatePayload.inventoryFinalizedBy = order.inventoryFinalizedBy || "admin";
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

    if (hasLocationUpdate || nextStatus === "Delivered") {
      await Transaction.findOneAndUpdate(
        { externalId },
        { $set: { location: nextLocationName || updatedOrder?.locationName || "online" } }
      );
    }

    const emailState = await sendStatusEmail({
      previousStatus: prevStatus,
      nextStatus,
      order: updatedOrder,
    });

    return res.status(200).json({
      success: true,
      emailState,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Order update failed:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
