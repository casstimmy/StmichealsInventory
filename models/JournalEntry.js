import mongoose, { Schema, models } from "mongoose";

const JournalLineSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    accountCode: { type: String, required: true },
    accountName: { type: String, required: true },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const JournalEntrySchema = new Schema(
  {
    entryNumber: { type: String, unique: true, required: true },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, required: true },
    lines: {
      type: [JournalLineSchema],
      validate: {
        validator: function (lines) {
          return lines && lines.length >= 2;
        },
        message: "A journal entry must have at least 2 lines",
      },
    },
    reference: { type: String, default: "" }, // e.g. "TXN-12345", "EXP-001", "PO-00123"
    referenceType: {
      type: String,
      enum: ["MANUAL", "SALE", "EXPENSE", "PURCHASE_ORDER", "SALARY", "REFUND", "OTHER"],
      default: "MANUAL",
    },
    referenceId: { type: Schema.Types.ObjectId }, // Link to source document
    status: {
      type: String,
      enum: ["DRAFT", "POSTED", "VOIDED"],
      default: "DRAFT",
    },
    location: { type: String, default: "" },
    totalDebit: { type: Number, default: 0 },
    totalCredit: { type: Number, default: 0 },
    postedAt: { type: Date },
    voidedAt: { type: Date },
    voidReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String },
  },
  { timestamps: true }
);

// Pre-save: calculate totals and validate debits = credits
JournalEntrySchema.pre("save", function (next) {
  const totalDebit = this.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = this.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

  // Round to 2 decimal places to avoid floating point issues
  this.totalDebit = Math.round(totalDebit * 100) / 100;
  this.totalCredit = Math.round(totalCredit * 100) / 100;

  if (this.status === "POSTED" && this.totalDebit !== this.totalCredit) {
    return next(new Error(`Debits (${this.totalDebit}) must equal Credits (${this.totalCredit})`));
  }

  next();
});

JournalEntrySchema.index({ date: -1 });
JournalEntrySchema.index({ status: 1 });
JournalEntrySchema.index({ referenceType: 1 });
JournalEntrySchema.index({ "lines.account": 1 });
JournalEntrySchema.index({ entryNumber: 1 });

export default models.JournalEntry || mongoose.model("JournalEntry", JournalEntrySchema);
