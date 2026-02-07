// models/Staff.js
import mongoose, { Schema, models } from "mongoose";

const StaffSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "staff",
    },

    location: {
      type: String,
      default: "",
    },

    accountName: {
      type: String,
      default: "",
    },

    accountNumber: {
      type: String,
      default: "",
    },

    bankName: {
      type: String,
      default: "",
    },

    salary: {
      type: Number,
      default: 0,
    },

    penalty: [
      {
        reason: String,
        amount: Number,
        date: { type: Date, default: Date.now },
      },
    ],

       locationId: { type: Schema.Types.ObjectId },
    locationName: String,


    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

StaffSchema.index({ username: 1 }, { unique: true, sparse: true });

export default models.Staff || mongoose.model("Staff", StaffSchema);

export const Staff =
  models.Staff || mongoose.model("Staff", StaffSchema);
