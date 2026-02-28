import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    price: Number, // Price from POS (for backward compatibility)
    quantity: Number, // Quantity from POS
    salePriceIncTax: Number, // Standardized field for reports
    qty: Number, // Standardized field for reports
  },
  {
    _id: false,
    strict: false, // Allow additional fields from POS
  }
);

const tenderPaymentSchema = new mongoose.Schema(
  {
    tenderType: { type: String },
    tenderName: { type: String },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const TransactionSchema = new mongoose.Schema({
  tenderType: String,
  tenderPayments: {
    type: [tenderPaymentSchema],
    default: [],
  },
  amountPaid: Number,
  total: Number,
  subtotal: Number,
  tax: Number,
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  staffName: { type: String }, // Staff name for reference (redundant but useful)
  location: { type: String }, // Store location as string (location name or 'online')
  device: String,
  tableName: String,
  discount: Number,
  discountReason: String,
  customerName: String,
  transactionType: { type: String, enum: ["pos"], default: "pos" }, // Only POS transactions
  status: { 
    type: String, 
    enum: ["held", "completed", "refunded"], 
    default: "completed" 
  },
  subStatus: {
    type: String,
    enum: ["none", "edited", "void"],
    default: "none",
  },
  change: Number,
  items: {
    type: [itemSchema],
    default: [],
  },
  refundReason: String,
  refundBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  refundedAt: Date,
  inventoryUpdated: { type: Boolean, default: false },
  inventoryRestockedAt: Date,
  externalId: { type: String },
  dedupeKey: { type: String },
  createdAt: { type: Date, default: Date.now },
});

TransactionSchema.index({ externalId: 1 }, { unique: true, sparse: true });
TransactionSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

// Avoid re-registering the model in development
const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);

export default Transaction;
export { Transaction };
