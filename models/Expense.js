import mongoose, { Schema, models } from "mongoose";

const ExpenseSchema = new Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },

    categoryId: {
      type: Schema.Types.ObjectId,
      index: true,
    },

    categoryName: {
      type: String,
      required: true,
      trim: true,
    },

    locationId: Schema.Types.ObjectId,
    locationName: String,

    expenseDate: { type: Date, default: Date.now },

    description: String,

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default models.Expense ||
  mongoose.model("Expense", ExpenseSchema);
