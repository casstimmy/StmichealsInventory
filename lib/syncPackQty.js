/**
 * Sync parent-child product quantities.
 * 
 * RULE: Child qty is ALWAYS derived from parent: child.qty = parent.qty × qtyPerPack.
 * Child qty is never independently managed — every change flows through the parent.
 *
 * deriveChildQty(productId):
 *   Recalculates child qty from parent after any parent qty change.
 *   Also works if you pass a child ID — it will find the parent and derive.
 *
 * syncAfterSale(productId, qtySold):
 *   Called AFTER the save loop has already run `$inc: { quantity: -qtySold }` on the sold product.
 *   If CHILD sold: undo direct child decrement, decrement parent, derive child qty.
 *   If PARENT sold: parent already decremented, derive child qty.
 */

import Product from "@/models/Product";

/**
 * Derive child qty from parent after any direct parent qty change.
 * Call this after stock movements, restocks, purchase orders, stock takes, etc.
 * Also works if you pass a child ID — it will find the parent and derive.
 */
export async function deriveChildQty(productId) {
  try {
    const product = await Product.findById(productId)
      .select("isChildProduct parentProduct packType qtyPerPack quantity")
      .lean();

    if (!product) return;

    if (product.isChildProduct && product.parentProduct) {
      // Was given a child — look up parent and derive
      const parent = await Product.findById(product.parentProduct)
        .select("quantity qtyPerPack")
        .lean();
      if (parent && parent.qtyPerPack > 0) {
        const newChildQty = parent.quantity * parent.qtyPerPack;
        await Product.findByIdAndUpdate(productId, {
          $set: { quantity: newChildQty },
        });
      }
    } else if (product.packType === "pack" && product.qtyPerPack > 0) {
      // Was given a parent — find child and derive
      const child = await Product.findOne({
        parentProduct: productId,
        isChildProduct: true,
      }).select("_id").lean();

      if (child) {
        const newChildQty = product.quantity * product.qtyPerPack;
        await Product.findByIdAndUpdate(child._id, {
          $set: { quantity: newChildQty },
        });
      }
    }
  } catch (err) {
    console.warn("⚠️ deriveChildQty error:", err.message);
  }
}

/**
 * After a sale: called AFTER `$inc: { quantity: -qtySold }` on the sold product.
 * If child sold: undo direct child decrement, decrement parent, derive child qty.
 * If parent sold: parent already decremented, derive child qty.
 */
export async function syncAfterSale(productId, qtySold) {
  try {
    const product = await Product.findById(productId)
      .select("isChildProduct parentProduct packType qtyPerPack quantity")
      .lean();

    if (!product) return;

    if (product.isChildProduct && product.parentProduct) {
      // Undo the direct child decrement
      await Product.findByIdAndUpdate(productId, {
        $inc: { quantity: qtySold },
      });

      const parent = await Product.findById(product.parentProduct)
        .select("qtyPerPack quantity")
        .lean();

      if (parent && parent.qtyPerPack > 0) {
        const parentDecrement = qtySold / parent.qtyPerPack;
        const updatedParent = await Product.findByIdAndUpdate(
          product.parentProduct,
          { $inc: { quantity: -parentDecrement } },
          { new: true }
        );

        const newChildQty = updatedParent.quantity * parent.qtyPerPack;
        await Product.findByIdAndUpdate(productId, {
          $set: { quantity: newChildQty },
        });
      }
    } else if (product.packType === "pack" && product.qtyPerPack > 0) {
      // Parent already decremented — derive child qty
      const child = await Product.findOne({
        parentProduct: productId,
        isChildProduct: true,
      }).select("_id").lean();

      if (child) {
        const newChildQty = product.quantity * product.qtyPerPack;
        await Product.findByIdAndUpdate(child._id, {
          $set: { quantity: newChildQty },
        });
      }
    }
  } catch (err) {
    console.warn("⚠️ syncAfterSale error:", err.message);
  }
}
